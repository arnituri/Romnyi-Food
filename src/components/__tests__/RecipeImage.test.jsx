import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RecipeImage from "../RecipeImage";

const getImageMock = vi.fn();

vi.mock("../../services/imageDatabaseService", () => ({
  getImage: (...args) => getImageMock(...args),
}));

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeEach(() => {
  getImageMock.mockReset();
  URL.createObjectURL = vi.fn(() => "blob:romnyi-food-image");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
  vi.restoreAllMocks();
});

describe("RecipeImage", () => {
  it("keeps a legacy external image URL without reading IndexedDB", () => {
    render(<RecipeImage src="https://example.com/recipe.jpg" alt="Külső kép" />);

    expect(screen.getByRole("img", { name: "Külső kép" })).toHaveAttribute(
      "src",
      "https://example.com/recipe.jpg",
    );
    expect(getImageMock).not.toHaveBeenCalled();
  });

  it("keeps a legacy Data URL without reading IndexedDB", () => {
    const dataUrl = "data:image/jpeg;base64,aGVsbG8=";
    render(<RecipeImage src={dataUrl} alt="Legacy kép" />);

    expect(screen.getByRole("img", { name: "Legacy kép" })).toHaveAttribute("src", dataUrl);
    expect(getImageMock).not.toHaveBeenCalled();
  });

  it("uses the existing fallback when neither image source is available", () => {
    render(<RecipeImage src="" alt="Hiányzó kép" className="recipe-image" />);

    expect(screen.getByRole("img", { name: "Hiányzó kép" })).toHaveClass("recipe-image-fallback");
  });

  it("resolves a valid image ID from IndexedDB and creates an object URL", async () => {
    const blob = new Blob(["image"], { type: "image/webp" });
    getImageMock.mockResolvedValue({ id: "image-1", blob });

    render(<RecipeImage src="" imageId="image-1" alt="Tárolt kép" />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Tárolt kép" })).toHaveAttribute(
        "src",
        "blob:romnyi-food-image",
      );
    });
    expect(getImageMock).toHaveBeenCalledWith("image-1");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it("revokes a resolved object URL when the image unmounts", async () => {
    getImageMock.mockResolvedValue({ blob: new Blob(["image"], { type: "image/jpeg" }) });
    const { unmount } = render(<RecipeImage src="" imageId="image-1" alt="Tárolt kép" />);

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalledOnce();
    });
    unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:romnyi-food-image");
  });

  it("revokes the previous object URL when the image ID changes", async () => {
    URL.createObjectURL
      .mockReturnValueOnce("blob:first-image")
      .mockReturnValueOnce("blob:second-image");
    getImageMock.mockResolvedValue({ blob: new Blob(["image"], { type: "image/jpeg" }) });
    const { rerender } = render(<RecipeImage src="" imageId="image-1" alt="Tárolt kép" />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Tárolt kép" })).toHaveAttribute(
        "src",
        "blob:first-image",
      );
    });
    rerender(<RecipeImage src="" imageId="image-2" alt="Tárolt kép" />);

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:first-image");
      expect(screen.getByRole("img", { name: "Tárolt kép" })).toHaveAttribute(
        "src",
        "blob:second-image",
      );
    });
  });

  it("falls back to the legacy image when an IndexedDB image is missing", async () => {
    getImageMock.mockResolvedValue(undefined);

    render(
      <RecipeImage
        src="https://example.com/legacy.jpg"
        imageId="missing-image"
        alt="Legacy tartalék"
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Legacy tartalék" })).toHaveAttribute(
        "src",
        "https://example.com/legacy.jpg",
      );
    });
  });

  it("falls back safely when IndexedDB reading fails", async () => {
    getImageMock.mockRejectedValue(new Error("IndexedDB unavailable"));

    render(<RecipeImage src="" imageId="failed-image" alt="Hibás kép" className="recipe-image" />);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Hibás kép" })).toHaveClass("recipe-image-fallback");
    });
  });
});
