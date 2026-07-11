import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getRecipeById,
  toggleFavorite,
  deleteRecipe,
} from "../services/recipeService";

import Header from "../components/Header";
import "../styles/RecipeDetails.css";

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(
    () => getRecipeById(id)?.favorite ?? false
  );

  const recipe = getRecipeById(id);

  if (!recipe) {
    return (
      <div className="details-page">
        <Header title="Recept" />

        <div className="details-container">
          <h1 className="details-title">
            ❌ A recept nem található.
          </h1>

          <button
            className="action-button"
            onClick={() => navigate("/recipes")}
          >
            ⬅️ Vissza
          </button>
        </div>
      </div>
    );
  }

  const handleFavorite = () => {
    toggleFavorite(recipe.id);
    setIsFavorite((favorite) => !favorite);
  };

  const confirmDelete = () => {
    deleteRecipe(recipe.id);
    navigate("/recipes");
  };

const handleEdit = () => {
  navigate(`/edit/${recipe.id}`);
};

  return (
    <div className="details-page">
      <Header title="Recept" />

      <div className="details-container">

        <img
          src={recipe.image || "https://placehold.co/1200x700"}
          alt={recipe.name}
          className="details-image"
        />

        <h1 className="details-title">
          {recipe.name}
        </h1>

        <p className="details-category">
          🏷️ {recipe.category || "Nincs kategória"}
        </p>

        <div className="info-grid">

          <div className="info-card">
            <h3>🔥 Kalória</h3>
            <p>{recipe.calories || 0} kcal</p>
          </div>

          <div className="info-card">
            <h3>🥩 Fehérje</h3>
            <p>{recipe.protein || 0} g</p>
          </div>

          <div className="info-card">
            <h3>🥑 Zsír</h3>
            <p>{recipe.fat || 0} g</p>
          </div>

          <div className="info-card">
            <h3>🍚 Szénhidrát</h3>
            <p>{recipe.carbs || 0} g</p>
          </div>

        </div>

        <div className="section">
          <h2>🥕 Hozzávalók</h2>

          <p className="details-text">
            {recipe.ingredients}
          </p>
        </div>

        <div className="section">
          <h2>👨‍🍳 Elkészítés</h2>

          <p className="details-text">
            {recipe.instructions}
          </p>
        </div>

        <div className="button-row">

          <button
            className="action-button"
            onClick={handleFavorite}
          >
            {isFavorite
              ? "❤️ Kedvenc"
              : "🤍 Kedvencekhez"}
          </button>

          <button
            className="action-button"
            onClick={handleEdit}
          >
            ✏️ Szerkesztés
          </button>

          <button
            className="delete-button"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            🗑️ Törlés
          </button>

          <button
            className="action-button"
            onClick={() => navigate("/recipes")}
          >
            ⬅️ Vissza
          </button>

        </div>

      </div>

      {isDeleteDialogOpen && (
        <div className="delete-dialog-backdrop">
          <div
            className="delete-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <h2 id="delete-dialog-title">Biztosan törölni szeretnéd ezt a receptet?</h2>

            <div className="delete-dialog-actions">
              <button
                className="action-button"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Mégse
              </button>

              <button className="delete-button" onClick={confirmDelete}>
                Törlés
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecipeDetails;
