import { useState } from "react";

function RecipeImage({ src, alt, className, fallbackClassName = "" }) {
  return (
    <RecipeImageContent
      key={src || "recipe-image-fallback"}
      src={src}
      alt={alt}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  );
}

function RecipeImageContent({ src, alt, className, fallbackClassName }) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!src || hasFailed) {
    return (
      <div
        className={`${className} recipe-image-fallback ${fallbackClassName}`.trim()}
        role="img"
        aria-label={alt || "Receptkép nem érhető el"}
      >
        <span aria-hidden="true">🍽️</span>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} onError={() => setHasFailed(true)} />;
}

export default RecipeImage;
