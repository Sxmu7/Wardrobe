const THEME_KEY = 'kleiderschrank_theme';

export function getStoredTheme() {
  if (typeof window === 'undefined') return 'light';
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function applyTheme(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function setStoredTheme(theme) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(THEME_KEY, theme);
  applyTheme(theme);
}
