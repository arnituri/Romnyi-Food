import { useEffect, useState } from "react";
import { consumeRecipeRecoveryNotice } from "../services/recipeService";
import "../styles/RecipeRecoveryNotice.css";

const RECOVERY_EVENT = "romnyi-food-recipes-recovered";

function RecipeRecoveryNotice() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showNotice = () => setIsVisible(true);

    if (consumeRecipeRecoveryNotice()) {
      showNotice();
    }

    window.addEventListener(RECOVERY_EVENT, showNotice);

    return () => window.removeEventListener(RECOVERY_EVENT, showNotice);
  }, []);

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const timer = window.setTimeout(() => setIsVisible(false), 8000);

    return () => window.clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="recipe-recovery-notice" role="status">
      A mentett receptadatok sérültek voltak, ezért az alkalmazás biztonságos
      helyreállítást végzett.
    </div>
  );
}

export default RecipeRecoveryNotice;
