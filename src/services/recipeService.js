export const RECIPE_STORAGE_KEY = "recipes";
const RECIPE_RECOVERY_KEY_PREFIX = "romnyi-food-recipes-recovery-";
const RECIPE_RECOVERED_EVENT = "romnyi-food-recipes-recovered";

let recoveryNoticePending = false;

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function normalizeNutritionValue(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function normalizeCreatedAt(value) {
  if (typeof value !== "string" || Number.isNaN(new Date(value).getTime())) {
    return null;
  }

  return value;
}

function isValidRecipeId(value) {
  return (
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.trim().length > 0)
  );
}

function isValidBackupNutritionValue(value) {
  return value === null || (typeof value === "number" && Number.isFinite(value) && value >= 0);
}

export function isValidRecipeRecord(recipe) {
  return (
    recipe &&
    typeof recipe === "object" &&
    !Array.isArray(recipe) &&
    isValidRecipeId(recipe.id) &&
    typeof recipe.name === "string" &&
    typeof recipe.image === "string" &&
    typeof recipe.category === "string" &&
    isValidBackupNutritionValue(recipe.calories) &&
    isValidBackupNutritionValue(recipe.protein) &&
    isValidBackupNutritionValue(recipe.fat) &&
    isValidBackupNutritionValue(recipe.carbs) &&
    typeof recipe.ingredients === "string" &&
    typeof recipe.instructions === "string" &&
    typeof recipe.favorite === "boolean" &&
    (recipe.createdAt === null || normalizeCreatedAt(recipe.createdAt) !== null)
  );
}

export function isValidRecipeCollection(recipes) {
  if (!Array.isArray(recipes)) {
    return false;
  }

  const ids = new Set();

  return recipes.every((recipe) => {
    if (!isValidRecipeRecord(recipe)) {
      return false;
    }

    const id = String(recipe.id);

    if (ids.has(id)) {
      return false;
    }

    ids.add(id);
    return true;
  });
}

function normalizeId(value, index, usedIds) {
  const baseId =
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.trim())
      ? String(value)
      : `recovered-${index + 1}`;
  let id = baseId;
  let duplicateCount = 1;

  while (usedIds.has(id)) {
    duplicateCount += 1;
    id = `${baseId}-${duplicateCount}`;
  }

  usedIds.add(id);

  return typeof value === "number" && Number.isFinite(value) && id === baseId
    ? value
    : id;
}

function normalizeRecipe(recipe, index, usedIds) {
  if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
    return null;
  }

  return {
    ...recipe,
    id: normalizeId(recipe.id, index, usedIds),
    name: normalizeText(recipe.name),
    image: normalizeText(recipe.image),
    category: normalizeText(recipe.category),
    calories: normalizeNutritionValue(recipe.calories),
    protein: normalizeNutritionValue(recipe.protein),
    fat: normalizeNutritionValue(recipe.fat),
    carbs: normalizeNutritionValue(recipe.carbs),
    ingredients: normalizeText(recipe.ingredients),
    instructions: normalizeText(recipe.instructions),
    favorite: recipe.favorite === true,
    createdAt: normalizeCreatedAt(recipe.createdAt),
  };
}

function normalizeRecipes(recipes) {
  const usedIds = new Set();

  return recipes
    .map((recipe, index) => normalizeRecipe(recipe, index, usedIds))
    .filter(Boolean);
}

function preserveCorruptedRecipes(rawValue) {
  const recoveryKey = `${RECIPE_RECOVERY_KEY_PREFIX}${Date.now()}`;

  try {
    localStorage.setItem(recoveryKey, rawValue);
  } catch {
    return;
  }

  try {
    localStorage.setItem(RECIPE_STORAGE_KEY, "[]");
  } catch {
    return;
  }

  recoveryNoticePending = true;

  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      window.dispatchEvent(new Event(RECIPE_RECOVERED_EVENT));
    }, 0);
  }
}

export function consumeRecipeRecoveryNotice() {
  const shouldShowNotice = recoveryNoticePending;

  recoveryNoticePending = false;
  return shouldShowNotice;
}

export function getRecipes() {
  const storedRecipes = localStorage.getItem(RECIPE_STORAGE_KEY);

  if (!storedRecipes) {
    return [];
  }

  try {
    const recipes = JSON.parse(storedRecipes);

    if (!Array.isArray(recipes)) {
      preserveCorruptedRecipes(storedRecipes);
      return [];
    }

    return normalizeRecipes(recipes);
  } catch {
    preserveCorruptedRecipes(storedRecipes);
    return [];
  }
}

export function saveRecipes(recipes) {
  localStorage.setItem(
    RECIPE_STORAGE_KEY,
    JSON.stringify(normalizeRecipes(Array.isArray(recipes) ? recipes : []))
  );
}

export function addRecipe(recipe) {
  saveRecipes([...getRecipes(), recipe]);
}

export function updateRecipe(updatedRecipe) {
  const recipes = getRecipes();
  const updatedRecipes = recipes.map((recipe) =>
    String(recipe.id) === String(updatedRecipe.id) ? updatedRecipe : recipe
  );

  saveRecipes(updatedRecipes);
}

export function deleteRecipe(id) {
  saveRecipes(
    getRecipes().filter((recipe) => String(recipe.id) !== String(id))
  );
}

export function getRecipeById(id) {
  return getRecipes().find((recipe) => String(recipe.id) === String(id));
}

export function toggleFavorite(id) {
  const updatedRecipes = getRecipes().map((recipe) =>
    String(recipe.id) === String(id)
      ? { ...recipe, favorite: !recipe.favorite }
      : recipe
  );

  saveRecipes(updatedRecipes);
}
