import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { startReminderScheduler } from "./services/reminder-scheduler.server";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";

// Inline translations for SSR (Cloudflare Workers doesn't support JSON imports well)
const huTranslations = {
  "login.title": "Bejelentkezés",
  "login.email": "Email",
  "login.password": "Jelszó",
  "login.submit": "Bejelentkezés",
  "login.noAccount": "Még nincs fiókod?",
  "login.registerLink": "Regisztrálj",
  "auth.forgotPassword": "Elfelejtetted a jelszavad?",
  "auth.showPassword": "Jelszó mutatása",
  "auth.hidePassword": "Jelszó elrejtése",
  "register.title": "Regisztráció",
  "register.firstName": "Keresztnév",
  "register.lastName": "Vezetéknév",
  "register.email": "Email",
  "register.password": "Jelszó",
  "register.confirmPassword": "Jelszó megerősítése",
  "register.submit": "Regisztráció",
  "register.hasAccount": "Már van fiókod?",
  "register.loginLink": "Jelentkezz be",
  "common.cancel": "Mégse",
  "footer.allRightsReserved": "Minden jog fenntartva.",
  "footer.reportBug": "Hiba bejelentése",
  "footer.bugReport": "Hiba bejelentése",
  "footer.bugReportDescription": "Segíts nekünk javítani az oldalt!",
  "footer.bugTitle": "Hiba címe",
  "footer.bugTitlePlaceholder": "Rövid leírás a hibáról",
  "footer.bugDescription": "Részletes leírás",
  "footer.bugDescriptionPlaceholder": "Írd le részletesen mit tapasztaltál",
  "footer.severity": "Súlyosság",
  "footer.severityLow": "Alacsony",
  "footer.severityMedium": "Közepes",
  "footer.severityHigh": "Magas",
  "footer.severityCritical": "Kritikus",
  "footer.submit": "Küldés",
  "footer.reportSubmitted": "Köszönjük a visszajelzést!"
};

const enTranslations = {
  "login.title": "Login",
  "login.email": "Email",
  "login.password": "Password",
  "login.submit": "Login",
  "login.noAccount": "Don't have an account?",
  "login.registerLink": "Register",
  "auth.forgotPassword": "Forgot your password?",
  "auth.showPassword": "Show password",
  "auth.hidePassword": "Hide password",
  "register.title": "Register",
  "register.firstName": "First Name",
  "register.lastName": "Last Name",
  "register.email": "Email",
  "register.password": "Password",
  "register.confirmPassword": "Confirm Password",
  "register.submit": "Register",
  "register.hasAccount": "Already have an account?",
  "register.loginLink": "Login",
  "common.cancel": "Cancel",
  "footer.allRightsReserved": "All rights reserved.",
  "footer.reportBug": "Report Bug",
  "footer.bugReport": "Report a Bug",
  "footer.bugReportDescription": "Help us improve the site!",
  "footer.bugTitle": "Bug Title",
  "footer.bugTitlePlaceholder": "Short description of the bug",
  "footer.bugDescription": "Detailed Description",
  "footer.bugDescriptionPlaceholder": "Describe what you experienced",
  "footer.severity": "Severity",
  "footer.severityLow": "Low",
  "footer.severityMedium": "Medium",
  "footer.severityHigh": "High",
  "footer.severityCritical": "Critical",
  "footer.submit": "Submit",
  "footer.reportSubmitted": "Thank you for your feedback!"
};

// Initialize i18next for SSR with inline translations
if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .init({
      lng: "hu",
      fallbackLng: "hu",
      resources: {
        hu: { translation: huTranslations },
        en: { translation: enTranslations }
      },
      interpolation: {
        escapeValue: false
      }
    });
}

// Start the reminder scheduler when server starts
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startReminderScheduler();
}

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  const markup = renderToString(
    <I18nextProvider i18n={i18next}>
      <RemixServer context={remixContext} url={request.url} />
    </I18nextProvider>
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
