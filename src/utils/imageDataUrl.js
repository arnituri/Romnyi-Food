import { SUPPORTED_IMAGE_TYPES } from "../services/imageService";

export class ImageDataUrlError extends Error {
  constructor(code) {
    super(code);
    this.name = "ImageDataUrlError";
    this.code = code;
  }
}

export function isImageDataUrl(value) {
  return typeof value === "string" && /^data:image\/[a-z0-9.+-]+(?:;base64)?,/i.test(value);
}

export function dataUrlToBlob(dataUrl) {
  if (!isImageDataUrl(dataUrl)) {
    throw new ImageDataUrlError("INVALID_IMAGE_DATA_URL");
  }

  const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/i.exec(dataUrl);
  const mimeType = match?.[1]?.toLowerCase();

  if (!mimeType || !SUPPORTED_IMAGE_TYPES.has(mimeType)) {
    throw new ImageDataUrlError("UNSUPPORTED_IMAGE_DATA_URL");
  }

  try {
    if (match[2]) {
      const binary = atob(match[3]);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      return new Blob([bytes], { type: mimeType });
    }

    return new Blob([decodeURIComponent(match[3])], { type: mimeType });
  } catch {
    throw new ImageDataUrlError("INVALID_IMAGE_DATA_URL");
  }
}

function blobToBase64DataUrl(blob) {
  return blob.arrayBuffer().then((buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);

    for (let index = 0; index < bytes.length; index += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
    }

    return `data:${blob.type};base64,${btoa(binary)}`;
  });
}

export function blobToDataUrl(blob) {
  if (!(blob instanceof Blob) || !SUPPORTED_IMAGE_TYPES.has(blob.type)) {
    return Promise.reject(new ImageDataUrlError("INVALID_IMAGE_BLOB"));
  }

  if (typeof FileReader === "undefined") {
    return blobToBase64DataUrl(blob).catch(() => {
      throw new ImageDataUrlError("IMAGE_DATA_URL_READ_FAILED");
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => {
      blobToBase64DataUrl(blob).then(resolve).catch(() => {
        reject(new ImageDataUrlError("IMAGE_DATA_URL_READ_FAILED"));
      });
    };
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new ImageDataUrlError("IMAGE_DATA_URL_READ_FAILED"));
    };
    try {
      reader.readAsDataURL(blob);
    } catch {
      blobToBase64DataUrl(blob).then(resolve).catch(() => {
        reject(new ImageDataUrlError("IMAGE_DATA_URL_READ_FAILED"));
      });
    }
  });
}
