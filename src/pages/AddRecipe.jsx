import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addRecipe, getRecipeById, updateRecipe } from "../services/recipeService";
import { optimizeRecipeImage } from "../services/imageService";
import BottomNavigation from "../components/BottomNavigation";
import RecipeImage from "../components/RecipeImage";
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
  const isEditing = Boolean(id);
  const existingRecipe = isEditing ? getRecipeById(id) : null;
  const [initialValues] = useState(() => getFormValues(existingRecipe));
  const [formValues, setFormValues] = useState(initialValues);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [leavePath, setLeavePath] = useState(null);
  const [isEditUnavailable, setIsEditUnavailable] = useState(false);

  const hasUnsavedChanges =
    isEditing && JSON.stringify(formValues) !== JSON.stringify(initialValues);

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
      alert(`⚠️ ${error.message || "A kép feldolgozása nem sikerült."}`);
    } finally {
      setIsProcessingImage(false);
      event.target.value = "";
    }
  };

  const saveRecipe = () => {
    if (isProcessingImage) return;

    const result = isEditing
      ? updateRecipe({ ...formValues, id: existingRecipe.id })
      : addRecipe(formValues);

    if (!result.success) {
      if (isEditing && result.error === "MISSING_RECIPE") {
        setIsEditUnavailable(true);
        return;
      }

      alert(`⚠️ ${result.message}`);
      return;
    }

    if (isEditing) {
      navigate(`/recipe/${result.recipe.id}`, { replace: true });
      return;
    }

    alert("✅ Recept sikeresen elmentve!");
    setFormValues(getFormValues(null));
  };

  const handleBottomNavigation = (path) => {
    requestLeave(path);
    return true;
  };

  if (isEditing && (!existingRecipe || isEditUnavailable)) {
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

        <label className="image-upload">
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
          <input className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} />
        </label>

        <input className="add-input" placeholder="🍽️ Recept neve" value={formValues.name} onChange={(event) => updateField("name", event.target.value)} />
        <select className="add-input" value={formValues.category} onChange={(event) => updateField("category", event.target.value)}>
          <option value="">🏷️ Válassz kategóriát</option>
          <option value="Reggeli">🍳 Reggeli</option>
          <option value="Ebéd">🍲 Ebéd</option>
          <option value="Vacsora">🍽️ Vacsora</option>
          <option value="Saláta">🥗 Saláta</option>
          <option value="Desszert">🍰 Desszert</option>
          <option value="Ital">🥤 Ital</option>
          <option value="Snack">🍿 Snack</option>
        </select>

        <input className="add-input" type="number" min="0" step="any" placeholder="🔥 Kalória" value={formValues.calories} onChange={(event) => updateField("calories", event.target.value)} />
        <input className="add-input" type="number" min="0" step="any" placeholder="🥩 Fehérje (g)" value={formValues.protein} onChange={(event) => updateField("protein", event.target.value)} />
        <input className="add-input" type="number" min="0" step="any" placeholder="🥑 Zsír (g)" value={formValues.fat} onChange={(event) => updateField("fat", event.target.value)} />
        <input className="add-input" type="number" min="0" step="any" placeholder="🍚 Szénhidrát (g)" value={formValues.carbs} onChange={(event) => updateField("carbs", event.target.value)} />
        <textarea className="add-textarea" rows="6" placeholder="🥕 Hozzávalók" value={formValues.ingredients} onChange={(event) => updateField("ingredients", event.target.value)} />
        <textarea className="add-textarea" rows="8" placeholder="👨‍🍳 Elkészítés" value={formValues.instructions} onChange={(event) => updateField("instructions", event.target.value)} />

        <div className="add-action-row">
          {isEditing && <button className="cancel-button" type="button" onClick={() => requestLeave(`/recipe/${existingRecipe.id}`)}>Mégse</button>}
          <button className="save-button" type="button" onClick={saveRecipe} disabled={isProcessingImage}>
            {isProcessingImage ? "Kép feldolgozása…" : "💾 Recept mentése"}
          </button>
        </div>
      </div>

      {leavePath && (
        <div className="add-dialog-backdrop">
          <section className="add-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-dialog-title">
            <h2 id="unsaved-dialog-title">Nem mentett módosításaid vannak. Biztosan elhagyod az oldalt?</h2>
            <div className="add-dialog-actions">
              <button className="cancel-button" type="button" onClick={() => setLeavePath(null)}>Maradok</button>
              <button className="save-button" type="button" onClick={() => navigate(leavePath)}>Kilépés mentés nélkül</button>
            </div>
          </section>
        </div>
      )}

      <BottomNavigation onNavigate={handleBottomNavigation} />
    </div>
  );
}

export default AddRecipe;
