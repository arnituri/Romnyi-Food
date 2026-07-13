import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addRecipe,
  getRecipeById,
  updateRecipe,
} from "../services/recipeService";
import { optimizeRecipeImage } from "../services/imageService";
import BottomNavigation from "../components/BottomNavigation";
import "../styles/AddRecipe.css";

function AddRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const existingRecipe = isEditing ? getRecipeById(id) : null;
  const [name, setName] = useState(existingRecipe?.name || "");
  const [image, setImage] = useState(existingRecipe?.image || "");
  const [category, setCategory] = useState(existingRecipe?.category || "");
  const [calories, setCalories] = useState(String(existingRecipe?.calories ?? ""));
  const [protein, setProtein] = useState(String(existingRecipe?.protein ?? ""));
  const [fat, setFat] = useState(String(existingRecipe?.fat ?? ""));
  const [carbs, setCarbs] = useState(String(existingRecipe?.carbs ?? ""));
  const [ingredients, setIngredients] = useState(existingRecipe?.ingredients || "");
  const [instructions, setInstructions] = useState(existingRecipe?.instructions || "");
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const handleImageChange = async (event) => {
    const file = event.target.files[0];

    if (!file) return;

    setIsProcessingImage(true);

    try {
      setImage(await optimizeRecipeImage(file));
    } catch (error) {
      alert(`⚠️ ${error.message || "A kép feldolgozása nem sikerült."}`);
    } finally {
      setIsProcessingImage(false);
      event.target.value = "";
    }
  };

  const saveRecipe = () => {
    if (isProcessingImage) return;

    const recipe = {
      name,
      image,
      category,
      calories,
      protein,
      fat,
      carbs,
      ingredients,
      instructions,
    };

    const result = isEditing
      ? updateRecipe({ ...recipe, id: existingRecipe.id })
      : addRecipe(recipe);

    if (!result.success) {
      alert(`⚠️ ${result.message}`);
      return;
    }

    if (isEditing) {
      alert("✅ A recept sikeresen frissítve lett!");
      return;
    }

    alert("✅ Recept sikeresen elmentve!");
    setName("");
    setImage("");
    setCategory("");
    setCalories("");
    setProtein("");
    setFat("");
    setCarbs("");
    setIngredients("");
    setInstructions("");
  };

  if (isEditing && !existingRecipe) {
    return (
      <div className="add-page">
        <div className="add-container">
          <h1 className="add-title">A recept nem található.</h1>
          <button className="save-button" onClick={() => navigate("/recipes")}>
            Vissza a receptekhez
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="add-page">
      <div className="add-container">
        <h1 className="add-title">
          {isEditing ? "✏️ Recept szerkesztése" : "➕ Új recept"}
        </h1>

        <label className="image-upload">
          {image ? (
            <img src={image} alt="Recept előnézet" />
          ) : (
            <div>
              📷
              <br />
              {isProcessingImage ? "Kép feldolgozása…" : "Kép kiválasztása"}
            </div>
          )}

          <input
            className="hidden-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
        </label>

        <input className="add-input" placeholder="🍽️ Recept neve" value={name} onChange={(event) => setName(event.target.value)} />

        <select className="add-input" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">🏷️ Válassz kategóriát</option>
          <option value="Reggeli">🍳 Reggeli</option>
          <option value="Ebéd">🍲 Ebéd</option>
          <option value="Vacsora">🍽️ Vacsora</option>
          <option value="Saláta">🥗 Saláta</option>
          <option value="Desszert">🍰 Desszert</option>
          <option value="Ital">🥤 Ital</option>
          <option value="Snack">🍿 Snack</option>
        </select>

        <input className="add-input" type="number" min="0" step="any" placeholder="🔥 Kalória" value={calories} onChange={(event) => setCalories(event.target.value)} />
        <input className="add-input" type="number" min="0" step="any" placeholder="🥩 Fehérje (g)" value={protein} onChange={(event) => setProtein(event.target.value)} />
        <input className="add-input" type="number" min="0" step="any" placeholder="🥑 Zsír (g)" value={fat} onChange={(event) => setFat(event.target.value)} />
        <input className="add-input" type="number" min="0" step="any" placeholder="🍚 Szénhidrát (g)" value={carbs} onChange={(event) => setCarbs(event.target.value)} />

        <textarea className="add-textarea" rows="6" placeholder="🥕 Hozzávalók" value={ingredients} onChange={(event) => setIngredients(event.target.value)} />
        <textarea className="add-textarea" rows="8" placeholder="👨‍🍳 Elkészítés" value={instructions} onChange={(event) => setInstructions(event.target.value)} />

        <button className="save-button" onClick={saveRecipe} disabled={isProcessingImage}>
          {isProcessingImage ? "Kép feldolgozása…" : "💾 Recept mentése"}
        </button>
      </div>
      <BottomNavigation />
    </div>
  );
}

export default AddRecipe;
