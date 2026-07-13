import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { makeRecipe } from "../../test/setup";
import RecipeCard from "../RecipeCard";

const { getDailyRecommendationMock } = vi.hoisted(() => ({
  getDailyRecommendationMock: vi.fn(),
}));

vi.mock("../../services/dailyRecommendationService", () => ({
  getDailyRecommendation: getDailyRecommendationMock,
}));

import DailyRecommendation from "../DailyRecommendation";

describe("recipe nutrition display", () => {
  it("renders zero nutrition values as valid values on recipe cards", () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={makeRecipe({ calories: 0, protein: 0, fat: 0, carbs: 0 })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/0 kcal/)).toBeInTheDocument();
    expect(screen.getByText(/Fehérje: 0 g/)).toBeInTheDocument();
    expect(screen.getByText(/Zsír: 0 g/)).toBeInTheDocument();
    expect(screen.getByText(/Szénhidrát: 0 g/)).toBeInTheDocument();
  });

  it("keeps missing nutrition values on their existing fallback", () => {
    render(
      <MemoryRouter>
        <RecipeCard
          recipe={makeRecipe({ calories: null, protein: null, fat: null, carbs: null })}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Nincs adat/)).toBeInTheDocument();
    expect(screen.queryByText(/Fehérje:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Zsír:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Szénhidrát:/)).not.toBeInTheDocument();
  });

  it("renders zero calories in the daily recommendation", () => {
    getDailyRecommendationMock.mockReturnValue(makeRecipe({ calories: 0 }));

    render(
      <MemoryRouter>
        <DailyRecommendation />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Ebéd.*0 kcal/)).toBeInTheDocument();
  });

  it("keeps an unavailable daily recommendation image decorative", () => {
    getDailyRecommendationMock.mockReturnValue(makeRecipe({ image: "invalid-image-url" }));

    const { container } = render(
      <MemoryRouter>
        <DailyRecommendation />
      </MemoryRouter>,
    );

    fireEvent.error(container.querySelector("img"));

    expect(container.querySelector(".daily-photo-fallback")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
