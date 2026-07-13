export const THEME_STORAGE_KEY = "romnyi-food-theme";

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The selected theme is still applied for the current session.
  }
}

function removeStoredTheme() {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function getTheme() {
  const theme = readStoredTheme();

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
  const supportedTheme = isSupportedTheme(theme) ? theme : "dark";

  applyThemeToDocument(supportedTheme);
  persistTheme(supportedTheme);
}

export function resetTheme() {
  applyThemeToDocument("dark");
  removeStoredTheme();
}

export function initializeTheme() {
  applyTheme(getTheme());
}
