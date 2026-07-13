import "../styles/Categories.css";

function Categories({ selectedCategory = "", onCategorySelect }) {
  const categories = [
    {
      icon: "🍳",
      name: "Reggeli",
    },
    {
      icon: "🥪",
      name: "Tízórai",
    },
    {
      icon: "🥘",
      name: "Ebéd",
    },
    {
      icon: "☕",
      name: "Uzsonna",
    },
    {
      icon: "🍝",
      name: "Vacsora",
    },
    {
      icon: "🥗",
      name: "Saláta",
    },
    {
      icon: "🍰",
      name: "Desszert",
    },
    {
      icon: "🥤",
      name: "Ital",
    },
    {
      icon: "🥜",
      name: "Snack",
    },
  ];

  return (
    <section className="categories-section">

      <h2 className="categories-title">
        📂 Kategóriák
      </h2>

      <div className="categories-grid">

        {categories.map((category, index) => (
          <button
            key={index}
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
