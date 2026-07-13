export function readStorageValue(key) {
  try {
    return { success: true, value: localStorage.getItem(key) };
  } catch {
    return { success: false, value: null };
  }
}

export function setStorageValue(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function removeStorageValue(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function getStorageKeys() {
  try {
    return Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
      .filter((key) => typeof key === "string");
  } catch {
    return null;
  }
}

function restoreSnapshot(snapshot) {
  [...snapshot.entries()].reverse().forEach(([key, value]) => {
    if (value === null) {
      removeStorageValue(key);
    } else {
      setStorageValue(key, value);
    }
  });
}

// Each entry has a key and a string value, or null when the key must be removed.
// A failed write triggers a best-effort rollback of every previously changed key.
export function applyStorageTransaction(entries) {
  const keys = [...new Set(entries.map(({ key }) => key))];
  const snapshot = new Map();

  for (const key of keys) {
    const result = readStorageValue(key);
    if (!result.success) return false;
    snapshot.set(key, result.value);
  }

  for (const { key, value } of entries) {
    const didWrite = value === null
      ? removeStorageValue(key)
      : setStorageValue(key, value);

    if (!didWrite) {
      restoreSnapshot(snapshot);
      return false;
    }
  }

  return true;
}
