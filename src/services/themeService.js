import {
  readStorageValue,
  removeStorageValue,
  setStorageValue,
} from "./storageService";

export const THEME_STORAGE_KEY = "romnyi-food-theme";

function readStoredTheme() {
  return readStorageValue(THEME_STORAGE_KEY).value;
}

function persistTheme(theme) {
  return setStorageValue(THEME_STORAGE_KEY, theme);
}

function removeStoredTheme() {
  return removeStorageValue(THEME_STORAGE_KEY);
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
  return persistTheme(supportedTheme);
}

export function resetTheme() {
  applyThemeToDocument("dark");
  return removeStoredTheme();
}

export function initializeTheme() {
  applyTheme(getTheme());
}
