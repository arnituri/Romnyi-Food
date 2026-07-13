import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

function Header({ title }) {
  const navigate = useNavigate();

  return (
    <header className="header">

      <button
        className="header-button"
        onClick={() => navigate("/")}
      >
        🏠 Főoldal
      </button>

      <h1 className="header-title">
        {title}
      </h1>

      <button
        className="header-button"
        aria-label="Beállítások megnyitása"
        onClick={() => navigate("/settings")}
      >
        ⚙️
      </button>

    </header>
  );
}

export default Header;
