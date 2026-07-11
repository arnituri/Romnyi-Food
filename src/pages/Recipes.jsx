import { useState } from "react";
import { getRecipes } from "../services/recipeService";
import RecipeCard from "../components/RecipeCard";
import Header from "../components/Header";

function Recipes() {

  const [recipes] = useState(() => getRecipes());

  return (
    <div className="details-page">

      <Header title="Receptek" />

      <div className="details-container">

        {recipes.length === 0 ? (

          <h2
            style={{
              color: "white",
              textAlign: "center",
              marginTop: "50px",
            }}
          >
            Még nincs recept.
          </h2>

        ) : (

          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
            />
          ))

        )}

      </div>

    </div>
  );
}

export default Recipes;
