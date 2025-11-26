import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '~/db.server';

/**
 * 2FA Service using TOTP (Time-based One-Time Password)
 * Supports both Google Authenticator and email-based 2FA
 */

export interface TwoFactorSetupResult {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

/**
 * Generate a new 2FA secret for a user
 * Returns QR code URL and manual entry key for authenticator apps
 */
export async function generateTwoFactorSecret(userId: number, email: string): Promise<TwoFactorSetupResult> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `QueueForRoom (${email})`,
    issuer: 'QueueForRoom',
    length: 32
  });

  // Generate QR code
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

  // Format secret for manual entry (groups of 4 characters)
  const manualEntryKey = secret.base32.match(/.{1,4}/g)?.join(' ') || secret.base32;

  return {
    secret: secret.base32,
    qrCodeUrl,
    manualEntryKey
  };
}

/**
 * Verify a TOTP code against a secret
 */
export function verifyTOTPCode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2 // Allow 2 time steps before/after (1 minute tolerance)
  });
}

/**
 * Enable 2FA for a user (authenticator app method)
 */
export async function enableTwoFactorAuth(
  userId: number,
  secret: string,
  verificationCode: string
): Promise<{ success: boolean; error?: string }> {
  // Verify the code first
  const isValid = verifyTOTPCode(secret, verificationCode);
  
  if (!isValid) {
    return { success: false, error: 'Invalid verification code' };
  }

  // Save to database
  await query(
    `UPDATE users 
     SET two_factor_secret = $1, 
         two_factor_enabled = true, 
         two_factor_method = 'authenticator',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [secret, userId]
  );

  return { success: true };
}

/**
 * Enable email-based 2FA
 */
export async function enableEmailTwoFactor(userId: number): Promise<void> {
  await query(
    `UPDATE users 
     SET two_factor_email = true,
         two_factor_enabled = true, 
         two_factor_method = 'email',
         two_factor_secret = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [userId]
  );
}

/**
 * Disable 2FA for a user
 */
export async function disableTwoFactorAuth(userId: number): Promise<void> {
  await query(
    `UPDATE users 
     SET two_factor_secret = NULL,
         two_factor_email = false,
         two_factor_enabled = false, 
         two_factor_method = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [userId]
  );
}

/**
 * Generate a 6-digit code for email 2FA
 */
export function generateEmailCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store email 2FA code in database (with 10 minute expiry)
 */
export async function storeEmailCode(userId: number, code: string): Promise<void> {
  await query(
    `INSERT INTO two_factor_codes (user_id, code, expires_at, used, created_at)
     VALUES ($1, $2, NOW() + INTERVAL '10 minutes', false, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET code = $2, expires_at = NOW() + INTERVAL '10 minutes', used = false, created_at = NOW()`,
    [userId, code]
  );
}

/**
 * Verify email 2FA code
 */
export async function verifyEmailCode(userId: number, code: string): Promise<boolean> {
  console.log('verifyEmailCode called with userId:', userId, 'code:', code);
  
  const result = await query(
    `SELECT code, expires_at, used 
     FROM two_factor_codes 
     WHERE user_id = $1 
     AND code = $2 
     AND expires_at > NOW()
     AND used = false`,
    [userId, code]
  );

  console.log('Query result rows:', result.rows);
  console.log('Number of matching rows:', result.rows.length);

  if (result.rows.length === 0) {
    // Let's check if the code exists at all
    const allCodesResult = await query(
      `SELECT code, expires_at, used 
       FROM two_factor_codes 
       WHERE user_id = $1`,
      [userId]
    );
    console.log('All codes for this user:', allCodesResult.rows);
    return false;
  }

  // Mark as used
  await query(
    `UPDATE two_factor_codes SET used = true WHERE user_id = $1 AND code = $2`,
    [userId, code]
  );

  console.log('Code marked as used');
  return true;
}
