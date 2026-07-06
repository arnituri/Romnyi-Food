import { Link } from "react-router-dom";

function Home() {
  return (
    <div
      style={{
        background: "#0b0b0b",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "20px",
      }}
    >
      <h1>👑 ROMNYI FOOD</h1>

      <Link to="/recipes">
        <button>📖 Receptek</button>
      </Link>

      <Link to="/favorites">
        <button>❤️ Kedvencek</button>
      </Link>

      <Link to="/add">
        <button>➕ Új recept</button>
      </Link>

      <Link to="/settings">
        <button>⚙️ Beállítások</button>
      </Link>
    </div>
  );
}

export default Home;