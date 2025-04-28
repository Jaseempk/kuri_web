import { useState, useCallback, useEffect } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { KuriCoreABI } from "../../contracts/abis/KuriCore";
import { handleContractError } from "../../utils/errors";
import { config } from "../../providers/Web3Provider";
import { useTransactionStatus } from "../useTransactionStatus";

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

  const account = getAccount(config);
  const { handleTransaction } = useTransactionStatus();

  // Fetch market data
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
    } catch (err) {
      setError(handleContractError(err).message);
    } finally {
      setIsLoading(false);
    }
  }, [kuriAddress]);

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

  // Make deposit
  const deposit = useCallback(async () => {
    if (!kuriAddress || !account.address || !marketData)
      throw new Error("Invalid parameters");

    try {
      const { request } = await simulateContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "userInstallmentDeposit",
      });

      const tx = await writeContract(config, request);

      await handleTransaction(tx, {
        loadingMessage: "Making deposit...",
        successMessage: "Deposit successful!",
        errorMessage: "Failed to make deposit",
      });

      await fetchMarketData();
      return tx;
    } catch (error) {
      throw handleContractError(error);
    }
  }, [
    kuriAddress,
    account.address,
    marketData,
    handleTransaction,
    fetchMarketData,
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

      return tx;
    } catch (error) {
      throw handleContractError(error);
    } finally {
      setIsRequesting(false);
    }
  }, [kuriAddress, account.address, handleTransaction]);

  // Accept member
  const acceptMember = useCallback(
    async (address: `0x${string}`) => {
      if (!kuriAddress || !account.address)
        throw new Error("Invalid parameters");

      console.log("acceptMember address:", address);

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
  const rejectMember = useCallback(
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

  // Fetch market data on mount and address change
  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    // Market data
    marketData,
    isLoading,
    error,

    // Actions
    requestMembership,
    acceptMember,
    rejectMember,
    getMemberStatus,
    initializeKuri,
    deposit,
    claimKuriAmount,

    // Loading states
    isRequesting,
    isAccepting,
    isRejecting,
  };
};
