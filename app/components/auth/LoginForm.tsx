import React, { useState } from "react";
import { Form, Link, useFetcher } from "@remix-run/react";
import { getSSRTranslation } from "~/utils/ssr-translations";

// SSR-safe translation hook
function useSSRSafeTranslation() {
  // During SSR, return Hungarian defaults using centralized translations
  if (typeof window === "undefined") {
    return { 
      t: (key: string) => getSSRTranslation(key, 'hu')
    };
  }
  
  // Client-side: try to load i18next, fallback to Hungarian
  try {
    const { useTranslation } = require("react-i18next");
    return useTranslation();
  } catch (e) {
    return { 
      t: (key: string) => getSSRTranslation(key, 'hu')
    };
  }
}

interface LoginFormProps {
  errorKey?: string;
  email?: string;
  notVerified?: boolean;
}

export default function LoginForm({ errorKey, email: initialEmail, notVerified }: LoginFormProps) {
  const { t } = useSSRSafeTranslation();
  
  const [email, setEmail] = useState(initialEmail || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  
  const resendFetcher = useFetcher();

  // Cooldown timer
  React.useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  // Handle resend result
  React.useEffect(() => {
    if (resendFetcher.data) {
      const data = resendFetcher.data as any;
      if (data.success) {
        setCooldownTime(60);
      } else if (data.waitTime) {
        setCooldownTime(data.waitTime);
      }
    }
  }, [resendFetcher.data]);

  const handleResendEmail = () => {
    if (cooldownTime > 0) return;
    
    resendFetcher.submit(
      { email },
      { method: "post", action: "/api/resend-verification" }
    );
  };

  return (
    <>
      {/* Welcome Section */}
      <div className="auth-welcome">
        <div className="auth-welcome-content">
          <h1>{t("login.title")} <span role="img" aria-label="wave">👋</span></h1>
          <p>{t("login.welcomeText")}</p>
          <div className="auth-welcome-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🗺️</div>
              <div className="auth-feature-text">
                <h3>{t("login.feature.map")}</h3>
                <p>{t("login.feature.mapDesc")}</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📅</div>
              <div className="auth-feature-text">
                <h3>{t("login.feature.quick")}</h3>
                <p>{t("login.feature.quickDesc")}</p>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🔔</div>
              <div className="auth-feature-text">
                <h3>{t("login.feature.notify")}</h3>
                <p>{t("login.feature.notifyDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="auth-form-section">
        <div className="auth-card">
          <h1>{t("login.title")}</h1>
          <p>{t("login.subtitle")}</p>
          
          {/* Email verification error with resend button */}
          {errorKey === "errors.verifyEmailFirst" && (
            <div className="error-message" role="alert" aria-live="assertive" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'stretch'
            }}>
              <div>{t(errorKey)}</div>
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={cooldownTime > 0 || resendFetcher.state === "submitting"}
                style={{
                  background: cooldownTime > 0 ? 'rgba(255,255,255,0.1)' : 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  color: cooldownTime > 0 ? 'rgba(255,255,255,0.5)' : '#4ade80',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  cursor: cooldownTime > 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: '500'
                }}
              >
                {resendFetcher.state === "submitting" ? (
                  "📧 Küldés..."
                ) : cooldownTime > 0 ? (
                  `⏱️ Újraküldés ${cooldownTime}s múlva`
                ) : (
                  "📧 Nem kaptam meg az emailt - Újraküldés"
                )}
              </button>
              {resendFetcher.data?.success && (
                <div style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.85rem',
                  color: '#4ade80'
                }}>
                  ✅ {resendFetcher.data.message}
                </div>
              )}
              {resendFetcher.data?.error && (
                <div style={{
                  fontSize: '0.85rem',
                  color: '#fca5a5'
                }}>
                  ⚠️ {resendFetcher.data.message}
                </div>
              )}
            </div>
          )}
          
          {/* Other errors */}
          {errorKey && errorKey !== "errors.verifyEmailFirst" && (
            <div className="error-message" role="alert" aria-live="assertive">
              {t(errorKey) || t("errors.invalidEmailOrPassword")}
            </div>
          )}
          
          <Form method="post" className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t("login.email")}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="pelda@email.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">{t("login.password")}</label>
              <div className="password-field-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  tabIndex={-1}
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                <Link to="/forgot-password" style={{ 
                  color: '#667eea', 
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  fontWeight: 500
                }}>
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>
            <button type="submit" className="btn-primary">
              {t("login.submit")}
            </button>
          </Form>
          <div className="auth-footer">
            <p>
              {t("login.noAccount")}{" "}
              <Link to="/register">{t("login.registerLink")}</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
