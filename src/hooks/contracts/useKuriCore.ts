import { useState, useCallback, useEffect, useMemo } from "react";
import { readContract, writeContract, simulateContract } from "@wagmi/core";

// Debounce utility for frequent blockchain calls
const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T => {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  }) as T;
};
import { KuriCoreABI } from "../../contracts/abis/KuriCoreV1";
import { ERC20ABI } from "../../contracts/abis/ERC20";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
import { getDefaultChainId } from "../../config/contracts";
import { useTransactionStatus } from "../useTransactionStatus";

import {
  calculateApprovalAmount,
  calculateRequiredDepositAmount,
} from "../../utils/tokenUtils";
import { useAccount, useSignMessage } from "@getpara/react-sdk";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  createGasSponsoredClient,
  executeSponsoredTransaction,
} from "../../utils/gasSponsorship";
import { encodeFunctionData } from "viem";

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

  const account = useAccount();
  const { smartAddress: userAddress } = useAuthContext();
  const { handleTransaction } = useTransactionStatus();
  const { signMessageAsync } = useSignMessage();
  const chainId = getDefaultChainId(); // Use environment-configured chain (mainnet/testnet)
  

  // Fetch token address from the contract
  const fetchTokenAddress = useCallback(async () => {
    if (!kuriAddress) return;

    try {
      const address = await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "circleCurrency",
        chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
      });
      setTokenAddress(address as `0x${string}`);
    } catch (err) {
      console.error("Failed to fetch token address:", err);
    }
  }, [kuriAddress, chainId]);

  // Check token allowance
  const checkAllowance = useCallback(async (): Promise<bigint> => {
    if (!kuriAddress || !userAddress || !tokenAddress) {
      return BigInt(0);
    }

    try {
      const allowance = await readContract(config, {
        address: tokenAddress,
        abi: ERC20ABI,
        functionName: "allowance",
        args: [userAddress as `0x${string}`, kuriAddress as `0x${string}`],
        chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
      });
      return allowance as bigint;
    } catch (err) {
      console.error("Failed to check allowance:", err);
      return BigInt(0);
    }
  }, [kuriAddress, userAddress, tokenAddress]);

  // Check user's token balance
  const checkUserBalance = useCallback(async (): Promise<bigint> => {
    if (!userAddress || !tokenAddress) {
      return BigInt(0);
    }

    try {
      const balance = await readContract(config, {
        address: tokenAddress,
        abi: ERC20ABI,
        functionName: "balanceOf",
        args: [userAddress as `0x${string}`],
        chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
      });

      const balanceAmount = balance as bigint;
      setUserBalance(balanceAmount);
      return balanceAmount;
    } catch (err) {
      console.error("Failed to check user balance:", err);
      setUserBalance(BigInt(0));
      return BigInt(0);
    }
  }, [userAddress, tokenAddress, chainId]);

  // Approve tokens
  const approveTokens = useCallback(
    async (amount: bigint) => {
      if (!kuriAddress || !userAddress || !tokenAddress) {
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
    [kuriAddress, userAddress, tokenAddress, handleTransaction]
  );

  const approveTokensSponsored = useCallback(
    async (amount: bigint) => {
      if (!kuriAddress || !userAddress || !tokenAddress) {
        throw new Error("Invalid parameters for token approval");
      }

      setIsApproving(true);

      try {
        // Get Para's wallet client
        const paraWalletClient = account.embedded.wallets?.[0];
        if (!paraWalletClient) throw new Error("Para wallet not available");

        // Create sponsored client using the helper
        const sponsoredClient = await createGasSponsoredClient({
          userAddress: paraWalletClient.address as `0x${string}`,
          paraWalletClient,
          signMessageAsync,
        });

        // Encode the contract call data for ERC20 approval
        const callData = encodeFunctionData({
          abi: ERC20ABI,
          functionName: "approve",
          args: [kuriAddress, amount],
        });

        // Execute sponsored transaction
        const txHash = await executeSponsoredTransaction({
          sponsoredClient,
          target: tokenAddress, // Target is the token contract, not KuriCore
          callData,
          operationName: "token approval",
        });

        await handleTransaction(txHash as `0x${string}`, {
          loadingMessage: "Approving tokens (gas-sponsored)...",
          successMessage: "Token approval successful! 🎉 Gas was sponsored!",
          errorMessage: "Failed to approve tokens (sponsored)",
        });

        return txHash;
      } catch (error) {
        console.error("Gas-sponsored approveTokens failed:", error);
        throw handleContractError(error);
      } finally {
        setIsApproving(false);
      }
    },
    [
      kuriAddress,
      userAddress,
      tokenAddress,
      handleTransaction,
      account,
      signMessageAsync,
    ]
  );

  // Check if user has paid for current interval
  const checkUserPaymentStatus = useCallback(async (): Promise<boolean> => {
    if (!kuriAddress || !userAddress || !marketData) {
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
        args: [userAddress as `0x${string}`],
        chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
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
        chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
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
        args: [userAddress as `0x${string}`, currentIntervalIndex],
        chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
      })) as boolean;

      setUserPaymentStatus(hasPaid);
      return hasPaid;
    } catch (err) {
      console.error("Failed to check payment status:", err);
      setUserPaymentStatus(null);
      return false;
    }
  }, [kuriAddress, userAddress, marketData, chainId]);

  const checkPaymentStatusIfMember = useCallback(async (): Promise<boolean> => {
    if (!kuriAddress || !userAddress || !marketData) {
      return false;
    }

    // Only check for ACTIVE markets
    if (marketData.state !== 2) {
      return false;
    }

    // Call the internal payment status check
    return checkUserPaymentStatus();
  }, [kuriAddress, userAddress, marketData, checkUserPaymentStatus]);

  // Refresh user-specific data (payment status and balance)
  const refreshUserData = useCallback(async (): Promise<void> => {
    if (!userAddress) return;

    try {
      await Promise.all([checkUserPaymentStatus(), checkUserBalance()]);
    } catch (err) {
      console.error("Failed to refresh user data:", err);
    }
  }, [userAddress]);

  // Enhanced fetchMarketData to also check payment status
  const fetchMarketData = useCallback(async () => {
    if (!kuriAddress) {
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const data = await readContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "kuriData",
        chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
      });

      const marketTuple = data as KuriDataTuple;
      const processedData = {
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
      };
      
      setMarketData(processedData);
      
    } catch (err) {
      const errorMessage = handleContractError(err).message;
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [kuriAddress, chainId]);

  // 🔒 MEMOIZE marketData to prevent object recreation causing infinite re-renders
  const memoizedMarketData = useMemo(() => {
    if (!marketData) return null;
    
    // Create stable object with same structure to break re-render cascade
    return {
      creator: marketData.creator,
      kuriAmount: marketData.kuriAmount,
      totalParticipantsCount: marketData.totalParticipantsCount,
      totalActiveParticipantsCount: marketData.totalActiveParticipantsCount,
      intervalDuration: marketData.intervalDuration,
      nexRaffleTime: marketData.nexRaffleTime,
      nextIntervalDepositTime: marketData.nextIntervalDepositTime,
      launchPeriod: marketData.launchPeriod,
      startTime: marketData.startTime,
      endTime: marketData.endTime,
      intervalType: marketData.intervalType,
      state: marketData.state,
    };
  }, [
    marketData?.creator,
    marketData?.kuriAmount,
    marketData?.totalParticipantsCount,
    marketData?.totalActiveParticipantsCount,
    marketData?.intervalDuration,
    marketData?.nexRaffleTime?.toString(),
    marketData?.nextIntervalDepositTime?.toString(),
    marketData?.launchPeriod?.toString(),
    marketData?.startTime?.toString(),
    marketData?.endTime?.toString(),
    marketData?.intervalType,
    marketData?.state,
  ]);

  // Check payment status and balance when market becomes active or user changes
  useEffect(() => {
    // Only check balance for active markets with connected users
    if (marketData?.state === 2 && userAddress) {
      checkUserBalance(); // Keep this - safe for all users
      // checkUserPaymentStatus(); ← REMOVED: Now explicit only
    }
  }, [marketData?.state, userAddress]);

  // Fetch market data and token address on mount and address change
  useEffect(() => {
    fetchMarketData();
    fetchTokenAddress();
  }, [kuriAddress, chainId]); // 🔥 FIX: Use direct dependencies instead of callback references

  // Initialize market
  const initializeKuri = useCallback(async () => {
    if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");

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
  }, [kuriAddress, userAddress, handleTransaction, fetchMarketData]);

  // Enhanced deposit function to refresh payment status after deposit
  const deposit = useCallback(async () => {
    if (!kuriAddress || !userAddress || !marketData || !tokenAddress)
      throw new Error("Invalid parameters");

    try {
      // Check if this is a first deposit (interval 1) that requires 1% fee
      const isFirstDeposit =
        currentInterval === 1 && userPaymentStatus === false;

      // Calculate required amount including fee for first deposit
      const requiredAmount = calculateRequiredDepositAmount(
        marketData.kuriAmount,
        marketData.totalParticipantsCount,
        isFirstDeposit
      );

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
    userAddress,
    marketData,
    tokenAddress,
    currentInterval,
    userPaymentStatus,
    checkAllowance,
    approveTokens,
    handleTransaction,
    fetchMarketData,
    refreshUserData,
  ]);

  // 🚀 NEW: Gas-sponsored deposit using Alchemy Account Kit (MOST COMPLEX)
  const depositSponsored = useCallback(async () => {
    if (!kuriAddress || !userAddress || !marketData || !tokenAddress)
      throw new Error("Invalid parameters");

    setIsLoading(true);
    try {
      // Check if this is a first deposit (interval 1) that requires 1% fee
      const isFirstDeposit =
        currentInterval === 1 && userPaymentStatus === false;

      // Calculate required amount including fee for first deposit
      const requiredAmount = calculateRequiredDepositAmount(
        marketData.kuriAmount,
        marketData.totalParticipantsCount,
        isFirstDeposit
      );

      const requiredApproval = calculateApprovalAmount(requiredAmount);
      const currentAllowance = await checkAllowance();

      // Get Para's wallet client
      const paraWalletClient = account.embedded.wallets?.[0];
      if (!paraWalletClient) throw new Error("Para wallet not available");

      // Create sponsored client using the helper
      const sponsoredClient = await createGasSponsoredClient({
        userAddress: paraWalletClient.address as `0x${string}`,
        paraWalletClient,
        signMessageAsync,
      });

      // STEP 1: Handle token approval if needed (gas-sponsored)
      if (currentAllowance < requiredAmount) {
        console.log(
          `🎫 Insufficient allowance. Current: ${currentAllowance}, Required: ${requiredAmount}${
            isFirstDeposit ? " (includes 1% fee)" : ""
          }`
        );

        // Encode the contract call data for ERC20 approval
        const approveCallData = encodeFunctionData({
          abi: ERC20ABI,
          functionName: "approve",
          args: [kuriAddress, requiredApproval],
        });

        // Execute sponsored approve transaction
        await executeSponsoredTransaction({
          sponsoredClient,
          target: tokenAddress,
          callData: approveCallData,
          operationName: "approval",
        });

        // Verify approval was successful
        const newAllowance = await checkAllowance();
        if (newAllowance < requiredAmount) {
          throw new Error(
            "Token approval failed - insufficient allowance after approval"
          );
        }

        console.log(
          `✅ Token approval successful! New allowance: ${newAllowance}`
        );
      } else {
        console.log(
          "✅ Sufficient allowance already available, skipping approval"
        );
      }

      // STEP 2: Execute the deposit (gas-sponsored)
      const depositCallData = encodeFunctionData({
        abi: KuriCoreABI,
        functionName: "userInstallmentDeposit",
        args: [],
      });

      // Execute sponsored deposit transaction
      const depositTxHash = await executeSponsoredTransaction({
        sponsoredClient,
        target: kuriAddress,
        callData: depositCallData,
        operationName: "deposit",
      });

      console.log(
        "🎉 Both approval and deposit gas fees sponsored by Alchemy Gas Manager!"
      );

      await handleTransaction(depositTxHash as `0x${string}`, {
        loadingMessage: "Processing deposit (gas-sponsored)...",
        successMessage: "Deposit successful! 🎉 Gas was sponsored!",
        errorMessage: "Failed to make deposit (sponsored)",
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

      return depositTxHash;
    } catch (error) {
      console.error("Gas-sponsored deposit failed:", error);
      throw handleContractError(error);
    } finally {
      setIsLoading(false);
    }
  }, [
    kuriAddress,
    userAddress,
    marketData,
    tokenAddress,
    currentInterval,
    userPaymentStatus,
    checkAllowance,
    handleTransaction,
    fetchMarketData,
    refreshUserData,
    account,
    signMessageAsync,
  ]);

  // Claim amount
  const claimKuriAmount = useCallback(
    async (intervalIndex: number) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");

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
    [kuriAddress, userAddress, handleTransaction, fetchMarketData]
  );

  // 🚀 NEW: Gas-sponsored claim Kuri amount using Alchemy Account Kit
  const claimKuriAmountSponsored = useCallback(
    async (intervalIndex: number) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");

      try {
        // Get Para's wallet client
        const paraWalletClient = account.embedded.wallets?.[0];
        if (!paraWalletClient) throw new Error("Para wallet not available");

        // Create sponsored client using the helper
        const sponsoredClient = await createGasSponsoredClient({
          userAddress: paraWalletClient.address as `0x${string}`,
          paraWalletClient,
          signMessageAsync,
        });

        // Encode the contract call data
        const callData = encodeFunctionData({
          abi: KuriCoreABI,
          functionName: "claimKuriAmount",
          args: [intervalIndex],
        });

        // Execute sponsored transaction
        const txHash = await executeSponsoredTransaction({
          sponsoredClient,
          target: kuriAddress,
          callData,
          operationName: "claimKuriAmount",
        });

        await handleTransaction(txHash as `0x${string}`, {
          loadingMessage: "Claiming amount (gas-sponsored)...",
          successMessage: "Amount claimed successfully! 🎉 Gas was sponsored!",
          errorMessage: "Failed to claim amount (sponsored)",
        });

        // Refresh market data after successful claim
        await fetchMarketData();
        return txHash;
      } catch (error) {
        console.error("Gas-sponsored claimKuriAmount failed:", error);
        throw handleContractError(error);
      }
    },
    [
      kuriAddress,
      userAddress,
      handleTransaction,
      fetchMarketData,
      account,
      signMessageAsync,
    ]
  );

  // Request membership with Para-compatible Wagmi hooks (ORIGINAL)
  const requestMembership = useCallback(async () => {
    if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");
    setIsRequesting(true);

    try {
      // Use simulateContract and writeContract from @wagmi/core (Para compatible)
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
  }, [kuriAddress, userAddress, handleTransaction, fetchMarketData]);

  // 🚀 NEW: Gas-sponsored request membership using Alchemy Account Kit
  const requestMembershipSponsored = useCallback(async () => {
    if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");
    setIsRequesting(true);

    try {
      // Get Para's wallet client
      const paraWalletClient = account.embedded.wallets?.[0];
      if (!paraWalletClient) throw new Error("Para wallet not available");

      // Create sponsored client using the helper
      const sponsoredClient = await createGasSponsoredClient({
        userAddress: paraWalletClient.address as `0x${string}`,
        paraWalletClient,
        signMessageAsync,
      });

      // Encode the contract call data
      const callData = encodeFunctionData({
        abi: KuriCoreABI,
        functionName: "requestMembership",
        args: [], // requestMembership takes no parameters
      });

      // Execute sponsored transaction
      const txHash = await executeSponsoredTransaction({
        sponsoredClient,
        target: kuriAddress,
        callData,
        operationName: "requestMembership",
      });

      await handleTransaction(txHash as `0x${string}`, {
        loadingMessage: "Requesting membership (gas-sponsored)...",
        successMessage:
          "Membership requested successfully! 🎉 Gas was sponsored!",
        errorMessage: "Failed to request membership (sponsored)",
      });

      // Refresh market data after successful request
      await fetchMarketData();
      return txHash;
    } catch (error) {
      console.error("Gas-sponsored transaction failed:", error);
      throw handleContractError(error);
    } finally {
      setIsRequesting(false);
    }
  }, [
    kuriAddress,
    userAddress,
    handleTransaction,
    fetchMarketData,
    account,
    signMessageAsync,
  ]);

  // 🚀 NEW: Gas-sponsored accept member using Alchemy Account Kit
  const acceptUserMembershipRequestSponsored = useCallback(
    async (memberAddress: `0x${string}`) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");
      setIsAccepting(true);

      try {
        // Get Para's wallet client
        const paraWalletClient = account.embedded.wallets?.[0];
        if (!paraWalletClient) throw new Error("Para wallet not available");

        // Create sponsored client using the helper
        const sponsoredClient = await createGasSponsoredClient({
          userAddress: paraWalletClient.address as `0x${string}`,
          paraWalletClient,
          signMessageAsync,
        });

        // Encode the contract call data
        const callData = encodeFunctionData({
          abi: KuriCoreABI,
          functionName: "acceptUserMembershipRequest",
          args: [memberAddress],
        });

        // Execute sponsored transaction
        const txHash = await executeSponsoredTransaction({
          sponsoredClient,
          target: kuriAddress,
          callData,
          operationName: "acceptMember",
        });

        await handleTransaction(txHash as `0x${string}`, {
          loadingMessage: "Accepting member (gas-sponsored)...",
          successMessage: "Member accepted successfully! 🎉 Gas was sponsored!",
          errorMessage: "Failed to accept member (sponsored)",
        });

        // Refresh market data after successful request
        await fetchMarketData();
        return txHash;
      } catch (error) {
        console.error("Gas-sponsored acceptMember failed:", error);
        throw handleContractError(error);
      } finally {
        setIsAccepting(false);
      }
    },
    [
      kuriAddress,
      userAddress,
      handleTransaction,
      fetchMarketData,
      account,
      signMessageAsync,
    ]
  );

  // 🚀 NEW: Gas-sponsored reject member using Alchemy Account Kit
  const rejectUserMembershipRequestSponsored = useCallback(
    async (memberAddress: `0x${string}`) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");
      setIsRejecting(true);

      try {
        // Get Para's wallet client
        const paraWalletClient = account.embedded.wallets?.[0];
        if (!paraWalletClient) throw new Error("Para wallet not available");

        // Create sponsored client using the helper
        const sponsoredClient = await createGasSponsoredClient({
          userAddress: paraWalletClient.address as `0x${string}`,
          paraWalletClient,
          signMessageAsync,
        });

        // Encode the contract call data
        const callData = encodeFunctionData({
          abi: KuriCoreABI,
          functionName: "rejectUserMembershipRequest",
          args: [memberAddress],
        });

        // Execute sponsored transaction
        const txHash = await executeSponsoredTransaction({
          sponsoredClient,
          target: kuriAddress,
          callData,
          operationName: "rejectMember",
        });

        await handleTransaction(txHash as `0x${string}`, {
          loadingMessage: "Rejecting member (gas-sponsored)...",
          successMessage: "Member rejected successfully! 🎉 Gas was sponsored!",
          errorMessage: "Failed to reject member (sponsored)",
        });

        // Refresh market data after successful request
        await fetchMarketData();
        return txHash;
      } catch (error) {
        console.error("Gas-sponsored rejectMember failed:", error);
        throw handleContractError(error);
      } finally {
        setIsRejecting(false);
      }
    },
    [
      kuriAddress,
      userAddress,
      handleTransaction,
      fetchMarketData,
      account,
      signMessageAsync,
    ]
  );

  // 🚀 NEW: Gas-sponsored accept multiple members using Alchemy Account Kit
  const acceptMultipleMembersSponsored = useCallback(
    async (addresses: `0x${string}`[]) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");
      if (addresses.length === 0) throw new Error("No addresses provided");
      setIsAccepting(true);

      try {
        // Get Para's wallet client
        const paraWalletClient = account.embedded.wallets?.[0];
        if (!paraWalletClient) throw new Error("Para wallet not available");

        // Create sponsored client using the helper
        const sponsoredClient = await createGasSponsoredClient({
          userAddress: paraWalletClient.address as `0x${string}`,
          paraWalletClient,
          signMessageAsync,
        });

        // Encode the contract call data
        const callData = encodeFunctionData({
          abi: KuriCoreABI,
          functionName: "acceptMultipleUserMembershipRequests",
          args: [addresses],
        });

        // Execute sponsored transaction
        const txHash = await executeSponsoredTransaction({
          sponsoredClient,
          target: kuriAddress,
          callData,
          operationName: "acceptMultipleMembers",
        });

        await handleTransaction(txHash as `0x${string}`, {
          loadingMessage: `Accepting ${addresses.length} members (gas-sponsored)...`,
          successMessage: `Successfully accepted ${addresses.length} members! 🎉 Gas was sponsored!`,
          errorMessage: "Failed to accept members (sponsored)",
        });

        // Refresh market data after successful request
        await fetchMarketData();
        return txHash;
      } catch (error) {
        console.error("Gas-sponsored acceptMultipleMembers failed:", error);
        throw handleContractError(error);
      } finally {
        setIsAccepting(false);
      }
    },
    [
      kuriAddress,
      userAddress,
      handleTransaction,
      fetchMarketData,
      account,
      signMessageAsync,
    ]
  );

  // 🚀 NEW: Gas-sponsored initialize Kuri using Alchemy Account Kit
  const initializeKuriSponsored = useCallback(async () => {
    if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");

    try {
      // Get Para's wallet client
      const paraWalletClient = account.embedded.wallets?.[0];
      if (!paraWalletClient) throw new Error("Para wallet not available");

      // Create sponsored client using the helper
      const sponsoredClient = await createGasSponsoredClient({
        userAddress: paraWalletClient.address as `0x${string}`,
        paraWalletClient,
        signMessageAsync,
      });

      // Encode the contract call data
      const callData = encodeFunctionData({
        abi: KuriCoreABI,
        functionName: "initialiseKuri",
        args: [],
      });

      // Execute sponsored transaction
      const txHash = await executeSponsoredTransaction({
        sponsoredClient,
        target: kuriAddress,
        callData,
        operationName: "initializeKuri",
      });

      await handleTransaction(txHash as `0x${string}`, {
        loadingMessage: "Initializing market (gas-sponsored)...",
        successMessage:
          "Market initialized successfully! 🎉 Gas was sponsored!",
        errorMessage: "Failed to initialize market (sponsored)",
      });

      // Refresh market data after successful initialization
      await fetchMarketData();
      return txHash;
    } catch (error) {
      console.error("Gas-sponsored initializeKuri failed:", error);
      throw handleContractError(error);
    }
  }, [
    kuriAddress,
    userAddress,
    handleTransaction,
    fetchMarketData,
    account,
    signMessageAsync,
  ]);

  // Accept member
  const acceptUserMembershipRequest = useCallback(
    async (address: `0x${string}`) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");

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
    [kuriAddress, userAddress, handleTransaction, fetchMarketData]
  );

  // Reject member
  const rejectUserMembershipRequest = useCallback(
    async (address: `0x${string}`) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");

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
    [kuriAddress, userAddress, handleTransaction, fetchMarketData]
  );

  // Accept multiple members (V1 batch operation)
  const acceptMultipleMembers = useCallback(
    async (addresses: `0x${string}`[]) => {
      if (!kuriAddress || !userAddress) throw new Error("Invalid parameters");
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
    [kuriAddress, userAddress, handleTransaction, fetchMarketData]
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
          chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
        });

        return (userData as any)[0];
      } catch (error) {
        throw handleContractError(error);
      }
    },
    [kuriAddress, chainId]
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
          chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
        })) as boolean;
        return claimed;
      } catch (error) {
        console.error("Failed to check claim status:", error);
        return false;
      }
    },
    [kuriAddress, chainId]
  );

  // Create debounced versions of frequently called functions
  const debouncedCheckUserPaymentStatus = useMemo(
    () => debounce(checkUserPaymentStatus, 1000),
    [checkUserPaymentStatus]
  );

  const debouncedCheckUserBalance = useMemo(
    () => debounce(checkUserBalance, 1000),
    [checkUserBalance]
  );

  return {
    // Market data
    marketData: memoizedMarketData,
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
    requestMembershipSponsored, // 🚀 NEW: Gas-sponsored version
    acceptMember: acceptUserMembershipRequest,
    acceptMemberSponsored: acceptUserMembershipRequestSponsored, // 🚀 NEW: Gas-sponsored version
    acceptMultipleMembers,
    acceptMultipleMembersSponsored, // 🚀 NEW: Gas-sponsored version
    rejectMember: rejectUserMembershipRequest,
    rejectMemberSponsored: rejectUserMembershipRequestSponsored, // 🚀 NEW: Gas-sponsored version
    getMemberStatus,
    initializeKuri,
    initializeKuriSponsored, // 🚀 NEW: Gas-sponsored version
    deposit,
    depositSponsored, // 🚀 NEW: Gas-sponsored version (most complex)
    claimKuriAmount,
    claimKuriAmountSponsored, // 🚀 NEW: Gas-sponsored version
    fetchMarketData,
    checkAllowance,
    approveTokens,
    approveTokensSponsored, // 🚀 NEW: Gas-sponsored version
    checkUserPaymentStatus,
    checkUserBalance,
    // Debounced versions for performance
    debouncedCheckUserPaymentStatus,
    debouncedCheckUserBalance,
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
