import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { ShareButton } from "../ShareButton";
import { renderWithProviders, mockMarket } from "../../../test/utils";

describe("ShareButton", () => {
  it("renders and triggers onClick", () => {
    const handleClick = vi.fn();
    renderWithProviders(
      <ShareButton onClick={handleClick} market={mockMarket} />
    );
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalled();
  });
});
