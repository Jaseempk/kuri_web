import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

// Mock environment variables for wagmi config
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_ALCHEMY_API_KEY: 'test-alchemy-key',
    VITE_WALLET_CONNECT_PROJECT_ID: 'test-wallet-connect-id',
  },
  writable: true,
});

// Mock wagmi config FIRST to prevent import errors
vi.mock("../../config/wagmi", () => ({
  config: {
    chains: [{ id: 84532, name: "Base Sepolia" }],
    transports: {},
  },
}));

import { useKuriFactory } from "../useKuriFactory";
import { renderWithProviders } from "../../../test/utils";

// Mock wagmi core functions
const mockSimulateContract = vi.hoisted(() => vi.fn());
const mockWriteContract = vi.hoisted(() => vi.fn());
const mockWaitForTransactionReceipt = vi.hoisted(() => vi.fn());
const mockGetAccount = vi.hoisted(() => vi.fn());

vi.mock("@wagmi/core", () => ({
  simulateContract: mockSimulateContract,
  writeContract: mockWriteContract,
  waitForTransactionReceipt: mockWaitForTransactionReceipt,
  getAccount: mockGetAccount,
}));

// Mock viem for event decoding
const mockDecodeEventLog = vi.hoisted(() => vi.fn());

vi.mock("viem", async () => {
  const actual = await vi.importActual("viem");
  return {
    ...actual,
    decodeEventLog: mockDecodeEventLog,
  };
});

// Mock useAccount hook
const mockUseAccount = vi.hoisted(() => vi.fn());

vi.mock("wagmi", async () => {
  const actual = await vi.importActual("wagmi");
  return {
    ...actual,
    useAccount: mockUseAccount,
    createConfig: vi.fn(),
    http: vi.fn(),
    WagmiProvider: vi.fn(({ children }) => children),
  };
});

vi.mock("wagmi/chains", () => ({
  baseSepolia: { id: 84532, name: "Base Sepolia" },
}));

// Mock ConnectKit
vi.mock("connectkit", () => ({
  ConnectKitProvider: vi.fn(({ children }) => children),
  getDefaultConfig: vi.fn(() => ({
    appName: "Test App",
    chains: [],
    transports: {},
  })),
}));

// Mock TanStack Query
vi.mock("@tanstack/react-query", () => ({
  QueryClient: vi.fn(() => ({
    setQueryDefaults: vi.fn(),
  })),
  QueryClientProvider: vi.fn(({ children }) => children),
  useQuery: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
}));

// Mock transaction status hook
const mockHandleTransaction = vi.hoisted(() => vi.fn());
const mockUseTransactionStatus = vi.hoisted(() => vi.fn());

vi.mock("../useTransactionStatus", () => ({
  useTransactionStatus: mockUseTransactionStatus,
}));

// Mock contract addresses
vi.mock("../../config/contracts", () => ({
  getContractAddress: vi.fn(() => "0xfactory1234567890123456789012345678901234567890"),
}));

// Mock error handling
vi.mock("../../utils/errors", () => ({
  handleContractError: vi.fn((error) => error),
}));

// Mock useKuriMarkets
const mockUseKuriMarkets = vi.hoisted(() => vi.fn());

vi.mock("../useKuriMarkets", () => ({
  useKuriMarkets: mockUseKuriMarkets,
}));


