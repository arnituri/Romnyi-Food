const savedRecipes = localStorage.getItem("recipes");
export const recipes = savedRecipes
  ? JSON.parse(savedRecipes)
  : [];
