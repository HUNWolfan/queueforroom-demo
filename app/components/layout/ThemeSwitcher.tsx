import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { t } = useTranslation();

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Listen for theme changes from other components (e.g., Settings page)
  useEffect(() => {
    const handleThemeChange = (e: CustomEvent) => {
      const newTheme = e.detail.theme;
      if (newTheme && newTheme !== 'auto') {
        setTheme(newTheme);
      }
    };

    window.addEventListener('themeChanged', handleThemeChange as EventListener);
    return () => window.removeEventListener('themeChanged', handleThemeChange as EventListener);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
  };

  return (
    <button
      onClick={toggleTheme}
      className="theme-switcher"
      title={t("settings.toggleTheme") || "Toggle theme"}
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
