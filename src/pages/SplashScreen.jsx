import darkSplashImage from "../assets/romnyi-food-splash-dark.jpg";
import lightSplashImage from "../assets/romnyi-food-splash-light.jpg";
import { getTheme } from "../services/themeService";
import "../styles/SplashScreen.css";

function SplashScreen({ isExiting = false }) {
  const theme = getTheme();
  const splashImage = theme === "light" ? lightSplashImage : darkSplashImage;

  return (
    <div className={`splash splash-${theme}${isExiting ? " splash-exiting" : ""}`}>
      <img
        className="splash-artwork"
        src={splashImage}
        alt="Romnyi Food"
      />
    </div>
  );
}

export default SplashScreen;
