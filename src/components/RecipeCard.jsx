import "../styles/RecipeCard.css";
import { useNavigate } from "react-router-dom";

function RecipeCard({ recipe }) {
  const navigate = useNavigate();

  return (
    <div className="recipe-card">
      <img
        src={recipe.image || "https://placehold.co/600x400"}
        alt={recipe.name}
        className="recipe-image"
      />

      <div className="recipe-content">

        <h2>{recipe.name}</h2>

        <p>🔥 {recipe.calories ?? "Nincs adat"}{recipe.calories === null ? "" : " kcal"}</p>

        {recipe.protein && <p>🥩 Fehérje: {recipe.protein} g</p>}
        {recipe.fat && <p>🥑 Zsír: {recipe.fat} g</p>}
        {recipe.carbs && <p>🍚 Szénhidrát: {recipe.carbs} g</p>}

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
