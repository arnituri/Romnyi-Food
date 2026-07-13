export const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_ORIGINAL_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1400;
export const MAX_PROCESSED_IMAGE_BYTES = 1200 * 1024;
const WEBP_QUALITY = 0.84;

export class ImageUploadError extends Error {
  constructor(message) {
    super(message);
    this.name = "ImageUploadError";
  }
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageUploadError("A kép beolvasása nem sikerült."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new ImageUploadError("A kiválasztott kép nem olvasható."));
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function getResizedDimensions(width, height) {
  const longestSide = Math.max(width, height);

  if (longestSide <= MAX_IMAGE_DIMENSION) {
    return { width, height };
  }

  const scale = MAX_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function getDataUrlByteSize(dataUrl) {
  if (typeof dataUrl !== "string") return 0;

  const commaIndex = dataUrl.indexOf(",");
  const base64 = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
  return Math.ceil((base64.length * 3) / 4);
}

export async function optimizeRecipeImage(file) {
  if (typeof File === "undefined" || !(file instanceof File)) {
    throw new ImageUploadError("Nem sikerült képfájlt kiválasztani.");
  }

  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new ImageUploadError("Csak JPEG, PNG vagy WebP formátumú képet tölthetsz fel.");
  }

  if (file.size > MAX_ORIGINAL_IMAGE_BYTES) {
    throw new ImageUploadError("A kép túl nagy. Legfeljebb 8 MB-os képet válassz.");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const source = await loadImage(objectUrl);
    if (!source.naturalWidth || !source.naturalHeight) {
      throw new ImageUploadError("A kiválasztott kép nem tartalmaz érvényes méreteket.");
    }
    const { width, height } = getResizedDimensions(source.naturalWidth, source.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new ImageUploadError("A kép feldolgozása nem támogatott ebben a böngészőben.");
    }

    context.drawImage(source, 0, 0, width, height);
    let output = await canvasToBlob(canvas, "image/webp", WEBP_QUALITY);

    if (!output) {
      output = await canvasToBlob(canvas, "image/jpeg", WEBP_QUALITY);
    }

    if (!output) {
      throw new ImageUploadError("A kép tömörítése nem sikerült.");
    }

    const imageDataUrl = await readBlobAsDataUrl(output);

    if (getDataUrlByteSize(imageDataUrl) > MAX_PROCESSED_IMAGE_BYTES) {
      throw new ImageUploadError(
        "A feldolgozott kép még mindig túl nagy a biztonságos mentéshez. Válassz kisebb képet."
      );
    }

    return imageDataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
