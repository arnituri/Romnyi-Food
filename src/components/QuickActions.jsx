import "../styles/QuickActions.css";
import { useNavigate } from "react-router-dom";

function QuickActions({ onRandomClick }) {
  const navigate = useNavigate();
  const actions = [
    {
      id: "random",
      icon: "🍽️",
      title: "Mit főzzünk ma?",
      subtitle: "Véletlen recept",
    },
    {
      id: "recipes",
      icon: "📖",
      title: "Receptek",
      subtitle: "Összes recept",
      path: "/recipes",
    },
    {
      id: "favorites",
      icon: "❤️",
      title: "Kedvencek",
      subtitle: "Kedvenc receptjeid",
      path: "/favorites",
    },
    {
      id: "add",
      icon: "➕",
      title: "Új recept",
      subtitle: "Recept hozzáadása",
      path: "/add",
    },
    {
      id: "statistics",
      icon: "📊",
      title: "Statisztika",
      subtitle: "Áttekintés",
      path: "/statistics",
    },
    {
      id: "cheatday",
      icon: "🎡",
      title: "Csalónap",
      subtitle: "Szerencsekerék",
      path: "/cheatday",
    },
  ];

  return (
    <section className="quick-actions">
      <h2 className="quick-title">
        Gyors műveletek
      </h2>

      <div className="quick-grid">

        {actions.map((action) => (

          <button
            key={action.id}
            className="quick-card"
            onClick={() => {

              if (action.id === "random") {
                onRandomClick();
                return;
              }

              navigate(action.path);

            }}
          >

            <div className="quick-icon">
              {action.icon}
            </div>

            <h3>{action.title}</h3>

            <p>{action.subtitle}</p>

          </button>

        ))}

      </div>

    </section>
  );
}

export default QuickActions;
