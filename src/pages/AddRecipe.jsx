import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addRecipe,
  getRecipeById,
  updateRecipe,
} from "../services/recipeService";
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
    };

    reader.readAsDataURL(file);
  };

  const saveRecipe = () => {
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
              Kép kiválasztása
            </div>
          )}

          <input
            className="hidden-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

        </label>

        <input
          className="add-input"
          placeholder="🍽️ Recept neve"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="add-input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">🏷️ Válassz kategóriát</option>
          <option value="Reggeli">🍳 Reggeli</option>
          <option value="Ebéd">🥘 Ebéd</option>
          <option value="Vacsora">🍝 Vacsora</option>
          <option value="Saláta">🥗 Saláta</option>
          <option value="Desszert">🍰 Desszert</option>
          <option value="Ital">🥤 Ital</option>
          <option value="Snack">🥜 Snack</option>
        </select>

        <input
          className="add-input"
          type="number"
          min="0"
          step="any"
          placeholder="🔥 Kalória"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />

        <input
          className="add-input"
          type="number"
          min="0"
          step="any"
          placeholder="🥩 Fehérje (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />

        <input
          className="add-input"
          type="number"
          min="0"
          step="any"
          placeholder="🥑 Zsír (g)"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
        />

        <input
          className="add-input"
          type="number"
          min="0"
          step="any"
          placeholder="🍚 Szénhidrát (g)"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
        />

        <textarea
          className="add-textarea"
          rows="6"
          placeholder="🥕 Hozzávalók"
          value={ingredients}
          onChange={(e) => setIngredients(e.target.value)}
        />

        <textarea
          className="add-textarea"
          rows="8"
          placeholder="👨‍🍳 Elkészítés"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />

        <button
          className="save-button"
          onClick={saveRecipe}
        >
          💾 Recept mentése
        </button>

      </div>
      <BottomNavigation />
    </div>
  );
}

export default AddRecipe;
