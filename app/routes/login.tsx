import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useSearchParams, Link, useFetcher } from "@remix-run/react";
// SSR-safe translation hook
function useSSRSafeTranslation() {
  if (typeof window === "undefined") {
    return { t: (key: string) => "" };
  }
  try {
    const { useTranslation } = require("react-i18next");
    return useTranslation();
  } catch (e) {
    return { t: (key: string) => "" };
  }
}
import { useState, useEffect } from "react";
import { login } from "~/services/auth.server";
import { createUserSession, getUserId } from "~/utils/session.server";
import LoginForm from "~/components/auth/LoginForm";
import { query } from "~/db.server";
import { 
  recordLoginAttempt, 
  isAccountLocked, 
  checkAndLockAccount, 
  getClientIP, 
  getLockoutInfo 
} from "~/services/security.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const userId = await getUserId(request);
    if (userId) return redirect("/");
    return json({});
  } catch (error) {
    console.error('LOGIN LOADER ERROR:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    // Return empty response instead of crashing
    return json({});
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return json({ errorKey: "errors.invalidFormData" }, { status: 400 });
  }

  // Get client IP and user agent for security tracking
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "Unknown";

  // Check if account is locked
  const locked = await isAccountLocked(email);
  if (locked) {
    const lockoutInfo = await getLockoutInfo(email);
    const lockedUntil = lockoutInfo.locked_until 
      ? new Date(lockoutInfo.locked_until).toLocaleString() 
      : "Unknown";
    
    return json({ 
      errorKey: "errors.accountLocked",
      lockedUntil,
      locked: true 
    }, { status: 403 });
  }

  const user = await login({ email, password });

  if (!user) {
    // Record failed login attempt
    await recordLoginAttempt(email, clientIP, false, userAgent);
    
    // Check if account should be locked after this failed attempt
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const browserLanguage = request.headers.get("accept-language")?.startsWith("hu") ? "hu" : "en";
    
    const lockResult = await checkAndLockAccount(email, baseUrl, browserLanguage as 'en' | 'hu');
    
    if (lockResult.locked) {
      return json({ 
        errorKey: "errors.accountLocked",
        message: lockResult.message,
        locked: true 
      }, { status: 403 });
    }
    
    return json({ errorKey: "errors.invalidEmailOrPassword" }, { status: 400 });
  }

  // Record successful login attempt
  await recordLoginAttempt(email, clientIP, true, userAgent);

  // Check if email is verified
  const userResult = await query(
    'SELECT email_verified, two_factor_enabled, two_factor_method FROM users WHERE id = $1',
    [user.id]
  );

  if (userResult.rows.length > 0 && !userResult.rows[0].email_verified) {
    return json({ 
      errorKey: "errors.verifyEmailFirst",
      notVerified: true,
      email: user.email
    }, { status: 403 });
  }

  // Check if 2FA is enabled
  const userData = userResult.rows[0];
  if (userData.two_factor_enabled) {
    // Instead of creating session, redirect to 2FA verification
    return json({ 
      requires2FA: true,
      userId: user.id,
      twoFactorMethod: userData.two_factor_method
    }, { status: 200 });
  }

  return redirect("/", await createUserSession(user.id, "/"));
}

