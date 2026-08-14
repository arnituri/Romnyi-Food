import { deleteDB, openDB } from "idb";
import { SUPPORTED_IMAGE_TYPES } from "./imageService";

export const IMAGE_DATABASE_NAME = "romnyi-food-media";
export const IMAGE_DATABASE_VERSION = 1;
export const RECIPE_IMAGES_STORE = "recipe-images";
export const IMAGE_OPERATIONS_STORE = "image-operations";

let databasePromise = null;

export class ImageDatabaseError extends Error {
  constructor(code, cause) {
    super(code);
    this.name = "ImageDatabaseError";
    this.code = code;
    this.cause = cause;
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isBlob(value) {
  return typeof Blob !== "undefined" && value instanceof Blob;
}

function isValidTimestamp(value) {
  return isNonEmptyString(value) && Number.isFinite(Date.parse(value));
}

function createFallbackImageId() {
  const randomValues = new Uint32Array(2);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(randomValues);
    return `image-${Date.now().toString(36)}-${randomValues[0].toString(36)}${randomValues[1].toString(36)}`;
  }

  return `image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function generateImageId() {
  return `image-${globalThis.crypto?.randomUUID?.() || createFallbackImageId()}`;
}

export function generateImageOperationId() {
  return `operation-${globalThis.crypto?.randomUUID?.() || createFallbackImageId()}`;
}

export function validateImageRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    return { valid: false, code: "INVALID_IMAGE_RECORD" };
  }

  if (!isNonEmptyString(record.id)) {
    return { valid: false, code: "INVALID_IMAGE_ID" };
  }

  if (!isNonEmptyString(record.recipeId)) {
    return { valid: false, code: "INVALID_RECIPE_ID" };
  }

  if (!isBlob(record.blob)) {
    return { valid: false, code: "INVALID_IMAGE_BLOB" };
  }

  if (!SUPPORTED_IMAGE_TYPES.has(record.mimeType) || record.mimeType !== record.blob.type) {
    return { valid: false, code: "INVALID_IMAGE_TYPE" };
  }

  if (!Number.isFinite(record.byteSize) || record.byteSize < 0 || record.byteSize !== record.blob.size) {
    return { valid: false, code: "INVALID_IMAGE_SIZE" };
  }

  if (!isValidTimestamp(record.createdAt) || !isValidTimestamp(record.updatedAt)) {
    return { valid: false, code: "INVALID_IMAGE_TIMESTAMP" };
  }

  if (record.pendingOperationId !== null && !isNonEmptyString(record.pendingOperationId)) {
    return { valid: false, code: "INVALID_PENDING_OPERATION" };
  }

  return { valid: true };
}

function assertValidImageRecord(record) {
  const validation = validateImageRecord(record);

  if (!validation.valid) {
    throw new ImageDatabaseError(validation.code);
  }
}

function assertImageId(id) {
  if (!isNonEmptyString(id)) {
    throw new ImageDatabaseError("INVALID_IMAGE_ID");
  }
}

function toImageMetadata(record) {
  if (!record) return undefined;

  return Object.fromEntries(Object.entries(record).filter(([key]) => key !== "blob"));
}

async function runDatabaseOperation(operation, callback) {
  try {
    return await callback();
  } catch (error) {
    if (error instanceof ImageDatabaseError) throw error;
    throw new ImageDatabaseError(operation, error);
  }
}

export function openImageDatabase() {
  if (!databasePromise) {
    databasePromise = Promise.resolve()
      .then(() =>
        openDB(IMAGE_DATABASE_NAME, IMAGE_DATABASE_VERSION, {
          upgrade(database) {
            if (!database.objectStoreNames.contains(RECIPE_IMAGES_STORE)) {
              const imageStore = database.createObjectStore(RECIPE_IMAGES_STORE, { keyPath: "id" });
              imageStore.createIndex("by-recipe-id", "recipeId");
              imageStore.createIndex("by-pending-operation-id", "pendingOperationId");
            }

            if (!database.objectStoreNames.contains(IMAGE_OPERATIONS_STORE)) {
              database.createObjectStore(IMAGE_OPERATIONS_STORE, { keyPath: "id" });
            }
          },
        })
      )
      .catch((error) => {
        databasePromise = null;
        throw new ImageDatabaseError("IMAGE_DATABASE_OPEN_FAILED", error);
      });
  }

  return databasePromise;
}

export async function storeImage({
  id = generateImageId(),
  recipeId,
  blob,
  mimeType = blob?.type,
  byteSize = blob?.size,
  createdAt,
  updatedAt,
  pendingOperationId,
}) {
  return runDatabaseOperation("IMAGE_DATABASE_WRITE_FAILED", async () => {
    const database = await openImageDatabase();
    const existingRecord = await database.get(RECIPE_IMAGES_STORE, id);
    const now = new Date().toISOString();
    const imageRecord = {
      id,
      recipeId,
      blob,
      mimeType,
      byteSize,
      createdAt: createdAt ?? existingRecord?.createdAt ?? now,
      updatedAt: updatedAt ?? now,
      pendingOperationId:
        pendingOperationId ?? existingRecord?.pendingOperationId ?? null,
    };

    assertValidImageRecord(imageRecord);
    await database.put(RECIPE_IMAGES_STORE, imageRecord);
    return imageRecord;
  });
}

export async function getImage(id) {
  assertImageId(id);
  return runDatabaseOperation("IMAGE_DATABASE_READ_FAILED", async () => {
    const database = await openImageDatabase();
    return database.get(RECIPE_IMAGES_STORE, id);
  });
}

export async function getImageMetadata(id) {
  return toImageMetadata(await getImage(id));
}

export async function hasImage(id) {
  assertImageId(id);
  return runDatabaseOperation("IMAGE_DATABASE_READ_FAILED", async () => {
    const database = await openImageDatabase();
    return (await database.count(RECIPE_IMAGES_STORE, id)) > 0;
  });
}

export async function deleteImage(id) {
  assertImageId(id);
  return runDatabaseOperation("IMAGE_DATABASE_DELETE_FAILED", async () => {
    const database = await openImageDatabase();
    const imageExists = (await database.count(RECIPE_IMAGES_STORE, id)) > 0;

    if (!imageExists) return false;

    await database.delete(RECIPE_IMAGES_STORE, id);
    return true;
  });
}

export async function getImageIds() {
  return runDatabaseOperation("IMAGE_DATABASE_READ_FAILED", async () => {
    const database = await openImageDatabase();
    return database.getAllKeys(RECIPE_IMAGES_STORE);
  });
}

export async function storeImageOperation(operation) {
  if (!operation || !isNonEmptyString(operation.id) || !isNonEmptyString(operation.type)) {
    throw new ImageDatabaseError("INVALID_IMAGE_OPERATION");
  }

  return runDatabaseOperation("IMAGE_OPERATION_WRITE_FAILED", async () => {
    const database = await openImageDatabase();
    const createdAt = operation.createdAt ?? new Date().toISOString();
    const imageIds = Array.isArray(operation.imageIds) ? operation.imageIds : [];

    if (!isValidTimestamp(createdAt) || imageIds.some((id) => !isNonEmptyString(id))) {
      throw new ImageDatabaseError("INVALID_IMAGE_OPERATION");
    }

    const storedOperation = {
      ...operation,
      imageIds,
      createdAt,
      updatedAt: operation.updatedAt ?? new Date().toISOString(),
    };
    await database.put(IMAGE_OPERATIONS_STORE, storedOperation);
    return storedOperation;
  });
}

export async function getImageOperations() {
  return runDatabaseOperation("IMAGE_OPERATION_READ_FAILED", async () => {
    const database = await openImageDatabase();
    return database.getAll(IMAGE_OPERATIONS_STORE);
  });
}

export async function deleteImageOperation(id) {
  assertImageId(id);
  return runDatabaseOperation("IMAGE_OPERATION_DELETE_FAILED", async () => {
    const database = await openImageDatabase();
    await database.delete(IMAGE_OPERATIONS_STORE, id);
  });
}

export async function closeImageDatabase() {
  if (!databasePromise) return;

  const database = await databasePromise;
  database.close();
  databasePromise = null;
}

// Test-only helper. Production code must never reset the image database automatically.
export async function resetImageDatabaseForTests() {
  await closeImageDatabase();
  await deleteDB(IMAGE_DATABASE_NAME);
}
