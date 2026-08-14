import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  closeImageDatabase,
  deleteImage,
  generateImageId,
  getImage,
  getImageMetadata,
  hasImage,
  IMAGE_DATABASE_NAME,
  IMAGE_DATABASE_VERSION,
  IMAGE_OPERATIONS_STORE,
  ImageDatabaseError,
  openImageDatabase,
  RECIPE_IMAGES_STORE,
  resetImageDatabaseForTests,
  storeImage,
  validateImageRecord,
} from "../imageDatabaseService";

function createImageInput(overrides = {}) {
  const blob = overrides.blob || new Blob(["recipe image"], { type: "image/webp" });

  return {
    id: "image-test-1",
    recipeId: "recipe-test-1",
    blob,
    mimeType: blob.type,
    byteSize: blob.size,
    createdAt: "2026-08-13T10:00:00.000Z",
    updatedAt: "2026-08-13T10:00:00.000Z",
    pendingOperationId: null,
    ...overrides,
  };
}

const browserBlob = globalThis.Blob;

beforeEach(() => {
  // fake-indexeddb uses Node's structured clone implementation, which preserves
  // Node Blobs while JSDOM's Blob is not cloneable in this test environment.
  globalThis.Blob = NodeBlob;
});

afterEach(async () => {
  await resetImageDatabaseForTests();
  globalThis.Blob = browserBlob;
  vi.restoreAllMocks();
});

describe("imageDatabaseService", () => {
  it("initializes the planned database and object stores", async () => {
    const database = await openImageDatabase();

    expect(database.name).toBe(IMAGE_DATABASE_NAME);
    expect(database.version).toBe(IMAGE_DATABASE_VERSION);
    expect([...database.objectStoreNames]).toEqual(
      expect.arrayContaining([RECIPE_IMAGES_STORE, IMAGE_OPERATIONS_STORE]),
    );
  });

  it("stores and retrieves a Blob while preserving its metadata", async () => {
    const input = createImageInput({ pendingOperationId: "operation-1" });
    const stored = await storeImage(input);
    const retrieved = await getImage(input.id);

    expect(stored).toMatchObject({
      id: input.id,
      recipeId: input.recipeId,
      mimeType: "image/webp",
      byteSize: input.blob.size,
      pendingOperationId: "operation-1",
    });
    expect(retrieved).toMatchObject({
      id: input.id,
      recipeId: input.recipeId,
      mimeType: "image/webp",
      byteSize: input.blob.size,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      pendingOperationId: "operation-1",
    });
    expect(retrieved.blob).toBeInstanceOf(Blob);
    expect(retrieved.blob.type).toBe("image/webp");
    expect(retrieved.blob.size).toBe(input.blob.size);
  });

  it("returns metadata without exposing the Blob payload", async () => {
    const input = createImageInput();
    await storeImage(input);

    await expect(getImageMetadata(input.id)).resolves.toEqual({
      id: input.id,
      recipeId: input.recipeId,
      mimeType: input.mimeType,
      byteSize: input.byteSize,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
      pendingOperationId: null,
    });
  });

  it("updates an image record with the same ID while retaining its original creation date", async () => {
    const original = createImageInput();
    const replacementBlob = new Blob(["replacement image"], { type: "image/jpeg" });
    await storeImage(original);

    const updated = await storeImage({
      id: original.id,
      recipeId: original.recipeId,
      blob: replacementBlob,
      updatedAt: "2026-08-13T11:00:00.000Z",
    });

    expect(updated).toMatchObject({
      id: original.id,
      createdAt: original.createdAt,
      updatedAt: "2026-08-13T11:00:00.000Z",
      mimeType: "image/jpeg",
      byteSize: replacementBlob.size,
    });
    expect((await getImage(original.id)).blob.type).toBe("image/jpeg");
  });

  it("reports missing images and deletes existing images safely", async () => {
    const input = createImageInput();

    await expect(getImage("missing-image")).resolves.toBeUndefined();
    await expect(hasImage("missing-image")).resolves.toBe(false);
    await expect(deleteImage("missing-image")).resolves.toBe(false);

    await storeImage(input);
    await expect(hasImage(input.id)).resolves.toBe(true);
    await expect(deleteImage(input.id)).resolves.toBe(true);
    await expect(hasImage(input.id)).resolves.toBe(false);
  });

  it("rejects invalid image records before writing", async () => {
    const invalidType = createImageInput({ mimeType: "image/gif" });
    const invalidSize = createImageInput({ byteSize: 1 });
    const missingRecipeId = createImageInput({ recipeId: "" });

    expect(validateImageRecord(invalidType)).toMatchObject({ valid: false, code: "INVALID_IMAGE_TYPE" });
    expect(validateImageRecord(invalidSize)).toMatchObject({ valid: false, code: "INVALID_IMAGE_SIZE" });
    await expect(storeImage(missingRecipeId)).rejects.toMatchObject({
      name: "ImageDatabaseError",
      code: "INVALID_RECIPE_ID",
    });
  });

  it("generates stable unique image IDs", () => {
    expect(generateImageId()).toMatch(/^image-/);
    expect(generateImageId()).not.toBe(generateImageId());
  });

  it("wraps IndexedDB opening failures in a predictable error", async () => {
    const originalOpen = globalThis.indexedDB.open;
    globalThis.indexedDB.open = () => {
      throw new Error("IndexedDB unavailable");
    };

    try {
      await expect(openImageDatabase()).rejects.toBeInstanceOf(ImageDatabaseError);
      await expect(openImageDatabase()).rejects.toMatchObject({ code: "IMAGE_DATABASE_OPEN_FAILED" });
    } finally {
      globalThis.indexedDB.open = originalOpen;
    }
  });

  it("persists records when the database is closed and reopened", async () => {
    const input = createImageInput();
    await storeImage(input);
    await closeImageDatabase();

    await expect(getImage(input.id)).resolves.toMatchObject({
      id: input.id,
      recipeId: input.recipeId,
    });
  });
});
