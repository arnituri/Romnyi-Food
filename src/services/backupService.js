import { getRecipes, RECIPE_STORAGE_KEY, saveRecipes } from "./recipeService";
import {
  CHEAT_DAY_RESULTS_STORAGE_KEY,
  CHEAT_DAY_SCHEDULES_STORAGE_KEY,
} from "./cheatDayService";
import {
  applyTheme,
  getTheme,
  resetTheme,
  THEME_STORAGE_KEY,
} from "./themeService";

const BACKUP_FORMAT = "romnyi-food-backup";
const BACKUP_VERSION = 1;

function readOptionalData(key) {
  const value = localStorage.getItem(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function writeOptionalData(key, value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    localStorage.setItem(key, JSON.stringify(value));
  } else {
    localStorage.removeItem(key);
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
      cheatDay: {
        schedules: readOptionalData(CHEAT_DAY_SCHEDULES_STORAGE_KEY),
        results: readOptionalData(CHEAT_DAY_RESULTS_STORAGE_KEY),
      },
    },
  };
}

export function validateBackup(backup) {
  if (
    !backup ||
    typeof backup !== "object" ||
    backup.format !== BACKUP_FORMAT ||
    backup.version !== BACKUP_VERSION ||
    !backup.data ||
    !Array.isArray(backup.data.recipes)
  ) {
    return false;
  }

  const hasValidRecipes = backup.data.recipes.every(
    (recipe) => recipe && typeof recipe === "object" && !Array.isArray(recipe)
  );
  const hasValidTheme = ["dark", "light"].includes(backup.data.theme);
  const cheatDay = backup.data.cheatDay;
  const hasValidCheatDay =
    !cheatDay ||
    (typeof cheatDay === "object" &&
      !Array.isArray(cheatDay) &&
      (!cheatDay.schedules || typeof cheatDay.schedules === "object") &&
      (!cheatDay.results || typeof cheatDay.results === "object"));

  return hasValidRecipes && hasValidTheme && hasValidCheatDay;
}

export function restoreBackup(backup) {
  saveRecipes(backup.data.recipes);
  applyTheme(backup.data.theme);
  writeOptionalData(
    CHEAT_DAY_SCHEDULES_STORAGE_KEY,
    backup.data.cheatDay?.schedules
  );
  writeOptionalData(CHEAT_DAY_RESULTS_STORAGE_KEY, backup.data.cheatDay?.results);
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
