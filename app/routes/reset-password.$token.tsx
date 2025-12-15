import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData, useSearchParams } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import bcrypt from "bcryptjs";
import { validatePasswordStrength } from "~/services/security.server";
import { useState } from "react";

export async function loader({ params }: LoaderFunctionArgs) {
  const { token } = params;

  if (!token) {
    throw new Response("Invalid reset link", { status: 400 });
  }

  // Check if token exists and is valid
  const resetResult = await query(
    `SELECT pr.id, pr.user_id, pr.expires_at, pr.used, u.email
     FROM password_resets pr
     JOIN users u ON u.id = pr.user_id
     WHERE pr.token = $1`,
    [token]
  );

  if (resetResult.rows.length === 0) {
    return json({ valid: false, error: "invalidToken" });
  }

  const reset = resetResult.rows[0];

  // Check if already used
  if (reset.used) {
    return json({ valid: false, error: "tokenUsed" });
  }

  // Check if expired
  if (new Date(reset.expires_at) < new Date()) {
    return json({ valid: false, error: "tokenExpired" });
  }

  return json({ 
    valid: true, 
    email: reset.email 
  });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const { token } = params;
  const formData = await request.formData();
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return json({ 
      success: false, 
      error: "allFieldsRequired" 
    });
  }

  if (password !== confirmPassword) {
    return json({ 
      success: false, 
      error: "passwordsDoNotMatch" 
    });
  }

  // Validate password strength
  const strengthCheck = validatePasswordStrength(password);
  if (!strengthCheck.valid) {
    return json({ 
      success: false, 
      error: "passwordWeak",
      details: strengthCheck.errors 
    });
  }

  // Verify token again
  const resetResult = await query(
    `SELECT id, user_id, expires_at, used
     FROM password_resets
     WHERE token = $1`,
    [token]
  );

  if (resetResult.rows.length === 0) {
    return json({ 
      success: false, 
      error: "invalidToken" 
    });
  }

  const reset = resetResult.rows[0];

  if (reset.used) {
    return json({ 
      success: false, 
      error: "tokenUsed" 
    });
  }

  if (new Date(reset.expires_at) < new Date()) {
    return json({ 
      success: false, 
      error: "tokenExpired" 
    });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(password, 10);

  // Update user password
  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [passwordHash, reset.user_id]
  );

  // Mark token as used
  await query(
    'UPDATE password_resets SET used = true WHERE id = $1',
    [reset.id]
  );

  return redirect("/login?reset=success");
}

export default function ResetPassword() {
  const loaderData = useLoaderData<typeof loader>() as any;
  const actionData = useActionData<typeof action>() as any;
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const unlockedFromEmail = searchParams.get("unlocked") === "true";

  if (!loaderData.valid) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh'
        }}>
          <div className="auth-card animate-scale-in" style={{ maxWidth: '450px', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
              <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Invalid Reset Link
              </h1>
            </div>

            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              {loaderData.error === 'tokenUsed' && 'This reset link has already been used.'}
              {loaderData.error === 'tokenExpired' && 'This reset link has expired. Please request a new one.'}
              {loaderData.error === 'invalidToken' && 'This reset link is invalid.'}
            </div>

            <a href="/forgot-password" className="btn-primary" style={{ 
              display: 'block',
              textAlign: 'center',
              textDecoration: 'none',
              padding: '0.75rem'
            }}>
              Request New Reset Link
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <main className="main-content" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        minHeight: '100vh'
      }}>
        <div className="auth-card animate-scale-in" style={{ maxWidth: '450px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
              {unlockedFromEmail ? '�' : '�🔑'}
            </div>
            <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {unlockedFromEmail ? 'Account Unlocked' : 'Reset Your Password'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              For account: <strong>{loaderData.email}</strong>
            </p>
            {unlockedFromEmail && (
              <div className="alert alert-success" style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                ✅ Your account has been unlocked. Please set a new password to secure your account.
              </div>
            )}
          </div>

          {actionData?.error && (
            <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              {actionData.error === 'passwordsDoNotMatch' && `❌ ${t('errors.passwordsDoNotMatch')}`}
              {actionData.error === 'passwordWeak' && (
                <>
                  ❌ {t('errors.passwordWeak')}:
                  <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                    {actionData.details?.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </>
              )}
              {actionData.error === 'allFieldsRequired' && `❌ ${t('errors.allFieldsRequired')}`}
              {actionData.error === 'tokenUsed' && `❌ ${t('errors.tokenUsed')}`}
              {actionData.error === 'tokenExpired' && `❌ ${t('errors.tokenExpired')}`}
              {actionData.error === 'invalidToken' && `❌ ${t('errors.invalidUnlockLink')}`}
            </div>
          )}

          <Form method="post" className="auth-form">
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  autoFocus
                  style={{ paddingRight: '45px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <small style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                Must contain uppercase, lowercase, number, and special character
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  minLength={8}
                  placeholder="Re-enter your password"
                  style={{ paddingRight: '45px', width: '100%' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle-btn"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-pulse" style={{ width: '100%' }}>
              🔒 Reset Password
            </button>

            <div style={{ 
              marginTop: '1.5rem', 
              textAlign: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '1.5rem'
            }}>
              <a href="/login" className="btn-secondary" style={{ 
                display: 'inline-block',
                textDecoration: 'none',
                padding: '0.75rem 2rem'
              }}>
                ← Back to Login
              </a>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
}
