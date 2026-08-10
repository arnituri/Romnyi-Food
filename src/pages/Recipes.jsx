import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useRecipes } from "../hooks/useRecipes";
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

  const recipes = useRecipes();
  const [searchParams, setSearchParams] = useSearchParams();
  const resultsRef = useRef(null);
  const shouldScrollToResultsRef = useRef(false);
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

  useEffect(() => {
    if (!shouldScrollToResultsRef.current) {
      return;
    }

    shouldScrollToResultsRef.current = false;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    resultsRef.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [category]);

  const updateFilter = (filterName, filterValue, options = {}) => {
    const { scrollToResults = false } = options;

    if (
      filterName === "category" &&
      scrollToResults &&
      filterValue !== category
    ) {
      shouldScrollToResultsRef.current = true;
    }

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
            onCategorySelect={(value) =>
              updateFilter("category", value, { scrollToResults: true })
            }
          />
        </div>

        <section className="recipe-results-section" ref={resultsRef}>
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
        </section>

      </div>

      <BottomNavigation />

    </div>
  );
}

export default Recipes;
