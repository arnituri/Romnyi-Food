import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getRecipes } from "../services/recipeService";
import RecipeCard from "../components/RecipeCard";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import SearchBar from "../components/SearchBar";
import Categories from "../components/Categories";
import {
  getCanonicalRecipeCategory,
  normalizeSupportedRecipeCategory,
} from "../constants/recipeCategories";

function Recipes() {

  const [recipes] = useState(() => getRecipes());
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") || "";
  const category = normalizeSupportedRecipeCategory(searchParams.get("category")) || "";

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      .toLocaleLowerCase("hu-HU")
      .includes(search.toLocaleLowerCase("hu-HU"));
    const matchesCategory =
      !category || getCanonicalRecipeCategory(recipe.category) === category;

    return matchesSearch && matchesCategory;
  });

  const updateFilter = (filterName, filterValue) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (filterValue) {
      nextSearchParams.set(filterName, filterValue);
    } else {
      nextSearchParams.delete(filterName);
    }

    setSearchParams(nextSearchParams);
  };

  return (
    <div className="details-page">

      <Header title="Receptek" />

      <div className="details-container">

        <div className="recipe-filter-controls">
          <SearchBar
            value={search}
            onSearchChange={(value) => updateFilter("search", value)}
          />
          <Categories
            selectedCategory={category}
            onCategorySelect={(value) => updateFilter("category", value)}
          />
        </div>

        {recipes.length === 0 ? (

          <h2
            style={{
              color: "var(--text)",
              textAlign: "center",
              marginTop: "50px",
            }}
          >
            Még nincs recept.
          </h2>

        ) : filteredRecipes.length === 0 ? (

          <h2
            style={{
              color: "var(--text)",
              textAlign: "center",
              marginTop: "50px",
            }}
          >
            Nincs a keresésnek megfelelő recept.
          </h2>

        ) : (

          filteredRecipes.map((recipe) => (
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

export default Recipes;
