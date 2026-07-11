import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import "../styles/RecipeDetails.css";

function CheatDay() {
  return (
    <div className="details-page">
      <Header title="Csalónap" />

      <div className="details-container">
        <section className="section">
          <h2>🎡 Csalónap</h2>
          <p className="details-text">
            A szerencsekerék hamarosan elérhető lesz.
          </p>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default CheatDay;
