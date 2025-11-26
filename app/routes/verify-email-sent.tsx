import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

export default function VerifyEmailSent() {
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
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Email Megerősítve!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Az email címed sikeresen megerősítésre került. Most már bejelentkezhetsz a fiókodba.
          </p>
        </div>

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
    </div>
  );
}
