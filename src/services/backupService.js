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
import {
  deleteImage,
  deleteImageOperation,
  generateImageId,
  generateImageOperationId,
  getImage,
  getImageIds,
  getImageOperations,
  hasImage,
  storeImage,
  storeImageOperation,
} from "./imageDatabaseService";
import {
  applyStorageTransaction,
  getStorageKeys,
  readStorageValue,
} from "./storageService";
import {
  applyThemeToDocument,
  getTheme,
  isSupportedTheme,
  resetTheme,
  THEME_STORAGE_KEY,
} from "./themeService";
import { blobToDataUrl, dataUrlToBlob, isImageDataUrl } from "../utils/imageDataUrl";

const BACKUP_FORMAT = "romnyi-food-backup";
const BACKUP_VERSION = 1;
const BACKUP_RESTORE_OPERATION_TYPE = "backup-restore";
export const IOS_CONSERVATIVE_WEB_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024;
export const RESTORE_STORAGE_LIMIT_ERROR = "RESTORE_STORAGE_LIMIT";
export const RESTORE_IMAGE_STAGING_ERROR = "RESTORE_IMAGE_STAGING_FAILED";
export const BACKUP_IMAGE_EXPORT_ERROR = "BACKUP_IMAGE_EXPORT_FAILED";
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

