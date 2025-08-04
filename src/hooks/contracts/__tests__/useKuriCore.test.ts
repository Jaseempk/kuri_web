import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useKuriCore, KuriState, IntervalType } from "../useKuriCore";
import { renderWithProviders } from "../../../test/utils";

// Mock wagmi core functions
const mockReadContract = vi.hoisted(() => vi.fn());
const mockWriteContract = vi.hoisted(() => vi.fn());
const mockSimulateContract = vi.hoisted(() => vi.fn());
const mockGetAccount = vi.hoisted(() => vi.fn());

vi.mock("@wagmi/core", () => ({
  readContract: mockReadContract,
  writeContract: mockWriteContract,
  simulateContract: mockSimulateContract,
  getAccount: mockGetAccount,
}));

// Mock transaction status hook
const mockHandleTransaction = vi.hoisted(() => vi.fn());
const mockUseTransactionStatus = vi.hoisted(() => vi.fn());

vi.mock("../useTransactionStatus", () => ({
  useTransactionStatus: mockUseTransactionStatus,
}));

// Mock error handling
vi.mock("../../utils/errors", () => ({
  handleContractError: vi.fn((error) => error),
}));

// Mock token utils
vi.mock("../../utils/tokenUtils", () => ({
  calculateApprovalAmount: vi.fn((amount) => amount * BigInt(2)),
}));

