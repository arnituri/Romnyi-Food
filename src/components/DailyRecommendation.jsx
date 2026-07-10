import "../styles/DailyRecommendation.css";

function DailyRecommendation() {
  return (
    <section className="daily-section">

      <h2 className="daily-title">
        ⭐ Mai ajánlat
      </h2>

      <div className="daily-card">

        <div className="daily-image">
          🍽️
        </div>

        <div className="daily-content">

          <h3>
            Ma még nincs kiválasztott recept
          </h3>

          <p>
            Hamarosan itt fog megjelenni a napi ajánlott recept.
          </p>

          <button className="daily-button">
            Megnézem
          </button>

        </div>

      </div>

    </section>
  );
}

export default DailyRecommendation;