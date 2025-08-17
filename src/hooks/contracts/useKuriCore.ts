import { useState, useCallback, useEffect } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { KuriCoreABI } from "../../contracts/abis/KuriCoreV1";
import { ERC20ABI } from "../../contracts/abis/ERC20";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
import { useTransactionStatus } from "../useTransactionStatus";

import { calculateApprovalAmount } from "../../utils/tokenUtils";

export enum KuriState {
  INLAUNCH,
  LAUNCHFAILED,
  ACTIVE,
  COMPLETED,
}

export enum IntervalType {
  WEEK,
  MONTH,
}

// Type definition for the contract's kuriData return tuple
// Based on the actual contract return types
type KuriDataTuple = readonly [
  `0x${string}`, // creator
  bigint, // kuriAmount
  number, // totalParticipantsCount
  number, // totalActiveParticipantsCount
  number, // intervalDuration
  number, // nexRaffleTime (contract returns as number)
  number, // nextIntervalDepositTime (contract returns as number)
  number, // launchPeriod (contract returns as number)
  number, // startTime (contract returns as number)
  number, // endTime (contract returns as number)
  number, // intervalType
  number // state
];

interface KuriData {
  creator: `0x${string}`;
  kuriAmount: bigint;
  totalParticipantsCount: number;
  totalActiveParticipantsCount: number;
  intervalDuration: number;
  nexRaffleTime: bigint;
  nextIntervalDepositTime: bigint;
  launchPeriod: bigint;
  startTime: bigint;
  endTime: bigint;
  intervalType: IntervalType;
  state: KuriState;
}

