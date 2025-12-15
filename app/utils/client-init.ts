/**
 * Client-side initialization script
 * Runs immediately when the page loads in the browser
 * Applies saved theme and language preferences from localStorage
 */

// Apply theme from localStorage (runs only in browser)
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  try {
    const theme = localStorage.getItem('theme');
    if (theme && theme !== 'auto') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    
    const lang = localStorage.getItem('i18nextLng') || 'hu';
    document.documentElement.setAttribute('lang', lang);
  } catch (e) {
    // Silently fail if localStorage is not available
    console.warn('Could not load preferences from localStorage', e);
  }
}
