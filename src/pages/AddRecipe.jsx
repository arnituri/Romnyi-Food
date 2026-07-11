import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addRecipe,
  getRecipeById,
  updateRecipe,
} from "../services/recipeService";
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
    if (
      !name.trim() ||
      !category ||
      !calories ||
      !ingredients.trim() ||
      !instructions.trim()
    ) {
      alert("⚠️ Kérlek tölts ki minden kötelező mezőt!");
      return;
    }

    const recipe = {
      ...existingRecipe,
      id: existingRecipe?.id ?? Date.now(),
      name,
      image,
      category,
      calories: Number(calories),
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      ingredients,
      instructions,
      favorite: existingRecipe?.favorite ?? false,
      createdAt: existingRecipe?.createdAt ?? new Date().toISOString(),
    };

    if (isEditing) {
      updateRecipe(recipe);
      alert("Recipe updated successfully!");
      return;
    }

    addRecipe(recipe);

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
          <h1 className="add-title">Recipe not found.</h1>
          <button className="save-button" onClick={() => navigate("/recipes")}>
            Back to recipes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="add-page">
      <div className="add-container">

        <h1 className="add-title">
          ➕ Új recept
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
          placeholder="🔥 Kalória"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />

        <input
          className="add-input"
          type="number"
          placeholder="🥩 Fehérje (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
        />

        <input
          className="add-input"
          type="number"
          placeholder="🥑 Zsír (g)"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
        />

        <input
          className="add-input"
          type="number"
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
    </div>
  );
}

export default AddRecipe;
