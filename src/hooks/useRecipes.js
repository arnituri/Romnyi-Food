import { useCallback, useEffect, useState } from "react";
import {
  getRecipes,
  RECIPE_STORAGE_KEY,
  RECIPE_STORAGE_UPDATED_EVENT,
} from "../services/recipeService";

export function useRecipeStorageChange(onRecipesChanged) {
  useEffect(() => {
    const handleRecipeStorageChange = (event) => {
      if (
        event.type === RECIPE_STORAGE_UPDATED_EVENT ||
        event.key === RECIPE_STORAGE_KEY
      ) {
        onRecipesChanged?.();
      }
    };

    window.addEventListener("storage", handleRecipeStorageChange);
    window.addEventListener(RECIPE_STORAGE_UPDATED_EVENT, handleRecipeStorageChange);

    return () => {
      window.removeEventListener("storage", handleRecipeStorageChange);
      window.removeEventListener(RECIPE_STORAGE_UPDATED_EVENT, handleRecipeStorageChange);
    };
  }, [onRecipesChanged]);
}

export function useRecipes() {
  const [recipes, setRecipes] = useState(() => getRecipes());
  const refreshRecipes = useCallback(() => setRecipes(getRecipes()), []);

  useRecipeStorageChange(refreshRecipes);

  return recipes;
}
