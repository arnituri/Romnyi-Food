import { useState } from "react";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import { applyTheme, getTheme } from "../services/themeService";
import "../styles/Settings.css";

function Settings() {
  const [theme, setTheme] = useState(getTheme());
  const isDarkTheme = theme === "dark";

  const toggleTheme = () => {
    const nextTheme = isDarkTheme ? "light" : "dark";
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return (
    <div className="settings-page">
      <Header title="Beállítások" />

      <div className="settings-container">
        <section className="settings-card">
          <div>
            <p className="settings-eyebrow">MEGJELENÉS</p>
            <h1>Fények és hangulat</h1>
            <p className="settings-description">
              Válaszd ki a Romnyi Food számodra kellemes megjelenését.
            </p>
          </div>

          <button
            className="theme-switch"
            type="button"
            onClick={toggleTheme}
            aria-pressed={!isDarkTheme}
          >
            <span className="theme-switch-icon">{isDarkTheme ? "☀️" : "🌙"}</span>
            <span>
              {isDarkTheme ? "Világos mód" : "Sötét mód"}
            </span>
            <span className="theme-switch-state">
              {isDarkTheme ? "Sötét" : "Világos"}
            </span>
          </button>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
}

export default Settings;
