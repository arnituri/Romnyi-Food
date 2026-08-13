import { describe, expect, it } from "vitest";
import {
  getCompressedBlob,
  getResizedDimensions,
  IMAGE_COMPRESSION_STEPS,
  isWebpBlob,
} from "../imageService.js";

describe("recipe image optimization", () => {
  it("keeps the initial Android/desktop compression pass unchanged", () => {
    expect(IMAGE_COMPRESSION_STEPS[0]).toEqual({
      maxDimension: 1400,
      quality: 0.84,
    });
  });

  it("progressively reduces dimensions without changing aspect ratio", () => {
    expect(getResizedDimensions(4032, 3024, 1400)).toEqual({
      width: 1400,
      height: 1050,
    });
    expect(getResizedDimensions(4032, 3024, 640)).toEqual({
      width: 640,
      height: 480,
    });
  });

  it("uses JPEG when WebKit silently substitutes PNG for a WebP canvas request", async () => {
    const requestedTypes = [];
    const canvas = {
      toBlob(callback, type) {
        requestedTypes.push(type);
        callback(new Blob(["image"], {
          type: type === "image/webp" ? "image/png" : "image/jpeg",
        }));
      },
    };

    const output = await getCompressedBlob(canvas, 0.84);

    expect(requestedTypes).toEqual(["image/webp", "image/jpeg"]);
    expect(output.type).toBe("image/jpeg");
    expect(isWebpBlob(output)).toBe(false);
  });
});
