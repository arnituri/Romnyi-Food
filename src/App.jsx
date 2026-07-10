import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import Favorites from "./pages/Favorites";
import AddRecipe from "./pages/AddRecipe";
import Settings from "./pages/Settings";
import RecipeDetails from "./pages/RecipeDetails";

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/recipes" element={<Recipes />} />

      <Route path="/favorites" element={<Favorites />} />

      {/* Új recept */}
      <Route path="/add" element={<AddRecipe />} />

      {/* Recept szerkesztése */}
      <Route path="/edit/:id" element={<AddRecipe />} />

      <Route path="/settings" element={<Settings />} />

      <Route path="/recipe/:id" element={<RecipeDetails />} />
    </Routes>
  );
}

export default App;