import { useState } from "react";
import { addRecipe } from "../services/recipeService";
import "../styles/AddRecipe.css";

function AddRecipe() {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [category, setCategory] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

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

    addRecipe({
      id: Date.now(),
      name,
      image,
      category,
      calories: Number(calories),
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbs: Number(carbs) || 0,
      ingredients,
      instructions,
      favorite: false,
      createdAt: new Date().toISOString(),
    });

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