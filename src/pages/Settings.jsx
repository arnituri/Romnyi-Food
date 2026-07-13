import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import BottomNavigation from "../components/BottomNavigation";
import {
  createBackup,
  downloadBackup,
  resetAppData,
  restoreBackup,
  validateBackup,
} from "../services/backupService";
import { applyTheme, getTheme } from "../services/themeService";
import "../styles/Settings.css";

function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef();
  const [theme, setTheme] = useState(getTheme());
  const [notice, setNotice] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const isDarkTheme = theme === "dark";

  const toggleTheme = () => {
    const nextTheme = isDarkTheme ? "light" : "dark";

    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleExport = () => {
    downloadBackup(createBackup());
    setNotice({ type: "success", text: "A biztonsági mentés elkészült." });
  };

  const handleImportFile = async (event) => {
    const [file] = event.target.files;

    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      const backup = JSON.parse(await file.text());

      if (!validateBackup(backup)) {
        setNotice({
          type: "error",
          text: "Ez a fájl nem érvényes Romnyi Food biztonsági mentés.",
        });
        return;
      }

      setPendingAction({ type: "restore", backup });
    } catch {
      setNotice({
        type: "error",
        text: "A kiválasztott fájl nem olvasható JSON biztonsági mentés.",
      });
    }
  };

  const confirmAction = () => {
    if (pendingAction?.type === "restore") {
      try {
        restoreBackup(pendingAction.backup);
        setTheme(getTheme());
        setPendingAction(null);
        navigate("/recipes", { replace: true });
      } catch {
        setPendingAction(null);
        setNotice({
          type: "error",
          text: "A biztonsági mentés visszaállítása nem sikerült. A meglévő adataid változatlanok maradtak.",
        });
      }
      return;
    }

    if (pendingAction?.type === "reset") {
      resetAppData();
      setTheme("dark");
      setPendingAction(null);
      navigate("/", { replace: true });
    }
  };

  const dialogContent =
    pendingAction?.type === "restore"
      ? {
          title: "Biztonsági mentés visszaállítása?",
          text: "A jelenlegi receptek, csalónap-adatok és téma-beállítás felülíródnak.",
          confirm: "Visszaállítás",
          danger: false,
        }
      : {
          title: "Biztosan törlöd az összes adatot?",
          text: "Minden helyben tárolt recept, kedvenc, csalónap-adat és téma-beállítás végleg törlődik.",
          confirm: "Összes adat törlése",
          danger: true,
        };

  return (
    <div className="settings-page">
      <Header title="Beállítások" />

      <main className="settings-container">
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
            <span>{isDarkTheme ? "Világos mód" : "Sötét mód"}</span>
            <span className="theme-switch-state">
              {isDarkTheme ? "Sötét" : "Világos"}
            </span>
          </button>
        </section>

        <section className="settings-card settings-card-spaced">
          <div>
            <p className="settings-eyebrow">BIZTONSÁGI MENTÉS</p>
            <h2>Adatok megőrzése</h2>
            <p className="settings-description">
              Mentsd el a receptjeidet, kedvenceidet, csalónap-adataidat és a kiválasztott témát.
            </p>
          </div>

          <div className="settings-action-list">
            <button className="settings-action" type="button" onClick={handleExport}>
              <span className="settings-action-icon">⇩</span>
              <span className="settings-action-copy">
                <strong>Biztonsági mentés exportálása</strong>
                <small>JSON fájl letöltése a jelenlegi adataiddal</small>
              </span>
              <span className="settings-action-arrow" aria-hidden="true">›</span>
            </button>

            <button
              className="settings-action"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="settings-action-icon">⇧</span>
              <span className="settings-action-copy">
                <strong>Biztonsági mentés visszaállítása</strong>
                <small>Korábban exportált Romnyi Food mentés betöltése</small>
              </span>
              <span className="settings-action-arrow" aria-hidden="true">›</span>
            </button>
            <input
              ref={fileInputRef}
              className="settings-file-input"
              type="file"
              accept="application/json,.json"
              onChange={handleImportFile}
            />
          </div>
        </section>

        <section className="settings-card settings-card-spaced">
          <div>
            <p className="settings-eyebrow">ALKALMAZÁS</p>
            <h2>Romnyi Food</h2>
          </div>
          <dl className="settings-info-list">
            <div className="settings-info-row">
              <dt>Alkalmazás</dt>
              <dd>Romnyi Food</dd>
            </div>
            <div className="settings-info-row">
              <dt>Verzió</dt>
              <dd>V1.0</dd>
            </div>
            <div className="settings-info-row">
              <dt>Adattárolás</dt>
              <dd>Helyi tárhely / offline</dd>
            </div>
          </dl>
        </section>

        <section className="settings-card settings-card-danger">
          <div>
            <p className="settings-eyebrow">VESZÉLYES MŰVELET</p>
            <h2>Alkalmazásadatok törlése</h2>
            <p className="settings-description">
              Ezzel minden helyben tárolt Romnyi Food adat végleg eltávolításra kerül.
            </p>
          </div>
          <button
            className="settings-danger-button"
            type="button"
            onClick={() => setPendingAction({ type: "reset" })}
          >
            Összes adat törlése
          </button>
        </section>

        {notice && (
          <p className={`settings-notice settings-notice-${notice.type}`} role="status">
            {notice.text}
          </p>
        )}
      </main>

      {pendingAction && (
        <div className="settings-dialog-backdrop">
          <section
            className="settings-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-dialog-title"
          >
            <h2 id="settings-dialog-title">{dialogContent.title}</h2>
            <p>{dialogContent.text}</p>
            <div className="settings-dialog-actions">
              <button
                className="settings-dialog-button"
                type="button"
                onClick={() => setPendingAction(null)}
              >
                Mégse
              </button>
              <button
                className={`settings-dialog-button settings-dialog-button-confirm${
                  dialogContent.danger ? " settings-dialog-button-danger" : ""
                }`}
                type="button"
                onClick={confirmAction}
              >
                {dialogContent.confirm}
              </button>
            </div>
          </section>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
}

export default Settings;
