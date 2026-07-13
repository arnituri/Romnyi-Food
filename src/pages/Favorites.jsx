import { useRecipes } from "../hooks/useRecipes";
import RecipeCard from "../components/RecipeCard";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";

function Favorites() {

  const favorites = useRecipes().filter(recipe => recipe.favorite);

  return (

    <div className="details-page">

      <Header title="Kedvencek" />

      <div className="details-container">

        {favorites.length === 0 ? (

          <h2
            style={{
              color: "var(--text)",
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

      <BottomNavigation />

    </div>

  );

}

export default Favorites;
