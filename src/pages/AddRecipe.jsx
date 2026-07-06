import { useState } from "react";
import { addRecipe } from "../services/recipeService";

function AddRecipe() {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [calories, setCalories] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");

  const saveRecipe = () => {
    addRecipe({
      id: Date.now(),
      name,
      image,
      calories,
      ingredients,
      instructions,
    });

    alert("✅ Recept elmentve!");

    setName("");
    setImage("");
    setCalories("");
    setIngredients("");
    setInstructions("");
  };

  return (
    <div
      style={{
        background: "#1b1b1b",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
      }}
    >
      <h1>➕ Új recept</h1>

      <br />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];

          if (!file) return;

          const reader = new FileReader();

          reader.onload = () => {
            setImage(reader.result);
          };

          reader.readAsDataURL(file);
        }}
      />

      <br />
      <br />

      <input
        placeholder="Recept neve"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="Kalória"
        value={calories}
        onChange={(e) => setCalories(e.target.value)}
      />

      <br />
      <br />

      <textarea
        placeholder="Hozzávalók"
        rows="6"
        value={ingredients}
        onChange={(e) => setIngredients(e.target.value)}
      />

      <br />
      <br />

      <textarea
        placeholder="Elkészítés"
        rows="8"
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />

      <br />
      <br />

      <button onClick={saveRecipe}>
        💾 Recept mentése
      </button>
    </div>
  );
}

export default AddRecipe;