describe("useKuriFactory", () => {
  const mockUserAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef" as `0x${string}`;
  const mockFactoryAddress = "0xfactory1234567890123456789012345678901234567890" as `0x${string}`;
  const mockNewMarketAddress = "0xmarket1234567890123456789012345678901234567890" as `0x${string}`;
  const mockTxHash = "0xabcdef123456789" as `0x${string}`;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAccount.mockReturnValue({
      address: mockUserAddress,
      chainId: 84532, // Base Sepolia
    });

    mockGetAccount.mockReturnValue({
      address: mockUserAddress,
    });

    mockUseTransactionStatus.mockReturnValue({
      handleTransaction: mockHandleTransaction,
      isSuccess: false,
    });

    mockUseKuriMarkets.mockReturnValue({
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    mockHandleTransaction.mockResolvedValue(undefined);
  });

  describe("market creation", () => {
    it("creates market with valid parameters", async () => {
      const kuriAmount = BigInt("1000000000"); // 1000 USDC
      const participantCount = 10;
      const intervalType = 1 as 0 | 1; // Monthly

      // Mock successful simulation
      mockSimulateContract.mockResolvedValueOnce({
        request: {
          address: mockFactoryAddress,
          functionName: "initialiseKuriMarket",
          args: [kuriAmount, participantCount, intervalType],
        },
      });

      // Mock successful transaction
      mockWriteContract.mockResolvedValueOnce(mockTxHash);

      // Mock transaction receipt with event logs
      const mockReceipt = {
        logs: [
          {
            data: "0x1234",
            topics: ["0xabcd", "0xef12"],
          },
        ],
      };
      mockWaitForTransactionReceipt.mockResolvedValueOnce(mockReceipt);

      // Mock event decoding
      mockDecodeEventLog.mockReturnValueOnce({
        eventName: "KuriMarketDeployed",
        args: {
          marketAddress: mockNewMarketAddress,
          caller: mockUserAddress,
          intervalType: intervalType,
          timestamp: BigInt(Date.now()),
        },
      });

      const { result } = renderHook(() => useKuriFactory());

      // Call the function
      const createResult = await result.current.initialiseKuriMarket(
        kuriAmount,
        participantCount,
        intervalType
      );

      // Verify contract simulation was called with correct parameters
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.anything(),
        {
          abi: expect.anything(),
          address: mockFactoryAddress,
          functionName: "initialiseKuriMarket",
          args: [kuriAmount, participantCount, intervalType],
        }
      );

      // Verify transaction was written
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          address: mockFactoryAddress,
          functionName: "initialiseKuriMarket",
        })
      );

      // Verify transaction was awaited
      expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith(
        expect.anything(),
        { hash: mockTxHash }
      );

      // Verify event was decoded
      expect(mockDecodeEventLog).toHaveBeenCalled();

      // Verify transaction status was handled
      expect(mockHandleTransaction).toHaveBeenCalledWith(mockTxHash, {
        loadingMessage: "Creating your Kuri market...",
        successMessage: "Kuri market created successfully!",
        errorMessage: "Failed to create Kuri market",
      });

      // Verify return value
      expect(createResult).toEqual({
        marketAddress: mockNewMarketAddress,
        txHash: mockTxHash,
      });

      expect(result.current.isCreating).toBe(false);
    });

    it("handles market creation failures", async () => {
      const kuriAmount = BigInt("1000000000");
      const participantCount = 10;
      const intervalType = 1 as 0 | 1;

      // Mock contract simulation failure
      const contractError = new Error("Insufficient participants");
      mockSimulateContract.mockRejectedValueOnce(contractError);

      const { result } = renderHook(() => useKuriFactory());

      // Should throw the contract error
      await expect(
        result.current.initialiseKuriMarket(kuriAmount, participantCount, intervalType)
      ).rejects.toThrow("Insufficient participants");

      // Verify transaction was not written since simulation failed
      expect(mockWriteContract).not.toHaveBeenCalled();
      expect(result.current.isCreating).toBe(false);
    });

    it("handles transaction write failures", async () => {
      const kuriAmount = BigInt("1000000000");
      const participantCount = 10;
      const intervalType = 1 as 0 | 1;

      // Mock successful simulation
      mockSimulateContract.mockResolvedValueOnce({
        request: {
          address: mockFactoryAddress,
          functionName: "initialiseKuriMarket",
          args: [kuriAmount, participantCount, intervalType],
        },
      });

      // Mock transaction write failure
      const writeError = new Error("User rejected transaction");
      mockWriteContract.mockRejectedValueOnce(writeError);

      const { result } = renderHook(() => useKuriFactory());

      await expect(
        result.current.initialiseKuriMarket(kuriAmount, participantCount, intervalType)
      ).rejects.toThrow("User rejected transaction");

      expect(result.current.isCreating).toBe(false);
    });

    it("handles missing market address in event logs", async () => {
      const kuriAmount = BigInt("1000000000");
      const participantCount = 10;
      const intervalType = 1 as 0 | 1;

      mockSimulateContract.mockResolvedValueOnce({
        request: { address: mockFactoryAddress },
      });
      mockWriteContract.mockResolvedValueOnce(mockTxHash);

      // Mock receipt with no relevant events
      const mockReceipt = {
        logs: [
          {
            data: "0x1234",
            topics: ["0xabcd"],
          },
        ],
      };
      mockWaitForTransactionReceipt.mockResolvedValueOnce(mockReceipt);

      // Mock event decoding that throws (not the right event)
      mockDecodeEventLog.mockImplementation(() => {
        throw new Error("Event not found");
      });

      const { result } = renderHook(() => useKuriFactory());

      await expect(
        result.current.initialiseKuriMarket(kuriAmount, participantCount, intervalType)
      ).rejects.toThrow("Market address not found in event logs");
    });

    it("tracks creation transaction status", async () => {
      const kuriAmount = BigInt("500000000"); // 500 USDC
      const participantCount = 5;
      const intervalType = 0 as 0 | 1; // Weekly

      mockSimulateContract.mockResolvedValueOnce({
        request: { address: mockFactoryAddress },
      });
      mockWriteContract.mockResolvedValueOnce(mockTxHash);
      mockWaitForTransactionReceipt.mockResolvedValueOnce({
        logs: [{ data: "0x1234", topics: ["0xabcd"] }],
      });
      mockDecodeEventLog.mockReturnValueOnce({
        eventName: "KuriMarketDeployed",
        args: { marketAddress: mockNewMarketAddress },
      });

      // Mock transaction status tracking
      mockUseTransactionStatus.mockReturnValue({
        handleTransaction: mockHandleTransaction,
        isSuccess: true,
      });

      const { result } = renderHook(() => useKuriFactory());

      expect(result.current.isCreationSuccess).toBe(true);

      await result.current.initialiseKuriMarket(kuriAmount, participantCount, intervalType);

      // Verify transaction status was handled with correct parameters
      expect(mockHandleTransaction).toHaveBeenCalledWith(mockTxHash, {
        loadingMessage: "Creating your Kuri market...",
        successMessage: "Kuri market created successfully!",
        errorMessage: "Failed to create Kuri market",
      });
    });

    it("validates wallet connection before creation", async () => {
      // Mock disconnected wallet
      mockGetAccount.mockReturnValue({
        address: undefined,
      });

      const { result } = renderHook(() => useKuriFactory());

      await expect(
        result.current.initialiseKuriMarket(BigInt("1000000000"), 10, 1)
      ).rejects.toThrow("Wallet not connected");

      expect(mockSimulateContract).not.toHaveBeenCalled();
    });

    it("sets creating state correctly during transaction", async () => {
      const kuriAmount = BigInt("1000000000");
      const participantCount = 10;
      const intervalType = 1 as 0 | 1;

      // Mock slow transaction
      let resolveSimulation: (value: any) => void;
      const simulationPromise = new Promise((resolve) => {
        resolveSimulation = resolve;
      });
      mockSimulateContract.mockReturnValue(simulationPromise);

      const { result } = renderHook(() => useKuriFactory());

      // Start creation
      const creationPromise = result.current.initialiseKuriMarket(
        kuriAmount,
        participantCount,
        intervalType
      );

      // Check that creating state is set
      expect(result.current.isCreating).toBe(true);

      // Resolve the simulation
      resolveSimulation!({ request: { address: mockFactoryAddress } });
      mockWriteContract.mockResolvedValueOnce(mockTxHash);
      mockWaitForTransactionReceipt.mockResolvedValueOnce({
        logs: [{ data: "0x1234", topics: ["0xabcd"] }],
      });
      mockDecodeEventLog.mockReturnValueOnce({
        eventName: "KuriMarketDeployed",
        args: { marketAddress: mockNewMarketAddress },
      });

      await creationPromise;

      // Check that creating state is cleared
      expect(result.current.isCreating).toBe(false);
    });
  });

  describe("integration with markets data", () => {
    it("provides loading and error states from markets hook", () => {
      mockUseKuriMarkets.mockReturnValue({
        loading: true,
        error: new Error("Failed to fetch markets"),
        refetch: vi.fn(),
      });

      const { result } = renderHook(() => useKuriFactory());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toEqual(new Error("Failed to fetch markets"));
    });

    it("handles chain configuration correctly", () => {
      mockUseAccount.mockReturnValue({
        address: mockUserAddress,
        chainId: undefined, // No chain connected
      });

      const { result } = renderHook(() => useKuriFactory());

      // Should still work with fallback chain ID
      expect(result.current.initialiseKuriMarket).toBeDefined();
    });
  });

  describe("parameter validation", () => {
    it("validates kuriAmount parameter", async () => {
      const invalidAmount = BigInt("0");
      const participantCount = 10;
      const intervalType = 1 as 0 | 1;

      // Mock simulation rejection for invalid amount
      mockSimulateContract.mockRejectedValueOnce(new Error("Invalid amount"));

      const { result } = renderHook(() => useKuriFactory());

      await expect(
        result.current.initialiseKuriMarket(invalidAmount, participantCount, intervalType)
      ).rejects.toThrow("Invalid amount");
    });

    it("validates participantCount parameter", async () => {
      const kuriAmount = BigInt("1000000000");
      const invalidParticipantCount = 0;
      const intervalType = 1 as 0 | 1;

      mockSimulateContract.mockRejectedValueOnce(new Error("Invalid participant count"));

      const { result } = renderHook(() => useKuriFactory());

      await expect(
        result.current.initialiseKuriMarket(kuriAmount, invalidParticipantCount, intervalType)
      ).rejects.toThrow("Invalid participant count");
    });
  });
});