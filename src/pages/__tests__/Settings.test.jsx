import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { NotificationProvider } from "../../components/NotificationProvider";
import { createBackup } from "../../services/backupService";
import { getTestStorage } from "../../test/setup";
import { THEME_STORAGE_KEY } from "../../services/themeService";
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

function createBackupFile(size, content = JSON.stringify(createBackup())) {
  const file = new File([content], "mentes.json", {
    type: "",
  });
  Object.defineProperty(file, "size", { value: size });
  file.text = vi.fn().mockResolvedValue(content);
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

    const file = createBackupFile(MAX_BACKUP_IMPORT_SIZE_BYTES - 1);
    importBackupFile(file);

    await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
    expect(file.text).toHaveBeenCalledOnce();
  });

  it("accepts a file exactly at the maximum size", async () => {
    renderSettings();

    const file = createBackupFile(MAX_BACKUP_IMPORT_SIZE_BYTES);
    importBackupFile(file);

    await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
    expect(file.text).toHaveBeenCalledOnce();
  });

  it("rejects an oversized backup before it is read or changes stored data", async () => {
    const existingRecipes = JSON.stringify([{ id: "meglevo", name: "Meglévő recept" }]);
    localStorage.setItem("recipes", existingRecipes);
    renderSettings();

    const file = createBackupFile(MAX_BACKUP_IMPORT_SIZE_BYTES + 1);
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

    importBackupFile(createBackupFile(24, "nem JSON"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "A kiválasztott fájl nem olvasható JSON biztonsági mentés.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows a visible notification when restoring cannot be persisted", async () => {
    renderSettings();
    const backup = createBackup();
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

    importBackupFile(createBackupFile(100, JSON.stringify(backup)));
    await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
    fireEvent.click(screen.getByRole("button", { name: "Visszaállítás" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "A biztonsági mentés visszaállítása nem sikerült. A meglévő adataid változatlanok maradtak."
    );
  });

  it("shows the specific iOS storage notification before an unsafe restore writes data", async () => {
    const originalCapacitor = globalThis.Capacitor;
    globalThis.Capacitor = { getPlatform: () => "ios" };
    const existingRecipes = JSON.stringify([{ id: "meglevo", name: "Meglévő recept" }]);
    localStorage.setItem("recipes", existingRecipes);
    renderSettings();
    const backup = createBackup();
    backup.data.recipes = [
      {
        id: "recipe-1",
        name: "Teszt recept",
        image: `data:image/webp;base64,${"a".repeat(5 * 1024 * 1024)}`,
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
      importBackupFile(createBackupFile(100, JSON.stringify(backup)));
      await screen.findByRole("dialog", { name: /biztonsági mentés visszaállítása/i });
      fireEvent.click(screen.getByRole("button", { name: "Visszaállítás" }));

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "A mentés képekkel együtt túl nagy az iPhone helyi tárhelyéhez. A jelenlegi adataid nem változtak."
      );
      expect(localStorage.getItem("recipes")).toBe(existingRecipes);
    } finally {
      globalThis.Capacitor = originalCapacitor;
    }
  });

  it("rejects a JSON file that is not a Romnyi Food backup", async () => {
    renderSettings();

    importBackupFile(createBackupFile(2, "{}"));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Ez a fájl nem érvényes Romnyi Food biztonsági mentés.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
