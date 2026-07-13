import { RECIPE_CATEGORIES } from "../constants/recipeCategories";
import "../styles/Categories.css";

function Categories({ selectedCategory = "", onCategorySelect }) {
  return (
    <section className="categories-section">

      <h2 className="categories-title">
        📂 Kategóriák
      </h2>

      <div className="categories-grid">

        {RECIPE_CATEGORIES.map((category) => (
          <button
            key={category.name}
            className={
              selectedCategory === category.name
                ? "category-card category-card-active"
                : "category-card"
            }
            onClick={() => onCategorySelect?.(category.name)}
          >
            <span className="category-icon">
              {category.icon}
            </span>

            <span className="category-name">
              {category.name}
            </span>
          </button>
        ))}

        <button
          className="category-card category-clear"
          onClick={() => onCategorySelect?.("")}
        >
          <span className="category-icon">✦</span>
          <span className="category-name">Összes recept</span>
        </button>

      </div>

    </section>
  );
}

export default Categories;
