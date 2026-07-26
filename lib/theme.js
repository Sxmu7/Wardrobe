const THEME_KEY = 'kleiderschrank_theme';

const DEFAULT_THEME = 'dark';

export function getStoredTheme() {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  return localStorage.getItem(THEME_KEY) || DEFAULT_THEME;
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
