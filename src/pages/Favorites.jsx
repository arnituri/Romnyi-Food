import { useEffect, useState } from "react";
import { getRecipes } from "../services/recipeService";
import RecipeCard from "../components/RecipeCard";
import Header from "../components/Header";

function Favorites() {

  const [favorites, setFavorites] = useState([]);

  useEffect(() => {

    const recipes = getRecipes();

    setFavorites(
      recipes.filter(recipe => recipe.favorite)
    );

  }, []);

  return (

    <div className="details-page">

      <Header title="Kedvencek" />

      <div className="details-container">

        {favorites.length === 0 ? (

          <h2
            style={{
              color: "white",
              textAlign: "center",
              marginTop: "60px",
            }}
          >
            ❤️ Még nincs kedvenc recept.
          </h2>

        ) : (

          favorites.map(recipe => (

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

export default Favorites;