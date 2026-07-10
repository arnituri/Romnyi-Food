const STORAGE_KEY = "recipes";

export function getRecipes() {
  const recipes = localStorage.getItem(STORAGE_KEY);

  if (!recipes) {
    return [];
  }

  return JSON.parse(recipes);
}

export function saveRecipes(recipes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

export function addRecipe(recipe) {
  const recipes = getRecipes();

  recipes.push(recipe);

  saveRecipes(recipes);
}

export function updateRecipe(updatedRecipe) {
  const recipes = getRecipes();

  const newRecipes = recipes.map((recipe) =>
    recipe.id === updatedRecipe.id ? updatedRecipe : recipe
  );

  saveRecipes(newRecipes);
}

export function deleteRecipe(id) {
  const recipes = getRecipes();

  const newRecipes = recipes.filter((recipe) => recipe.id !== id);

  saveRecipes(newRecipes);
}

export function getRecipeById(id) {
  const recipes = getRecipes();

  return recipes.find((recipe) => recipe.id === Number(id));
}
export function toggleFavorite(id) {
  const recipes = getRecipes();

  const newRecipes = recipes.map((recipe) => {
    if (recipe.id === id) {
      return {
        ...recipe,
        favorite: !recipe.favorite,
      };
    }

    return recipe;
  });

  saveRecipes(newRecipes);
}