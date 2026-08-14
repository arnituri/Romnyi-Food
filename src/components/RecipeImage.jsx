import { useEffect, useState } from "react";
import { getImage } from "../services/imageDatabaseService";

function RecipeImage({
  src,
  imageId,
  alt,
  decorative = false,
  className,
  fallbackClassName = "",
}) {
  const [indexedDbSource, setIndexedDbSource] = useState(null);
  const resolvedSource =
    imageId && indexedDbSource?.imageId === imageId ? indexedDbSource.source : imageId ? null : src;

  useEffect(() => {
    let isCurrent = true;
    let objectUrl;
    let hasRevokedObjectUrl = false;

    const revokeObjectUrl = () => {
      if (
        objectUrl &&
        !hasRevokedObjectUrl &&
        typeof URL.revokeObjectURL === "function"
      ) {
        URL.revokeObjectURL(objectUrl);
        hasRevokedObjectUrl = true;
      }
    };

    if (!imageId) return undefined;

    getImage(imageId)
      .then((imageRecord) => {
        if (!imageRecord?.blob || typeof URL.createObjectURL !== "function") {
          return src;
        }

        objectUrl = URL.createObjectURL(imageRecord.blob);
        return objectUrl;
      })
      .catch(() => src)
      .then((nextSource) => {
        if (isCurrent) {
          setIndexedDbSource({ imageId, source: nextSource || null });
        } else if (objectUrl) {
          revokeObjectUrl();
        }
      });

    return () => {
      isCurrent = false;
      revokeObjectUrl();
    };
  }, [imageId, src]);

  return (
    <RecipeImageContent
      key={resolvedSource || "recipe-image-fallback"}
      src={resolvedSource}
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
