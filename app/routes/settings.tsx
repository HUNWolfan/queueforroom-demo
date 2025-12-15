import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useOutletContext, Form, useActionData, useFetcher } from "@remix-run/react";
import { requireUserId } from "~/utils/session.server";
import { query } from "~/db.server";
import Header from "~/components/layout/Header";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  
  // Get user data including 2FA status
  const userResult = await query(
    'SELECT id, email, first_name, last_name, role, created_at, two_factor_secret, two_factor_email FROM users WHERE id = $1',
    [userId]
  );
  
  const user = userResult.rows[0];
  
  // Get notification settings
  const notificationResult = await query(
    `SELECT * FROM notification_settings WHERE user_id = $1`,
    [userId]
  );
  
  let notificationSettings = notificationResult.rows[0];
  
  // If no settings exist, create default ones
  if (!notificationSettings) {
    await query(
      `INSERT INTO notification_settings (user_id) VALUES ($1)`,
      [userId]
    );
    notificationSettings = {
      email_notifications: true,
      reservation_reminders: true,
      reservation_confirmed: true,
      reservation_cancelled: true,
      reservation_updated: true,
      permission_granted: true,
      permission_rejected: false,
    };
  }
  
  return json({ 
    user,
    settings: {
      emailNotifications: notificationSettings.email_notifications,
      reservationReminders: notificationSettings.reservation_reminders,
      reservationConfirmed: notificationSettings.reservation_confirmed,
      reservationCancelled: notificationSettings.reservation_cancelled,
      reservationUpdated: notificationSettings.reservation_updated,
      permissionGranted: notificationSettings.permission_granted,
      permissionRejected: notificationSettings.permission_rejected,
      theme: 'auto',
      twoFactorEnabled: !!user.two_factor_secret || !!user.two_factor_email,
      twoFactorMethod: user.two_factor_secret ? 'authenticator' : user.two_factor_email ? 'email' : null,
      animationsEnabled: true,
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  const formData = await request.formData();
  
  const intent = formData.get("intent");
  
  // Handle theme change
  if (intent === "theme") {
    const theme = formData.get("theme");
    const animationsEnabled = formData.get("animationsEnabled") === "on";
    
    return json({ 
      success: true, 
      message: "saveSuccess",
      theme: theme,
      animationsEnabled: animationsEnabled
    });
  }
  
  // Handle notification settings
  if (intent === "notifications") {
    const emailNotifications = formData.get("emailNotifications") === "on";
    const reservationReminders = formData.get("reservationReminders") === "on";
    const reservationConfirmed = formData.get("reservationConfirmed") === "on";
    const reservationCancelled = formData.get("reservationCancelled") === "on";
    const reservationUpdated = formData.get("reservationUpdated") === "on";
    const permissionGranted = formData.get("permissionGranted") === "on";
    const permissionRejected = formData.get("permissionRejected") === "on";

    // Update notification settings
    await query(
      `UPDATE notification_settings 
       SET email_notifications = $1,
           reservation_reminders = $2,
           reservation_confirmed = $3,
           reservation_cancelled = $4,
           reservation_updated = $5,
           permission_granted = $6,
           permission_rejected = $7,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $8`,
      [
        emailNotifications,
        reservationReminders,
        reservationConfirmed,
        reservationCancelled,
        reservationUpdated,
        permissionGranted,
        permissionRejected,
        userId
      ]
    );
    
    return json({ 
      success: true, 
      message: "saveSuccess" 
    });
  }
  
  // Handle password reset email
  if (intent === "passwordReset") {
    const email = formData.get("email");
    
    // Generate reset token
    const crypto = await import('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store reset token in database
    await query(
      `UPDATE users 
       SET password_reset_token = $1, 
           password_reset_expires = $2
       WHERE id = $3`,
      [resetToken, resetTokenExpiry, userId]
    );
    
    // Send reset email (we'll implement this properly later)
    // For now, just return success
    return json({ 
      success: true, 
      message: "resetEmailSent",
      resetToken: resetToken // In production, don't return this!
    });
  }
  
  return json({ 
    success: false, 
    error: "Invalid intent" 
  }, { status: 400 });
}

export default function Settings() {
  const { user: currentUser, settings } = useLoaderData<typeof loader>();
  const { user } = useOutletContext<any>();
  const actionData = useActionData<typeof action>();
  const { t, i18n } = useTranslation();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selected2FAMethod, setSelected2FAMethod] = useState<'authenticator' | 'email'>('authenticator');
  const [currentTheme, setCurrentTheme] = useState<string>('auto');
  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string;
    qrCodeUrl: string;
    manualEntryKey: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState("");
  const fetcher = useFetcher();
  const twoFactorFetcher = useFetcher();

  // Load current theme on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'auto';
      setCurrentTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'auto');
    }
  }, []);

  useEffect(() => {
    if ((actionData as any)?.theme) {
      // Apply theme to document
      const newTheme = (actionData as any).theme;
      if (newTheme === 'auto') {
        if (typeof document !== 'undefined') {
          document.documentElement.removeAttribute('data-theme');
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('theme');
        }
        setCurrentTheme('auto');
      } else {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', newTheme);
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('theme', newTheme);
        }
        setCurrentTheme(newTheme);
        
        // Dispatch custom event for ThemeSwitcher to update
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
        }
      }
    }
    
    // Handle animations setting
    if ((actionData as any)?.animationsEnabled !== undefined) {
      const animationsEnabled = (actionData as any).animationsEnabled;
      if (animationsEnabled) {
        if (typeof document !== 'undefined') {
          document.documentElement.removeAttribute('data-no-animations');
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('no-animations');
        }
      } else {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-no-animations', 'true');
        }
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('no-animations', 'true');
        }
      }
    }
  }, [actionData]);

  const handle2FAEnable = async () => {
    if (settings.twoFactorEnabled) {
      // If 2FA is enabled, disable it
      twoFactorFetcher.submit(
        { intent: "disable" },
        { method: "post", action: "/api/2fa" }
      );
    } else {
      // If 2FA is disabled, show setup modal
      setShow2FAModal(true);
      setTwoFactorError("");
      setVerificationCode("");
      
      // Load 2FA setup data
      try {
        const response = await fetch('/api/2fa');
        const data = await response.json();
        if (data.error) {
          setTwoFactorError(data.error);
        } else {
          setTwoFactorSetup(data);
        }
      } catch (error) {
        setTwoFactorError("Failed to load 2FA setup data");
      }
    }
  };

  const handlePasswordReset = () => {
    setShowResetModal(true);
  };

  const sendPasswordResetEmail = () => {
    // Send password reset email via fetcher
    fetcher.submit(
      { intent: "passwordReset", email: currentUser.email },
      { method: "post" }
    );
    setShowResetModal(false);
  };

  const handleEnable2FA = () => {
    console.log('handleEnable2FA called, method:', selected2FAMethod);
    
    if (selected2FAMethod === 'authenticator') {
      if (!verificationCode || verificationCode.length !== 6) {
        setTwoFactorError("Please enter a 6-digit verification code");
        return;
      }
      
      if (!twoFactorSetup) {
        setTwoFactorError("2FA setup data not loaded");
        return;
      }
      
      console.log('Submitting authenticator 2FA...');
      twoFactorFetcher.submit(
        { 
          intent: "enable-authenticator",
          secret: twoFactorSetup.secret,
          code: verificationCode
        },
        { method: "post", action: "/api/2fa" }
      );
    } else {
      console.log('Submitting email 2FA...');
      twoFactorFetcher.submit(
        { intent: "enable-email" },
        { method: "post", action: "/api/2fa" }
      );
    }
  };

  // Handle 2FA fetcher response
  useEffect(() => {
    if (twoFactorFetcher.data) {
      const data = twoFactorFetcher.data as any;
      if (data.success) {
        setShow2FAModal(false);
        setTwoFactorSetup(null);
        setVerificationCode("");
        
        // Show success message
        if (data.message) {
          setSuccessMessage(data.message);
          setShowSuccessModal(true);
        }
        
        // Reload page to update 2FA status after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else if (data.error) {
        setTwoFactorError(data.error);
      }
    }
  }, [twoFactorFetcher.data]);

  // Handle password reset fetcher response
  useEffect(() => {
    if (fetcher.data && (fetcher.data as any).message === 'resetEmailSent') {
      alert(t("settings.resetEmailSent"));
    }
  }, [fetcher.data, t]);

  return (
    <div className="app-container">
      <Header user={user} />
      
      <main className="main-content">
        <div className="settings-container">
          <div className="settings-header animate-slide-in">
            <h1>{t("nav.settings")}</h1>
            <p className="settings-subtitle">
              {t("settings.accountInfo")}
            </p>
          </div>

          {actionData?.success && (
            <div className="success-message animate-fade-in">
              {t(`settings.${(actionData as any).message}`)}
            </div>
          )}

          <div className="settings-grid">
            {/* Security Settings - NEW */}
            <div className="settings-card">
              <div className="card-icon security-icon">🔒</div>
              <h2>{t("settings.security")}</h2>
              
              <div className="settings-section">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t("settings.twoFactor")}</h3>
                    <p>{t("settings.twoFactorDesc")}</p>
                    {settings.twoFactorEnabled && (
                      <p style={{ fontSize: '0.875rem', color: '#4ade80', marginTop: '0.5rem', fontWeight: 'bold' }}>
                        ✅ Aktív
                        {settings.twoFactorMethod && (
                          <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)' }}>
                            ({settings.twoFactorMethod === 'authenticator' ? '📱 Authenticator' : '✉️ Email'})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={handle2FAEnable}
                    className={settings.twoFactorEnabled ? "btn-danger" : "btn-primary"}
                  >
                    {settings.twoFactorEnabled ? t("settings.disable2FA") : t("settings.enable2FA")}
                  </button>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>{t("settings.passwordReset")}</h3>
                    <p>{t("settings.resetEmailSent")}</p>
                  </div>
                  <button 
                    onClick={handlePasswordReset}
                    className="btn-secondary"
                  >
                    {t("settings.sendResetEmail")}
                  </button>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="settings-card">
              <div className="card-icon notification-icon">🔔</div>
              <h2>{t("settings.notifications")}</h2>
              <Form method="post" className="settings-form">
                <input type="hidden" name="intent" value="notifications" />
                
                <div className="form-group checkbox-group">
                  <label className="modern-checkbox">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      defaultChecked={settings.emailNotifications}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label-text">
                      <strong>{t("settings.emailNotifications")}</strong>
                      <small>{t("settings.emailNotificationsDesc")}</small>
                    </span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="modern-checkbox">
                    <input
                      type="checkbox"
                      name="reservationReminders"
                      defaultChecked={settings.reservationReminders}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label-text">
                      <strong>{t("settings.reservationReminders")}</strong>
                      <small>{t("settings.reservationRemindersDesc")}</small>
                    </span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="modern-checkbox">
                    <input
                      type="checkbox"
                      name="reservationConfirmed"
                      defaultChecked={settings.reservationConfirmed}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label-text">
                      <strong>{t("settings.reservationConfirmed")}</strong>
                      <small>{t("settings.reservationConfirmedDesc")}</small>
                    </span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="modern-checkbox">
                    <input
                      type="checkbox"
                      name="reservationCancelled"
                      defaultChecked={settings.reservationCancelled}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label-text">
                      <strong>{t("settings.reservationCancelled")}</strong>
                      <small>{t("settings.reservationCancelledDesc")}</small>
                    </span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label className="modern-checkbox">
                    <input
                      type="checkbox"
                      name="reservationUpdated"
                      defaultChecked={settings.reservationUpdated}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label-text">
                      <strong>{t("settings.reservationUpdated")}</strong>
                      <small>{t("settings.reservationUpdatedDesc")}</small>
                    </span>
                  </label>
                </div>

                {currentUser.role === 'user' && (
                  <>
                    <div className="form-group checkbox-group">
                      <label className="modern-checkbox">
                        <input
                          type="checkbox"
                          name="permissionGranted"
                          defaultChecked={settings.permissionGranted}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-label-text">
                          <strong>{t("settings.permissionGranted")}</strong>
                          <small>{t("settings.permissionGrantedDesc")}</small>
                        </span>
                      </label>
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="modern-checkbox">
                        <input
                          type="checkbox"
                          name="permissionRejected"
                          defaultChecked={settings.permissionRejected}
                        />
                        <span className="checkbox-custom"></span>
                        <span className="checkbox-label-text">
                          <strong>{t("settings.permissionRejected")}</strong>
                          <small>{t("settings.permissionRejectedDesc")}</small>
                        </span>
                      </label>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary btn-pulse">
                  {t("common.save")}
                </button>
              </Form>
            </div>

            {/* Appearance Settings */}
            <div className="settings-card">
              <div className="card-icon theme-icon">🎨</div>
              <h2>{t("settings.appearance")}</h2>
              <Form method="post" className="settings-form">
                <input type="hidden" name="intent" value="theme" />
                <div className="form-group">
                  <label>{t("settings.theme")}</label>
                  <div className="theme-selector">
                    <label className="theme-option">
                      <input type="radio" name="theme" value="auto" defaultChecked={currentTheme === 'auto'} />
                      <div className="theme-card">
                        <div className="theme-preview auto">🌓</div>
                        <span>{t("settings.themeAuto")}</span>
                      </div>
                    </label>
                    <label className="theme-option">
                      <input type="radio" name="theme" value="light" defaultChecked={currentTheme === 'light'} />
                      <div className="theme-card">
                        <div className="theme-preview light">☀️</div>
                        <span>{t("settings.themeLight")}</span>
                      </div>
                    </label>
                    <label className="theme-option">
                      <input type="radio" name="theme" value="dark" defaultChecked={currentTheme === 'dark'} />
                      <div className="theme-card">
                        <div className="theme-preview dark">🌙</div>
                        <span>{t("settings.themeDark")}</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label className="modern-checkbox">
                    <input
                      type="checkbox"
                      name="animationsEnabled"
                      defaultChecked={settings.animationsEnabled}
                    />
                    <span className="checkbox-custom"></span>
                    <span className="checkbox-label-text">
                      <strong>{t("settings.enableAnimations")}</strong>
                      <small>{t("settings.animationsDesc")}</small>
                    </span>
                  </label>
                </div>

                <button type="submit" className="btn-primary btn-pulse">
                  {t("common.save")}
                </button>
              </Form>
            </div>

            {/* Language Settings */}
            <div className="settings-card">
              <div className="card-icon language-icon">{i18n.language === 'hu' ? '🇭🇺' : '🇬🇧'}</div>
              <h2>{t("settings.language")}</h2>
              <div className="settings-info">
                <div className="info-badge">
                  <span className="badge-label">{t("settings.currentLanguage")}:</span>
                  <span className="badge-value">
                    {i18n.language === 'hu' ? '🇭🇺 Magyar' : '🇬🇧 English'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '1rem' }}>
                  {t("settings.languageDesc")}
                </p>
              </div>
            </div>

            {/* Account Settings */}
            <div className="settings-card">
              <div className="card-icon account-icon">👤</div>
              <h2>{t("settings.account")}</h2>
              <div className="settings-info">
                <div className="account-details">
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{currentUser.email}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("profile.role")}:</span>
                    <span className="detail-value role-badge-small">
                      {currentUser.role === 'admin' && `👑 ${t("roles.admin")}`}
                      {currentUser.role === 'instructor' && `⭐ ${t("roles.instructor")}`}
                      {currentUser.role === 'student' && `🎓 ${t("roles.student")}`}
                      {currentUser.role === 'user' && `👤 ${t("roles.user")}`}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">{t("profile.memberSince")}:</span>
                    <span className="detail-value">
                      {new Date(currentUser.created_at).toLocaleDateString(i18n.language)}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <a href="/profile" className="btn-secondary btn-hover">
                    ✏️ {t("settings.editProfile")}
                  </a>
                  <button className="btn-secondary btn-hover" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    📦 {t("settings.exportData")}
                  </button>
                  <button className="btn-danger btn-hover" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                    🗑️ {t("settings.deleteAccount")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2FA Modal */}
        {show2FAModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShow2FAModal(false)}>
            <div className="modal-content modern-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🔐 {t("settings.enable2FA")}</h2>
                <button className="modal-close" onClick={() => setShow2FAModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                    {t("settings.choose2FAMethod")}
                  </p>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <label 
                      className="modern-checkbox" 
                      style={{ 
                        padding: '1rem', 
                        cursor: 'pointer', 
                        border: selected2FAMethod === 'authenticator' ? '2px solid var(--primary-color)' : '2px solid transparent', 
                        borderRadius: '8px', 
                        transition: 'all 0.3s',
                        background: selected2FAMethod === 'authenticator' ? 'rgba(103, 58, 183, 0.1)' : 'transparent'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="2fa-method" 
                        value="authenticator" 
                        checked={selected2FAMethod === 'authenticator'}
                        onChange={() => setSelected2FAMethod('authenticator')}
                        style={{ display: 'none' }}
                      />
                      <div className="checkbox-content" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2rem' }}>📱</div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{t("settings.authenticatorApp")}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {t("settings.authenticatorAppDesc")}
                          </div>
                        </div>
                      </div>
                    </label>
                    <label 
                      className="modern-checkbox" 
                      style={{ 
                        padding: '1rem', 
                        cursor: 'pointer', 
                        border: selected2FAMethod === 'email' ? '2px solid var(--primary-color)' : '2px solid transparent', 
                        borderRadius: '8px', 
                        transition: 'all 0.3s',
                        background: selected2FAMethod === 'email' ? 'rgba(103, 58, 183, 0.1)' : 'transparent'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="2fa-method" 
                        value="email" 
                        checked={selected2FAMethod === 'email'}
                        onChange={() => setSelected2FAMethod('email')}
                        style={{ display: 'none' }}
                      />
                      <div className="checkbox-content" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ fontSize: '2rem' }}>✉️</div>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>{t("settings.emailCode")}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {t("settings.emailCodeDesc")}
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
                
                {selected2FAMethod === 'authenticator' ? (
                  <>
                    {twoFactorError && (
                      <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1rem',
                        color: '#ef4444'
                      }}>
                        {twoFactorError}
                      </div>
                    )}
                    
                    {!twoFactorSetup ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="loading-spinner" style={{ 
                          width: '40px', 
                          height: '40px', 
                          border: '4px solid rgba(103, 126, 234, 0.1)',
                          borderTopColor: 'rgba(103, 126, 234, 1)',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          margin: '0 auto'
                        }}></div>
                        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                          Loading 2FA setup...
                        </p>
                      </div>
                    ) : (
                      <>
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {t("settings.scanQRCode")}
                          </p>
                          <div style={{ 
                            background: '#fff', 
                            padding: '1rem', 
                            borderRadius: '12px',
                            display: 'inline-block',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                          }}>
                            <img 
                              src={twoFactorSetup.qrCodeUrl} 
                              alt="QR Code" 
                              style={{ 
                                width: '200px', 
                                height: '200px',
                                display: 'block'
                              }}
                            />
                          </div>
                          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {t("settings.manualEntry")}
                          </p>
                          <code style={{ 
                            background: 'rgba(0,0,0,0.2)', 
                            padding: '0.5rem 1rem', 
                            borderRadius: '6px', 
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            letterSpacing: '2px'
                          }}>
                            {twoFactorSetup.manualEntryKey}
                          </code>
                        </div>
                        
                        <div className="form-group">
                          <label>{t("settings.verificationCode")}</label>
                          <input 
                            type="text" 
                            value={verificationCode}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                              setVerificationCode(value);
                              setTwoFactorError("");
                            }}
                            placeholder="000000"
                            maxLength={6}
                            style={{ 
                              textAlign: 'center', 
                              fontSize: '1.5rem', 
                              letterSpacing: '0.5rem',
                              fontFamily: 'monospace'
                            }}
                          />
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                            Enter the 6-digit code from your authenticator app
                          </p>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ 
                      background: 'rgba(103, 126, 234, 0.1)', 
                      border: '1px solid rgba(103, 126, 234, 0.3)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
                      <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                        Email-alapú kétfaktoros hitelesítés
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        Bejelentkezéskor egy 6 számjegyű kódot küldünk a regisztrált email címedre:
                      </p>
                      <div style={{ 
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        marginTop: '1rem',
                        fontWeight: 'bold',
                        color: 'var(--text-primary)'
                      }}>
                        {currentUser.email}
                      </div>
                      <p style={{ 
                        color: 'var(--text-secondary)', 
                        fontSize: '0.85rem', 
                        marginTop: '1rem',
                        fontStyle: 'italic'
                      }}>
                        A kód 10 percig érvényes
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-actions">
                <button onClick={() => setShow2FAModal(false)} className="btn-secondary">
                  {t("common.cancel")}
                </button>
                <button 
                  onClick={handleEnable2FA}
                  className="btn-primary btn-pulse"
                  disabled={
                    twoFactorFetcher.state === 'submitting' || 
                    (selected2FAMethod === 'authenticator' && (!twoFactorSetup || verificationCode.length !== 6))
                  }
                >
                  {twoFactorFetcher.state === 'submitting' ? t("common.saving") : t("common.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Reset Modal */}
        {showResetModal && (
          <div className="modal-overlay animate-fade-in" onClick={() => setShowResetModal(false)}>
            <div className="modal-content modern-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>🔑 {t("settings.passwordReset")}</h2>
                <button className="modal-close" onClick={() => setShowResetModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                  {t("settings.sendResetEmailDesc")}
                </p>
                <div className="info-badge" style={{ marginBottom: '1.5rem' }}>
                  <span className="badge-value">{currentUser.email}</span>
                </div>
                <div className="alert alert-info">
                  ℹ️ {t("settings.resetLinkExpiry")}
                </div>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowResetModal(false)} className="btn-secondary">
                  {t("common.cancel")}
                </button>
                <button 
                  className="btn-primary btn-pulse" 
                  onClick={sendPasswordResetEmail}
                  disabled={fetcher.state === 'submitting'}
                >
                  {fetcher.state === 'submitting' ? t("common.sending") : `📧 ${t("settings.sendResetEmail")}`}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>✅ {t("common.success")}</h2>
                <button className="modal-close" onClick={() => setShowSuccessModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: '1.1rem', textAlign: 'center', margin: '1.5rem 0' }}>
                  {successMessage}
                </p>
              </div>
              <div className="modal-actions">
                <button onClick={() => setShowSuccessModal(false)} className="btn-primary">
                  {t("common.ok")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
