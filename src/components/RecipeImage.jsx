import { useState } from "react";

function RecipeImage({ src, alt, decorative = false, className, fallbackClassName = "" }) {
  return (
    <RecipeImageContent
      key={src || "recipe-image-fallback"}
      src={src}
      alt={alt}
      decorative={decorative}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  );
}

function RecipeImageContent({ src, alt, decorative, className, fallbackClassName }) {
  const [hasFailed, setHasFailed] = useState(false);
  const isDecorative = decorative || alt === "";

  if (!src || hasFailed) {
    const fallbackClassNames = `${className} recipe-image-fallback ${fallbackClassName}`.trim();

    if (isDecorative) {
      return (
        <div className={fallbackClassNames} aria-hidden="true">
          <span aria-hidden="true">🍽️</span>
        </div>
      );
    }

    return (
      <div
        className={fallbackClassNames}
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
