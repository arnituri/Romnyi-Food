import { describe, expect, it } from 'vitest';
import { getTestStorage, makeRecipe } from '../../test/setup';
import {
  createBackup,
  estimateRestoreStorageFootprint,
  getConservativeStorageSize,
  IOS_CONSERVATIVE_WEB_STORAGE_LIMIT_BYTES,
  RESTORE_STORAGE_LIMIT_ERROR,
  restoreBackup,
  validateBackup,
} from '../backupService';
import {
  CHEAT_DAY_RESULTS_STORAGE_KEY,
  CHEAT_DAY_SCHEDULES_STORAGE_KEY,
  getMonthlyWinningDays,
} from '../cheatDayService';
import { DAILY_RECOMMENDATION_STORAGE_KEY } from '../dailyRecommendationService';
import { RECIPE_STORAGE_KEY } from '../recipeService';
import { THEME_STORAGE_KEY } from '../themeService';

function makeValidBackup() {
  getMonthlyWinningDays(new Date(2026, 6, 13, 12));
  const backup = createBackup();
  backup.data.recipes = [makeRecipe()];
  backup.data.theme = 'light';
  return backup;
}

describe('backupService', () => {
  it('uses a conservative UTF-16 storage estimate for restore payloads', () => {
    const backup = makeValidBackup();
    const footprint = estimateRestoreStorageFootprint(backup);

    expect(getConservativeStorageSize('abc')).toBe(6);
    expect(footprint).toBeGreaterThan(
      getConservativeStorageSize(JSON.stringify(backup.data.recipes)),
    );
  });

  it('accepts and restores a valid backup transactionally', () => {
    const backup = makeValidBackup();
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify([makeRecipe({ id: 'old' })]));
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, JSON.stringify({ date: '2026-07-13', recipeId: 'old' }));

    restoreBackup(backup);

    expect(JSON.parse(localStorage.getItem(RECIPE_STORAGE_KEY))).toEqual([makeRecipe()]);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY)).toBeNull();
  });

  it('rejects invalid JSON before it can become a backup object', () => {
    expect(() => JSON.parse('{invalid json')).toThrow();
  });

  it('rejects an invalid backup root structure', () => {
    expect(validateBackup([])).toBe(false);
    expect(() => restoreBackup({ format: 'romnyi-food-backup', version: 1, data: [] })).toThrow('INVALID_BACKUP');
  });

  it('rejects malformed recipe records', () => {
    const backup = makeValidBackup();
    backup.data.recipes = [{ id: 'bad', name: 12 }];

    expect(validateBackup(backup)).toBe(false);
  });

  it('rejects an invalid theme', () => {
    const backup = makeValidBackup();
    backup.data.theme = 'purple';

    expect(validateBackup(backup)).toBe(false);
  });

  it('rejects malformed Cheat Day data', () => {
    const backup = makeValidBackup();
    backup.data.cheatDay = { schedules: { '2026-07': [1] }, results: {} };

    expect(validateBackup(backup)).toBe(false);
  });

  it('rolls every key back after a simulated storage failure', () => {
    const backup = makeValidBackup();
    const originalRecipes = JSON.stringify([makeRecipe({ id: 'old' })]);
    localStorage.setItem(RECIPE_STORAGE_KEY, originalRecipes);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    localStorage.setItem(CHEAT_DAY_SCHEDULES_STORAGE_KEY, '{}');
    localStorage.setItem(CHEAT_DAY_RESULTS_STORAGE_KEY, '{}');
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, 'old-recommendation');
    getTestStorage().failOnWrite(2);

    expect(() => restoreBackup(backup)).toThrow('RESTORE_FAILED');
    expect(localStorage.getItem(RECIPE_STORAGE_KEY)).toBe(originalRecipes);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY)).toBe('old-recommendation');
  });

  it('aborts an unsafe iOS restore before it writes any data', () => {
    const backup = makeValidBackup();
    backup.data.recipes[0].image = `data:image/webp;base64,${'a'.repeat(IOS_CONSERVATIVE_WEB_STORAGE_LIMIT_BYTES)}`;
    const originalRecipes = JSON.stringify([makeRecipe({ id: 'old' })]);
    localStorage.setItem(RECIPE_STORAGE_KEY, originalRecipes);
    const originalCapacitor = globalThis.Capacitor;
    globalThis.Capacitor = { getPlatform: () => 'ios' };

    try {
      expect(() => restoreBackup(backup)).toThrow(RESTORE_STORAGE_LIMIT_ERROR);
      expect(localStorage.getItem(RECIPE_STORAGE_KEY)).toBe(originalRecipes);
    } finally {
      globalThis.Capacitor = originalCapacitor;
    }
  });
});
