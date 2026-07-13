export function getRecentRecipes(recipes) {
  return recipes
    .filter(
      (recipe) =>
        typeof recipe.createdAt === "string" &&
        recipe.createdAt.trim() !== "" &&
        !Number.isNaN(new Date(recipe.createdAt).getTime())
    )
    .map((recipe) => ({ ...recipe, createdDate: new Date(recipe.createdAt) }))
    .sort((firstRecipe, secondRecipe) => secondRecipe.createdDate - firstRecipe.createdDate)
    .slice(0, 3);
}
