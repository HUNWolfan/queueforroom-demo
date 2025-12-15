import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { query } from "~/db.server";
import { sendWelcomeEmail } from "~/services/email.server";
import crypto from "crypto";

export async function loader({ request }: LoaderFunctionArgs) {
  return json({});
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (typeof email !== "string") {
    return json({ error: "Invalid email" }, { status: 400 });
  }

  // Check if user exists and is not verified
  const userResult = await query(
    'SELECT id, first_name, email_verified, preferred_language FROM users WHERE email = $1',
    [email]
  );

  if (userResult.rows.length === 0) {
    // Don't reveal if email exists for security
    return json({ success: true });
  }

  const user = userResult.rows[0];

  if (user.email_verified) {
    return json({ error: "Email is already verified. You can log in now." }, { status: 400 });
  }

  // Check rate limiting - max 3 requests per hour
  const recentRequests = await query(
    `SELECT COUNT(*) FROM email_verifications 
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [user.id]
  );

  if (parseInt(recentRequests.rows[0].count) >= 3) {
    return json({ 
      error: "Too many verification emails sent. Please wait an hour before requesting another one." 
    }, { status: 429 });
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Invalidate old tokens (optional - set verified = true to prevent reuse)
  await query(
    `UPDATE email_verifications SET verified = true WHERE user_id = $1 AND verified = false`,
    [user.id]
  );

  // Insert new verification token
  await query(
    `INSERT INTO email_verifications (user_id, token, expires_at, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [user.id, verificationToken, expiresAt]
  );

  // Get base URL
  const baseUrl = new URL(request.url).origin;
  const language = (user.preferred_language || 'en') as 'en' | 'hu';

  // Send verification email
  await sendWelcomeEmail(email, user.first_name, verificationToken, baseUrl, language)
    .catch(err => {
      console.error('Failed to send verification email:', err);
      throw new Error('Failed to send email');
    });

  return json({ success: true });
}

export default function ResendVerification() {
  const actionData = useActionData<typeof action>() as any;
  const { t } = useTranslation();

  if (actionData?.success) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Email elküldve!
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Ellenőrizd a postafiókod és kövesd az utasításokat.
            </p>
            <Link 
              to="/login" 
              className="btn-primary" 
              style={{ 
                width: '100%', 
                display: 'block', 
                textAlign: 'center',
                padding: '0.875rem 1.5rem'
              }}
            >
              Vissza a bejelentkezéshez
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--text-primary)', textAlign: 'center' }}>
          Megerősítő email újraküldése
        </h1>

        {actionData?.error && (
          <div className="alert alert-error" style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.2))',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            {actionData.error}
          </div>
        )}

        <Form method="post">
          <div className="form-group">
            <label htmlFor="email" style={{ color: 'var(--text-primary)' }}>
              {t("auth.emailAddress")}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="form-input"
              placeholder={t("auth.enterYourEmail")}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
            {t("auth.sendVerificationEmail")}
          </button>
        </Form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {t("auth.alreadyVerified")}{' '}
          <a href="/login" style={{ color: 'var(--text-primary)' }}>
            {t("auth.loginHere")}
          </a>
        </p>
      </div>
    </div>
  );
}
