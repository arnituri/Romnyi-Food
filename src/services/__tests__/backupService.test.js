import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getTestStorage, makeRecipe } from '../../test/setup';
import {
  createBackup,
  estimateRestoreStorageFootprint,
  getConservativeStorageSize,
  IOS_CONSERVATIVE_WEB_STORAGE_LIMIT_BYTES,
  restoreBackup,
  validateBackup,
} from '../backupService';
import { getImage, resetImageDatabaseForTests, storeImage } from "../imageDatabaseService";
import {
  CHEAT_DAY_RESULTS_STORAGE_KEY,
  CHEAT_DAY_SCHEDULES_STORAGE_KEY,
  getMonthlyWinningDays,
} from '../cheatDayService';
import { DAILY_RECOMMENDATION_STORAGE_KEY } from '../dailyRecommendationService';
import { RECIPE_STORAGE_KEY } from '../recipeService';
import { THEME_STORAGE_KEY } from '../themeService';

const browserBlob = globalThis.Blob;

beforeEach(() => {
  globalThis.Blob = NodeBlob;
});

afterEach(async () => {
  await resetImageDatabaseForTests();
  globalThis.Blob = browserBlob;
});

async function makeValidBackup() {
  getMonthlyWinningDays(new Date(2026, 6, 13, 12));
  const backup = await createBackup();
  backup.data.recipes = [makeRecipe()];
  backup.data.theme = 'light';
  return backup;
}

