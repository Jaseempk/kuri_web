import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateMarketForm } from "../CreateMarketForm";
import { renderWithProviders } from "../../../test/utils";

// Mock useKuriFactory hook
const mockInitialiseKuriMarket = vi.hoisted(() => vi.fn());
const mockUseKuriFactory = vi.hoisted(() => vi.fn());

vi.mock("../../../hooks/contracts/useKuriFactory", () => ({
  useKuriFactory: mockUseKuriFactory,
}));

// Mock useAccount hook
const mockUseAccount = vi.hoisted(() => vi.fn());

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: mockUseAccount,
  };
});

// Mock parseUnits from viem
const mockParseUnits = vi.hoisted(() => vi.fn());

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    parseUnits: mockParseUnits,
  };
});

// Mock utility functions
vi.mock("../../../utils/sanitize", () => ({
  sanitizeInput: vi.fn((input) => input.replace(/<[^>]*>/g, "")),
}));

vi.mock("../../../utils/fileValidation", () => ({
  validateImageFile: vi.fn((file) => {
    if (file.size > 5000000) {
      return { isValid: false, error: "File too large" };
    }
    if (!file.type.startsWith("image/")) {
      return { isValid: false, error: "Invalid file type" };
    }
    return { isValid: true };
  }),
}));

// Mock error handling utilities
vi.mock("../../../utils/errors", () => ({
  isUserRejection: vi.fn((error) => error.message.includes("User rejected")),
}));

vi.mock("../../../utils/apiErrors", () => ({
  formatErrorForUser: vi.fn((error) => 
    error instanceof Error ? error.message : "An error occurred"
  ),
}));

// Mock analytics
vi.mock("../../../utils/analytics", () => ({
  trackMarketCreation: vi.fn(),
  trackError: vi.fn(),
}));

// Mock API client
const mockCreateCircleMetadata = vi.hoisted(() => vi.fn());

vi.mock("../../../lib/apiClient", () => ({
  apiClient: {
    createCircleMetadata: mockCreateCircleMetadata,
  },
}));

// Mock toast notifications
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock UI components
vi.mock("../../ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@radix-ui/react-dialog", () => ({
  DialogClose: ({ children, asChild }: any) => 
    asChild ? children : <div>{children}</div>,
}));

vi.mock("../../ui/Confetti", () => ({
  Confetti: () => <div data-testid="confetti">🎉</div>,
}));

