import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConnectButton } from "../ConnectButton";
import { renderWithProviders } from "../../../test/utils";

// Mock wagmi hook
const mockUseAccount = vi.hoisted(() => vi.fn());
vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: mockUseAccount,
    createConfig: vi.fn(),
    http: vi.fn(),
    WagmiProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

vi.mock("wagmi/chains", () => ({
  baseSepolia: { id: 84532, name: "Base Sepolia" },
}));

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn(() => ({
    setQueryDefaults: vi.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ConnectKitButton
const mockShow = vi.fn();
const mockConnectKitButton = vi.hoisted(() => ({
  Custom: ({ children }: { children: any }) =>
    children({
      isConnected: false,
      isConnecting: false,
      show: mockShow,
    }),
}));

vi.mock("connectkit", () => ({
  ConnectKitButton: mockConnectKitButton,
  ConnectKitProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  getDefaultConfig: vi.fn(() => ({
    appName: "Test App", 
    chains: [],
    transports: {},
  })),
}));

describe("ConnectButton", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAccount.mockReset();
  });

  describe("when wallet is disconnected", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });
      
      mockConnectKitButton.Custom = ({ children }: { children: any }) =>
        children({
          isConnected: false,
          isConnecting: false,
          show: mockShow,
        });
    });

    it("shows connect prompt when wallet disconnected", async () => {
      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      // Check button displays correct text
      const connectButton = screen.getByRole("button", { name: /connect wallet/i });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).not.toBeDisabled();
    });

    it("calls show function when clicked", async () => {
      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      const connectButton = screen.getByRole("button", { name: /connect wallet/i });
      
      await act(async () => {
        await user.click(connectButton);
      });

      expect(mockShow).toHaveBeenCalledOnce();
    });
  });

  describe("when wallet is connected", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: "0x1234567890123456789012345678901234567890",
        isConnected: true,
      });
      
      mockConnectKitButton.Custom = ({ children }: { children: any }) =>
        children({
          isConnected: true,
          isConnecting: false,
          show: mockShow,
        });
    });

    it("shows wallet address when connected", async () => {
      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      // Check address truncation logic
      const connectButton = screen.getByRole("button", { name: /0x1234\.\.\.7890/i });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).not.toBeDisabled();
      
      // Verify full address is not exposed in DOM
      expect(screen.queryByText("0x1234567890123456789012345678901234567890")).not.toBeInTheDocument();
    });

    it("is clickable for account options when connected", async () => {
      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      const connectButton = screen.getByRole("button");
      
      await act(async () => {
        await user.click(connectButton);
      });

      expect(mockShow).toHaveBeenCalledOnce();
    });
  });

  describe("when wallet is connecting", () => {
    beforeEach(() => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });
      
      mockConnectKitButton.Custom = ({ children }: { children: any }) =>
        children({
          isConnected: false,
          isConnecting: true,
          show: mockShow,
        });
    });

    it("shows connecting state during connection", async () => {
      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      // Check loading text and disabled state
      const connectButton = screen.getByRole("button", { name: /connecting\.\.\./i });
      expect(connectButton).toBeInTheDocument();
      expect(connectButton).toBeDisabled();
    });

    it("does not call show when clicked during connecting", async () => {
      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      const connectButton = screen.getByRole("button", { name: /connecting\.\.\./i });
      
      // Try to click disabled button
      await act(async () => {
        await user.click(connectButton);
      });

      // Should not call show when disabled
      expect(mockShow).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("handles inconsistent state (connected true but no address)", async () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: true,
      });
      
      mockConnectKitButton.Custom = ({ children }: { children: any }) =>
        children({
          isConnected: true,
          isConnecting: false,
          show: mockShow,
        });

      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      // Component should gracefully handle this case
      // Should show "Connect Wallet" since no address is available
      expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
    });

    it("handles very long addresses", async () => {
      const longAddress = "0x1234567890123456789012345678901234567890ABCDEF";
      mockUseAccount.mockReturnValue({
        address: longAddress,
        isConnected: true,
      });
      
      mockConnectKitButton.Custom = ({ children }: { children: any }) =>
        children({
          isConnected: true,
          isConnecting: false,
          show: mockShow,
        });

      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      // Should still truncate correctly (first 6 + last 4)
      expect(screen.getByRole("button", { name: /0x1234\.\.\.CDEF/i })).toBeInTheDocument();
    });

    it("handles malformed addresses gracefully", async () => {
      const malformedAddress = "0x123"; // Too short
      mockUseAccount.mockReturnValue({
        address: malformedAddress,
        isConnected: true,
      });
      
      mockConnectKitButton.Custom = ({ children }: { children: any }) =>
        children({
          isConnected: true,
          isConnecting: false,
          show: mockShow,
        });

      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      // Component should not crash and show something reasonable
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("accessibility", () => {
    it("has proper button role and is keyboard accessible", async () => {
      mockUseAccount.mockReturnValue({
        address: undefined,
        isConnected: false,
      });

      await act(async () => {
        renderWithProviders(<ConnectButton />);
      });

      const connectButton = screen.getByRole("button");
      expect(connectButton).toBeInTheDocument();
      
      // Test keyboard activation
      connectButton.focus();
      expect(connectButton).toHaveFocus();
    });
  });
});