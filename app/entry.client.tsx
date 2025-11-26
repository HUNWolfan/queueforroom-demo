import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import i18next from "i18next";
import { I18nextProvider, initReactI18next } from "react-i18next";

async function hydrate() {
  await i18next
    .use(initReactI18next)
    .init({
      supportedLngs: ["en", "hu"],
      fallbackLng: "en",
      defaultNS: "translation",
      lng: localStorage.getItem("language") || "en",
      interpolation: {
        escapeValue: false,
      },
      resources: {
        en: {
          translation: await fetch("/locales/en/translation.json").then(r => r.json()),
        },
        hu: {
          translation: await fetch("/locales/hu/translation.json").then(r => r.json()),
        },
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <I18nextProvider i18n={i18next}>
          <RemixBrowser />
        </I18nextProvider>
      </StrictMode>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate);
} else {
  window.setTimeout(hydrate, 1);
}
