function readWithFileReader(file) {
  if (typeof FileReader === "undefined") {
    return Promise.reject(new Error("FILE_READING_UNAVAILABLE"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error || new Error("FILE_READING_FAILED"));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("FILE_READING_FAILED"));
    };
    reader.readAsText(file);
  });
}

export async function readTextFile(file) {
  if (!file) {
    throw new Error("MISSING_FILE");
  }

  if (typeof file.text === "function") {
    try {
      return await file.text();
    } catch {
      // Some iOS Files providers expose File.text() but cannot complete the read.
    }
  }

  return readWithFileReader(file);
}
