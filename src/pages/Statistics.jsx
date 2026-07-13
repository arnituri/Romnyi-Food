import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { getRecipes } from "../services/recipeService";
import { getRecentRecipes } from "../utils/recentRecipes";
import "../styles/Statistics.css";

const NUTRIENTS = [
  { key: "calories", label: "Átlag kalória", unit: "kcal", icon: "🔥" },
  { key: "protein", label: "Átlag fehérje", unit: "g", icon: "🥩" },
  { key: "fat", label: "Átlag zsír", unit: "g", icon: "🥑" },
  { key: "carbs", label: "Átlag szénhidrát", unit: "g", icon: "🍚" },
];

function getValidNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function getAverage(recipes, key) {
  const values = recipes
    .map((recipe) => getValidNumber(recipe[key]))
    .filter((value) => value !== null);

  if (values.length === 0) {
    return null;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function Statistics() {
  const recipes = getRecipes();
  const favoriteCount = recipes.filter((recipe) => recipe.favorite).length;
  const categoryCounts = recipes.reduce((counts, recipe) => {
    const category = recipe.category?.trim() || "Egyéb";

    counts[category] = (counts[category] || 0) + 1;
    return counts;
  }, {});
  const categories = Object.entries(categoryCounts).sort(
    ([firstCategory, firstCount], [secondCategory, secondCount]) =>
      secondCount - firstCount || firstCategory.localeCompare(secondCategory, "hu")
  );
  const topCategory = categories[0] || null;
  const recentRecipes = getRecentRecipes(recipes);

  return (
    <div className="statistics-page">
      <Header title="Statisztika" />

      <main className="statistics-container">
        <section className="statistics-intro">
          <p className="statistics-eyebrow">RECEPTTÁRAD ÁTTEKINTÉSE</p>
          <h1>Ízek, számok, kedvencek</h1>
          <p>Az összesített adatok a jelenleg elmentett receptjeidből készülnek.</p>
        </section>

        {recipes.length === 0 ? (
          <section className="statistics-empty-state">
            <span>📊</span>
            <h2>Még nincs mit összesíteni.</h2>
            <p>Adj hozzá néhány receptet, és itt rögtön megjelennek a statisztikáid.</p>
          </section>
        ) : (
          <>
            <section className="statistics-summary-grid" aria-label="Összesített statisztikák">
              <article className="statistics-card">
                <span className="statistics-card-icon">📖</span>
                <span className="statistics-card-label">Összes recept</span>
                <strong>{recipes.length}</strong>
              </article>
              <article className="statistics-card">
                <span className="statistics-card-icon">❤️</span>
                <span className="statistics-card-label">Kedvenc recept</span>
                <strong>{favoriteCount}</strong>
              </article>
              <article className="statistics-card statistics-card-wide">
                <span className="statistics-card-icon">🏆</span>
                <span className="statistics-card-label">Legnépszerűbb kategória</span>
                <strong>{topCategory ? topCategory[0] : "—"}</strong>
                {topCategory && <small>{topCategory[1]} recept</small>}
              </article>
            </section>

            <section className="statistics-section">
              <div className="statistics-section-heading">
                <p className="statistics-eyebrow">TÁPÉRTÉK</p>
                <h2>Átlagos értékek receptenként</h2>
              </div>

              <div className="nutrition-grid">
                {NUTRIENTS.map((nutrient) => {
                  const average = getAverage(recipes, nutrient.key);

                  return (
                    <article className="nutrition-card" key={nutrient.key}>
                      <span>{nutrient.icon}</span>
                      <p>{nutrient.label}</p>
                      <strong>
                        {average === null ? "—" : `${Math.round(average)} ${nutrient.unit}`}
                      </strong>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="statistics-section category-distribution">
              <div className="statistics-section-heading">
                <p className="statistics-eyebrow">KATEGÓRIÁK</p>
                <h2>Receptjeid eloszlása</h2>
              </div>

              <div className="category-stat-list">
                {categories.map(([category, count]) => (
                  <div className="category-stat-row" key={category}>
                    <div className="category-stat-meta">
                      <span>{category}</span>
                      <strong>{count} recept</strong>
                    </div>
                    <div className="category-stat-track">
                      <span style={{ width: `${(count / recipes.length) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {recentRecipes.length > 0 && (
              <section className="statistics-section">
                <div className="statistics-section-heading">
                  <p className="statistics-eyebrow">LEGÚJABBAK</p>
                  <h2>Nemrég hozzáadott receptek</h2>
                </div>

                <div className="recent-recipe-list">
                  {recentRecipes.map((recipe) => (
                    <article className="recent-recipe" key={recipe.id}>
                      <div>
                        <h3>{recipe.name || "Névtelen recept"}</h3>
                        <p>{recipe.category || "Kategória nélkül"}</p>
                      </div>
                      <time dateTime={recipe.createdDate.toISOString()}>
                        {formatDate(recipe.createdDate)}
                      </time>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}

export default Statistics;
