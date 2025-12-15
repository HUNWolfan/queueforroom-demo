import type { AppLoadContext, EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { startReminderScheduler } from "./services/reminder-scheduler.server";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { readFileSync } from "fs";
import { resolve } from "path";

// Start the reminder scheduler when server starts
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  startReminderScheduler();
}

// Initialize i18next on server side with default language (hu)
// This prevents "NO_I18NEXT_INSTANCE" errors during SSR
const enTranslations = JSON.parse(
  readFileSync(resolve("public/locales/en/translation.json"), "utf-8")
);
const huTranslations = JSON.parse(
  readFileSync(resolve("public/locales/hu/translation.json"), "utf-8")
);

i18next
  .use(initReactI18next)
  .init({
    supportedLngs: ["en", "hu"],
    fallbackLng: "hu",
    defaultNS: "translation",
    lng: "hu", // Always render SSR with Hungarian (client will override if needed)
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: enTranslations },
      hu: { translation: huTranslations },
    },
  });

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
  loadContext: AppLoadContext
) {
  const markup = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );

  responseHeaders.set("Content-Type", "text/html");

  return new Response("<!DOCTYPE html>" + markup, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
