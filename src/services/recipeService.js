import { readStorageValue, setStorageValue } from "./storageService.js";

export const RECIPE_STORAGE_KEY = "recipes";
export const RECIPE_RECOVERY_KEY_PREFIX = "romnyi-food-recipes-recovery-";
const RECIPE_RECOVERED_EVENT = "romnyi-food-recipes-recovered";
const MAX_NUTRITION_VALUE = 1000000;
const MAX_RECIPE_STORAGE_BYTES = 4 * 1024 * 1024;

let recoveryNoticePending = false;

export class RecipeStorageError extends Error {
  constructor(code) {
    super(code);
    this.name = "RecipeStorageError";
    this.code = code;
  }
}

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

function isEmptyValue(value) {
  return value === "" || value === null || value === undefined;
}

function getValidatedNutritionValue(value, fieldName, isRequired = false) {
  if (isEmptyValue(value)) {
    return isRequired
      ? { error: "MISSING_CALORIES" }
      : { value: null };
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0 || number > MAX_NUTRITION_VALUE) {
    return { error: `INVALID_${fieldName.toUpperCase()}` };
  }

  return { value: number };
}

function getValidatedText(value, errorCode, isRequired = false) {
  if (typeof value !== "string") {
    return { error: errorCode };
  }

  const text = value.trim();

  if (isRequired && !text) {
    return { error: errorCode };
  }

  return { value: text };
}

function getValidationMessage(error) {
  const messages = {
    MISSING_NAME: "Add meg a recept nevét.",
    INVALID_CATEGORY: "Válassz érvényes kategóriát.",
    MISSING_CALORIES: "Add meg a kalóriaértéket.",
    INVALID_CALORIES: "A kalóriaérték nem lehet negatív, végtelen vagy túl nagy.",
    INVALID_PROTEIN: "A fehérjeérték nem lehet negatív, végtelen vagy túl nagy.",
    INVALID_FAT: "A zsírérték nem lehet negatív, végtelen vagy túl nagy.",
    INVALID_CARBS: "A szénhidrátérték nem lehet negatív, végtelen vagy túl nagy.",
    MISSING_INGREDIENTS: "Add meg a hozzávalókat.",
    MISSING_INSTRUCTIONS: "Add meg az elkészítés lépéseit.",
    INVALID_IMAGE: "A recept képe nem érvényes.",
    INVALID_ID: "A recept azonosítója nem érvényes.",
    DUPLICATE_ID: "Ezzel az azonosítóval már létezik recept.",
    MISSING_RECIPE: "A szerkeszteni kívánt recept nem található.",
  };

  return messages[error] || "A recept adatai nem érvényesek.";
}

function getStorageErrorMessage(error) {
  if (error?.code === "STORAGE_LIMIT" || error?.name === "QuotaExceededError") {
    return "A képpel együtt túl sok adatot kellene menteni a készüléken. Válassz kisebb képet, vagy törölj néhány régi receptet.";
  }

  return "A recept mentése nem sikerült. A korábbi adatok változatlanok maradtak.";
}

function getUtf8ByteSize(value) {
  return new Blob([value]).size;
}

