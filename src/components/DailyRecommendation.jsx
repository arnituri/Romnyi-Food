import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDailyRecommendation } from "../services/dailyRecommendationService";
import RecipeImage from "./RecipeImage";
import { hasNutritionValue } from "../utils/nutrition";
import "../styles/DailyRecommendation.css";

function DailyRecommendation() {
  const [recipe, setRecipe] = useState(() => getDailyRecommendation());

  useEffect(() => {
    let nextDayTimer;

    const refreshForNewLocalDay = () => {
      setRecipe(getDailyRecommendation());

      const now = new Date();
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      nextDayTimer = window.setTimeout(
        refreshForNewLocalDay,
        Math.max(1000, nextMidnight.getTime() - now.getTime())
      );
    };

    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    nextDayTimer = window.setTimeout(
      refreshForNewLocalDay,
      Math.max(1000, nextMidnight.getTime() - now.getTime())
    );

    return () => window.clearTimeout(nextDayTimer);
  }, []);

  return (
    <section className="daily-section">
      <h2 className="daily-title">Mai ajánlat</h2>

      {recipe ? (
        <Link className="daily-card" to={`/recipe/${recipe.id}`} aria-label={`${recipe.name} recept megnyitása`}>
          <div className="daily-image">
            <RecipeImage src={recipe.image} alt="" className="daily-photo" fallbackClassName="daily-photo-fallback" />
          </div>

          <div className="daily-content">
            <p className="daily-label">NEKED VÁLASZTOTTUK</p>
            <h3>{recipe.name}</h3>
            <p className="daily-meta">
              {recipe.category || "Recept"}
              {hasNutritionValue(recipe.calories) ? ` · ${recipe.calories} kcal` : ""}
            </p>
            <span className="daily-button">
              Recept megnyitása <span aria-hidden="true">→</span>
            </span>
          </div>
        </Link>
      ) : (
        <div className="daily-card daily-card-empty">
          <div className="daily-image" aria-hidden="true">🍽️</div>
          <div className="daily-content">
            <h3>Még nincs ajánlható recept</h3>
            <p>Adj hozzá egy receptet, és holnap már napi ajánlattal várunk.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export default DailyRecommendation;
