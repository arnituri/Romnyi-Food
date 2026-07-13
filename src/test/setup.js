import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

let storage;

function createMemoryStorage() {
  const values = new Map();
  let writeCount = 0;
  let failingWriteNumber = null;

  return {
    get length() {
      return values.size;
    },
    getItem(key) {
      return values.has(String(key)) ? values.get(String(key)) : null;
    },
    setItem(key, value) {
      writeCount += 1;
      if (writeCount === failingWriteNumber) {
        throw new Error('Simulated storage write failure');
      }
      values.set(String(key), String(value));
    },
    removeItem(key) {
      writeCount += 1;
      if (writeCount === failingWriteNumber) {
        throw new Error('Simulated storage write failure');
      }
      values.delete(String(key));
    },
    clear() {
      values.clear();
    },
    key(index) {
      return [...values.keys()][index] ?? null;
    },
    failOnWrite(writeNumber) {
      failingWriteNumber = writeCount + writeNumber;
    },
  };
}

export function getTestStorage() {
  return storage;
}

export function makeRecipe(overrides = {}) {
  return {
    id: 'recipe-1',
    name: 'Teszt recept',
    image: '',
    category: 'Ebéd',
    calories: 450,
    protein: 25,
    fat: 12,
    carbs: 48,
    ingredients: 'Hozzávaló',
    instructions: 'Elkészítés',
    favorite: false,
    createdAt: '2026-07-13T12:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  storage = createMemoryStorage();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
