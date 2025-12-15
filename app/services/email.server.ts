import { Resend } from 'resend';
import { query } from '~/db.server';

/**
 * Email Service using Resend API
 * Free tier: 3,000 emails/month, 100 emails/day
 * Docs: https://resend.com/docs
 */

// Lazy initialization of Resend client for Cloudflare Workers compatibility
let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY || 're_123456789_YOUR_API_KEY_HERE';
    resend = new Resend(apiKey);
  }
  return resend;
}

// Get email configuration from environment (lazy evaluation)
function getFromEmail() {
  return process.env.FROM_EMAIL || 'onboarding@resend.dev';
}

const APP_NAME = 'QueueForRoom';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Check if user has email notifications enabled for a specific type
 */
async function shouldSendEmail(userEmail: string, notificationType: string): Promise<boolean> {
  try {
    const result = await query(
      `SELECT ns.email_notifications, ns.${notificationType}
       FROM notification_settings ns
       JOIN users u ON ns.user_id = u.id
       WHERE u.email = $1`,
      [userEmail]
    );

    if (result.rows.length === 0) {
      // No settings found - default to enabled
      return true;
    }

    const settings = result.rows[0];
    
    // Check global email notifications switch first
    if (!settings.email_notifications) {
      console.log(`⏭️  Email skipped: User has disabled all email notifications (${userEmail})`);
      return false;
    }

    // Check specific notification type
    if (!settings[notificationType]) {
      console.log(`⏭️  Email skipped: User has disabled ${notificationType} notifications (${userEmail})`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking email notification settings:', error);
    // On error, default to sending email (fail-safe)
    return true;
  }
}

// Email translations
const emailTranslations = {
  en: {
    passwordReset: {
      subject: 'Password Reset Request',
      title: 'Password Reset',
      greeting: 'Hello',
      message: 'You requested to reset your password. Click the button below to create a new password:',
      button: 'Reset Password',
      expiry: 'This link will expire in 1 hour.',
      noRequest: "If you didn't request this, please ignore this email.",
      footer: 'Thanks, The QueueForRoom Team'
    },
    welcome: {
      subject: 'Welcome to QueueForRoom!',
      title: 'Welcome aboard!',
      greeting: 'Hi',
      message: 'Thank you for registering with QueueForRoom. We\'re excited to have you!',
      activateMessage: 'Please verify your email address by clicking the button below:',
      button: 'Verify Email Address',
      features: 'What you can do:',
      feature1: '🗺️ Browse interactive room maps',
      feature2: '📅 Make and manage reservations',
      feature3: '🔔 Get notifications for your bookings',
      expiry: 'This verification link will expire in 24 hours.',
      footer: 'Welcome to the team! The QueueForRoom Team'
    },
    reservation: {
      subject: 'Reservation Confirmation',
      title: 'Reservation Confirmed',
      greeting: 'Hello',
      message: 'Your room reservation has been confirmed:',
      room: 'Room',
      date: 'Date',
      time: 'Time',
      attendees: 'Attendees',
      purpose: 'Purpose',
      shareLink: 'Share this reservation:',
      footer: 'See you there! The QueueForRoom Team'
    },
    twoFactor: {
      subject: 'Your Verification Code',
      title: 'Two-Factor Authentication',
      greeting: 'Hello',
      message: 'Your verification code is:',
      expiry: 'This code will expire in 10 minutes.',
      noRequest: "If you didn't request this, please secure your account immediately.",
      footer: 'The QueueForRoom Team'
    }
  },
  hu: {
    passwordReset: {
      subject: 'Jelszó Visszaállítási Kérés',
      title: 'Jelszó Visszaállítás',
      greeting: 'Helló',
      message: 'Jelszó visszaállítást kértél. Kattints az alábbi gombra új jelszó létrehozásához:',
      button: 'Jelszó Visszaállítása',
      expiry: 'Ez a link 1 órán belül lejár.',
      noRequest: 'Ha nem te kérted ezt, kérjük figyelmen kívül hagyni ezt az emailt.',
      footer: 'Köszönjük, A QueueForRoom Csapat'
    },
    welcome: {
      subject: 'Üdvözlünk a QueueForRoom-ban!',
      title: 'Üdvözlünk a fedélzeten!',
      greeting: 'Szia',
      message: 'Köszönjük, hogy regisztráltál a QueueForRoom-ba. Örülünk, hogy itt vagy!',
      activateMessage: 'Kérjük erősítsd meg az email címedet az alábbi gombra kattintva:',
      button: 'Email Cím Megerősítése',
      features: 'Mit tudsz csinálni:',
      feature1: '🗺️ Interaktív terem térképek böngészése',
      feature2: '📅 Foglalások létrehozása és kezelése',
      feature3: '🔔 Értesítések fogadása a foglalásaidról',
      expiry: 'Ez az ellenőrző link 24 órán belül lejár.',
      footer: 'Üdvözlünk a csapatban! A QueueForRoom Csapat'
    },
    reservation: {
      subject: 'Foglalás Megerősítés',
      title: 'Foglalás Megerősítve',
      greeting: 'Helló',
      message: 'A terem foglalásod megerősítésre került:',
      room: 'Terem',
      date: 'Dátum',
      time: 'Időpont',
      attendees: 'Résztvevők',
      purpose: 'Cél',
      shareLink: 'Oszd meg ezt a foglalást:',
      footer: 'Ott találkozunk! A QueueForRoom Csapat'
    },
    twoFactor: {
      subject: 'Az Ellenőrző Kódod',
      title: 'Kétfaktoros Hitelesítés',
      greeting: 'Helló',
      message: 'Az ellenőrző kódod:',
      expiry: 'Ez a kód 10 percen belül lejár.',
      noRequest: 'Ha nem te kérted ezt, kérjük azonnal biztosítsd a fiókodat.',
      footer: 'A QueueForRoom Csapat'
    }
  }
};

/**
 * Send a generic email
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams) {
  // Check if in development mode or Resend API key is not configured
  const isDevelopment = process.env.NODE_ENV === 'development';
  const hasValidKey = process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_123456789_YOUR_API_KEY_HERE';
  
  // RESEND FREE TIER: Can only send to verified email address
  // Override recipient for testing if needed
  const testEmail = process.env.TEST_EMAIL_OVERRIDE || process.env.VERIFIED_EMAIL || 'wrabl.marcell@gmail.com';
  const shouldSendRealEmail = process.env.SEND_REAL_EMAILS === 'true' && hasValidKey && !isDevelopment;
  const actualRecipient = shouldSendRealEmail ? testEmail : to;
  
  // Always log email for debugging
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📧 EMAIL ${shouldSendRealEmail ? 'SENDING' : 'PREVIEW'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Mode:', isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION');
  console.log('Send Real Emails:', shouldSendRealEmail);
  console.log('Has Valid API Key:', hasValidKey);
  console.log('Intended Recipient:', to);
  if (shouldSendRealEmail && actualRecipient !== to) {
    console.log('⚠️  REDIRECTED TO:', actualRecipient, '(Resend free tier limitation)');
  }
  console.log('Subject:', subject);
  console.log('From:', `${APP_NAME} <${getFromEmail()}>`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Content Preview:');
  console.log(text || html.replace(/<[^>]*>/g, '').substring(0, 500));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // In development or when real email sending is disabled, just show preview
  if (!shouldSendRealEmail) {
    if (!hasValidKey) {
      console.log('⚠️  To enable real email sending:');
      console.log('1. Sign up at https://resend.com');
      console.log('2. Get your API key from https://resend.com/api-keys');
      console.log('3. Set RESEND_API_KEY in .env');
      console.log('4. Set NODE_ENV=production and SEND_REAL_EMAILS=true');
      console.log('5. Verify a domain at https://resend.com/domains for production');
    } else if (isDevelopment) {
      console.log('ℹ️  Development mode: Emails shown in console only');
      console.log('   To send real emails:');
      console.log('   1. Set NODE_ENV=production in .env');
      console.log('   2. Set SEND_REAL_EMAILS=true in .env');
      console.log('   Note: Free tier can only send to:', testEmail);
    } else {
      console.log('ℹ️  Email preview mode: SEND_REAL_EMAILS is not true');
      console.log('   Set SEND_REAL_EMAILS=true in .env to send real emails.');
      console.log('   Free tier: Emails will be sent to', testEmail);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: true, data: { id: 'preview-mode-' + Date.now() } };
  }

  // Production mode - attempt to send real email
  try {
    const client = getResendClient();
    const response = await client.emails.send({
      from: `${APP_NAME} <${getFromEmail()}>`,
      to: [actualRecipient],
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    });

    console.log('✅ Email sent successfully to', actualRecipient);
    
    // Resend returns { data: { id: "..." }, error: null }
    if (response && response.data && 'id' in response.data) {
      console.log('   Message ID:', response.data.id);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return { success: true, data: response.data };
  } catch (error: any) {
    console.error('❌ Email sending failed:', error);
    
    // If error is about domain verification, provide helpful message
    if (error?.message?.includes('verify a domain')) {
      console.log('\n⚠️  RESEND FREE TIER LIMITATION:');
      console.log('   You can only send to your verified email address in free tier.');
      console.log('   Current recipient:', actualRecipient);
      console.log('   To send to other addresses:');
      console.log('   1. Go to https://resend.com/domains');
      console.log('   2. Add and verify your domain');
      console.log('   3. Update FROM_EMAIL in .env to use your domain\n');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    return { success: false, error };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string, baseUrl: string) {
  const resetLink = `${baseUrl}/reset-password/${resetToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-top: 20px;
          }
          .button {
            display: inline-block;
            background: rgba(103, 126, 234, 1);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
          }
          .footer {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-top: 20px;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: white; margin: 0;">🔑 ${APP_NAME}</h1>
          <p style="color: rgba(255,255,255,0.9);">Password Reset Request</p>
          
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            
            <a href="${resetLink}" class="button">Reset Password</a>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in <strong>1 hour</strong>.<br>
              If you didn't request this, please ignore this email.
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              Or copy and paste this URL into your browser:<br>
              <code style="background: #f5f5f5; padding: 8px; display: block; word-break: break-all; margin-top: 10px;">
                ${resetLink}
              </code>
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent by ${APP_NAME}<br>School Room Reservation System</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - Password Reset Request
    
    You requested to reset your password.
    
    Click here to reset: ${resetLink}
    
    This link will expire in 1 hour.
    If you didn't request this, please ignore this email.
    
    ---
    ${APP_NAME} - School Room Reservation System
  `;

  return sendEmail({
    to: email,
    subject: `Reset Your ${APP_NAME} Password`,
    html,
    text,
  });
}

/**
 * Send reservation confirmation email
 */
export async function sendReservationConfirmation(
  email: string,
  userName: string,
  reservation: {
    roomName: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
  }
) {
  // Check if user has this notification type enabled
  const canSend = await shouldSendEmail(email, 'reservation_confirmed');
  if (!canSend) {
    return { success: true, skipped: true };
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 40px;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          .button {
            display: inline-block;
            background: rgba(103, 126, 234, 1);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: white; text-align: center;">✅ Reservation Confirmed</h1>
          
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>Your room reservation has been confirmed:</p>
            
            <div class="detail-row">
              <strong>Room:</strong>
              <span>${reservation.roomName}</span>
            </div>
            <div class="detail-row">
              <strong>Start:</strong>
              <span>${formatDate(reservation.startTime)}</span>
            </div>
            <div class="detail-row">
              <strong>End:</strong>
              <span>${formatDate(reservation.endTime)}</span>
            </div>
            ${reservation.purpose ? `
            <div class="detail-row">
              <strong>Purpose:</strong>
              <span>${reservation.purpose}</span>
            </div>
            ` : ''}
            
            <p style="margin-top: 30px; color: #666;">
              Need to make changes? Log in to your account to manage your reservations.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Reservation Confirmed - ${reservation.roomName}`,
    html,
  });
}

/**
 * Send 2FA verification code
 */
export async function send2FACode(email: string, code: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          .code {
            font-size: 42px;
            font-weight: bold;
            letter-spacing: 8px;
            color: rgba(103, 126, 234, 1);
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: white;">🔐 ${APP_NAME}</h1>
          
          <div class="content">
            <h2>Two-Factor Authentication</h2>
            <p>Your verification code is:</p>
            
            <div class="code">${code}</div>
            
            <p style="color: #666; font-size: 14px;">
              This code will expire in <strong>10 minutes</strong>.<br>
              If you didn't request this, please secure your account immediately.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Your ${APP_NAME} Verification Code: ${code}`,
    html,
  });
}

/**
 * Send welcome email with verification link to new users
 */
export async function sendWelcomeEmail(
  email: string, 
  firstName: string, 
  verificationToken: string, 
  baseUrl: string,
  language: 'en' | 'hu' = 'en'
) {
  const t = emailTranslations[language].welcome;
  const verificationLink = `${baseUrl}/verify-email/${verificationToken}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
          }
          .button {
            display: inline-block;
            background: rgba(103, 126, 234, 1);
            color: white;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: 600;
          }
          .feature {
            text-align: left;
            padding: 12px;
            margin: 10px 0;
            background: #f9f9f9;
            border-radius: 6px;
          }
          .footer {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
            margin-top: 20px;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px;
            margin: 20px 0;
            text-align: left;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: white;">🎉 ${t.title}</h1>
          
          <div class="content">
            <h2>${t.greeting} ${firstName}!</h2>
            <p>${t.message}</p>
            
            <p style="margin-top: 20px;"><strong>${t.activateMessage}</strong></p>
            
            <a href="${verificationLink}" class="button">${t.button}</a>
            
            <h3 style="margin-top: 30px;">${t.features}</h3>
            <div class="feature">${t.feature1}</div>
            <div class="feature">${t.feature2}</div>
            <div class="feature">${t.feature3}</div>
            
            <div class="warning">
              ⏰ ${t.expiry}
            </div>
          </div>
          
          <div class="footer">
            <p>${t.footer}</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${firstName}!
    
    ${t.message}
    
    ${t.activateMessage}
    ${verificationLink}
    
    ${t.features}
    - ${t.feature1}
    - ${t.feature2}
    - ${t.feature3}
    
    ${t.expiry}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send notification email to users registered by admin
 * No verification required - just notification
 */
export async function sendAdminRegistrationEmail(
  email: string,
  firstName: string,
  tempPassword: string,
  baseUrl: string,
  language: 'en' | 'hu' = 'en'
) {
  const translations = {
    en: {
      subject: 'Your account has been created',
      title: 'Account Created',
      greeting: 'Hello',
      message: 'An administrator has created an account for you.',
      credentialsTitle: 'Your login credentials:',
      email: 'Email',
      password: 'Temporary Password',
      loginButton: 'Login Now',
      changePasswordNote: 'Please change your password after your first login.',
      footer: `This is an automated message from ${APP_NAME}. Please do not reply to this email.`
    },
    hu: {
      subject: 'A fiókod létrehozásra került',
      title: 'Fiók Létrehozva',
      greeting: 'Szia',
      message: 'Egy adminisztrátor létrehozott neked egy fiókot.',
      credentialsTitle: 'Bejelentkezési adataid:',
      email: 'Email',
      password: 'Ideiglenes Jelszó',
      loginButton: 'Bejelentkezés',
      changePasswordNote: 'Kérlek, változtasd meg a jelszavadat az első bejelentkezés után.',
      footer: `Ez egy automatikus üzenet a ${APP_NAME} rendszerétől. Kérjük, ne válaszolj erre az emailre.`
    }
  };

  const t = translations[language];
  const loginLink = `${baseUrl}/login`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-top: 20px;
            text-align: left;
          }
          .credentials {
            background: #f7fafc;
            border-left: 4px solid rgba(103, 126, 234, 1);
            padding: 15px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 10px 0;
          }
          .credential-label {
            font-weight: bold;
            color: #4a5568;
          }
          .credential-value {
            font-family: monospace;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            display: inline-block;
            margin-left: 10px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, rgba(103, 126, 234, 1), rgba(103, 126, 234, 0.8));
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .warning {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 10px;
            border-radius: 4px;
            color: #856404;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: white;">🎉 ${APP_NAME}</h1>
          
          <div class="content">
            <h2>${t.title}</h2>
            <p>${t.greeting} ${firstName},</p>
            <p>${t.message}</p>
            
            <div class="credentials">
              <strong>${t.credentialsTitle}</strong>
              <div class="credential-item">
                <span class="credential-label">${t.email}:</span>
                <span class="credential-value">${email}</span>
              </div>
              <div class="credential-item">
                <span class="credential-label">${t.password}:</span>
                <span class="credential-value">${tempPassword}</span>
              </div>
            </div>

            <div class="warning">
              ⚠️ ${t.changePasswordNote}
            </div>

            <center>
              <a href="${loginLink}" class="button">${t.loginButton}</a>
            </center>

            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${firstName},
    
    ${t.message}
    
    ${t.credentialsTitle}
    ${t.email}: ${email}
    ${t.password}: ${tempPassword}
    
    ${t.changePasswordNote}
    
    ${t.loginButton}: ${loginLink}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send account lockout notification email with unlock link
 */
export async function sendAccountLockoutEmail(
  email: string,
  unlockToken: string,
  baseUrl: string,
  language: 'en' | 'hu' = 'en'
) {
  const translations = {
    en: {
      subject: '🔒 Security Alert: Account Locked',
      title: 'Account Locked',
      greeting: 'Hello',
      message: 'Your account has been temporarily locked due to too many failed login attempts.',
      lockDuration: 'Lock Duration: 10 minutes',
      securityNote: 'If this was you, please wait 10 minutes or use the button below to unlock your account immediately.',
      notYouWarning: 'If this wasn\'t you, someone may be trying to access your account. Please unlock your account and change your password immediately.',
      unlockButton: 'Unlock Account & Change Password',
      tokenNote: 'This unlock link can only be used once and will redirect you to change your password.',
      footer: `This is an automated security message from ${APP_NAME}. Please do not reply to this email.`
    },
    hu: {
      subject: '🔒 Biztonsági Figyelmeztetés: Fiók Zárolva',
      title: 'Fiók Zárolva',
      greeting: 'Szia',
      message: 'A fiókod ideiglenesen zárolva lett túl sok sikertelen bejelentkezési kísérlet miatt.',
      lockDuration: 'Zárolás időtartama: 10 perc',
      securityNote: 'Ha te voltál, kérlek várj 10 percet, vagy használd az alábbi gombot a fiókod azonnali feloldásához.',
      notYouWarning: 'Ha nem te voltál, valaki megpróbálhat hozzáférni a fiókodhoz. Kérlek, oldd fel a fiókodat és azonnal változtasd meg a jelszavadat.',
      unlockButton: 'Fiók Feloldása és Jelszó Változtatás',
      tokenNote: 'Ez a feloldó link csak egyszer használható és átirányít téged a jelszó változtatás oldalára.',
      footer: `Ez egy automatikus biztonsági üzenet a ${APP_NAME} rendszerétől. Kérjük, ne válaszolj erre az emailre.`
    }
  };

  const t = translations[language];
  const unlockLink = `${baseUrl}/unlock-account/${unlockToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-top: 20px;
            text-align: left;
          }
          .alert {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #856404;
          }
          .warning {
            background: #fee;
            border: 2px solid #ef4444;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #991b1b;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 8px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          .lockout-info {
            background: #f7fafc;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
            font-family: monospace;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: white; font-size: 2.5rem; margin: 0;">🔒</h1>
          <h2 style="color: white; margin: 10px 0;">${APP_NAME}</h2>
          
          <div class="content">
            <h2>${t.title}</h2>
            <p>${t.greeting},</p>
            <p>${t.message}</p>
            
            <div class="lockout-info">
              ⏱️ ${t.lockDuration}
            </div>

            <div class="alert">
              ℹ️ ${t.securityNote}
            </div>

            <center>
              <a href="${unlockLink}" class="button">${t.unlockButton}</a>
            </center>

            <p style="font-size: 13px; color: #666; text-align: center; margin-top: 10px;">
              ${t.tokenNote}
            </p>

            <div class="warning">
              ⚠️ ${t.notYouWarning}
            </div>

            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting},
    
    ${t.message}
    
    ${t.lockDuration}
    
    ${t.securityNote}
    
    ${t.unlockButton}: ${unlockLink}
    
    ${t.tokenNote}
    
    ${t.notYouWarning}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send reservation invitation email to invited users
 */
export async function sendReservationInvite(
  email: string,
  inviterName: string,
  inviteeName: string,
  reservation: {
    roomName: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
  },
  baseUrl: string,
  language: 'en' | 'hu' = 'en'
) {
  const translations = {
    en: {
      subject: `You've been invited to a reservation`,
      title: 'Reservation Invitation',
      greeting: 'Hello',
      message: `${inviterName} has invited you to join their room reservation.`,
      details: 'Reservation Details:',
      room: 'Room',
      date: 'Date & Time',
      purpose: 'Purpose',
      viewButton: 'View Reservation',
      footer: `This is an automated invitation from ${APP_NAME}. Please do not reply to this email.`
    },
    hu: {
      subject: `Meghívót kaptál egy foglaláshoz`,
      title: 'Foglalási Meghívó',
      greeting: 'Szia',
      message: `${inviterName} meghívott téged a teremfoglalásához.`,
      details: 'Foglalás részletei:',
      room: 'Terem',
      date: 'Dátum és Időpont',
      purpose: 'Cél',
      viewButton: 'Foglalás Megtekintése',
      footer: `Ez egy automatikus meghívó a ${APP_NAME} rendszerétől. Kérjük, ne válaszolj erre az emailre.`
    }
  };

  const t = translations[language];
  const viewLink = `${baseUrl}/reservations`;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            margin-top: 20px;
            text-align: left;
          }
          .details-box {
            background: #f7fafc;
            border-left: 4px solid rgba(103, 126, 234, 1);
            padding: 15px;
            margin: 20px 0;
          }
          .detail-row {
            margin: 10px 0;
          }
          .detail-label {
            font-weight: bold;
            color: #4a5568;
            display: inline-block;
            min-width: 120px;
          }
          .detail-value {
            color: #2d3748;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, rgba(103, 126, 234, 1), rgba(103, 126, 234, 0.8));
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            color: #999;
            font-size: 12px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 style="color: white;">📅 ${APP_NAME}</h1>
          
          <div class="content">
            <h2>${t.title}</h2>
            <p>${t.greeting} ${inviteeName},</p>
            <p>${t.message}</p>
            
            <div class="details-box">
              <strong>${t.details}</strong>
              <div class="detail-row">
                <span class="detail-label">${t.room}:</span>
                <span class="detail-value">${reservation.roomName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">${t.date}:</span>
                <span class="detail-value">${formatDate(reservation.startTime)} - ${formatDate(reservation.endTime)}</span>
              </div>
              ${reservation.purpose ? `
              <div class="detail-row">
                <span class="detail-label">${t.purpose}:</span>
                <span class="detail-value">${reservation.purpose}</span>
              </div>
              ` : ''}
            </div>

            <center>
              <a href="${viewLink}" class="button">${t.viewButton}</a>
            </center>

            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${inviteeName},
    
    ${t.message}
    
    ${t.details}
    ${t.room}: ${reservation.roomName}
    ${t.date}: ${formatDate(reservation.startTime)} - ${formatDate(reservation.endTime)}
    ${reservation.purpose ? `${t.purpose}: ${reservation.purpose}` : ''}
    
    ${t.viewButton}: ${viewLink}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send reservation cancellation email
 */
export async function sendReservationCancelled(
  email: string,
  userName: string,
  reservation: {
    roomName: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
  },
  language: 'en' | 'hu' = 'en'
) {
  // Check if user has this notification type enabled
  const canSend = await shouldSendEmail(email, 'reservation_cancelled');
  if (!canSend) {
    return { success: true, skipped: true };
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const t = language === 'hu' ? {
    title: 'Foglalás törölve',
    greeting: 'Kedves',
    message: 'A következő foglalásod törlésre került:',
    room: 'Terem',
    startTime: 'Kezdés',
    endTime: 'Befejezés',
    purpose: 'Cél',
    footer: 'Ha kérdésed van, lépj kapcsolatba az adminisztrátorral.',
    subject: `Foglalás törölve - ${reservation.roomName}`
  } : {
    title: 'Reservation Cancelled',
    greeting: 'Dear',
    message: 'Your reservation has been cancelled:',
    room: 'Room',
    startTime: 'Start Time',
    endTime: 'End Time',
    purpose: 'Purpose',
    footer: 'If you have any questions, please contact your administrator.',
    subject: `Reservation Cancelled - ${reservation.roomName}`
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 2px;
          }
          .content {
            background: white;
            border-radius: 10px;
            padding: 30px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1 style="margin: 0;">❌ ${t.title}</h1>
            </div>
            
            <p><strong>${t.greeting} ${userName}!</strong></p>
            <p>${t.message}</p>
            
            <div class="detail-row">
              <strong>${t.room}:</strong>
              <span>${reservation.roomName}</span>
            </div>
            <div class="detail-row">
              <strong>${t.startTime}:</strong>
              <span>${formatDate(reservation.startTime)}</span>
            </div>
            <div class="detail-row">
              <strong>${t.endTime}:</strong>
              <span>${formatDate(reservation.endTime)}</span>
            </div>
            ${reservation.purpose ? `
            <div class="detail-row">
              <strong>${t.purpose}:</strong>
              <span>${reservation.purpose}</span>
            </div>
            ` : ''}
            
            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${userName}!
    
    ${t.message}
    
    ${t.room}: ${reservation.roomName}
    ${t.startTime}: ${formatDate(reservation.startTime)}
    ${t.endTime}: ${formatDate(reservation.endTime)}
    ${reservation.purpose ? `${t.purpose}: ${reservation.purpose}` : ''}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send reservation updated email
 */
export async function sendReservationUpdated(
  email: string,
  userName: string,
  reservation: {
    roomName: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
  },
  language: 'en' | 'hu' = 'en'
) {
  // Check if user has this notification type enabled
  const canSend = await shouldSendEmail(email, 'reservation_updated');
  if (!canSend) {
    return { success: true, skipped: true };
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const t = language === 'hu' ? {
    title: 'Foglalás módosítva',
    greeting: 'Kedves',
    message: 'A foglalásod módosítva lett:',
    room: 'Terem',
    startTime: 'Új kezdés',
    endTime: 'Új befejezés',
    purpose: 'Cél',
    footer: 'Ha nem te végezted a módosítást, lépj kapcsolatba az adminisztrátorral.',
    subject: `Foglalás módosítva - ${reservation.roomName}`
  } : {
    title: 'Reservation Updated',
    greeting: 'Dear',
    message: 'Your reservation has been updated:',
    room: 'Room',
    startTime: 'New Start Time',
    endTime: 'New End Time',
    purpose: 'Purpose',
    footer: 'If you did not make this change, please contact your administrator.',
    subject: `Reservation Updated - ${reservation.roomName}`
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 2px;
          }
          .content {
            background: white;
            border-radius: 10px;
            padding: 30px;
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1 style="margin: 0;">🔄 ${t.title}</h1>
            </div>
            
            <p><strong>${t.greeting} ${userName}!</strong></p>
            <p>${t.message}</p>
            
            <div class="detail-row">
              <strong>${t.room}:</strong>
              <span>${reservation.roomName}</span>
            </div>
            <div class="detail-row">
              <strong>${t.startTime}:</strong>
              <span>${formatDate(reservation.startTime)}</span>
            </div>
            <div class="detail-row">
              <strong>${t.endTime}:</strong>
              <span>${formatDate(reservation.endTime)}</span>
            </div>
            ${reservation.purpose ? `
            <div class="detail-row">
              <strong>${t.purpose}:</strong>
              <span>${reservation.purpose}</span>
            </div>
            ` : ''}
            
            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${userName}!
    
    ${t.message}
    
    ${t.room}: ${reservation.roomName}
    ${t.startTime}: ${formatDate(reservation.startTime)}
    ${t.endTime}: ${formatDate(reservation.endTime)}
    ${reservation.purpose ? `${t.purpose}: ${reservation.purpose}` : ''}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send reservation reminder email
 */
export async function sendReservationReminder(
  email: string,
  userName: string,
  reservation: {
    roomName: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
  },
  language: 'en' | 'hu' = 'en'
) {
  // Check if user has this notification type enabled
  const canSend = await shouldSendEmail(email, 'reservation_reminders');
  if (!canSend) {
    return { success: true, skipped: true };
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'hu' ? 'hu-HU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const now = new Date();
  const minutesUntil = Math.round((reservation.startTime.getTime() - now.getTime()) / (1000 * 60));

  const t = language === 'hu' ? {
    title: 'Foglalás emlékeztető',
    greeting: 'Kedves',
    message: `A foglalásod ${minutesUntil} perc múlva kezdődik:`,
    room: 'Terem',
    startTime: 'Kezdés',
    endTime: 'Befejezés',
    purpose: 'Cél',
    footer: 'Jó munkát kívánunk!',
    subject: `Emlékeztető - ${reservation.roomName} foglalás ${minutesUntil} perc múlva`
  } : {
    title: 'Reservation Reminder',
    greeting: 'Dear',
    message: `Your reservation starts in ${minutesUntil} minutes:`,
    room: 'Room',
    startTime: 'Start Time',
    endTime: 'End Time',
    purpose: 'Purpose',
    footer: 'Have a great session!',
    subject: `Reminder - ${reservation.roomName} reservation in ${minutesUntil} minutes`
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 2px;
          }
          .content {
            background: white;
            border-radius: 10px;
            padding: 30px;
          }
          .header {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1 style="margin: 0;">⏰ ${t.title}</h1>
            </div>
            
            <p><strong>${t.greeting} ${userName}!</strong></p>
            <p>${t.message}</p>
            
            <div class="detail-row">
              <strong>${t.room}:</strong>
              <span>${reservation.roomName}</span>
            </div>
            <div class="detail-row">
              <strong>${t.startTime}:</strong>
              <span>${formatDate(reservation.startTime)}</span>
            </div>
            <div class="detail-row">
              <strong>${t.endTime}:</strong>
              <span>${formatDate(reservation.endTime)}</span>
            </div>
            ${reservation.purpose ? `
            <div class="detail-row">
              <strong>${t.purpose}:</strong>
              <span>${reservation.purpose}</span>
            </div>
            ` : ''}
            
            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${userName}!
    
    ${t.message}
    
    ${t.room}: ${reservation.roomName}
    ${t.startTime}: ${formatDate(reservation.startTime)}
    ${t.endTime}: ${formatDate(reservation.endTime)}
    ${reservation.purpose ? `${t.purpose}: ${reservation.purpose}` : ''}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send permission granted email
 */
export async function sendPermissionGranted(
  email: string,
  userName: string,
  permissionType: string,
  language: 'en' | 'hu' = 'en'
) {
  // Check if user has this notification type enabled
  const canSend = await shouldSendEmail(email, 'permission_granted');
  if (!canSend) {
    return { success: true, skipped: true };
  }

  const t = language === 'hu' ? {
    title: 'Jogosultság megadva',
    greeting: 'Kedves',
    message: 'Kaptál egy új jogosultságot:',
    permission: 'Jogosultság',
    description: permissionType === 'can_reserve_rooms' ? 'Termek foglalása' : 
                 permissionType === 'can_override_reservations' ? 'Foglalások felülírása' : permissionType,
    nextSteps: 'Következő lépések',
    nextStepsText: 'Most már elérheted az új funkciókat. Jelentkezz be a fiókodba és kezdd el használni!',
    footer: 'Ha kérdésed van, lépj kapcsolatba az adminisztrátorral.',
    subject: 'Új jogosultság kapott - QueueForRoom'
  } : {
    title: 'Permission Granted',
    greeting: 'Dear',
    message: 'You have been granted a new permission:',
    permission: 'Permission',
    description: permissionType === 'can_reserve_rooms' ? 'Reserve Rooms' : 
                 permissionType === 'can_override_reservations' ? 'Override Reservations' : permissionType,
    nextSteps: 'Next Steps',
    nextStepsText: 'You can now access the new features. Log in to your account to get started!',
    footer: 'If you have any questions, please contact your administrator.',
    subject: 'New Permission Granted - QueueForRoom'
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 2px;
          }
          .content {
            background: white;
            border-radius: 10px;
            padding: 30px;
          }
          .header {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .permission-box {
            background: #f0fdf4;
            border: 2px solid #10b981;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1 style="margin: 0;">✅ ${t.title}</h1>
            </div>
            
            <p><strong>${t.greeting} ${userName}!</strong></p>
            <p>${t.message}</p>
            
            <div class="permission-box">
              <h2 style="margin: 0; color: #10b981;">${t.description}</h2>
            </div>
            
            <h3>${t.nextSteps}</h3>
            <p>${t.nextStepsText}</p>
            
            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${userName}!
    
    ${t.message}
    
    ${t.permission}: ${t.description}
    
    ${t.nextSteps}
    ${t.nextStepsText}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}

/**
 * Send permission rejected email
 */
export async function sendPermissionRejected(
  email: string,
  userName: string,
  reason: string,
  language: 'en' | 'hu' = 'en'
) {
  // Check if user has this notification type enabled
  const canSend = await shouldSendEmail(email, 'permission_rejected');
  if (!canSend) {
    return { success: true, skipped: true };
  }

  const t = language === 'hu' ? {
    title: 'Jogosultság elutasítva',
    greeting: 'Kedves',
    message: 'Sajnos a jogosultság kérelmed elutasításra került.',
    reasonLabel: 'Indok',
    nextSteps: 'Következő lépések',
    nextStepsText: 'Ha úgy gondolod, hogy ez tévedés, vagy további információra van szükséged, lépj kapcsolatba az adminisztrátorral.',
    footer: 'Köszönjük a megértést.',
    subject: 'Jogosultság kérelem elutasítva - QueueForRoom'
  } : {
    title: 'Permission Request Rejected',
    greeting: 'Dear',
    message: 'Unfortunately, your permission request has been rejected.',
    reasonLabel: 'Reason',
    nextSteps: 'Next Steps',
    nextStepsText: 'If you believe this was a mistake or need more information, please contact your administrator.',
    footer: 'Thank you for your understanding.',
    subject: 'Permission Request Rejected - QueueForRoom'
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background: linear-gradient(135deg, #2a2438 0%, #1a1825 100%);
            border-radius: 12px;
            padding: 2px;
          }
          .content {
            background: white;
            border-radius: 10px;
            padding: 30px;
          }
          .header {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 20px;
          }
          .reason-box {
            background: #fef2f2;
            border: 2px solid #ef4444;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="content">
            <div class="header">
              <h1 style="margin: 0;">❌ ${t.title}</h1>
            </div>
            
            <p><strong>${t.greeting} ${userName}!</strong></p>
            <p>${t.message}</p>
            
            <div class="reason-box">
              <strong>${t.reasonLabel}:</strong><br>
              ${reason}
            </div>
            
            <h3>${t.nextSteps}</h3>
            <p>${t.nextStepsText}</p>
            
            <div class="footer">
              ${t.footer}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
    ${APP_NAME} - ${t.title}
    
    ${t.greeting} ${userName}!
    
    ${t.message}
    
    ${t.reasonLabel}: ${reason}
    
    ${t.nextSteps}
    ${t.nextStepsText}
    
    ---
    ${t.footer}
  `;

  return sendEmail({
    to: email,
    subject: t.subject,
    html,
    text,
  });
}
