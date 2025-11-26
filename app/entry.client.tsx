import { RemixBrowser } from "@remix-run/react";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";

// Note: We apply theme and language AFTER hydration to prevent SSR mismatch warnings
// The initial render will match the server HTML, then we update preferences

async function hydrate() {
  // Detect browser language (client-side only)
  const browserLang = typeof navigator !== 'undefined' && navigator.language?.startsWith('hu') ? 'hu' : 'en';
  const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem("i18nextLng") : null;
  
  await i18next
    .use(initReactI18next)
    .init({
      supportedLngs: ["en", "hu"],
      fallbackLng: "hu",
      defaultNS: "translation",
      lng: savedLang || browserLang,
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
        <RemixBrowser />
      </StrictMode>
    );
  });
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(() => {
    hydrate();
    // Apply theme and language preferences AFTER hydration
    applyUserPreferences();
  });
} else {
  window.setTimeout(() => {
    hydrate();
    // Apply theme and language preferences AFTER hydration
    applyUserPreferences();
  }, 1);
}

function applyUserPreferences() {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    try {
      const theme = localStorage.getItem('theme');
      if (theme && theme !== 'auto') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      
      const lang = localStorage.getItem('i18nextLng') || 'hu';
      document.documentElement.setAttribute('lang', lang);
    } catch (e) {
      // Silently fail
    }
  }
}
