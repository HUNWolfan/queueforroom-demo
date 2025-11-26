import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { startReminderScheduler } from "./services/reminder-scheduler.server";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";
import huTranslation from "../public/locales/hu/translation.json";
import enTranslation from "../public/locales/en/translation.json";

// Initialize i18next for SSR
if (!i18next.isInitialized) {
  i18next
    .use(initReactI18next)
    .init({
      lng: "hu",
      fallbackLng: "hu",
      resources: {
        hu: { translation: huTranslation },
        en: { translation: enTranslation }
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
