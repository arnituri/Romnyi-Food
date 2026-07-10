import "../styles/Categories.css";

function Categories() {
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
            className="category-card"
          >
            <span className="category-icon">
              {category.icon}
            </span>

            <span className="category-name">
              {category.name}
            </span>
          </button>
        ))}

      </div>

    </section>
  );
}

export default Categories;