describe("CreateMarketForm", () => {
  const mockUserAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef" as `0x${string}`;
  const mockOnSuccess = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
    });

    mockUseKuriFactory.mockReturnValue({
      initialiseKuriMarket: mockInitialiseKuriMarket,
      isCreating: false,
    });

    mockParseUnits.mockImplementation((value, decimals) => BigInt(value) * BigInt(10 ** decimals));

    mockCreateCircleMetadata.mockResolvedValue({
      id: "metadata-123",
      shortDescription: "Test Circle",
    });

    // Mock successful market creation by default
    mockInitialiseKuriMarket.mockResolvedValue({
      marketAddress: "0x1234567890123456789012345678901234567890",
      txHash: "0xabcdef123456789",
    });
  });

  describe("form validation", () => {
    it("validates total amount input", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const submitButton = screen.getByRole("button", { name: /create circle/i });
      
      // Try to submit without total amount
      await user.click(submitButton);

      expect(screen.getByText("Please enter a valid total amount")).toBeInTheDocument();
      expect(mockInitialiseKuriMarket).not.toHaveBeenCalled();
    });

    it("validates participant count input", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const totalAmountInput = screen.getByPlaceholderText("1000");
      const submitButton = screen.getByRole("button", { name: /create circle/i });

      // Fill total amount but leave participant count empty
      await user.type(totalAmountInput, "1000");
      await user.click(submitButton);

      expect(screen.getByText("Please enter the number of participants")).toBeInTheDocument();
      expect(mockInitialiseKuriMarket).not.toHaveBeenCalled();
    });

    it("validates maximum participant count", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const totalAmountInput = screen.getByPlaceholderText("1000");
      const participantCountInput = screen.getByPlaceholderText("10");
      const submitButton = screen.getByRole("button", { name: /create circle/i });

      await user.type(totalAmountInput, "1000");
      await user.type(participantCountInput, "501");
      await user.click(submitButton);

      expect(screen.getByText("Maximum 500 participants allowed per circle")).toBeInTheDocument();
      expect(mockInitialiseKuriMarket).not.toHaveBeenCalled();
    });

    it("requires image upload", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const totalAmountInput = screen.getByPlaceholderText("1000");
      const participantCountInput = screen.getByPlaceholderText("10");
      const submitButton = screen.getByRole("button", { name: /create circle/i });

      await user.type(totalAmountInput, "1000");
      await user.type(participantCountInput, "10");
      await user.click(submitButton);

      expect(screen.getByText("Please add a circle image to continue")).toBeInTheDocument();
      expect(mockInitialiseKuriMarket).not.toHaveBeenCalled();
    });

    it("validates image file size and type", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      // Create oversized file
      const oversizedFile = new File(["x".repeat(6000000)], "large.jpg", {
        type: "image/jpeg",
      });

      await user.upload(fileInput as HTMLInputElement, oversizedFile);

      expect(screen.getByText("File too large")).toBeInTheDocument();
    });

    it("handles invalid file types", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      // Create non-image file
      const textFile = new File(["test content"], "document.txt", {
        type: "text/plain",
      });

      await user.upload(fileInput as HTMLInputElement, textFile);

      expect(screen.getByText("Invalid file type")).toBeInTheDocument();
    });
  });

  describe("monthly contribution calculation", () => {
    it("calculates monthly contribution correctly", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const totalAmountInput = screen.getByPlaceholderText("1000");
      const participantCountInput = screen.getByPlaceholderText("10");

      await user.type(totalAmountInput, "1000");
      await user.type(participantCountInput, "10");

      // Monthly contribution should be 1000 / 10 = 100
      const monthlyContributionInput = screen.getByDisplayValue("100.00");
      expect(monthlyContributionInput).toBeInTheDocument();
    });

    it("handles decimal calculations properly", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const totalAmountInput = screen.getByPlaceholderText("1000");
      const participantCountInput = screen.getByPlaceholderText("10");

      await user.type(totalAmountInput, "1000");
      await user.type(participantCountInput, "3");

      // Monthly contribution should be 1000 / 3 = 333.33
      const monthlyContributionInput = screen.getByDisplayValue("333.33");
      expect(monthlyContributionInput).toBeInTheDocument();
    });

    it("shows zero for invalid inputs", async () => {
      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      // Initially should show 0
      const monthlyContributionInput = screen.getByDisplayValue("0");
      expect(monthlyContributionInput).toBeInTheDocument();
    });
  });

  describe("form submission", () => {
    const setupValidForm = async (user: any) => {
      const totalAmountInput = screen.getByPlaceholderText("1000");
      const participantCountInput = screen.getByPlaceholderText("10");
      const shortDescriptionInput = screen.getByPlaceholderText("A brief description of your circle");
      const fileInput = screen.getByRole("textbox", { hidden: true }) || 
                       document.querySelector('input[type="file"]');

      await user.type(totalAmountInput, "1000");
      await user.type(participantCountInput, "10");
      await user.type(shortDescriptionInput, "Test Circle");

      // Upload valid image
      const validFile = new File(["image content"], "test.jpg", {
        type: "image/jpeg",
      });
      await user.upload(fileInput as HTMLInputElement, validFile);
    };

    it("creates market successfully with valid form", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /create circle/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockInitialiseKuriMarket).toHaveBeenCalledWith(
          BigInt("100000000"), // 100 USDC * 10^6 decimals
          10,
          1 // Monthly interval
        );
      });

      expect(mockCreateCircleMetadata).toHaveBeenCalledWith({
        userAddress: mockUserAddress,
        contractAddress: "0x1234567890123456789012345678901234567890",
        transactionHash: "0xabcdef123456789",
        shortDescription: "Test Circle",
        longDescription: "",
        image: expect.any(File),
      });

      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          address: "0x1234567890123456789012345678901234567890",
          name: "Test Circle",
          totalParticipants: 10,
          kuriAmount: "100.00",
        })
      );

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("handles contract creation failures", async () => {
      const user = userEvent.setup();
      const contractError = new Error("Insufficient gas");
      mockInitialiseKuriMarket.mockRejectedValueOnce(contractError);

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /create circle/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Insufficient gas")).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("handles API metadata creation failures", async () => {
      const user = userEvent.setup();
      const apiError = new Error("API service unavailable");
      mockCreateCircleMetadata.mockRejectedValueOnce(apiError);

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /create circle/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("API service unavailable")).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("handles user transaction rejection gracefully", async () => {
      const user = userEvent.setup();
      const userRejectionError = new Error("User rejected transaction");
      mockInitialiseKuriMarket.mockRejectedValueOnce(userRejectionError);

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /create circle/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Should not show error message for user rejection
        expect(screen.queryByText("User rejected transaction")).not.toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("shows loading state during creation", async () => {
      const user = userEvent.setup();
      mockUseKuriFactory.mockReturnValue({
        initialiseKuriMarket: mockInitialiseKuriMarket,
        isCreating: true,
      });

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const submitButton = screen.getByRole("button", { name: /creating/i });
      expect(submitButton).toBeDisabled();
      expect(screen.getByText("Creating...")).toBeInTheDocument();
    });
  });

  describe("input sanitization", () => {
    it("sanitizes text inputs to prevent XSS", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const shortDescriptionInput = screen.getByPlaceholderText("A brief description of your circle");

      await user.type(shortDescriptionInput, "<script>alert('xss')</script>Safe text");

      // Should have sanitized the input
      expect(shortDescriptionInput).toHaveValue("Safe text");
    });
  });

  describe("interval type selection", () => {
    it("defaults to monthly interval", () => {
      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const intervalSelect = screen.getByDisplayValue("Monthly");
      expect(intervalSelect).toBeInTheDocument();
    });

    it("allows switching to weekly interval", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      const intervalSelect = screen.getByRole("combobox");
      await user.selectOptions(intervalSelect, "0");

      expect(screen.getByDisplayValue("Weekly")).toBeInTheDocument();
    });
  });

  describe("success state", () => {
    it("shows confetti animation on successful creation", async () => {
      const user = userEvent.setup();

      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      await setupValidForm(user);

      const submitButton = screen.getByRole("button", { name: /create circle/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("confetti")).toBeInTheDocument();
      });
    });
  });

  describe("accessibility", () => {
    it("provides proper form labels and structure", () => {
      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      expect(screen.getByLabelText("Total Kuri Amount (USDC)")).toBeInTheDocument();
      expect(screen.getByLabelText("Number of Participants")).toBeInTheDocument();
      expect(screen.getByLabelText("Contribution Interval")).toBeInTheDocument();
      expect(screen.getByLabelText("Short Description (1-2 lines)")).toBeInTheDocument();
      expect(screen.getByLabelText("Full Story")).toBeInTheDocument();
      expect(screen.getByLabelText("Circle Image")).toBeInTheDocument();
    });

    it("provides helpful placeholder text and constraints", () => {
      render(
        <CreateMarketForm onSuccess={mockOnSuccess} onClose={mockOnClose} />,
        { wrapper: ({ children }) => renderWithProviders(<div>{children}</div>).container }
      );

      expect(screen.getByText("Min: 2, Max: 500 participants")).toBeInTheDocument();
      expect(screen.getByText("This is the total amount anyone can win on each cycle.")).toBeInTheDocument();
      expect(screen.getByText("How often participants will contribute")).toBeInTheDocument();
    });
  });
});