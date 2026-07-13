import { useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addRecipe,
  getRecipeById,
  getRecipeVersion,
  updateRecipe,
} from "../services/recipeService";
import { optimizeRecipeImage } from "../services/imageService";
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_NAMES,
} from "../constants/recipeCategories";
import BottomNavigation from "../components/BottomNavigation";
import RecipeImage from "../components/RecipeImage";
import { useNotifications } from "../hooks/useNotifications";
import { useAccessibleDialog } from "../hooks/useAccessibleDialog";
import "../styles/AddRecipe.css";

function getFormValues(recipe) {
  return {
    name: recipe?.name || "",
    image: recipe?.image || "",
    category: recipe?.category || "",
    calories: String(recipe?.calories ?? ""),
    protein: String(recipe?.protein ?? ""),
    fat: String(recipe?.fat ?? ""),
    carbs: String(recipe?.carbs ?? ""),
    ingredients: recipe?.ingredients || "",
    instructions: recipe?.instructions || "",
  };
}

function AddRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotifications();
  const imageInputRef = useRef(null);
  const isEditing = Boolean(id);
  const [existingRecipe] = useState(() => (isEditing ? getRecipeById(id) : null));
  const [initialValues] = useState(() => getFormValues(existingRecipe));
  const [initialRecipeVersion] = useState(() => getRecipeVersion(existingRecipe));
  const [formValues, setFormValues] = useState(initialValues);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [leavePath, setLeavePath] = useState(null);
  const [editConflict, setEditConflict] = useState(null);
  const closeLeaveDialog = useCallback(() => setLeavePath(null), []);
  const closeEditConflict = useCallback(() => setEditConflict(null), []);
  const { dialogRef: leaveDialogRef } = useAccessibleDialog(Boolean(leavePath), closeLeaveDialog);
  const { dialogRef: editConflictDialogRef } = useAccessibleDialog(
    Boolean(editConflict),
    closeEditConflict,
  );

  const hasUnsavedChanges =
    isEditing && JSON.stringify(formValues) !== JSON.stringify(initialValues);
  const hasLegacyCategory =
    Boolean(formValues.category) &&
    !RECIPE_CATEGORY_NAMES.includes(formValues.category);

  const updateField = (field, value) => {
    setFormValues((values) => ({ ...values, [field]: value }));
  };

  const requestLeave = (path) => {
    if (isEditing && hasUnsavedChanges) {
      setLeavePath(path);
      return;
    }

    navigate(path);
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsProcessingImage(true);

    try {
      updateField("image", await optimizeRecipeImage(file));
    } catch (error) {
      notify.error(error.message || "A kép feldolgozása nem sikerült.");
    } finally {
      setIsProcessingImage(false);
      event.target.value = "";
    }
  };

  const saveRecipe = () => {
    if (isProcessingImage) return;

    const result = isEditing
      ? updateRecipe(
          { ...formValues, id: existingRecipe.id },
          initialRecipeVersion,
        )
      : addRecipe(formValues);

    if (!result.success) {
      if (isEditing && (result.error === "EDIT_CONFLICT" || result.error === "MISSING_RECIPE")) {
        setEditConflict(result.error);
        notify.error(
          result.error === "EDIT_CONFLICT"
            ? result.message
            : "A receptet közben törölték egy másik ablakban. A saját módosításaid megmaradtak.",
        );
        return;
      }

      notify.error(result.message);
      return;
    }

    if (isEditing) {
      navigate(`/recipe/${result.recipe.id}`, { replace: true });
      return;
    }

    notify.success("Recept sikeresen elmentve!");
    setFormValues(getFormValues(null));
  };

  const handleBottomNavigation = (path) => {
    requestLeave(path);
    return true;
  };

  if (isEditing && !existingRecipe) {
    return (
      <div className="add-page">
        <div className="add-container add-missing-recipe">
          <h1 className="add-title">A recept nem található.</h1>
          <p>Lehet, hogy közben törölték. Új recept nem jött létre.</p>
          <div className="add-action-row">
            <button className="save-button" onClick={() => navigate("/recipes")}>Receptek</button>
            <button className="cancel-button" onClick={() => navigate("/")}>Főoldal</button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="add-page">
      <div className="add-container">
        <h1 className="add-title">{isEditing ? "✏️ Recept szerkesztése" : "➕ Új recept"}</h1>

        <button
          className="image-upload"
          type="button"
          aria-label="Receptkép kiválasztása"
          onClick={() => imageInputRef.current?.click()}
        >
          {formValues.image ? (
            <RecipeImage
              src={formValues.image}
              alt="Recept előnézet"
              className="image-upload-preview"
              fallbackClassName="image-upload-preview-fallback"
            />
          ) : (
            <div>
              📷<br />
              {isProcessingImage ? "Kép feldolgozása…" : "Kép kiválasztása"}
            </div>
          )}
        </button>
        <input
          ref={imageInputRef}
          className="hidden-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-hidden="true"
          tabIndex="-1"
          onChange={handleImageChange}
        />

        <input className="add-input" aria-label="Recept neve" placeholder="🍽️ Recept neve" value={formValues.name} onChange={(event) => updateField("name", event.target.value)} />
        <select className="add-input" aria-label="Kategória" value={formValues.category} onChange={(event) => updateField("category", event.target.value)}>
          <option value="">🏷️ Válassz kategóriát</option>
          {hasLegacyCategory && (
            <option value={formValues.category}>
              Korábbi kategória: {formValues.category}
            </option>
          )}
          {RECIPE_CATEGORIES.map((category) => (
            <option key={category.name} value={category.name}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>

        <input className="add-input" type="number" aria-label="Kalória" min="0" step="any" placeholder="🔥 Kalória" value={formValues.calories} onChange={(event) => updateField("calories", event.target.value)} />
        <input className="add-input" type="number" aria-label="Fehérje" min="0" step="any" placeholder="🥩 Fehérje (g)" value={formValues.protein} onChange={(event) => updateField("protein", event.target.value)} />
        <input className="add-input" type="number" aria-label="Zsír" min="0" step="any" placeholder="🥑 Zsír (g)" value={formValues.fat} onChange={(event) => updateField("fat", event.target.value)} />
        <input className="add-input" type="number" aria-label="Szénhidrát" min="0" step="any" placeholder="🍚 Szénhidrát (g)" value={formValues.carbs} onChange={(event) => updateField("carbs", event.target.value)} />
        <textarea className="add-textarea" aria-label="Hozzávalók" rows="6" placeholder="🥕 Hozzávalók" value={formValues.ingredients} onChange={(event) => updateField("ingredients", event.target.value)} />
        <textarea className="add-textarea" aria-label="Elkészítés" rows="8" placeholder="👨‍🍳 Elkészítés" value={formValues.instructions} onChange={(event) => updateField("instructions", event.target.value)} />

        <div className="add-action-row">
          {isEditing && <button className="cancel-button" type="button" onClick={() => requestLeave(`/recipe/${existingRecipe.id}`)}>Mégse</button>}
          <button className="save-button" type="button" onClick={saveRecipe} disabled={isProcessingImage}>
            {isProcessingImage ? "Kép feldolgozása…" : "💾 Recept mentése"}
          </button>
        </div>
      </div>

      {leavePath && (
        <div className="add-dialog-backdrop">
          <section ref={leaveDialogRef} className="add-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title" aria-describedby="unsaved-dialog-description" tabIndex="-1">
            <h2 id="unsaved-dialog-title">Nem mentett módosításaid vannak. Biztosan elhagyod az oldalt?</h2>
            <p id="unsaved-dialog-description">A módosításaid mentés nélkül elvesznek.</p>
            <div className="add-dialog-actions">
              <button className="cancel-button" type="button" data-dialog-initial-focus onClick={closeLeaveDialog}>Maradok</button>
              <button className="save-button" type="button" onClick={() => navigate(leavePath)}>Kilépés mentés nélkül</button>
            </div>
          </section>
        </div>
      )}

      {editConflict && (
        <div className="add-dialog-backdrop">
          <section
            ref={editConflictDialogRef}
            className="add-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="edit-conflict-dialog-title"
            aria-describedby="edit-conflict-dialog-description"
            tabIndex="-1"
          >
            <h2 id="edit-conflict-dialog-title">
              {editConflict === "EDIT_CONFLICT"
                ? "Ez a recept időközben módosult egy másik ablakban."
                : "A receptet közben törölték egy másik ablakban."}
            </h2>
            <p id="edit-conflict-dialog-description">
              {editConflict === "EDIT_CONFLICT"
                ? "A saját módosításaid nem lettek felülírva."
                : "A saját módosításaid megmaradtak, de a receptet nem lehet újra létrehozni mentéssel."}
            </p>
            <div className="add-dialog-actions">
              <button
                className="cancel-button"
                type="button"
                data-dialog-initial-focus
                onClick={closeEditConflict}
              >
                Maradok és átnézem
              </button>
              <button
                className="save-button"
                type="button"
                onClick={() => navigate(editConflict === "EDIT_CONFLICT" ? `/recipe/${id}` : "/recipes")}
              >
                {editConflict === "EDIT_CONFLICT"
                  ? "Legfrissebb verzió megnyitása"
                  : "Receptek megnyitása"}
              </button>
            </div>
          </section>
        </div>
      )}

      <BottomNavigation onNavigate={handleBottomNavigation} />
    </div>
  );
}

export default AddRecipe;