export const useKuriCore = (kuriAddress?: `0x${string}`) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketData, setMarketData] = useState<KuriData | null>(null);
  const [tokenAddress, setTokenAddress] = useState<`0x${string}` | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [userPaymentStatus, setUserPaymentStatus] = useState<boolean | null>(
    null
  );
  const [userBalance, setUserBalance] = useState<bigint>(BigInt(0));
  const [currentInterval, setCurrentInterval] = useState<number>(0);

  const account = getAccount(config);
  const { handleTransaction } = useTransactionStatus();

  // Fetch token address from the contract
  const fetchTokenAddress = useCallback(async () => {
    if (!kuriAddress) return;

    try {
      const address = await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "circleCurrency",
      });
      setTokenAddress(address as `0x${string}`);
    } catch (err) {
      console.error("Failed to fetch token address:", err);
    }
  }, [kuriAddress]);

  // Check token allowance
  const checkAllowance = useCallback(async (): Promise<bigint> => {
    if (!kuriAddress || !account.address || !tokenAddress) {
      return BigInt(0);
    }

    try {
      const allowance = await readContract(config, {
        address: tokenAddress,
        abi: ERC20ABI,
        functionName: "allowance",
        args: [account.address, kuriAddress],
      });
      return allowance as bigint;
    } catch (err) {
      console.error("Failed to check allowance:", err);
      return BigInt(0);
    }
  }, [kuriAddress, account.address, tokenAddress]);

  // Check user's token balance
  const checkUserBalance = useCallback(async (): Promise<bigint> => {
    if (!account.address || !tokenAddress) {
      return BigInt(0);
    }

    try {
      const balance = await readContract(config, {
        address: tokenAddress,
        abi: ERC20ABI,
        functionName: "balanceOf",
        args: [account.address],
      });

      const balanceAmount = balance as bigint;
      setUserBalance(balanceAmount);
      return balanceAmount;
    } catch (err) {
      console.error("Failed to check user balance:", err);
      setUserBalance(BigInt(0));
      return BigInt(0);
    }
  }, [account.address, tokenAddress]);

  // Approve tokens
  const approveTokens = useCallback(
    async (amount: bigint) => {
      if (!kuriAddress || !account.address || !tokenAddress) {
        throw new Error("Invalid parameters for token approval");
      }

      setIsApproving(true);
      try {
        const { request } = await simulateContract(config, {
          address: tokenAddress,
          abi: ERC20ABI,
          functionName: "approve",
          args: [kuriAddress, amount],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: "Approving tokens...",
          successMessage: "Token approval successful!",
          errorMessage: "Failed to approve tokens",
        });

        return tx;
      } catch (error) {
        throw handleContractError(error);
      } finally {
        setIsApproving(false);
      }
    },
    [kuriAddress, account.address, tokenAddress, handleTransaction]
  );

  // Check if user has paid for current interval
  const checkUserPaymentStatus = useCallback(async (): Promise<boolean> => {
    if (!kuriAddress || !account.address || !marketData) {
      return false;
    }

    // Only check payment status for ACTIVE markets
    if (marketData.state !== 2) {
      // Not ACTIVE
      setUserPaymentStatus(null);
      return false;
    }

    // Only check if we're past the next deposit time
    const currentTime = Math.floor(Date.now() / 1000);
    const nextDepositTime = Number(marketData.nextIntervalDepositTime);

    if (currentTime < nextDepositTime) {
      setUserPaymentStatus(null);
      return false;
    }

    try {
      // 🔥 NEW: Check if user is an accepted member first
      const userData = await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "userToData",
        args: [account.address],
      });

      const membershipStatus = (userData as any)[0];

      // If user is not an accepted member (status !== 1), skip payment check
      if (membershipStatus !== 1) {
        setUserPaymentStatus(null);
        return false;
      }

      // Get current interval index (returns uint16)
      const intervalCounter = (await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "passedIntervalsCounter",
      })) as number;

      // Validate interval index - if it's unreasonably high, skip payment check
      // This happens due to a contract bug where passedIntervalsCounter() calculates
      // (block.timestamp - 0) for INLAUNCH markets where startTime is uninitialized
      if (intervalCounter < 0 || intervalCounter > 1000) {
        console.warn(
          `Invalid interval counter for market ${kuriAddress}: ${intervalCounter}. This is likely an INLAUNCH market with uninitialized startTime.`
        );
        setUserPaymentStatus(null);
        return false;
      }

      // Store current interval for UI components
      setCurrentInterval(intervalCounter);

      // Convert to bigint for hasPaid function (which expects uint256)
      const currentIntervalIndex = BigInt(intervalCounter);

      // Check if user has paid for this interval
      const hasPaid = (await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "hasPaid",
        args: [account.address, currentIntervalIndex],
      })) as boolean;

      setUserPaymentStatus(hasPaid);
      return hasPaid;
    } catch (err) {
      console.error("Failed to check payment status:", err);
      setUserPaymentStatus(null);
      return false;
    }
  }, [kuriAddress, account.address, marketData]);

  // 🔥 NEW: Explicit method for components to call when they need payment status
  const checkPaymentStatusIfMember = useCallback(async (): Promise<boolean> => {
    if (!kuriAddress || !account.address || !marketData) {
      return false;
    }

    // Only check for ACTIVE markets
    if (marketData.state !== 2) {
      return false;
    }

    // Call the internal payment status check
    return checkUserPaymentStatus();
  }, [kuriAddress, account.address, marketData, checkUserPaymentStatus]);

  // Refresh user-specific data (payment status and balance)
  const refreshUserData = useCallback(async (): Promise<void> => {
    if (!account.address) return;

    try {
      await Promise.all([checkUserPaymentStatus(), checkUserBalance()]);
    } catch (err) {
      console.error("Failed to refresh user data:", err);
    }
  }, [account.address]);

  // Enhanced fetchMarketData to also check payment status
  const fetchMarketData = useCallback(async () => {
    if (!kuriAddress) return;
    setIsLoading(true);
    setError(null);

    try {
      const data = await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "kuriData",
      });

      const marketTuple = data as KuriDataTuple;
      setMarketData({
        creator: marketTuple[0],
        kuriAmount: marketTuple[1],
        totalParticipantsCount: marketTuple[2],
        totalActiveParticipantsCount: marketTuple[3],
        intervalDuration: marketTuple[4],
        nexRaffleTime: BigInt(marketTuple[5]),
        nextIntervalDepositTime: BigInt(marketTuple[6]),
        launchPeriod: BigInt(marketTuple[7]),
        startTime: BigInt(marketTuple[8]),
        endTime: BigInt(marketTuple[9]),
        intervalType: marketTuple[10],
        state: marketTuple[11],
      });
    } catch (err) {
      setError(handleContractError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, [kuriAddress, account.address]);

  // Check payment status and balance when market becomes active or user changes
  useEffect(() => {
    // Only check balance for active markets with connected users
    if (marketData?.state === 2 && account.address) {
      checkUserBalance(); // Keep this - safe for all users
      // checkUserPaymentStatus(); ← REMOVED: Now explicit only
    }
  }, [marketData?.state, account.address]);

  // Fetch market data and token address on mount and address change
  useEffect(() => {
    fetchMarketData();
    fetchTokenAddress();
  }, [fetchMarketData, fetchTokenAddress]);

  // Initialize market
  const initializeKuri = useCallback(async () => {
    if (!kuriAddress || !account.address) throw new Error("Invalid parameters");

    try {
      const { request } = await simulateContract(config, {
        abi: KuriCoreABI,
        address: kuriAddress,
        functionName: "initialiseKuri",
      });

      const tx = await writeContract(config, request);

      await handleTransaction(tx, {
        loadingMessage: "Initializing market...",
        successMessage: "Market initialized successfully!",
        errorMessage: "Failed to initialize market",
      });

      await fetchMarketData();
      return tx;
    } catch (error) {
      throw handleContractError(error);
    }
  }, [kuriAddress, account.address, handleTransaction, fetchMarketData]);

  // Enhanced deposit function to refresh payment status after deposit
  const deposit = useCallback(async () => {
    if (!kuriAddress || !account.address || !marketData || !tokenAddress)
      throw new Error("Invalid parameters");

    try {
      const kuriAmount = marketData.kuriAmount;

      // Check if this is a first deposit (interval 1) that requires 1% fee
      const isFirstDeposit =
        currentInterval === 1 && userPaymentStatus === false;

      // Calculate required amount including fee for first deposit
      const requiredAmount = isFirstDeposit
        ? kuriAmount + kuriAmount / BigInt(100) // Add 1% fee
        : kuriAmount;

      const requiredApproval = calculateApprovalAmount(requiredAmount);
      const currentAllowance = await checkAllowance();

      if (currentAllowance < requiredAmount) {
        console.log(
          `Insufficient allowance. Current: ${currentAllowance}, Required: ${requiredAmount}${
            isFirstDeposit ? " (includes 1% fee)" : ""
          }`
        );

        await approveTokens(requiredApproval);

        const newAllowance = await checkAllowance();
        if (newAllowance < requiredAmount) {
          throw new Error(
            "Token approval failed - insufficient allowance after approval"
          );
        }
      }

      const { request } = await simulateContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "userInstallmentDeposit",
      });

      const tx = await writeContract(config, request);

      await handleTransaction(tx, {
        loadingMessage: "Processing deposit...",
        successMessage: "Deposit successful!",
        errorMessage: "Failed to make deposit",
      });

      // Refresh market data first
      await fetchMarketData();

      // Explicitly refresh user data with retry mechanism
      // Sometimes there's a slight delay before blockchain state is queryable
      let retries = 3;
      while (retries > 0) {
        try {
          await refreshUserData();
          break; // Success, exit retry loop
        } catch (err) {
          retries--;
          if (retries > 0) {
            // Wait a bit before retrying
            await new Promise((resolve) => setTimeout(resolve, 500));
          } else {
            console.error(
              "Failed to refresh user data after all retries:",
              err
            );
          }
        }
      }

      return tx;
    } catch (error) {
      throw handleContractError(error);
    }
  }, [
    kuriAddress,
    account.address,
    marketData,
    tokenAddress,
    checkAllowance,
    approveTokens,
    handleTransaction,
    fetchMarketData,
    refreshUserData,
  ]);

  // Claim amount
  const claimKuriAmount = useCallback(
    async (intervalIndex: number) => {
      if (!kuriAddress || !account.address)
        throw new Error("Invalid parameters");

      try {
        const { request } = await simulateContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "claimKuriAmount",
          args: [intervalIndex],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: "Claiming amount...",
          successMessage: "Amount claimed successfully!",
          errorMessage: "Failed to claim amount",
        });

        await fetchMarketData();
        return tx;
      } catch (error) {
        throw handleContractError(error);
      }
    },
    [kuriAddress, account.address, handleTransaction, fetchMarketData]
  );

  // Request membership
  const requestMembership = useCallback(async () => {
    if (!kuriAddress || !account.address) throw new Error("Invalid parameters");
    setIsRequesting(true);

    try {
      const { request } = await simulateContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "requestMembership",
      });

      const tx = await writeContract(config, request);

      await handleTransaction(tx, {
        loadingMessage: "Requesting membership...",
        successMessage: "Membership requested successfully!",
        errorMessage: "Failed to request membership",
      });

      // Refresh market data after successful request
      await fetchMarketData();
      return tx;
    } catch (error) {
      throw handleContractError(error);
    } finally {
      setIsRequesting(false);
    }
  }, [kuriAddress, account.address, handleTransaction, fetchMarketData]);

  // Accept member
  const acceptUserMembershipRequest = useCallback(
    async (address: `0x${string}`) => {
      if (!kuriAddress || !account.address)
        throw new Error("Invalid parameters");

      try {
        const { request } = await simulateContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "acceptUserMembershipRequest",
          args: [address],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: "Accepting member...",
          successMessage: "Member accepted successfully!",
          errorMessage: "Failed to accept member",
        });

        await fetchMarketData();
        return tx;
      } catch (error) {
        throw handleContractError(error);
      }
    },
    [kuriAddress, account.address, handleTransaction, fetchMarketData]
  );

  // Reject member
  const rejectUserMembershipRequest = useCallback(
    async (address: `0x${string}`) => {
      if (!kuriAddress || !account.address)
        throw new Error("Invalid parameters");

      try {
        const { request } = await simulateContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "rejectUserMembershipRequest",
          args: [address],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: "Rejecting member...",
          successMessage: "Member rejected successfully!",
          errorMessage: "Failed to reject member",
        });

        await fetchMarketData();
        return tx;
      } catch (error) {
        throw handleContractError(error);
      }
    },
    [kuriAddress, account.address, handleTransaction, fetchMarketData]
  );

  // Accept multiple members (V1 batch operation)
  const acceptMultipleMembers = useCallback(
    async (addresses: `0x${string}`[]) => {
      if (!kuriAddress || !account.address)
        throw new Error("Invalid parameters");
      if (addresses.length === 0) throw new Error("No addresses provided");

      try {
        const { request } = await simulateContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "acceptMultipleUserMembershipRequests",
          args: [addresses],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: `Accepting ${addresses.length} members...`,
          successMessage: `Successfully accepted ${addresses.length} members!`,
          errorMessage: "Failed to accept members",
        });

        await fetchMarketData();
        return tx;
      } catch (error) {
        throw handleContractError(error);
      }
    },
    [kuriAddress, account.address, handleTransaction, fetchMarketData]
  );

  // Get member status
  const getMemberStatus = useCallback(
    async (address: `0x${string}`) => {
      if (!kuriAddress) return null;

      try {
        const userData = await readContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "userToData",
          args: [address],
        });

        return (userData as any)[0];
      } catch (error) {
        throw handleContractError(error);
      }
    },
    [kuriAddress]
  );

  // Check if user has claimed for their winnings
  const checkHasClaimed = useCallback(
    async (userAddress: `0x${string}`) => {
      if (!kuriAddress) return false;

      try {
        const claimed = (await readContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "hasClaimed",
          args: [userAddress],
        })) as boolean;
        return claimed;
      } catch (error) {
        console.error("Failed to check claim status:", error);
        return false;
      }
    },
    [kuriAddress]
  );

  return {
    // Market data
    marketData,
    isLoading,
    error,

    // Token data
    tokenAddress,

    // State
    userPaymentStatus,
    userBalance,
    currentInterval,

    // Actions
    requestMembership,
    acceptMember: acceptUserMembershipRequest,
    acceptMultipleMembers,
    rejectMember: rejectUserMembershipRequest,
    getMemberStatus,
    initializeKuri,
    deposit,
    claimKuriAmount,
    fetchMarketData,
    checkAllowance,
    approveTokens,
    checkUserPaymentStatus,
    checkUserBalance,
    refreshUserData,
    checkPaymentStatusIfMember, // Add the new method to the return object
    checkHasClaimed,

    // Loading states
    isRequesting,
    isAccepting,
    isRejecting,
    isApproving,
  };
};
