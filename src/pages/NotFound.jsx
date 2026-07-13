import { Link } from "react-router-dom";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import "../styles/NotFound.css";

function NotFound() {
  return (
    <div className="not-found-page">
      <Header title="Romnyi Food" />

      <main className="not-found-container">
        <section className="not-found-card">
          <span className="not-found-code">404</span>
          <p className="not-found-eyebrow">ELTÉVEDT OLDAL</p>
          <h1>Az oldal nem található</h1>
          <p>
            A keresett oldal nem létezik vagy áthelyezték. Térj vissza a
            receptjeidhez, és folytasd ott, ahol abbahagytad.
          </p>

          <div className="not-found-actions">
            <Link className="not-found-button not-found-button-primary" to="/">
              Főoldal
            </Link>
            <Link className="not-found-button" to="/recipes">
              Receptek
            </Link>
          </div>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}

export default NotFound;
