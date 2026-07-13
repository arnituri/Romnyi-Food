import { parseStrictRecipeCreatedAt } from "./recipeDate";

export function getRecentRecipes(recipes) {
  return recipes
    .map((recipe) => ({
      ...recipe,
      createdDate: parseStrictRecipeCreatedAt(recipe.createdAt),
    }))
    .filter((recipe) => recipe.createdDate !== null)
    .sort((firstRecipe, secondRecipe) => secondRecipe.createdDate - firstRecipe.createdDate)
    .slice(0, 3);
}
