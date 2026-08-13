export const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const MAX_ORIGINAL_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1400;
export const MAX_PROCESSED_IMAGE_BYTES = 1200 * 1024;
const WEBP_QUALITY = 0.84;

// WKWebView can return a PNG Blob when WebP encoding is requested, and its
// resulting Blob can remain unexpectedly large for high-resolution iPhone photos.
// Keep the first pass unchanged for browsers that support WebP, then progressively
// reduce only when the encoded result still cannot be stored safely.
export const IMAGE_COMPRESSION_STEPS = Object.freeze([
  { maxDimension: MAX_IMAGE_DIMENSION, quality: WEBP_QUALITY },
  { maxDimension: 1200, quality: 0.8 },
  { maxDimension: 1000, quality: 0.76 },
  { maxDimension: 840, quality: 0.72 },
  { maxDimension: 720, quality: 0.68 },
  { maxDimension: 640, quality: 0.64 },
]);

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

export function getResizedDimensions(width, height, maxDimension = MAX_IMAGE_DIMENSION) {
  const longestSide = Math.max(width, height);

  if (longestSide <= maxDimension) {
    return { width, height };
  }

  const scale = maxDimension / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function isWebpBlob(blob) {
  return Boolean(blob && blob.type === "image/webp");
}

function createCanvas(source, maxDimension) {
  const { width, height } = getResizedDimensions(
    source.naturalWidth,
    source.naturalHeight,
    maxDimension,
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new ImageUploadError("A kép feldolgozása nem támogatott ebben a böngészőben.");
  }

  if ("imageSmoothingQuality" in context) {
    context.imageSmoothingQuality = "high";
  }

  // The browser's image decoder applies the displayed EXIF orientation before
  // drawing, including in iOS/WKWebView.
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

export async function getCompressedBlob(canvas, quality) {
  const webpOutput = await canvasToBlob(canvas, "image/webp", quality);

  // Safari/WebKit can silently fall back to PNG while reporting a non-null Blob.
  // Treat that as unsupported WebP and explicitly encode JPEG instead.
  if (isWebpBlob(webpOutput) && webpOutput.size <= MAX_PROCESSED_IMAGE_BYTES) {
    return webpOutput;
  }

  const jpegOutput = await canvasToBlob(canvas, "image/jpeg", quality);
  if (jpegOutput && jpegOutput.type === "image/jpeg") {
    return jpegOutput;
  }

  // A supported WebP result is still useful if JPEG encoding is unavailable;
  // the caller will retry it at a smaller size if it exceeds the limit.
  return isWebpBlob(webpOutput) ? webpOutput : null;
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
    for (const { maxDimension, quality } of IMAGE_COMPRESSION_STEPS) {
      const canvas = createCanvas(source, maxDimension);

      try {
        const output = await getCompressedBlob(canvas, quality);

        if (!output || output.size > MAX_PROCESSED_IMAGE_BYTES) {
          continue;
        }

        const imageDataUrl = await readBlobAsDataUrl(output);
        if (getDataUrlByteSize(imageDataUrl) <= MAX_PROCESSED_IMAGE_BYTES) {
          return imageDataUrl;
        }
      } finally {
        // Release each large backing store before trying the next pass on mobile.
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    throw new ImageUploadError(
      "A feldolgozott kép még mindig túl nagy a biztonságos mentéshez. Válassz kisebb képet."
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
