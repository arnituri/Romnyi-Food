const THEME_STORAGE_KEY = "romnyi-food-theme";

export function getTheme() {
  return localStorage.getItem(THEME_STORAGE_KEY) || "dark";
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initializeTheme() {
  applyTheme(getTheme());
}