describe("useKuriCore", () => {
  const mockKuriAddress = "0x1234567890123456789012345678901234567890" as `0x${string}`;
  const mockUserAddress = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef" as `0x${string}`;
  const mockTokenAddress = "0xa0b86a33e6a20f8e9a4a6c9d11c7c8b18e5a5b7e" as `0x${string}`;

  const mockMarketData = {
    creator: "0x1111111111111111111111111111111111111111" as `0x${string}`,
    kuriAmount: BigInt("1000000000"), // 1000 USDC
    totalParticipantsCount: 10,
    totalActiveParticipantsCount: 8,
    intervalDuration: 604800, // 1 week
    nexRaffleTime: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
    nextIntervalDepositTime: BigInt(Math.floor(Date.now() / 1000) + 7200), // 2 hours from now
    launchPeriod: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
    startTime: BigInt(Math.floor(Date.now() / 1000) - 7200), // 2 hours ago
    endTime: BigInt(Math.floor(Date.now() / 1000) + 86400), // 24 hours from now
    intervalType: IntervalType.WEEK,
    state: KuriState.ACTIVE,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseTransactionStatus.mockReturnValue({
      handleTransaction: mockHandleTransaction,
    });

    mockGetAccount.mockReturnValue({
      address: mockUserAddress,
      isConnected: true,
    });

    mockHandleTransaction.mockResolvedValue(undefined);
  });

  describe("market data fetching", () => {
    it("fetches market data successfully", async () => {
      // Mock successful contract read
      mockReadContract()
        .mockResolvedValueOnce(mockTokenAddress) // SUPPORTED_TOKEN call
        .mockResolvedValueOnce([ // kuriData call
          mockMarketData.creator,
          mockMarketData.kuriAmount,
          mockMarketData.totalParticipantsCount,
          mockMarketData.totalActiveParticipantsCount,
          mockMarketData.intervalDuration,
          mockMarketData.nexRaffleTime,
          mockMarketData.nextIntervalDepositTime,
          mockMarketData.launchPeriod,
          mockMarketData.startTime,
          mockMarketData.endTime,
          mockMarketData.intervalType,
          mockMarketData.state,
        ]);

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify market data transformation
      expect(result.current.marketData).toEqual({
        creator: mockMarketData.creator,
        kuriAmount: mockMarketData.kuriAmount,
        totalParticipantsCount: mockMarketData.totalParticipantsCount,
        totalActiveParticipantsCount: mockMarketData.totalActiveParticipantsCount,
        intervalDuration: mockMarketData.intervalDuration,
        nexRaffleTime: mockMarketData.nexRaffleTime,
        nextIntervalDepositTime: mockMarketData.nextIntervalDepositTime,
        launchPeriod: mockMarketData.launchPeriod,
        startTime: mockMarketData.startTime,
        endTime: mockMarketData.endTime,
        intervalType: mockMarketData.intervalType,
        state: mockMarketData.state,
      });

      expect(result.current.error).toBeNull();
      expect(result.current.tokenAddress).toBe(mockTokenAddress);
    });

    it("handles contract read failures", async () => {
      const contractError = new Error("Contract function reverted");
      mockReadContract
        .mockResolvedValueOnce(mockTokenAddress) // SUPPORTED_TOKEN succeeds
        .mockRejectedValueOnce(contractError); // kuriData fails

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(contractError);
      expect(result.current.marketData).toBeNull();
    });

    it("handles missing kuri address", () => {
      const { result } = renderHook(() => useKuriCore(undefined));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.marketData).toBeNull();
      // Don't check mock calls since the function isn't called when address is undefined
    });
  });

  describe("member status checking", () => {
    beforeEach(() => {
      // Setup basic market data
      mockReadContract
        .mockResolvedValueOnce(mockTokenAddress)
        .mockResolvedValueOnce([
          mockMarketData.creator,
          mockMarketData.kuriAmount,
          mockMarketData.totalParticipantsCount,
          mockMarketData.totalActiveParticipantsCount,
          mockMarketData.intervalDuration,
          mockMarketData.nexRaffleTime,
          mockMarketData.nextIntervalDepositTime,
          mockMarketData.launchPeriod,
          mockMarketData.startTime,
          mockMarketData.endTime,
          mockMarketData.intervalType,
          mockMarketData.state,
        ]);
    });

    it("checks member status correctly", async () => {
      const mockUserData = [
        1, // ACCEPTED status
        5, // user index
        mockUserAddress, // user address
      ];

      mockReadContract.mockResolvedValueOnce(mockUserData);

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const memberStatus = await result.current.getMemberStatus(mockUserAddress);
      expect(memberStatus).toBe(1); // ACCEPTED

      expect(mockReadContract).toHaveBeenCalledWith(
        expect.anything(),
        {
          address: mockKuriAddress,
          abi: expect.anything(),
          functionName: "userToData",
          args: [mockUserAddress],
        }
      );
    });

    it("handles different membership statuses", async () => {
      const testCases = [
        { status: 0, description: "NONE" },
        { status: 1, description: "ACCEPTED" },
        { status: 2, description: "REJECTED" },
        { status: 4, description: "APPLIED" },
      ];

      for (const testCase of testCases) {
        mockReadContract.mockResolvedValueOnce([testCase.status, 0, mockUserAddress]);

        const { result } = renderHook(() => useKuriCore(mockKuriAddress));

        const memberStatus = await result.current.getMemberStatus(mockUserAddress);
        expect(memberStatus).toBe(testCase.status);
      }
    });
  });

  describe("payment status validation", () => {
    beforeEach(() => {
      // Setup active market
      const activeMarketData = {
        ...mockMarketData,
        state: KuriState.ACTIVE,
        nextIntervalDepositTime: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
      };

      mockReadContract
        .mockResolvedValueOnce(mockTokenAddress)
        .mockResolvedValueOnce([
          activeMarketData.creator,
          activeMarketData.kuriAmount,
          activeMarketData.totalParticipantsCount,
          activeMarketData.totalActiveParticipantsCount,
          activeMarketData.intervalDuration,
          activeMarketData.nexRaffleTime,
          activeMarketData.nextIntervalDepositTime,
          activeMarketData.launchPeriod,
          activeMarketData.startTime,
          activeMarketData.endTime,
          activeMarketData.intervalType,
          activeMarketData.state,
        ]);
    });

    it("validates payment status for members only", async () => {
      // Mock user is ACCEPTED member
      mockReadContract
        .mockResolvedValueOnce([1, 5, mockUserAddress]) // userToData - ACCEPTED
        .mockResolvedValueOnce(2) // passedIntervalsCounter
        .mockResolvedValueOnce(true); // hasPaid

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const paymentStatus = await result.current.checkPaymentStatusIfMember();
      expect(paymentStatus).toBe(true);

      // Verify payment check was called
      expect(mockReadContract).toHaveBeenCalledWith(
        expect.anything(),
        {
          address: mockKuriAddress,
          abi: expect.anything(),
          functionName: "hasPaid",
          args: [mockUserAddress, BigInt(2)],
        }
      );
    });

    it("skips payment check for non-members", async () => {
      // Mock user is NOT a member (status 0 = NONE)
      mockReadContract.mockResolvedValueOnce([0, 0, mockUserAddress]); // userToData - NONE

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const paymentStatus = await result.current.checkPaymentStatusIfMember();
      expect(paymentStatus).toBe(false);

      // Verify payment check was NOT called for non-members
      expect(mockReadContract).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          functionName: "hasPaid",
        })
      );
    });

    it("prevents KuriCore__InvalidUser errors", async () => {
      // Mock user is REJECTED (status 2)
      mockReadContract.mockResolvedValueOnce([2, 0, mockUserAddress]); // userToData - REJECTED

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const paymentStatus = await result.current.checkPaymentStatusIfMember();
      expect(paymentStatus).toBe(false);

      // Should not attempt payment check for rejected users
      expect(mockReadContract).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          functionName: "hasPaid",
        })
      );
    });

    it("handles invalid interval counters gracefully", async () => {
      // Mock user is ACCEPTED
      mockReadContract
        .mockResolvedValueOnce([1, 5, mockUserAddress]) // userToData - ACCEPTED
        .mockResolvedValueOnce(99999); // Invalid high interval counter

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const paymentStatus = await result.current.checkPaymentStatusIfMember();
      expect(paymentStatus).toBe(false);

      // Should not call hasPaid with invalid interval
      expect(mockReadContract).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          functionName: "hasPaid",
        })
      );
    });
  });

  describe("deposit functionality", () => {
    beforeEach(() => {
      mockReadContract
        .mockResolvedValueOnce(mockTokenAddress)
        .mockResolvedValueOnce([
          mockMarketData.creator,
          mockMarketData.kuriAmount,
          mockMarketData.totalParticipantsCount,
          mockMarketData.totalActiveParticipantsCount,
          mockMarketData.intervalDuration,
          mockMarketData.nexRaffleTime,
          mockMarketData.nextIntervalDepositTime,
          mockMarketData.launchPeriod,
          mockMarketData.startTime,
          mockMarketData.endTime,
          mockMarketData.intervalType,
          mockMarketData.state,
        ]);
    });

    it("processes deposit successfully with sufficient allowance", async () => {
      const mockTxHash = "0xabcdef123456789";
      
      // Mock sufficient allowance
      mockReadContract.mockResolvedValueOnce(mockMarketData.kuriAmount * BigInt(2)); // allowance check
      
      // Mock successful contract simulation and write
      mockSimulateContract.mockResolvedValueOnce({ request: { to: mockKuriAddress } });
      mockWriteContract.mockResolvedValueOnce(mockTxHash);

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const depositResult = await result.current.deposit();

      expect(depositResult).toBe(mockTxHash);
      expect(mockHandleTransaction).toHaveBeenCalledWith(mockTxHash, {
        loadingMessage: "Processing deposit...",
        successMessage: "Deposit successful!",
        errorMessage: "Failed to make deposit",
      });
    });

    it("handles insufficient allowance with approval flow", async () => {
      const mockTxHash = "0xabcdef123456789";
      const mockApprovalTxHash = "0x987654321fedcba";
      
      // Mock insufficient then sufficient allowance
      mockReadContract
        .mockResolvedValueOnce(BigInt(0)) // Initial insufficient allowance
        .mockResolvedValueOnce(mockMarketData.kuriAmount * BigInt(2)); // After approval

      // Mock approval transaction
      mockSimulateContract
        .mockResolvedValueOnce({ request: { to: mockTokenAddress } }) // approval simulation
        .mockResolvedValueOnce({ request: { to: mockKuriAddress } }); // deposit simulation
      
      mockWriteContract
        .mockResolvedValueOnce(mockApprovalTxHash) // approval tx
        .mockResolvedValueOnce(mockTxHash); // deposit tx

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const depositResult = await result.current.deposit();

      expect(depositResult).toBe(mockTxHash);
      expect(mockHandleTransaction).toHaveBeenCalledTimes(2); // approval + deposit
    });

    it("handles deposit failures gracefully", async () => {
      const depositError = new Error("Insufficient gas");
      
      mockReadContract.mockResolvedValueOnce(mockMarketData.kuriAmount * BigInt(2)); // sufficient allowance
      mockSimulateContract.mockRejectedValueOnce(depositError);

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(result.current.deposit()).rejects.toThrow("Insufficient gas");
    });
  });

  describe("claim functionality", () => {
    beforeEach(() => {
      mockReadContract
        .mockResolvedValueOnce(mockTokenAddress)
        .mockResolvedValueOnce([
          mockMarketData.creator,
          mockMarketData.kuriAmount,
          mockMarketData.totalParticipantsCount,
          mockMarketData.totalActiveParticipantsCount,
          mockMarketData.intervalDuration,
          mockMarketData.nexRaffleTime,
          mockMarketData.nextIntervalDepositTime,
          mockMarketData.launchPeriod,
          mockMarketData.startTime,
          mockMarketData.endTime,
          mockMarketData.intervalType,
          mockMarketData.state,
        ]);
    });

    it("processes claim successfully", async () => {
      const mockTxHash = "0xabcdef123456789";
      const intervalIndex = 2;
      
      mockSimulateContract.mockResolvedValueOnce({ request: { to: mockKuriAddress } });
      mockWriteContract.mockResolvedValueOnce(mockTxHash);

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const claimResult = await result.current.claimKuriAmount(intervalIndex);

      expect(claimResult).toBe(mockTxHash);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.anything(),
        {
          address: mockKuriAddress,
          abi: expect.anything(),
          functionName: "claimKuriAmount",
          args: [intervalIndex],
        }
      );
    });
  });

  describe("membership management", () => {
    it("requests membership successfully", async () => {
      const mockTxHash = "0xabcdef123456789";
      
      mockSimulateContract.mockResolvedValueOnce({ request: { to: mockKuriAddress } });
      mockWriteContract.mockResolvedValueOnce(mockTxHash);

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      const requestResult = await result.current.requestMembership();

      expect(requestResult).toBe(mockTxHash);
      expect(result.current.isRequesting).toBe(false);
    });

    it("accepts member successfully", async () => {
      const mockTxHash = "0xabcdef123456789";
      const memberAddress = "0x1111111111111111111111111111111111111111" as `0x${string}`;
      
      mockSimulateContract.mockResolvedValueOnce({ request: { to: mockKuriAddress } });
      mockWriteContract.mockResolvedValueOnce(mockTxHash);

      const { result } = renderHook(() => useKuriCore(mockKuriAddress));

      const acceptResult = await result.current.acceptMember(memberAddress);

      expect(acceptResult).toBe(mockTxHash);
      expect(mockSimulateContract).toHaveBeenCalledWith(
        expect.anything(),
        {
          address: mockKuriAddress,
          abi: expect.anything(),
          functionName: "acceptUserMembershipRequest",
          args: [memberAddress],
        }
      );
    });
  });
});