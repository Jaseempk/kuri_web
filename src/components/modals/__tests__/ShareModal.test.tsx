import { describe, it, expect } from "vitest";
import { vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { renderWithProviders, mockMarket } from "../../../test/utils";
import { ShareModal } from "../ShareModal";

describe("ShareModal", () => {
  it("renders and displays social share options", () => {
    renderWithProviders(
      <ShareModal isOpen={true} onClose={vi.fn()} market={mockMarket} />
    );

    // Use more specific selector for the main title
    expect(
      screen.getByRole("heading", { name: /share.*test market/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /twitter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /telegram/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /whatsapp/i })
    ).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = vi.fn();
    renderWithProviders(
      <ShareModal isOpen={true} onClose={mockOnClose} market={mockMarket} />
    );

    // Find the close button by its aria-label
    const closeButton = screen.getByLabelText(/close share modal/i);
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
