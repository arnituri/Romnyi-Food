import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  toggleFavorite,
  deleteRecipe,
} from "../services/recipeService";

import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import RecipeImage from "../components/RecipeImage";
import { useNotifications } from "../hooks/useNotifications";
import { useAccessibleDialog } from "../hooks/useAccessibleDialog";
import { useRecipes } from "../hooks/useRecipes";
import "../styles/RecipeDetails.css";

function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotifications();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const recipes = useRecipes();
  const closeDeleteDialog = useCallback(() => setIsDeleteDialogOpen(false), []);
  const { captureOpener: captureDeleteOpener, dialogRef: deleteDialogRef } = useAccessibleDialog(
    isDeleteDialogOpen,
    closeDeleteDialog
  );

  const recipe = recipes.find((savedRecipe) => String(savedRecipe.id) === String(id));
  const isFavorite = recipe?.favorite ?? false;

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
        <BottomNavigation />
      </div>
    );
  }

  const handleFavorite = () => {
    const result = toggleFavorite(recipe.id);

    if (!result.success) {
      notify.error(result.message);
      return;
    }

  };

  const confirmDelete = () => {
    const result = deleteRecipe(recipe.id);

    if (!result.success) {
      setIsDeleteDialogOpen(false);
      notify.error(result.message);
      return;
    }

    navigate("/recipes");
  };

const handleEdit = () => {
  navigate(`/edit/${recipe.id}`);
};

  return (
    <div className="details-page">
      <Header title="Recept" />

      <div className="details-container">

        <RecipeImage src={recipe.image} alt={recipe.name} className="details-image" />

        <h1 className="details-title">
          {recipe.name}
        </h1>

        <p className="details-category">
          🏷️ {recipe.category || "Nincs kategória"}
        </p>

        <div className="info-grid">

          <div className="info-card">
            <h3>🔥 Kalória</h3>
            <p>{recipe.calories ?? "Nincs adat"}{recipe.calories === null ? "" : " kcal"}</p>
          </div>

          <div className="info-card">
            <h3>🥩 Fehérje</h3>
            <p>{recipe.protein ?? "Nincs adat"}{recipe.protein === null ? "" : " g"}</p>
          </div>

          <div className="info-card">
            <h3>🥑 Zsír</h3>
            <p>{recipe.fat ?? "Nincs adat"}{recipe.fat === null ? "" : " g"}</p>
          </div>

          <div className="info-card">
            <h3>🍚 Szénhidrát</h3>
            <p>{recipe.carbs ?? "Nincs adat"}{recipe.carbs === null ? "" : " g"}</p>
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
            onClick={(event) => {
              captureDeleteOpener(event);
              setIsDeleteDialogOpen(true);
            }}
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
            ref={deleteDialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            tabIndex="-1"
          >
            <h2 id="delete-dialog-title">Biztosan törölni szeretnéd ezt a receptet?</h2>
            <p id="delete-dialog-description">A törlés végleges, és nem vonható vissza.</p>

            <div className="delete-dialog-actions">
              <button
                className="action-button"
                data-dialog-initial-focus
                onClick={closeDeleteDialog}
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
      <BottomNavigation />
    </div>
  );
}

export default RecipeDetails;
