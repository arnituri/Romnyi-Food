import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDailyRecommendation } from "../services/dailyRecommendationService";
import "../styles/DailyRecommendation.css";

function DailyRecommendation() {
  const [recipe, setRecipe] = useState(() => getDailyRecommendation());

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    let intervalId;
    const timeoutId = window.setTimeout(() => {
      setRecipe(getDailyRecommendation());
      intervalId = window.setInterval(() => {
        setRecipe(getDailyRecommendation());
      }, 24 * 60 * 60 * 1000);
    }, nextDay.getTime() - now.getTime());

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <section className="daily-section">
      <h2 className="daily-title">Mai ajánlat</h2>

      {recipe ? (
        <Link
          className="daily-card"
          to={`/recipe/${recipe.id}`}
          aria-label={`${recipe.name} recept megnyitása`}
        >
          <div className="daily-image">
            {recipe.image ? (
              <img src={recipe.image} alt="" />
            ) : (
              <span aria-hidden="true">🍽️</span>
            )}
          </div>

          <div className="daily-content">
            <p className="daily-label">NEKED VÁLASZTOTTUK</p>
            <h3>{recipe.name}</h3>
            <p className="daily-meta">
              {recipe.category || "Recept"}
              {recipe.calories ? ` · ${recipe.calories} kcal` : ""}
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
