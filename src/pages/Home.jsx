import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import SearchBar from "../components/SearchBar";
import QuickActions from "../components/QuickActions";
import DailyRecommendation from "../components/DailyRecommendation";
import Categories from "../components/Categories";
import { getRecipes } from "../services/recipeService";

import "../styles/Home.css";

function Home() {
  const navigate = useNavigate();

  const handleRandomRecipe = () => {
    const recipes = getRecipes();

    if (recipes.length === 0) {
      alert("Még nincs elmentett recept. Először adj hozzá egy újat!");
      return;
    }

    const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
    navigate(`/recipe/${randomRecipe.id}`);
  };

  return (
    <Layout title="Romnyi Food">

      <div className="home-page">

        <SearchBar />

        <QuickActions onRandomClick={handleRandomRecipe} />

        <DailyRecommendation />

        <Categories />

      </div>

    </Layout>
  );
}

export default Home;
