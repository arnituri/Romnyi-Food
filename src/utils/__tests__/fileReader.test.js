import { describe, expect, it, vi } from "vitest";
import { readTextFile } from "../fileReader";

describe("readTextFile", () => {
  it("uses File.text when it is available", async () => {
    const file = { text: vi.fn().mockResolvedValue("backup") };

    await expect(readTextFile(file)).resolves.toBe("backup");
    expect(file.text).toHaveBeenCalledOnce();
  });

  it("falls back to FileReader when File.text is unavailable or fails", async () => {
    const originalFileReader = globalThis.FileReader;
    const readAsText = vi.fn();

    class TestFileReader {
      readAsText(file) {
        readAsText(file);
        this.result = "backup from FileReader";
        this.onload();
      }
    }

    globalThis.FileReader = TestFileReader;

    try {
      await expect(readTextFile({ text: vi.fn().mockRejectedValue(new Error("read failed")) })).resolves.toBe(
        "backup from FileReader"
      );
      expect(readAsText).toHaveBeenCalledOnce();
    } finally {
      globalThis.FileReader = originalFileReader;
    }
  });
});
