import { describe, it, expect } from "vitest";
import { screen, act } from "@testing-library/react";
import { MarketCard } from "../MarketCard";
import { renderWithProviders, mockMarket } from "../../../test/utils";

describe("MarketCard", () => {
  it("renders market information correctly", async () => {
    await act(async () => {
      renderWithProviders(<MarketCard market={mockMarket} index={0} />);
    });

    // Check if market title is displayed (actual UI shows 'Kuri')
    expect(screen.getByText("Kuri")).toBeInTheDocument();

    // Check if participant count is displayed (appears multiple times)
    expect(screen.getAllByText(/5\/10/)).toHaveLength(2);

    // Check if contribution is displayed
    expect(screen.getByText(/1000.00/)).toBeInTheDocument();
  });

  it("renders share button", async () => {
    await act(async () => {
      renderWithProviders(<MarketCard market={mockMarket} index={0} />);
    });

    // Check if share button is present
    expect(screen.getByRole("button", { name: /share/i })).toBeInTheDocument();
  });
});
