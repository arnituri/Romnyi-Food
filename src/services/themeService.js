export const THEME_STORAGE_KEY = "romnyi-food-theme";

export function getTheme() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY);

  return isSupportedTheme(theme) ? theme : "dark";
}

export function isSupportedTheme(theme) {
  return theme === "dark" || theme === "light";
}

export function applyThemeToDocument(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function applyTheme(theme) {
  applyThemeToDocument(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function resetTheme() {
  applyThemeToDocument("dark");
  localStorage.removeItem(THEME_STORAGE_KEY);
}

export function initializeTheme() {
  applyTheme(getTheme());
}