function generateFallbackId() {
  const randomValues = new Uint32Array(2);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomValues);
    return `recipe-${Date.now().toString(36)}-${randomValues[0].toString(36)}${randomValues[1].toString(36)}`;
  }

  return `recipe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function generateUniqueRecipeId(existingRecipes = getRecipes()) {
  const existingIds = new Set(existingRecipes.map((recipe) => String(recipe.id)));
  let id;

  do {
    id = globalThis.crypto?.randomUUID?.() || generateFallbackId();
  } while (existingIds.has(String(id)));

  return id;
}

function prepareRecipeForSave(recipe, existingRecipe, recipes) {
  if (!recipe || typeof recipe !== "object" || Array.isArray(recipe)) {
    return { success: false, error: "MISSING_NAME" };
  }

  const name = getValidatedText(recipe.name, "MISSING_NAME", true);
  const category = getValidatedText(recipe.category, "INVALID_CATEGORY", true);
  const image = getValidatedText(recipe.image ?? "", "INVALID_IMAGE");
  const ingredients = getValidatedText(recipe.ingredients, "MISSING_INGREDIENTS", true);
  const instructions = getValidatedText(recipe.instructions, "MISSING_INSTRUCTIONS", true);
  const calories = getValidatedNutritionValue(recipe.calories, "calories", true);
  const protein = getValidatedNutritionValue(recipe.protein, "protein");
  const fat = getValidatedNutritionValue(recipe.fat, "fat");
  const carbs = getValidatedNutritionValue(recipe.carbs, "carbs");
  const validationResults = [
    name,
    category,
    image,
    ingredients,
    instructions,
    calories,
    protein,
    fat,
    carbs,
  ];
  const invalidResult = validationResults.find((result) => result.error);

  if (invalidResult) {
    return { success: false, error: invalidResult.error };
  }

  const existingIds = new Set(recipes.map((savedRecipe) => String(savedRecipe.id)));
  const requestedId = recipe.id;
  const id = existingRecipe?.id ??
    (isEmptyValue(requestedId)
      ? generateUniqueRecipeId(recipes)
      : requestedId);

  if (!isValidRecipeId(id)) {
    return { success: false, error: "INVALID_ID" };
  }

  if (!existingRecipe && existingIds.has(String(id))) {
    return { success: false, error: "DUPLICATE_ID" };
  }

  return {
    success: true,
    recipe: {
      ...existingRecipe,
      ...recipe,
      id,
      name: name.value,
      image: image.value,
      category: category.value,
      calories: calories.value,
      protein: protein.value,
      fat: fat.value,
      carbs: carbs.value,
      ingredients: ingredients.value,
      instructions: instructions.value,
      favorite: existingRecipe?.favorite ?? recipe.favorite === true,
      createdAt:
        existingRecipe?.createdAt ??
        normalizeCreatedAt(recipe.createdAt) ??
        new Date().toISOString(),
    },
  };
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
    if (!setStorageValue(recoveryKey, rawValue)) return;
  } catch {
    return;
  }

  try {
    if (!setStorageValue(RECIPE_STORAGE_KEY, "[]")) return;
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
  const storageResult = readStorageValue(RECIPE_STORAGE_KEY);
  const storedRecipes = storageResult.value;

  if (!storageResult.success || !storedRecipes) {
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
  if (!isValidRecipeCollection(recipes)) {
    throw new Error("INVALID_RECIPE_COLLECTION");
  }

  const serializedRecipes = JSON.stringify(recipes);

  if (getUtf8ByteSize(serializedRecipes) > MAX_RECIPE_STORAGE_BYTES) {
    throw new RecipeStorageError("STORAGE_LIMIT");
  }

  if (!setStorageValue(RECIPE_STORAGE_KEY, serializedRecipes)) {
    throw new RecipeStorageError("STORAGE_WRITE_FAILED");
  }
}

export function addRecipe(recipe) {
  const recipes = getRecipes();
  const preparedRecipe = prepareRecipeForSave(recipe, null, recipes);

  if (!preparedRecipe.success) {
    return {
      ...preparedRecipe,
      message: getValidationMessage(preparedRecipe.error),
    };
  }

  try {
    saveRecipes([...recipes, preparedRecipe.recipe]);
  } catch (error) {
    return { success: false, error: "STORAGE_LIMIT", message: getStorageErrorMessage(error) };
  }

  return { success: true, recipe: preparedRecipe.recipe };
}

export function updateRecipe(updatedRecipe) {
  const recipes = getRecipes();
  const existingRecipe = recipes.find(
    (recipe) => String(recipe.id) === String(updatedRecipe?.id)
  );

  if (!existingRecipe) {
    return { success: false, error: "MISSING_RECIPE", message: getValidationMessage("MISSING_RECIPE") };
  }

  const preparedRecipe = prepareRecipeForSave(
    updatedRecipe,
    existingRecipe,
    recipes
  );

  if (!preparedRecipe.success) {
    return {
      ...preparedRecipe,
      message: getValidationMessage(preparedRecipe.error),
    };
  }

  const updatedRecipes = recipes.map((recipe) =>
    String(recipe.id) === String(existingRecipe.id)
      ? preparedRecipe.recipe
      : recipe
  );

  try {
    saveRecipes(updatedRecipes);
  } catch (error) {
    return { success: false, error: "STORAGE_LIMIT", message: getStorageErrorMessage(error) };
  }

  return { success: true, recipe: preparedRecipe.recipe };
}

export function deleteRecipe(id) {
  const recipes = getRecipes();
  const recipe = recipes.find((savedRecipe) => String(savedRecipe.id) === String(id));

  if (!recipe) {
    return { success: false, error: "MISSING_RECIPE", message: getValidationMessage("MISSING_RECIPE") };
  }

  try {
    saveRecipes(recipes.filter((savedRecipe) => String(savedRecipe.id) !== String(id)));
  } catch {
    return {
      success: false,
      error: "STORAGE_WRITE_FAILED",
      message: "A recept törlése nem sikerült. A recept változatlanul megmaradt.",
    };
  }

  return { success: true, recipe };
}

export function getRecipeById(id) {
  return getRecipes().find((recipe) => String(recipe.id) === String(id));
}

export function toggleFavorite(id) {
  const recipes = getRecipes();
  const recipe = recipes.find((savedRecipe) => String(savedRecipe.id) === String(id));

  if (!recipe) {
    return { success: false, error: "MISSING_RECIPE", message: getValidationMessage("MISSING_RECIPE") };
  }

  const updatedRecipes = recipes.map((recipe) =>
    String(recipe.id) === String(id)
      ? { ...recipe, favorite: !recipe.favorite }
      : recipe
  );

  try {
    saveRecipes(updatedRecipes);
  } catch {
    return {
      success: false,
      error: "STORAGE_WRITE_FAILED",
      message: "A kedvenc beállítás mentése nem sikerült. A korábbi állapot változatlan maradt.",
    };
  }

  return {
    success: true,
    recipe: updatedRecipes.find((savedRecipe) => String(savedRecipe.id) === String(id)),
  };
}
