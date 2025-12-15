import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { query } from "~/db.server";
import { useTranslation } from "react-i18next";

export async function loader({ params }: LoaderFunctionArgs) {
  const { token } = params;

  if (!token) {
    return json({ success: false, error: "invalid" });
  }

  try {
    // Check if token exists and is not expired
    const verificationResult = await query(
      `SELECT ev.*, u.email 
       FROM email_verifications ev
       JOIN users u ON ev.user_id = u.id
       WHERE ev.token = $1 AND ev.verified = false AND ev.expires_at > NOW()`,
      [token]
    );

    if (verificationResult.rows.length === 0) {
      // Token is invalid, expired, or already used
      const usedToken = await query(
        `SELECT * FROM email_verifications WHERE token = $1`,
        [token]
      );

      if (usedToken.rows.length === 0) {
        return json({ success: false, error: "invalid" });
      } else if (usedToken.rows[0].verified) {
        return json({ success: false, error: "already_verified" });
      } else {
        return json({ success: false, error: "expired" });
      }
    }

    const verification = verificationResult.rows[0];

    // Update user's email_verified status
    await query(
      `UPDATE users SET email_verified = true WHERE id = $1`,
      [verification.user_id]
    );

    // Mark verification token as used
    await query(
      `UPDATE email_verifications SET verified = true WHERE id = $1`,
      [verification.id]
    );

    return json({ success: true, error: null });
  } catch (error) {
    console.error('Email verification error:', error);
    return json({ success: false, error: "server_error" });
  }
}

export default function VerifyEmail() {
  const data = useLoaderData<typeof loader>();
  const { t } = useTranslation();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div className="auth-card" style={{ maxWidth: '500px', width: '100%' }}>
        {data.success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Email Megerősítve!
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Az email címed sikeresen megerősítésre került. Most már bejelentkezhetsz a fiókodba.
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
              Továbba a Bejelentkezéshez
            </Link>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              {data.error === "invalid" && "Érvénytelen hivatkozás"}
              {data.error === "expired" && "Lejárt hivatkozás"}
              {data.error === "already_verified" && "Már megerősítve"}
              {data.error === "server_error" && "Szerver hiba"}
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              {data.error === "expired" && "Kérj új megerősítő hivatkozást."}
              {data.error === "already_verified" && "Most már bejelentkezhetsz."}
              {(data.error === "invalid" || data.error === "server_error") && "Kérlek, lépj kapcsolatba az ügyfélszolgálattal."}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {data.error === "expired" && (
                <Link to="/resend-verification" className="btn-secondary" style={{ padding: '0.875rem 1.5rem' }}>
                  Email újraküldése
                </Link>
              )}
              <Link to="/login" className="btn-primary" style={{ padding: '0.875rem 1.5rem' }}>
                Vissza a bejelentkezéshez
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
