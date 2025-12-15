import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, Link } from "@remix-run/react";
import { unlockAccountWithToken } from "~/services/security.server";
import { useTranslation } from "react-i18next";

export async function loader({ params }: LoaderFunctionArgs) {
  const { token } = params;
  
  if (!token) {
    return json({ 
      success: false, 
      error: "Invalid unlock link" 
    }, { status: 400 });
  }

  const result = await unlockAccountWithToken(token);
  
  if (result.success && result.email) {
    // Redirect to password reset with email in query param
    return redirect(`/reset-password?email=${encodeURIComponent(result.email)}&unlocked=true`);
  }

  return json(result, { status: result.success ? 200 : 400 });
}

export default function UnlockAccount() {
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
      <div className="auth-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '4rem' }}>
          {data.success ? '✅' : '❌'}
        </h2>
        
        {data.success ? (
          <>
            <h3 style={{ marginBottom: '1rem', fontSize: '2rem', color: 'var(--text-primary)' }}>
              Fiók feloldva!
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              Átirányítunk a jelszó visszaállításához...
            </p>
          </>
        ) : (
          <>
            <h3 style={{ marginBottom: '1rem', fontSize: '2rem', color: '#ef4444' }}>
              Feloldás sikertelen
            </h3>
            <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
              {data.error === "Invalid or expired unlock token" && (
                <p>Ez a hivatkozás érvénytelen vagy már felhasználásra került. Próbálj meg újra bejelentkezni, vagy vedd fel a kapcsolatot az ügyfélszolgálattal.</p>
              )}
              {data.error !== "Invalid or expired unlock token" && (
                <p>{data.error}</p>
              )}
            </div>
            <div>
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
          </>
        )}
      </div>
    </div>
  );
}
