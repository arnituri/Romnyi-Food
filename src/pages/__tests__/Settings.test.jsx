import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NotificationProvider } from "../../components/NotificationProvider";
import { getTestStorage } from "../../test/setup";
import { THEME_STORAGE_KEY } from "../../services/themeService";
import Settings from "../Settings";

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