export default function Login() {
  const actionData = useActionData<typeof action>() as any;
  const [searchParams] = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";
  
  // Safe fallback for SSR - return empty string during SSR to match client structure
  let t: (key: string) => string;
  try {
    const translation = useTranslation();
    t = translation.t;
  } catch (e) {
    // SSR fallback - return empty string to prevent hydration mismatch
    t = (key: string) => "";
  }
  
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [savedUserId, setSavedUserId] = useState<number | null>(null);
  const [savedTwoFactorMethod, setSavedTwoFactorMethod] = useState<string>("");
  const twoFactorFetcher = useFetcher();

  // Show 2FA modal when required
  useEffect(() => {
    if (actionData?.requires2FA && !show2FAModal) {
      setShow2FAModal(true);
      setTwoFactorCode("");
      setTwoFactorError("");
      setEmailCodeSent(false);
      // Save userId and method to state
      setSavedUserId(actionData.userId);
      setSavedTwoFactorMethod(actionData.twoFactorMethod);
    }
  }, [actionData?.requires2FA, show2FAModal]);

  // Send email code only once when modal opens for email method
  useEffect(() => {
    if (show2FAModal && savedTwoFactorMethod === 'email' && !emailCodeSent && savedUserId) {
      console.log('Sending email code...');
      twoFactorFetcher.submit(
        { intent: "send-code", userId: savedUserId.toString() },
        { method: "post", action: "/api/2fa-verify" }
      );
      setEmailCodeSent(true);
    }
  }, [show2FAModal, savedTwoFactorMethod, emailCodeSent, savedUserId]);

  const handleVerify2FA = () => {
    console.log('handleVerify2FA called');
    console.log('twoFactorCode:', twoFactorCode);
    console.log('twoFactorCode.length:', twoFactorCode.length);
    console.log('savedUserId:', savedUserId);
    console.log('savedTwoFactorMethod:', savedTwoFactorMethod);
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      console.log('Invalid code length, setting error');
      setTwoFactorError(t("errors.invalidCode"));
      return;
    }

    if (!savedUserId) {
      console.log('No savedUserId available');
      setTwoFactorError("Session expired. Please login again.");
      return;
    }

    console.log('Verifying 2FA code...', {
      userId: savedUserId,
      code: twoFactorCode,
      method: savedTwoFactorMethod
    });

    twoFactorFetcher.submit(
      { 
        intent: "verify", 
        userId: savedUserId.toString(),
        code: twoFactorCode,
        method: savedTwoFactorMethod
      },
      { method: "post", action: "/api/2fa-verify" }
    );
    
    console.log('Fetcher submit called');
  };

  // Handle verification result
  useEffect(() => {
    console.log('useEffect - twoFactorFetcher.data changed:', twoFactorFetcher.data);
    console.log('useEffect - twoFactorFetcher.state:', twoFactorFetcher.state);
    
    if (twoFactorFetcher.data) {
      const data = twoFactorFetcher.data as any;
      console.log('2FA Fetcher data received:', data);
      
      if (data.success && data.redirectTo) {
        // Redirect on successful verification
        console.log('Redirecting to:', data.redirectTo);
        if (typeof window !== 'undefined') {
          window.location.href = data.redirectTo;
        }
      } else if (data.success && data.message) {
        // Email sent successfully
        console.log('Email code sent successfully');
      } else if (data.error) {
        console.log('Error received:', data.error);
        setTwoFactorError(t(`errors.${data.error}`) || data.error);
      }
    }
  }, [twoFactorFetcher.data, twoFactorFetcher.state, t]);

  return (
    <div className="auth-container">
      {resetSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          maxWidth: '500px',
          width: '90%'
        }}>
          <div className="alert alert-success animate-slide-down" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(22, 163, 74, 0.2))',
            border: '1px solid rgba(34, 197, 94, 0.4)',
            backdropFilter: 'blur(10px)',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            ✅ {t("auth.passwordResetSuccess")}
          </div>
        </div>
      )}
      <LoginForm 
        errorKey={actionData?.errorKey} 
        email={actionData?.email}
        notVerified={actionData?.notVerified}
      />

      {/* 2FA Verification Modal */}
      {show2FAModal && (
        <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔐 Kétfaktoros hitelesítés</h2>
            </div>
            <div className="modal-body">
              {savedTwoFactorMethod === 'email' ? (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    📧 Elküldtünk egy 6 számjegyű kódot az email címedre.
                  </p>
                  {twoFactorFetcher.state === 'submitting' && twoFactorFetcher.formData?.get('intent') === 'send-code' && (
                    <p style={{ color: '#4ade80', fontSize: '0.9rem' }}>
                      ⏳ Email küldése...
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    📱 Írd be az Authenticator alkalmazásodból a kódot.
                  </p>
                </div>
              )}

              {twoFactorError && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  color: '#ef4444',
                  textAlign: 'center'
                }}>
                  {twoFactorError}
                </div>
              )}

              <div className="form-group">
                <label>Biztonsági kód</label>
                <input 
                  type="text" 
                  value={twoFactorCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFactorCode(value);
                    setTwoFactorError("");
                  }}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  style={{ 
                    textAlign: 'center', 
                    fontSize: '1.5rem', 
                    letterSpacing: '0.5rem',
                    fontFamily: 'monospace'
                  }}
                />
              </div>
            </div>
            <div className="modal-actions">
              <button 
                onClick={() => {
                  setShow2FAModal(false);
                  setTwoFactorCode("");
                  setTwoFactorError("");
                }} 
                className="btn-secondary"
              >
                Mégse
              </button>
              <button 
                onClick={handleVerify2FA}
                className="btn-primary"
                disabled={twoFactorFetcher.state === 'submitting' || twoFactorCode.length !== 6}
                type="button"
              >
                {twoFactorFetcher.state === 'submitting' ? 'Ellenőrzés...' : 'Megerősítés'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
