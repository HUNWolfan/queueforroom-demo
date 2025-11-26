import { useState } from "react";
import { Form, Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

interface RegisterFormProps {
  errorKey?: string;
}

export default function RegisterForm({ errorKey }: RegisterFormProps) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const isHungarian = i18n.language === 'hu';

  return (
    <>
      {/* Welcome Section */}
      <div className="auth-welcome">
        <div className="auth-welcome-content">
          <h1>Csatlakozz hozzánk! 🚀</h1>
          <p>
            Hozz létre egy új fiókot, és használd ki a termfoglaló rendszer
            minden funkcióját. Egyszerű, gyors és biztonságos.
          </p>
          
          <div className="auth-welcome-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <div className="auth-feature-text">
                <h3>Gyors regisztráció</h3>
                <p>Pár lépésben létrehozhatod a fiókodat</p>
              </div>
            </div>
            
            <div className="auth-feature">
              <div className="auth-feature-icon">🔒</div>
              <div className="auth-feature-text">
                <h3>Biztonságos</h3>
                <p>Adataid védve vannak, 2FA támogatással</p>
              </div>
            </div>
            
            <div className="auth-feature">
              <div className="auth-feature-icon">🌍</div>
              <div className="auth-feature-text">
                <h3>Kétnyelvű</h3>
                <p>Magyar és angol nyelven is elérhető</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="auth-form-section">
        <div className="auth-card">
          <h1>{t("register.title")}</h1>
          <p>Hozz létre egy új fiókot</p>
          
          {errorKey && <div className="error-message">{t(errorKey)}</div>}
          
          <Form method="post" className="auth-form">
            <div className="form-row">
              {isHungarian ? (
                <>
                  {/* Magyar sorrend: Vezetéknév → Keresztnév */}
                  <div className="form-group">
                    <label htmlFor="lastName">{t("register.lastName")}</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      autoComplete="family-name"
                      placeholder="Kovács"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="firstName">{t("register.firstName")}</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                      placeholder="János"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Angol/nemzetközi sorrend: First Name → Last Name */}
                  <div className="form-group">
                    <label htmlFor="firstName">{t("register.firstName")}</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      autoComplete="given-name"
                      placeholder="John"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">{t("register.lastName")}</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      autoComplete="family-name"
                      placeholder="Smith"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">{t("register.email")}</label>
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
              <label htmlFor="password">{t("register.password")}</label>
              <div className="password-field-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>\/?]).{8,}$"
                  title={t("auth.passwordRequirements")}
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
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                {t("auth.passwordRequirements")}
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t("register.confirmPassword")}</label>
              <div className="password-field-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={8}
                  pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':&quot;\\|,.<>\/?]).{8,}$"
                  title={t("auth.passwordRequirements")}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              {t("register.submit")}
            </button>

            <div className="terms-notice">
              {t("auth.termsNotice")}{" "}
              <Link to="/terms">
                {t("auth.terms")}
              </Link>
              {", "}
              <Link to="/acceptable-use">
                {t("auth.acceptableUse")}
              </Link>
              {", "}
              {t("common.and")}{" "}
              <Link to="/privacy">
                {t("auth.privacyPolicy")}
              </Link>
            </div>
          </Form>

          <div className="auth-footer">
            <p>
              {t("register.hasAccount")}{" "}
              <Link to="/login">{t("register.loginLink")}</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
