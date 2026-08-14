import { beforeEach, describe, expect, it, vi } from "vitest";
import { getTestStorage, makeRecipe } from "../../test/setup";
import { getRecipeById, RECIPE_STORAGE_KEY } from "../recipeService";

const storeImageMock = vi.fn();
const deleteImageMock = vi.fn();
const generateImageIdMock = vi.fn();

vi.mock("../imageDatabaseService", () => ({
  storeImage: (...args) => storeImageMock(...args),
  deleteImage: (...args) => deleteImageMock(...args),
  generateImageId: () => generateImageIdMock(),
}));

const { deleteRecipeWithImage, saveRecipeWithImage } = await import(
  "../recipeImagePersistenceService"
);

function storeRecipes(recipes) {
  localStorage.setItem(RECIPE_STORAGE_KEY, JSON.stringify(recipes));
}

function createBlob() {
  return new Blob(["optimized image"], { type: "image/webp" });
}

beforeEach(() => {
  storeImageMock.mockReset();
  deleteImageMock.mockReset();
  generateImageIdMock.mockReset();
  storeImageMock.mockResolvedValue(undefined);
  deleteImageMock.mockResolvedValue(true);
  generateImageIdMock.mockReturnValue("image-new");
});

describe("recipe image persistence", () => {
  it("stores a newly uploaded Blob in IndexedDB and saves only its imageId in recipe metadata", async () => {
    const imageBlob = createBlob();
    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ id: undefined, image: "data:image/jpeg;base64,legacy-copy" }),
      imageBlob,
    });

    expect(result).toMatchObject({
      success: true,
      recipe: { image: "", imageId: "image-new" },
    });
    expect(storeImageMock).toHaveBeenCalledWith({
      id: "image-new",
      recipeId: String(result.recipe.id),
      blob: imageBlob,
    });
    expect(getRecipeById(result.recipe.id)).toMatchObject({ image: "", imageId: "image-new" });
  });

  it("cleans up a newly staged Blob when creating recipe metadata fails", async () => {
    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ id: undefined, name: "" }),
      imageBlob: createBlob(),
    });

    expect(result).toMatchObject({ success: false, error: "MISSING_NAME" });
    expect(deleteImageMock).toHaveBeenCalledWith("image-new");
    expect(getRecipeById("recipe-1")).toBeUndefined();
  });

  it("does not save recipe metadata when IndexedDB cannot store a new image", async () => {
    storeImageMock.mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ id: undefined }),
      imageBlob: createBlob(),
    });

    expect(result).toMatchObject({ success: false, error: "IMAGE_STORAGE_WRITE_FAILED" });
    expect(getRecipeById("recipe-1")).toBeUndefined();
    expect(deleteImageMock).not.toHaveBeenCalled();
  });

  it("preserves a legacy image when an edit does not change it", async () => {
    const existingRecipe = makeRecipe({ image: "data:image/jpeg;base64,legacy" });
    storeRecipes([existingRecipe]);

    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ name: "Frissített recept", image: existingRecipe.image }),
      existingRecipe,
    });

    expect(result).toMatchObject({ success: true, recipe: { image: existingRecipe.image } });
    expect(storeImageMock).not.toHaveBeenCalled();
    expect(deleteImageMock).not.toHaveBeenCalled();
  });

  it("replaces a legacy image with an IndexedDB image without deleting the legacy value", async () => {
    const existingRecipe = makeRecipe({ image: "https://example.com/legacy.jpg" });
    storeRecipes([existingRecipe]);

    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ image: existingRecipe.image }),
      existingRecipe,
      imageBlob: createBlob(),
    });

    expect(result).toMatchObject({ success: true, recipe: { image: "", imageId: "image-new" } });
    expect(deleteImageMock).not.toHaveBeenCalled();
  });

  it("keeps the old IndexedDB image when recipe metadata saving fails", async () => {
    const existingRecipe = makeRecipe({ image: "", imageId: "image-old" });
    storeRecipes([existingRecipe]);
    getTestStorage().failOnWrite(1);

    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ image: "" }),
      existingRecipe,
      imageBlob: createBlob(),
    });

    expect(result.success).toBe(false);
    expect(deleteImageMock).toHaveBeenCalledWith("image-new");
    expect(deleteImageMock).not.toHaveBeenCalledWith("image-old");
    expect(getRecipeById("recipe-1")).toMatchObject({ imageId: "image-old" });
  });

  it("deletes the previous IndexedDB image only after a successful replacement", async () => {
    const existingRecipe = makeRecipe({ image: "", imageId: "image-old" });
    storeRecipes([existingRecipe]);

    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ image: "" }),
      existingRecipe,
      imageBlob: createBlob(),
    });

    expect(result).toMatchObject({ success: true, recipe: { imageId: "image-new" } });
    expect(deleteImageMock).toHaveBeenCalledWith("image-old");
  });

  it("removes an existing IndexedDB image only after recipe metadata is updated", async () => {
    const existingRecipe = makeRecipe({ image: "", imageId: "image-old" });
    storeRecipes([existingRecipe]);

    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ image: "" }),
      existingRecipe,
      removeImage: true,
    });

    expect(result).toMatchObject({ success: true, recipe: { image: "" } });
    expect(result.recipe).not.toHaveProperty("imageId");
    expect(deleteImageMock).toHaveBeenCalledWith("image-old");
  });

  it("keeps a successful recipe save when old image cleanup fails", async () => {
    const existingRecipe = makeRecipe({ image: "", imageId: "image-old" });
    storeRecipes([existingRecipe]);
    deleteImageMock.mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    const result = await saveRecipeWithImage({
      recipe: makeRecipe({ image: "" }),
      existingRecipe,
      imageBlob: createBlob(),
    });

    expect(result).toMatchObject({ success: true, imageCleanupFailed: true });
    expect(getRecipeById("recipe-1")).toMatchObject({ imageId: "image-new" });
  });

  it("deletes IndexedDB media only after recipe deletion succeeds", async () => {
    const recipe = makeRecipe({ image: "", imageId: "image-old" });
    storeRecipes([recipe]);

    const result = await deleteRecipeWithImage(recipe);

    expect(result).toMatchObject({ success: true });
    expect(getRecipeById("recipe-1")).toBeUndefined();
    expect(deleteImageMock).toHaveBeenCalledWith("image-old");
  });

  it("does not restore deleted recipe metadata if IndexedDB deletion fails", async () => {
    const recipe = makeRecipe({ image: "", imageId: "image-old" });
    storeRecipes([recipe]);
    deleteImageMock.mockRejectedValueOnce(new Error("IndexedDB unavailable"));

    const result = await deleteRecipeWithImage(recipe);

    expect(result).toMatchObject({ success: true, imageCleanupFailed: true });
    expect(getRecipeById("recipe-1")).toBeUndefined();
  });
});