function createRestorePayload(backup, recipes = backup?.data?.recipes) {
  if (!validateBackup(backup) || !Array.isArray(recipes)) {
    return null;
  }

  try {
    return new Map([
      [RECIPE_STORAGE_KEY, JSON.stringify(recipes)],
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

function getRecipeImageIds(recipes) {
  return new Set(
    recipes
      .map((recipe) => recipe?.imageId)
      .filter((imageId) => typeof imageId === "string" && imageId.trim()),
  );
}

function createMetadataRecipes(recipes, imageIdFactory) {
  return recipes.map((recipe, index) => {
    if (!isImageDataUrl(recipe.image)) return { ...recipe };

    return {
      ...recipe,
      image: "",
      imageId: imageIdFactory(index),
    };
  });
}

function createStorageBackupView(backup) {
  if (!validateBackup(backup)) {
    return null;
  }

  return {
    ...backup,
    data: {
      ...backup.data,
      recipes: createMetadataRecipes(backup.data.recipes, (index) => `restore-image-${index}`),
    },
  };
}

export function getConservativeStorageSize(value) {
  return typeof value === "string" ? value.length * 2 : 0;
}

export function estimateRestoreStorageFootprint(backup, recipes) {
  const storageBackupView = recipes ? null : createStorageBackupView(backup);
  const restorePayload = createRestorePayload(backup, recipes ?? storageBackupView?.data.recipes);
  const storageKeys = getStorageKeys();

  if (!restorePayload || !storageKeys) {
    return null;
  }

  const restoreKeys = new Set(restorePayload.keys());
  let size = 0;

  for (const key of storageKeys) {
    if (restoreKeys.has(key)) continue;

    const storedValue = readStorageValue(key);
    if (!storedValue.success) return null;

    size += getConservativeStorageSize(key) + getConservativeStorageSize(storedValue.value);
  }

  for (const [key, value] of restorePayload) {
    if (value === null) continue;
    size += getConservativeStorageSize(key) + getConservativeStorageSize(value);
  }

  return size;
}

function isIosCapacitor() {
  return globalThis.Capacitor?.getPlatform?.() === "ios";
}

async function createPortableRecipe(recipe) {
  if (!recipe.imageId) return { ...recipe };

  try {
    const imageRecord = await getImage(recipe.imageId);

    if (!imageRecord?.blob) {
      throw new Error("MISSING_IMAGE");
    }

    const image = await blobToDataUrl(imageRecord.blob);
    const portableRecipe = { ...recipe, image };
    delete portableRecipe.imageId;
    return portableRecipe;
  } catch {
    throw new Error(BACKUP_IMAGE_EXPORT_ERROR);
  }
}

export async function createBackup() {
  const recipes = await Promise.all(getRecipes().map(createPortableRecipe));

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      recipes,
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
      isValidCheatDayBackupData(backup.data.cheatDay),
  );
}

async function createRestorePlan(backup) {
  const transformedRecipes = [];
  const imagePlans = [];
  const usedImageIds = new Set();

  for (const recipe of backup.data.recipes) {
    const importedRecipe = { ...recipe };
    delete importedRecipe.imageId;

    if (!isImageDataUrl(importedRecipe.image)) {
      transformedRecipes.push(importedRecipe);
      continue;
    }

    let blob;
    try {
      blob = dataUrlToBlob(importedRecipe.image);
    } catch {
      throw new Error("INVALID_BACKUP");
    }

    let imageId;
    do {
      imageId = generateImageId();
    } while (usedImageIds.has(imageId) || await hasImage(imageId));
    usedImageIds.add(imageId);

    transformedRecipes.push({ ...importedRecipe, image: "", imageId });
    imagePlans.push({ imageId, recipeId: String(recipe.id), blob });
  }

  return { transformedRecipes, imagePlans };
}

async function cleanupImageIds(imageIds) {
  const results = await Promise.all(
    imageIds.map(async (imageId) => {
      try {
        await deleteImage(imageId);
        return true;
      } catch {
        // The pending operation retains the IDs for a later safe cleanup attempt.
        return false;
      }
    }),
  );

  return results.every(Boolean);
}

async function recoverInterruptedImageRestores(referencedImageIds) {
  const operations = await getImageOperations();

  for (const operation of operations) {
    if (operation?.type !== BACKUP_RESTORE_OPERATION_TYPE || !Array.isArray(operation.imageIds)) {
      continue;
    }

    const didCleanup = await cleanupImageIds(
      operation.imageIds.filter((imageId) => !referencedImageIds.has(imageId)),
    );
    if (didCleanup) {
      await deleteImageOperation(operation.id);
    }
  }
}

async function stageRestoreImages(imagePlans) {
  if (!imagePlans.length) return null;

  const operationId = generateImageOperationId();
  const imageIds = imagePlans.map(({ imageId }) => imageId);

  try {
    await storeImageOperation({
      id: operationId,
      type: BACKUP_RESTORE_OPERATION_TYPE,
      imageIds,
    });

    for (const imagePlan of imagePlans) {
      await storeImage({
        id: imagePlan.imageId,
        recipeId: imagePlan.recipeId,
        blob: imagePlan.blob,
        pendingOperationId: operationId,
      });
    }

    return { operationId, imageIds };
  } catch {
    const didCleanup = await cleanupImageIds(imageIds);
    if (didCleanup) {
      try {
        await deleteImageOperation(operationId);
      } catch {
        // An operation record makes any remaining staged images recoverable.
      }
    }
    throw new Error(RESTORE_IMAGE_STAGING_ERROR);
  }
}

async function cleanupUnreferencedImages(referencedImageIds) {
  const imageIds = await getImageIds();
  return cleanupImageIds(imageIds.filter((imageId) => !referencedImageIds.has(imageId)));
}

export async function restoreBackup(backup) {
  if (!validateBackup(backup)) {
    throw new Error("INVALID_BACKUP");
  }

  await recoverInterruptedImageRestores(getRecipeImageIds(getRecipes()));
  const { transformedRecipes, imagePlans } = await createRestorePlan(backup);
  const restorePayload = createRestorePayload(backup, transformedRecipes);

  if (!restorePayload) {
    throw new Error("INVALID_BACKUP");
  }

  const estimatedStorageFootprint = estimateRestoreStorageFootprint(backup, transformedRecipes);
  if (
    isIosCapacitor() &&
    estimatedStorageFootprint !== null &&
    estimatedStorageFootprint > IOS_CONSERVATIVE_WEB_STORAGE_LIMIT_BYTES
  ) {
    throw new Error(RESTORE_STORAGE_LIMIT_ERROR);
  }

  const stagedImages = await stageRestoreImages(imagePlans);
  const didRestore = applyStorageTransaction(
    [...restorePayload.entries()].map(([key, value]) => ({ key, value })),
  );

  if (!didRestore) {
    if (stagedImages) {
      const didCleanup = await cleanupImageIds(stagedImages.imageIds);
      if (didCleanup) {
        try {
          await deleteImageOperation(stagedImages.operationId);
        } catch {
          // The operation record keeps failed cleanup recoverable.
        }
      }
    }
    throw new Error("RESTORE_FAILED");
  }

  applyThemeToDocument(backup.data.theme);
  const referencedImageIds = getRecipeImageIds(transformedRecipes);
  let cleanupFailed = false;

  try {
    const didCleanup = await cleanupUnreferencedImages(referencedImageIds);
    if (!didCleanup) {
      cleanupFailed = true;
    }
    if (stagedImages) {
      await deleteImageOperation(stagedImages.operationId);
    }
  } catch {
    cleanupFailed = true;
  }

  return { success: true, cleanupFailed };
}

export function resetAppData() {
  const storageKeys = getStorageKeys();
  if (!storageKeys) {
    return { success: false };
  }

  const recoveryKeys = storageKeys.filter((key) => key.startsWith(RECIPE_RECOVERY_KEY_PREFIX));
  const didReset = applyStorageTransaction(
    [...RESTORE_KEYS, ...recoveryKeys].map((key) => ({ key, value: null })),
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
