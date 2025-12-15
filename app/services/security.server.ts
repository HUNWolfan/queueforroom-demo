import { query } from "~/db.server";
import crypto from "crypto";
import { sendAccountLockoutEmail } from "./email.server";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 10;

/**
 * Record a login attempt
 */
export async function recordLoginAttempt(
  email: string,
  ipAddress: string | null,
  success: boolean,
  userAgent: string | null = null
) {
  await query(
    `INSERT INTO login_attempts (email, ip_address, success, user_agent, attempted_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [email, ipAddress, success, userAgent]
  );
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(email: string): Promise<boolean> {
  const result = await query(
    `SELECT locked_until FROM account_lockouts
     WHERE email = $1 AND locked_until > NOW()
     ORDER BY locked_until DESC
     LIMIT 1`,
    [email]
  );

  return result.rows.length > 0;
}

/**
 * Get lockout info
 */
export async function getLockoutInfo(email: string) {
  const result = await query(
    `SELECT locked_until, reason FROM account_lockouts
     WHERE email = $1 AND locked_until > NOW()
     ORDER BY locked_until DESC
     LIMIT 1`,
    [email]
  );

  return result.rows[0] || null;
}

/**
 * Check failed login attempts and lock account if necessary
 */
export async function checkAndLockAccount(
  email: string,
  baseUrl: string,
  language: 'en' | 'hu' = 'en'
): Promise<{ locked: boolean; message?: string; lockedUntil?: Date }> {
  // Count failed attempts in last 15 minutes
  const failedAttemptsResult = await query(
    `SELECT COUNT(*) as count
     FROM login_attempts
     WHERE email = $1
       AND success = false
       AND attempted_at > NOW() - INTERVAL '15 minutes'`,
    [email]
  );

  const failedAttempts = parseInt(failedAttemptsResult.rows[0].count);

  if (failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    // Check if already locked
    const alreadyLocked = await isAccountLocked(email);
    
    if (!alreadyLocked) {
      // Generate unlock token
      const unlockToken = crypto.randomBytes(32).toString('hex');
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000);

      // Lock the account
      await query(
        `INSERT INTO account_lockouts (email, locked_until, reason, unlock_token)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) 
         DO UPDATE SET 
           locked_until = $2,
           unlock_token = $4,
           token_used = false,
           created_at = NOW()`,
        [
          email,
          lockedUntil,
          `Too many failed login attempts (${failedAttempts})`,
          unlockToken
        ]
      );

      // Send security alert email
      sendAccountLockoutEmail(email, unlockToken, baseUrl, language)
        .catch(err => console.error('Failed to send lockout email:', err));

      return {
        locked: true,
        message: `Account locked due to too many failed attempts. Locked until ${lockedUntil.toLocaleTimeString()}`,
        lockedUntil
      };
    }

    const lockInfo = await getLockoutInfo(email);
    return {
      locked: true,
      message: `Account is locked until ${new Date(lockInfo.locked_until).toLocaleTimeString()}`,
      lockedUntil: new Date(lockInfo.locked_until)
    };
  }

  return { locked: false };
}

/**
 * Unlock account using one-time token
 */
export async function unlockAccountWithToken(token: string): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  const result = await query(
    `SELECT email, token_used, locked_until
     FROM account_lockouts
     WHERE unlock_token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return { success: false, error: 'Invalid unlock token' };
  }

  const lockout = result.rows[0];

  if (lockout.token_used) {
    return { success: false, error: 'Token has already been used' };
  }

  // Mark token as used and remove lockout
  await query(
    `UPDATE account_lockouts
     SET token_used = true,
         locked_until = NOW() - INTERVAL '1 second'
     WHERE unlock_token = $1`,
    [token]
  );

  // Clear failed attempts
  await query(
    `DELETE FROM login_attempts
     WHERE email = $1 AND success = false`,
    [lockout.email]
  );

  return { success: true, email: lockout.email };
}

/**
 * Get client IP address from request
 */
export function getClientIP(request: Request): string | null {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return null;
}

/**
 * Clean up old login attempts (run this periodically)
 */
export async function cleanupOldLoginAttempts() {
  await query(
    `DELETE FROM login_attempts
     WHERE attempted_at < NOW() - INTERVAL '30 days'`
  );

  await query(
    `DELETE FROM account_lockouts
     WHERE locked_until < NOW() - INTERVAL '30 days'`
  );
}

/**
 * Password strength validator
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'abc123', 'password123'];
  if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
    errors.push('Password is too common');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
