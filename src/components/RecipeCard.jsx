import "../styles/RecipeCard.css";
import { useNavigate } from "react-router-dom";
import RecipeImage from "./RecipeImage";
import { hasNutritionValue } from "../utils/nutrition";

function RecipeCard({ recipe }) {
  const navigate = useNavigate();

  return (
    <div className="recipe-card">
      <RecipeImage src={recipe.image} alt={recipe.name} className="recipe-image" />

      <div className="recipe-content">

        <h2>{recipe.name}</h2>

        <p>🔥 {hasNutritionValue(recipe.calories) ? recipe.calories : "Nincs adat"}{hasNutritionValue(recipe.calories) ? " kcal" : ""}</p>

        {hasNutritionValue(recipe.protein) && <p>🥩 Fehérje: {recipe.protein} g</p>}
        {hasNutritionValue(recipe.fat) && <p>🥑 Zsír: {recipe.fat} g</p>}
        {hasNutritionValue(recipe.carbs) && <p>🍚 Szénhidrát: {recipe.carbs} g</p>}

        <button
          onClick={() => navigate(`/recipe/${recipe.id}`)}
        >
          👁️ Megnyitás
        </button>

      </div>
    </div>
  );
}

export default RecipeCard;