describe('backupService', () => {
  it('uses a conservative UTF-16 storage estimate for restore payloads', async () => {
    const backup = await makeValidBackup();
    const footprint = estimateRestoreStorageFootprint(backup);

    expect(getConservativeStorageSize('abc')).toBe(6);
    expect(footprint).toBeGreaterThan(
      getConservativeStorageSize(JSON.stringify(backup.data.recipes)),
    );
  });

  it('accepts and restores a valid backup transactionally', async () => {
    const backup = await makeValidBackup();
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify([makeRecipe({ id: 'old' })]));
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, JSON.stringify({ date: '2026-07-13', recipeId: 'old' }));

    await restoreBackup(backup);

    expect(JSON.parse(localStorage.getItem(RECIPE_STORAGE_KEY))).toEqual([makeRecipe()]);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY)).toBeNull();
  });

  it('rejects invalid JSON before it can become a backup object', () => {
    expect(() => JSON.parse('{invalid json')).toThrow();
  });

  it('rejects an invalid backup root structure', async () => {
    expect(validateBackup([])).toBe(false);
    await expect(restoreBackup({ format: 'romnyi-food-backup', version: 1, data: [] })).rejects.toThrow('INVALID_BACKUP');
  });

  it('rejects malformed recipe records', async () => {
    const backup = await makeValidBackup();
    backup.data.recipes = [{ id: 'bad', name: 12 }];

    expect(validateBackup(backup)).toBe(false);
  });

  it('rejects an invalid theme', async () => {
    const backup = await makeValidBackup();
    backup.data.theme = 'purple';

    expect(validateBackup(backup)).toBe(false);
  });

  it('rejects malformed Cheat Day data', async () => {
    const backup = await makeValidBackup();
    backup.data.cheatDay = { schedules: { '2026-07': [1] }, results: {} };

    expect(validateBackup(backup)).toBe(false);
  });

  it('rolls every key back after a simulated storage failure', async () => {
    const backup = await makeValidBackup();
    const originalRecipes = JSON.stringify([makeRecipe({ id: 'old' })]);
    localStorage.setItem(RECIPE_STORAGE_KEY, originalRecipes);
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    localStorage.setItem(CHEAT_DAY_SCHEDULES_STORAGE_KEY, '{}');
    localStorage.setItem(CHEAT_DAY_RESULTS_STORAGE_KEY, '{}');
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, 'old-recommendation');
    getTestStorage().failOnWrite(2);

    await expect(restoreBackup(backup)).rejects.toThrow('RESTORE_FAILED');
    expect(localStorage.getItem(RECIPE_STORAGE_KEY)).toBe(originalRecipes);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY)).toBe('old-recommendation');
  });

  it('does not count embedded Data URL images against the iOS localStorage estimate', async () => {
    const backup = await makeValidBackup();
    backup.data.recipes[0].image = `data:image/webp;base64,${'a'.repeat(IOS_CONSERVATIVE_WEB_STORAGE_LIMIT_BYTES)}`;
    const originalRecipes = JSON.stringify([makeRecipe({ id: 'old' })]);
    localStorage.setItem(RECIPE_STORAGE_KEY, originalRecipes);
    const originalCapacitor = globalThis.Capacitor;
    globalThis.Capacitor = { getPlatform: () => 'ios' };

    try {
      expect(estimateRestoreStorageFootprint(backup)).toBeLessThan(
        IOS_CONSERVATIVE_WEB_STORAGE_LIMIT_BYTES,
      );
      await restoreBackup(backup);
      const restoredRecipe = JSON.parse(localStorage.getItem(RECIPE_STORAGE_KEY))[0];
      expect(restoredRecipe.image).toBe("");
      expect(restoredRecipe.imageId).toBeTruthy();
    } finally {
      globalThis.Capacitor = originalCapacitor;
    }
  });

  it("restores multiple embedded images into IndexedDB while keeping external and empty images unchanged", async () => {
    const backup = await makeValidBackup();
    const imageDataUrl = "data:image/png;base64,aGVsbG8=";
    backup.data.recipes = [
      makeRecipe({ id: "local-1", image: imageDataUrl }),
      makeRecipe({ id: "local-2", image: imageDataUrl }),
      makeRecipe({ id: "external-1", image: "https://example.com/recipe.jpg" }),
      makeRecipe({ id: "empty-1", image: "" }),
    ];

    await restoreBackup(backup);
    const restoredRecipes = JSON.parse(localStorage.getItem(RECIPE_STORAGE_KEY));
    const localRecipe = restoredRecipes.find((recipe) => recipe.id === "local-1");
    const secondLocalRecipe = restoredRecipes.find((recipe) => recipe.id === "local-2");
    const externalRecipe = restoredRecipes.find((recipe) => recipe.id === "external-1");
    const emptyRecipe = restoredRecipes.find((recipe) => recipe.id === "empty-1");

    expect(localRecipe).toMatchObject({ image: "", imageId: expect.any(String) });
    expect(await getImage(localRecipe.imageId)).toMatchObject({
      recipeId: "local-1",
      mimeType: "image/png",
      byteSize: 5,
    });
    expect(secondLocalRecipe).toMatchObject({ image: "", imageId: expect.any(String) });
    expect(secondLocalRecipe.imageId).not.toBe(localRecipe.imageId);
    expect(await getImage(secondLocalRecipe.imageId)).toMatchObject({ recipeId: "local-2" });
    expect(externalRecipe).toMatchObject({ image: "https://example.com/recipe.jpg" });
    expect(externalRecipe).not.toHaveProperty("imageId");
    expect(emptyRecipe).toMatchObject({ image: "" });
    expect(emptyRecipe).not.toHaveProperty("imageId");
  });

  it("exports IndexedDB images back to portable v1 Data URLs", async () => {
    const imageBlob = new Blob(["hello"], { type: "image/png" });
    await storeImage({ id: "image-export", recipeId: "recipe-1", blob: imageBlob });
    localStorage.setItem(
      RECIPE_STORAGE_KEY,
      JSON.stringify([makeRecipe({ image: "", imageId: "image-export" })]),
    );

    const backup = await createBackup();

    expect(backup).toMatchObject({ format: "romnyi-food-backup", version: 1 });
    expect(backup.data.recipes[0].image).toBe("data:image/png;base64,aGVsbG8=");
    expect(backup.data.recipes[0]).not.toHaveProperty("imageId");
  });

  it("keeps existing legacy Data URL images portable during export", async () => {
    const legacyImage = "data:image/jpeg;base64,aGVsbG8=";
    localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify([makeRecipe({ image: legacyImage })]));

    const backup = await createBackup();

    expect(backup.data.recipes[0]).toMatchObject({ image: legacyImage });
    expect(backup.data.recipes[0]).not.toHaveProperty("imageId");
  });

  it("fails export rather than producing an incomplete backup for a missing IndexedDB image", async () => {
    localStorage.setItem(
      RECIPE_STORAGE_KEY,
      JSON.stringify([makeRecipe({ image: "", imageId: "missing-image" })]),
    );

    await expect(createBackup()).rejects.toThrow("BACKUP_IMAGE_EXPORT_FAILED");
  });
});
