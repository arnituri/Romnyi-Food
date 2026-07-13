import { getRecipes } from "./recipeService";

export const DAILY_RECOMMENDATION_STORAGE_KEY =
  "romnyi-food-daily-recommendation";

function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStoredRecommendation() {
  try {
    const storedValue = localStorage.getItem(DAILY_RECOMMENDATION_STORAGE_KEY);

    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
}

function findRecipe(recipes, recipeId) {
  return recipes.find((recipe) => String(recipe.id) === String(recipeId));
}

export function getDailyRecommendation(date = new Date()) {
  const recipes = getRecipes();

  if (recipes.length === 0) {
    return null;
  }

  const dateKey = getDateKey(date);
  const storedRecommendation = getStoredRecommendation();

  if (storedRecommendation?.date === dateKey) {
    const storedRecipe = findRecipe(recipes, storedRecommendation.recipeId);

    if (storedRecipe) {
      return storedRecipe;
    }
  }

  const selectableRecipes =
    recipes.length > 1 && storedRecommendation?.recipeId != null
      ? recipes.filter(
          (recipe) => String(recipe.id) !== String(storedRecommendation.recipeId)
        )
      : recipes;
  const recipe =
    selectableRecipes[Math.floor(Math.random() * selectableRecipes.length)];

  localStorage.setItem(
    DAILY_RECOMMENDATION_STORAGE_KEY,
    JSON.stringify({ date: dateKey, recipeId: recipe.id })
  );

  return recipe;
}
