import { getLocalDateKey, isValidLocalDateKey } from "./cheatDayService.js";
import { getRecipes } from "./recipeService.js";

export const DAILY_RECOMMENDATION_STORAGE_KEY = "romnyi-food-daily-recommendation";

function isPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isValidRecipeId(value) {
  return (
    (typeof value === "number" && Number.isFinite(value)) ||
    (typeof value === "string" && value.trim().length > 0)
  );
}

function isValidStoredRecommendation(value) {
  return (
    isPlainObject(value) &&
    isValidLocalDateKey(value.date) &&
    isValidRecipeId(value.recipeId)
  );
}

function clearStoredRecommendation() {
  try {
    localStorage.removeItem(DAILY_RECOMMENDATION_STORAGE_KEY);
  } catch {
    // Local storage can be unavailable in private or restricted contexts.
  }
}

function getStoredRecommendation() {
  try {
    const storedValue = localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY);
    if (!storedValue) return null;

    const recommendation = JSON.parse(storedValue);
    if (isValidStoredRecommendation(recommendation)) return recommendation;
  } catch {
    // Invalid JSON is treated exactly like an invalid recommendation object.
  }

  clearStoredRecommendation();
  return null;
}

function findRecipe(recipes, recipeId) {
  return recipes.find((recipe) => String(recipe.id) === String(recipeId));
}

function getDeterministicIndex(dateKey, itemCount) {
  let hash = 0;

  for (const character of dateKey) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % itemCount;
}

function storeRecommendation(recommendation) {
  try {
    localStorage.setItem(DAILY_RECOMMENDATION_STORAGE_KEY, JSON.stringify(recommendation));
  } catch {
    // The deterministic choice below is still stable for this browser session.
  }
}

export function clearDailyRecommendation() {
  clearStoredRecommendation();
}

export function getDailyRecommendation(date = new Date()) {
  const recipes = getRecipes();
  const dateKey = getLocalDateKey(date);
  const storedRecommendation = getStoredRecommendation();

  if (recipes.length === 0) {
    if (storedRecommendation) clearStoredRecommendation();
    return null;
  }

  if (storedRecommendation?.date === dateKey) {
    const storedRecipe = findRecipe(recipes, storedRecommendation.recipeId);
    if (storedRecipe) return storedRecipe;

    // The selected recipe was deleted; immediately replace its stale reference.
    clearStoredRecommendation();
  }

  const previousRecipe =
    storedRecommendation?.date !== dateKey
      ? findRecipe(recipes, storedRecommendation?.recipeId)
      : null;
  const selectableRecipes =
    recipes.length > 1 && previousRecipe
      ? recipes.filter((recipe) => String(recipe.id) !== String(previousRecipe.id))
      : recipes;
  const recipe = selectableRecipes[getDeterministicIndex(dateKey, selectableRecipes.length)];

  storeRecommendation({ date: dateKey, recipeId: recipe.id });
  return recipe;
}
