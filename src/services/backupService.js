import {
  getRecipes,
  isValidRecipeCollection,
  RECIPE_RECOVERY_KEY_PREFIX,
  RECIPE_STORAGE_KEY,
} from "./recipeService";
import {
  CHEAT_DAY_RESULTS_STORAGE_KEY,
  CHEAT_DAY_SCHEDULES_STORAGE_KEY,
  getCheatDayBackupData,
  isValidCheatDayBackupData,
} from "./cheatDayService";
import { DAILY_RECOMMENDATION_STORAGE_KEY } from "./dailyRecommendationService";
import { applyStorageTransaction, getStorageKeys } from "./storageService";
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
  DAILY_RECOMMENDATION_STORAGE_KEY,
];

function serializeOptionalData(value) {
  return value === null ? null : JSON.stringify(value);
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
      [DAILY_RECOMMENDATION_STORAGE_KEY, null],
    ]);
  } catch {
    return null;
  }
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

  const didRestore = applyStorageTransaction(
    [...restorePayload.entries()].map(([key, value]) => ({ key, value }))
  );

  if (!didRestore) {
    throw new Error("RESTORE_FAILED");
  }

  applyThemeToDocument(backup.data.theme);
}

export function resetAppData() {
  const storageKeys = getStorageKeys();
  if (!storageKeys) {
    return { success: false };
  }

  const recoveryKeys = storageKeys.filter((key) => key.startsWith(RECIPE_RECOVERY_KEY_PREFIX));
  const didReset = applyStorageTransaction(
    [...RESTORE_KEYS, ...recoveryKeys].map((key) => ({ key, value: null }))
  );

  if (!didReset) {
    return { success: false };
  }

  resetTheme();
  return { success: true };
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
