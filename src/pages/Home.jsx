import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import QuickActions from "../components/QuickActions";
import DailyRecommendation from "../components/DailyRecommendation";
import Categories from "../components/Categories";
import { getRecipes } from "../services/recipeService";
import { useNotifications } from "../hooks/useNotifications";

import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();
  const notify = useNotifications();

  const handleRandomRecipe = () => {
    const recipes = getRecipes();

    if (recipes.length === 0) {
      notify.warning("Még nincs elmentett recept. Először adj hozzá egy újat!");
      return;
    }

    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    navigate(`/recipe/${randomRecipe.id}`);
  };

  const openFilteredRecipes = (filterName, filterValue) => {
    const searchParams = new URLSearchParams();

    if (filterValue) {
      searchParams.set(filterName, filterValue);
    }

    navigate(`/recipes${searchParams.size ? `?${searchParams}` : ""}`);
  };

  return (
    <Layout title="Romnyi Food">

      <div className="home-page">

        <SearchBar
          onSearchChange={(search) => openFilteredRecipes("search", search)}
        />

        <QuickActions onRandomClick={handleRandomRecipe} />

        <DailyRecommendation />

        <Categories
          onCategorySelect={(category) =>
            openFilteredRecipes("category", category)
          }
        />

      </div>

    </Layout>
  );
}

export default Home;
