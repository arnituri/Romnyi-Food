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

function createBackupFile(size) {
  const file = new File([JSON.stringify(createBackup())], "mentes.json", {
    type: "application/json",
  });
  Object.defineProperty(file, "size", { value: size });
  file.text = vi.fn().mockResolvedValue(JSON.stringify(createBackup()));
  return file;
}

function importBackupFile(file) {
  const input = document.querySelector('input[type="file"]');
  fireEvent.change(input, { target: { files: [file] } });
}

describe("Settings backup import size limit", () => {
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
});
