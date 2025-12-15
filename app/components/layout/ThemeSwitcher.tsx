import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation();

  // Prevent SSR hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Load theme from localStorage after client mount
    if (isClient) {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [isClient]);

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
    
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', newTheme);
    }
    
    // Dispatch custom event for other components to listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
    }
  };

  // Don't render during SSR to prevent hydration mismatch
  if (!isClient) {
    return <button className="theme-switcher" style={{ opacity: 0 }}>🌙</button>;
  }

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
