import {
  deleteImage,
  generateImageId,
  storeImage,
} from "./imageDatabaseService";
import {
  addRecipe,
  deleteRecipe,
  generateUniqueRecipeId,
  updateRecipe,
} from "./recipeService";

const IMAGE_SAVE_FAILURE_MESSAGE =
  "A kép mentése nem sikerült. A recept adatai változatlanok maradtak.";
const IMAGE_CLEANUP_FAILURE_MESSAGE =
  "A recept mentése sikerült, de a korábbi kép törlése nem sikerült.";

async function removeStagedImage(imageId) {
  if (!imageId) return;

  try {
    await deleteImage(imageId);
  } catch {
    // An orphaned staged image is safe: it is never referenced by recipe data.
  }
}

export async function saveRecipeWithImage({
  recipe,
  existingRecipe = null,
  expectedVersion,
  imageBlob = null,
  removeImage = false,
}) {
  const isEditing = Boolean(existingRecipe);
  const recipeId = isEditing
    ? existingRecipe.id
    : imageBlob
      ? generateUniqueRecipeId()
      : undefined;
  let stagedImageId = null;

  if (imageBlob) {
    stagedImageId = generateImageId();

    try {
      await storeImage({
        id: stagedImageId,
        recipeId: String(recipeId),
        blob: imageBlob,
      });
    } catch {
      return {
        success: false,
        error: "IMAGE_STORAGE_WRITE_FAILED",
        message: IMAGE_SAVE_FAILURE_MESSAGE,
      };
    }
  }

  const recipeToSave = { ...recipe };

  if (recipeId !== undefined) {
    recipeToSave.id = recipeId;
  }

  if (imageBlob) {
    recipeToSave.image = "";
    recipeToSave.imageId = stagedImageId;
  } else if (isEditing && removeImage) {
    recipeToSave.image = "";
    recipeToSave.imageId = null;
  }

  const result = isEditing
    ? updateRecipe(recipeToSave, expectedVersion)
    : addRecipe(recipeToSave);

  if (!result.success) {
    await removeStagedImage(stagedImageId);
    return result;
  }

  const oldImageId = existingRecipe?.imageId;
  const shouldRemovePreviousImage =
    Boolean(oldImageId) &&
    (Boolean(imageBlob) || removeImage) &&
    oldImageId !== result.recipe.imageId;

  if (shouldRemovePreviousImage) {
    try {
      await deleteImage(oldImageId);
    } catch {
      return {
        ...result,
        imageCleanupFailed: true,
        cleanupMessage: IMAGE_CLEANUP_FAILURE_MESSAGE,
      };
    }
  }

  return result;
}

export async function deleteRecipeWithImage(recipe) {
  const result = deleteRecipe(recipe.id);

  if (!result.success || !recipe.imageId) {
    return result;
  }

  try {
    await deleteImage(recipe.imageId);
  } catch {
    return {
      ...result,
      imageCleanupFailed: true,
      cleanupMessage: IMAGE_CLEANUP_FAILURE_MESSAGE,
    };
  }

  return result;
}
