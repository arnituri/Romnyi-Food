import { NavLink } from "react-router-dom";
import "../styles/BottomNavigation.css";

function BottomNavigation() {
  return (
    <nav className="bottom-nav">

      <NavLink
        to="/"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span>🏠</span>
        <small>Főoldal</small>
      </NavLink>

      <NavLink
        to="/recipes"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span>📖</span>
        <small>Receptek</small>
      </NavLink>

      <NavLink
        to="/add"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span>➕</span>
        <small>Új recept</small>
      </NavLink>

      <NavLink
        to="/favorites"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span>❤️</span>
        <small>Kedvencek</small>
      </NavLink>

      <NavLink
        to="/settings"
        className={({ isActive }) =>
          isActive ? "nav-item active" : "nav-item"
        }
      >
        <span>⚙️</span>
        <small>Beállítások</small>
      </NavLink>

    </nav>
  );
}

export default BottomNavigation;