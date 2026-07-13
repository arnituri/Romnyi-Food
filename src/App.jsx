import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import SplashScreen from "./pages/SplashScreen";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import Favorites from "./pages/Favorites";
import AddRecipe from "./pages/AddRecipe";
import Settings from "./pages/Settings";
import RecipeDetails from "./pages/RecipeDetails";
import CheatDay from "./pages/CheatDay";
import Statistics from "./pages/Statistics";
import RecipeRecoveryNotice from "./components/RecipeRecoveryNotice";
import NotFound from "./pages/NotFound";

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
    <>
      <Routes>
        <Route path="/" element={<Home />} />

      <Route path="/recipes" element={<Recipes />} />

      <Route path="/favorites" element={<Favorites />} />

      {/* Új recept */}
      <Route path="/add" element={<AddRecipe />} />

      {/* Recept szerkesztése */}
      <Route path="/edit/:id" element={<AddRecipe />} />

      <Route path="/settings" element={<Settings />} />

      <Route path="/cheatday" element={<CheatDay />} />

      <Route path="/statistics" element={<Statistics />} />

        <Route path="/recipe/:id" element={<RecipeDetails />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <RecipeRecoveryNotice />
    </>
  );
}

export default App;
