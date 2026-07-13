import {
  getRecipes,
  isValidRecipeCollection,
  RECIPE_STORAGE_KEY,
} from "./recipeService";
import {
  CHEAT_DAY_RESULTS_STORAGE_KEY,
  CHEAT_DAY_SCHEDULES_STORAGE_KEY,
  getCheatDayBackupData,
  isValidCheatDayBackupData,
} from "./cheatDayService";
import {
  applyThemeToDocument,
  getTheme,
  isSupportedTheme,
  resetTheme,
  THEME_STORAGE_KEY,
} from "./themeService";

const BACKUP_FORMAT = "romnyi-food-backup";
const BACKUP_VERSION = 1;
const RESTORE_KEYS = [
  RECIPE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  CHEAT_DAY_SCHEDULES_STORAGE_KEY,
  CHEAT_DAY_RESULTS_STORAGE_KEY,
];

function serializeOptionalData(value) {
  return value === null ? null : JSON.stringify(value);
}

function writeStorageValue(key, value) {
  if (value === null) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(key, value);
}

function createRestorePayload(backup) {
  if (!validateBackup(backup)) {
    return null;
  }

  try {
    return new Map([
      [RECIPE_STORAGE_KEY, JSON.stringify(backup.data.recipes)],
      [THEME_STORAGE_KEY, backup.data.theme],
      [
        CHEAT_DAY_SCHEDULES_STORAGE_KEY,
        serializeOptionalData(backup.data.cheatDay.schedules),
      ],
      [
        CHEAT_DAY_RESULTS_STORAGE_KEY,
        serializeOptionalData(backup.data.cheatDay.results),
      ],
    ]);
  } catch {
    return null;
  }
}

function restoreSnapshot(snapshot) {
  [...snapshot.entries()].reverse().forEach(([key, value]) => {
    try {
      writeStorageValue(key, value);
    } catch {
      // A browser can continue rejecting writes after a quota error.
    }
  });
}

export function createBackup() {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      recipes: getRecipes(),
      theme: getTheme(),
      cheatDay: getCheatDayBackupData(),
    },
  };
}

export function validateBackup(backup) {
  return Boolean(
    backup &&
      typeof backup === "object" &&
      !Array.isArray(backup) &&
      backup.format === BACKUP_FORMAT &&
      backup.version === BACKUP_VERSION &&
      backup.data &&
      typeof backup.data === "object" &&
      !Array.isArray(backup.data) &&
      isValidRecipeCollection(backup.data.recipes) &&
      isSupportedTheme(backup.data.theme) &&
      isValidCheatDayBackupData(backup.data.cheatDay)
  );
}

export function restoreBackup(backup) {
  const restorePayload = createRestorePayload(backup);

  if (!restorePayload) {
    throw new Error("INVALID_BACKUP");
  }

  const snapshot = new Map(
    RESTORE_KEYS.map((key) => [key, localStorage.getItem(key)])
  );

  try {
    restorePayload.forEach((value, key) => writeStorageValue(key, value));
  } catch {
    restoreSnapshot(snapshot);
    throw new Error("RESTORE_FAILED");
  }

  applyThemeToDocument(backup.data.theme);
}

export function resetAppData() {
  localStorage.removeItem(RECIPE_STORAGE_KEY);
  localStorage.removeItem(CHEAT_DAY_SCHEDULES_STORAGE_KEY);
  localStorage.removeItem(CHEAT_DAY_RESULTS_STORAGE_KEY);
  localStorage.removeItem(THEME_STORAGE_KEY);
  resetTheme();
}

export function downloadBackup(backup) {
  const file = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(file);
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `romnyi-food-mentes-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
