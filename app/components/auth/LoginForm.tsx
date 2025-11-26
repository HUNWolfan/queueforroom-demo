import { useState } from "react";
import { Form, Link } from "@remix-run/react";

// SSR-safe translation hook
function useSSRSafeTranslation() {
  // During SSR, return Hungarian defaults to prevent hydration mismatch
  if (typeof window === "undefined") {
    return { 
      t: (key: string) => {
        const translations: Record<string, string> = {
          "login.title": "Bejelentkezés",
          "login.email": "E-mail cím",
          "login.password": "Jelszó",
          "login.submit": "Bejelentkezés",
          "login.noAccount": "Nincs még fiókod?",
          "login.registerLink": "Regisztráció itt",
          "login.welcomeText": "Jelentkezz be a fiókodba, hogy hozzáférj az összes funkcióhoz és kezdd el használni a rendszert.",
          "login.subtitle": "Lépj be a fiókodba",
          "login.feature.map": "Interaktív térkép",
          "login.feature.mapDesc": "Böngéssz a termek között vizuális térképen",
          "login.feature.quick": "Gyors foglalás",
          "login.feature.quickDesc": "Foglalj termet pár kattintással",
          "login.feature.notify": "Értesítések",
          "login.feature.notifyDesc": "Értesülj a foglalásaidról valós időben",
          "auth.forgotPassword": "Elfelejtetted a jelszavad?",
          "auth.showPassword": "Jelszó megjelenítése",
          "auth.hidePassword": "Jelszó elrejtése",
          "errors.invalidEmailOrPassword": "Érvénytelen email vagy jelszó",
          "errors.allFieldsRequired": "Minden mező kitöltése kötelező",
          "errors.accountLocked": "A fiók zárolva van túl sok sikertelen bejelentkezési kísérlet miatt.",
        };
        return translations[key] || key;
      }
    };
  }
  
  // Client-side: try to load i18next, fallback to Hungarian
  try {
    const { useTranslation } = require("react-i18next");
    return useTranslation();
  } catch (e) {
    return { 
      t: (key: string) => {
        const translations: Record<string, string> = {
          "login.title": "Bejelentkezés",
          "login.email": "E-mail cím",
          "login.password": "Jelszó",
          "login.submit": "Bejelentkezés",
          "login.noAccount": "Nincs még fiókod?",
          "login.registerLink": "Regisztráció itt",
          "login.welcomeText": "Jelentkezz be a fiókodba, hogy hozzáférj az összes funkcióhoz és kezdd el használni a rendszert.",
          "login.subtitle": "Lépj be a fiókodba",
          "login.feature.map": "Interaktív térkép",
          "login.feature.mapDesc": "Böngéssz a termek között vizuális térképen",
          "login.feature.quick": "Gyors foglalás",
          "login.feature.quickDesc": "Foglalj termet pár kattintással",
          "login.feature.notify": "Értesítések",
          "login.feature.notifyDesc": "Értesülj a foglalásaidról valós időben",
          "auth.forgotPassword": "Elfelejtetted a jelszavad?",
          "auth.showPassword": "Jelszó megjelenítése",
          "auth.hidePassword": "Jelszó elrejtése",
          "errors.invalidEmailOrPassword": "Érvénytelen email vagy jelszó",
          "errors.allFieldsRequired": "Minden mező kitöltése kötelező",
          "errors.accountLocked": "A fiók zárolva van túl sok sikertelen bejelentkezési kísérlet miatt.",
        };
        return translations[key] || key;
      }
    };
  }
}

interface LoginFormProps {
  errorKey?: string;
}

export default function LoginForm({ errorKey }: LoginFormProps) {
  const { t } = useSSRSafeTranslation();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

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
          {errorKey && (
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
