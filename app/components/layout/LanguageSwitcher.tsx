import { useTranslation } from "react-i18next";
import { useEffect, useState, useRef } from "react";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState("hu");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Detect browser language (client-side only)
    const browserLang = typeof navigator !== 'undefined' && navigator.language.startsWith('hu') ? 'hu' : 'en';
    const savedLang = typeof localStorage !== 'undefined' ? localStorage.getItem("i18nextLng") : null;
    const lang = savedLang || browserLang;
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
  }, [i18n]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const switchLanguage = (lang: string) => {
    setIsOpen(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem("i18nextLng", lang);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('lang', lang);
    }
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
  };

  const getCurrentFlag = () => {
    return currentLang === "hu" ? "🇭🇺" : "🇬🇧";
  };

  return (
    <div className="language-switcher-dropdown" ref={dropdownRef}>
      <button
        className="lang-dropdown-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={currentLang === "hu" ? "Magyar" : "English"}
      >
        <span className="flag-icon">{getCurrentFlag()}</span>
        <span className="dropdown-arrow">▼</span>
      </button>
      
      {isOpen && (
        <div className="lang-dropdown-menu">
          <button
            className={`lang-option ${currentLang === "en" ? "active" : ""}`}
            onClick={() => switchLanguage("en")}
          >
            <span className="flag-icon">🇬🇧</span>
            <span className="lang-name">English</span>
          </button>
          <button
            className={`lang-option ${currentLang === "hu" ? "active" : ""}`}
            onClick={() => switchLanguage("hu")}
          >
            <span className="flag-icon">🇭🇺</span>
            <span className="lang-name">Magyar</span>
          </button>
        </div>
      )}
    </div>
  );
}
