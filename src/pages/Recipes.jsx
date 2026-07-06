import { useEffect, useState } from "react";
import RecipeCard from "../components/RecipeCard";
import {
  getRecipes,
  deleteRecipe,
} from "../services/recipeService";

function Recipes() {
  const [recipeList, setRecipeList] = useState([]);

  useEffect(() => {
    setRecipeList(getRecipes());
  }, []);

  const handleDelete = (id) => {
    deleteRecipe(id);
    setRecipeList(getRecipes());
  };

  return (
    <div
      style={{
        background: "#1b1b1b",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
      }}
    >
      <h1>📖 Receptek</h1>

      {recipeList.length === 0 ? (
        <p>Még nincs egyetlen recept sem.</p>
      ) : (
        recipeList.map((recipe) => (
          <div key={recipe.id}>
            <RecipeCard recipe={recipe} />

            <div
              style={{
                textAlign: "center",
                marginBottom: "30px",
              }}
            >
              <button
                onClick={() => handleDelete(recipe.id)}
                style={{
                  background: "#c62828",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                🗑️ Törlés
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Recipes;