import { NavLink } from "react-router-dom";
import "../styles/BottomNavigation.css";

const NAVIGATION_ITEMS = [
  { to: "/", icon: "🏠", label: "Főoldal" },
  { to: "/recipes", icon: "📖", label: "Receptek" },
  { to: "/add", icon: "➕", label: "Új recept" },
  { to: "/favorites", icon: "❤️", label: "Kedvencek" },
  { to: "/settings", icon: "⚙️", label: "Beállítások" },
];

function BottomNavigation({ onNavigate }) {
  return (
    <nav className="bottom-nav">
      {NAVIGATION_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
          onClick={(event) => {
            if (onNavigate?.(item.to)) event.preventDefault();
          }}
        >
          <span>{item.icon}</span>
          <small>{item.label}</small>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNavigation;
