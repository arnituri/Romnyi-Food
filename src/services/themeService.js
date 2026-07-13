export const THEME_STORAGE_KEY = "romnyi-food-theme";

export function getTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function resetTheme() {
  document.documentElement.dataset.theme = "dark";
  document.documentElement.style.colorScheme = "dark";
  localStorage.removeItem(THEME_STORAGE_KEY);
}

export function initializeTheme() {
  applyTheme(getTheme());
}
