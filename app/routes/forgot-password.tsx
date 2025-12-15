import { json, type ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import { generateShareToken } from "~/utils/crypto.server";
import { sendPasswordResetEmail } from "~/services/email.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email") as string;

  if (!email) {
    return json({ 
      success: false, 
      error: "emailRequired" 
    });
  }

  // Check if user exists
  const userResult = await query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    // Don't reveal if email exists or not (security)
    return json({ 
      success: true, 
      message: "resetEmailSent" 
    });
  }

  // Generate reset token
  const resetToken = generateShareToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  // Save reset token to database with expiry
  await query(
    'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userResult.rows[0].id, resetToken, expiresAt]
  );

  const baseUrl = new URL(request.url).origin;
  
  // Send email using Resend
  const emailResult = await sendPasswordResetEmail(email, resetToken, baseUrl);

  if (!emailResult.success) {
    console.error('Failed to send reset email:', emailResult.error);
    
    // In development, still show success but log the error
    if (process.env.NODE_ENV === 'development') {
      const resetLink = `${baseUrl}/reset-password/${resetToken}`;
      return json({ 
        success: true, 
        message: "resetEmailSent",
        resetLink, // Only in development
        emailError: 'Email service not configured. Check console for reset link.'
      });
    }
    
    return json({ 
      success: false, 
      error: "emailSendFailed" 
    });
  }

  return json({ 
    success: true, 
    message: "resetEmailSent"
  });
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>() as any;
  const { t } = useTranslation();

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
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔑</div>
            <h1 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {t("settings.passwordReset")}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {actionData?.success && (
            <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              ✅ {t(`settings.${actionData.message}`)}
              {actionData.resetLink && (
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  <strong>Reset link (dev only):</strong><br />
                  <a href={actionData.resetLink} style={{ color: 'inherit' }}>
                    {actionData.resetLink}
                  </a>
                </div>
              )}
            </div>
          )}

          {actionData?.error && (
            <div className="alert alert-error animate-fade-in" style={{ marginBottom: '1.5rem' }}>
              ❌ Email is required
            </div>
          )}

          <Form method="post" className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your@email.com"
                autoFocus
              />
            </div>

            <button type="submit" className="btn-primary btn-pulse" style={{ width: '100%' }}>
              📧 {t("settings.sendResetEmail")}
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
                ← {t("nav.login")}
              </a>
            </div>
          </Form>
        </div>
      </main>
    </div>
  );
}
