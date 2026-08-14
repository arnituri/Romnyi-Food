import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "fake-indexeddb/auto";
import { Blob as NodeBlob } from "node:buffer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationProvider } from "../../components/NotificationProvider";
import { createBackup } from "../../services/backupService";
import { getTestStorage } from "../../test/setup";
import { THEME_STORAGE_KEY } from "../../services/themeService";
import { resetImageDatabaseForTests } from "../../services/imageDatabaseService";
import Settings, { MAX_BACKUP_IMPORT_SIZE_BYTES } from "../Settings";

function renderSettings() {
  return render(
    <NotificationProvider>
      <MemoryRouter>
        <Settings />
      </MemoryRouter>
    </NotificationProvider>,
  );
}

const browserBlob = globalThis.Blob;

beforeEach(() => {
  globalThis.Blob = NodeBlob;
});

afterEach(async () => {
  await resetImageDatabaseForTests();
  globalThis.Blob = browserBlob;
});

describe("Settings theme persistence", () => {
  it("updates the visible theme only after successful persistence", () => {
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: /világos mód/i }));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByRole("button", { name: /sötét mód/i })).toBeInTheDocument();
  });

  it("restores the previous theme and shows an error when persistence fails", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "dark");
    getTestStorage().failOnWrite(1);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: /világos mód/i }));

    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByRole("button", { name: /világos mód/i })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "A téma mentése nem sikerült. Az előző beállítás maradt érvényben.",
    );
  });
});

async function createBackupFile(size, content) {
  const fileContent = content ?? JSON.stringify(await createBackup());
  const file = new File([fileContent], "mentes.json", {
    type: "",
  });
  Object.defineProperty(file, "size", { value: size });
  file.text = vi.fn().mockResolvedValue(fileContent);
  return file;
}

function importBackupFile(file) {
  const input = document.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });
}

describe("Settings backup import size limit", () => {
  it("does not use a native file-type filter that can disable iOS Files selections", () => {
    renderSettings();

    expect(document.querySelector('input[type="file"]')).not.toHaveAttribute("accept");
  });

  it("accepts a valid backup below the maximum size", async () => {
    renderSettings();

    const file = await createBackupFile(MAX_BACKUP_IMPORT_SIZE_BYTES - 1);
    importBackupFile(file);

    await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
    expect(file.text).toHaveBeenCalledOnce();
  });

  it("accepts a file exactly at the maximum size", async () => {
    renderSettings();

    const file = await createBackupFile(MAX_BACKUP_IMPORT_SIZE_BYTES);
    importBackupFile(file);

    await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
    expect(file.text).toHaveBeenCalledOnce();
  });

  it("rejects an oversized backup before it is read or changes stored data", async () => {
    const existingRecipes = JSON.stringify([{ id: "meglevo", name: "Meglévő recept" }]);
    localStorage.setItem("recipes", existingRecipes);
    renderSettings();

    const file = await createBackupFile(MAX_BACKUP_IMPORT_SIZE_BYTES + 1);
    importBackupFile(file);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "A kiválasztott biztonsági mentés túl nagy. A maximális engedélyezett fájlméret 10 MB.",
      );
    });
    expect(file.text).not.toHaveBeenCalled();
    expect(localStorage.getItem("recipes")).toBe(existingRecipes);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("rejects invalid JSON after selection", async () => {
    renderSettings();

    importBackupFile(await createBackupFile(24, "nem JSON"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "A kiválasztott fájl nem olvasható JSON biztonsági mentés.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a visible notification when restoring cannot be persisted", async () => {
    renderSettings();
    const backup = await createBackup();
    backup.data.recipes = [
      {
        id: "recipe-1",
        name: "Teszt recept",
        image: "",
        category: "Ebéd",
        calories: 450,
        protein: 25,
        fat: 12,
        carbs: 48,
        ingredients: "Hozzávaló",
        instructions: "Elkészítés",
        favorite: false,
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    ];
    getTestStorage().failOnWrite(1);

    importBackupFile(await createBackupFile(100, JSON.stringify(backup)));
    await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
    fireEvent.click(screen.getByRole("button", { name: "Visszaállítás" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A biztonsági mentés visszaállítása nem sikerült. A meglévő adataid változatlanok maradtak."
    );
  });

  it("restores an iOS backup after image data is moved out of localStorage", async () => {
    const originalCapacitor = globalThis.Capacitor;
    globalThis.Capacitor = { getPlatform: () => "ios" };
    const existingRecipes = JSON.stringify([{ id: "meglevo", name: "Meglévő recept" }]);
    localStorage.setItem("recipes", existingRecipes);
    renderSettings();
    const backup = await createBackup();
    backup.data.recipes = [
      {
        id: "recipe-1",
        name: "Teszt recept",
        image: "data:image/webp;base64,aGVsbG8=",
        category: "Ebéd",
        calories: 450,
        protein: 25,
        fat: 12,
        carbs: 48,
        ingredients: "Hozzávaló",
        instructions: "Elkészítés",
        favorite: false,
        createdAt: "2026-07-13T12:00:00.000Z",
      },
    ];

    try {
      importBackupFile(await createBackupFile(100, JSON.stringify(backup)));
      await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
      fireEvent.click(screen.getByRole("button", { name: "Visszaállítás" }));

      await waitFor(() => {
        const restoredRecipe = JSON.parse(localStorage.getItem("recipes"))[0];
        expect(restoredRecipe.image).toBe("");
        expect(restoredRecipe.imageId).toEqual(expect.any(String));
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } finally {
      globalThis.Capacitor = originalCapacitor;
    }
  });

  it("rejects a JSON file that is not a Romnyi Food backup", async () => {
    renderSettings();

    importBackupFile(await createBackupFile(2, "{}"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Ez a fájl nem érvényes Romnyi Food biztonsági mentés.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
