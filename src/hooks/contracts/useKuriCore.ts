import { useState, useCallback, useEffect } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { KuriCoreABI } from "../../contracts/abis/KuriCore";
import { ERC20ABI } from "../../contracts/abis/ERC20";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
import { useTransactionStatus } from "../useTransactionStatus";
import { parseUnits } from "viem";
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

  const account = getAccount(config);
  const { handleTransaction } = useTransactionStatus();

  // Fetch token address from the contract
  const fetchTokenAddress = useCallback(async () => {
    if (!kuriAddress) return;

    try {
      const address = await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "SUPPORTED_TOKEN",
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

      // Convert to bigint for hasPaid function (which expects uint256)
      const currentIntervalIndex = BigInt(intervalCounter);
      console.log("currentIntervalIndex:", currentIntervalIndex);

      // Check if user has paid for this interval
      const hasPaid = (await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "hasPaid",
        args: [account.address, currentIntervalIndex],
      })) as boolean;
      console.log("currentintervalIndex:", currentIntervalIndex);
      console.log("hasPaid:", hasPaid);

      setUserPaymentStatus(hasPaid);
      return hasPaid;
    } catch (err) {
      console.error("Failed to check payment status:", err);
      setUserPaymentStatus(null);
      return false;
    }
  }, [kuriAddress, account.address, marketData]);

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

      setMarketData({
        creator: data[0],
        kuriAmount: BigInt(data[1]),
        totalParticipantsCount: Number(data[2]),
        totalActiveParticipantsCount: Number(data[3]),
        intervalDuration: Number(data[4]),
        nexRaffleTime: BigInt(data[5]),
        nextIntervalDepositTime: BigInt(data[6]),
        launchPeriod: BigInt(data[7]),
        startTime: BigInt(data[8]),
        endTime: BigInt(data[9]),
        intervalType: data[10],
        state: data[11],
      });

      // Only check payment status and balance if user is connected and market is active
      // This reduces unnecessary blockchain calls for markets the user isn't involved in
      if (account.address && data[11] === 2) {
        // Only for ACTIVE markets
        await checkUserPaymentStatus();
        await checkUserBalance();
      }
    } catch (err) {
      setError(handleContractError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, [kuriAddress, account.address]);

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
      const requiredApproval = calculateApprovalAmount(kuriAmount);

      const currentAllowance = await checkAllowance();

      if (currentAllowance < kuriAmount) {
        console.log(
          `Insufficient allowance. Current: ${currentAllowance}, Required: ${kuriAmount}`
        );

        await approveTokens(requiredApproval);

        const newAllowance = await checkAllowance();
        if (newAllowance < kuriAmount) {
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

        return userData[0];
      } catch (error) {
        throw handleContractError(error);
      }
    },
    [kuriAddress]
  );

  // Fetch market data and token address on mount and address change
  useEffect(() => {
    fetchMarketData();
    fetchTokenAddress();
  }, [fetchMarketData, fetchTokenAddress]);

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

    // Actions
    requestMembership,
    acceptMember: acceptUserMembershipRequest,
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

    // Loading states
    isRequesting,
    isAccepting,
    isRejecting,
    isApproving,
  };
};
