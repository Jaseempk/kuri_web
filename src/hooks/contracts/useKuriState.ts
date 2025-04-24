import { useState, useCallback, useEffect } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { KuriCoreABI } from "../../contracts/abis/KuriCore";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
import { useTransactionStatus } from "../useTransactionStatus";
import {
  KuriData,
  KuriState,
  IntervalType,
  MarketTimings,
  MarketParticipation,
  KuriContractData,
} from "../../types/market";
import { useAccount } from "wagmi";
import { KURI_CONTRACT_ADDRESS } from "../../config/contracts";

// Define types based on the contract's actual structure
interface KuriDataStruct {
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
  intervalType: number;
  state: number;
}

export const useKuriState = () => {
  const { address } = useAccount();
  const [marketData, setMarketData] = useState<KuriDataStruct | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const rawData = await readContract(config, {
        abi: KuriCoreABI,
        address: KURI_CONTRACT_ADDRESS,
        functionName: "kuriData",
      });

      // Convert numeric values to appropriate types
      const data: KuriDataStruct = {
        ...rawData,
        kuriAmount: BigInt(rawData.kuriAmount.toString()),
        nexRaffleTime: BigInt(rawData.nexRaffleTime.toString()),
        nextIntervalDepositTime: BigInt(
          rawData.nextIntervalDepositTime.toString()
        ),
        launchPeriod: BigInt(rawData.launchPeriod.toString()),
        startTime: BigInt(rawData.startTime.toString()),
        endTime: BigInt(rawData.endTime.toString()),
      };

      setMarketData(data);
    } catch (err) {
      console.error("Error fetching market data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch market data"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeKuri = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");

    try {
      setIsLoading(true);
      setError(null);

      const { request } = await simulateContract(config, {
        address: KURI_CONTRACT_ADDRESS,
        abi: KuriCoreABI,
        functionName: "initialiseKuri",
        account: address,
      });

      await writeContract(config, request);
      await fetchMarketData();
    } catch (err) {
      console.error("Error initializing kuri:", err);
      setError(
        err instanceof Error ? err.message : "Failed to initialize kuri"
      );
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, fetchMarketData]);

  const deposit = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!marketData) throw new Error("Market data not loaded");

    try {
      setIsLoading(true);
      setError(null);

      const { request } = await simulateContract(config, {
        address: KURI_CONTRACT_ADDRESS,
        abi: KuriCoreABI,
        functionName: "userInstallmentDeposit",
        account: address,
      });

      await writeContract(config, request);
      await fetchMarketData();
    } catch (err) {
      console.error("Error depositing:", err);
      setError(err instanceof Error ? err.message : "Failed to deposit");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [address, marketData, fetchMarketData]);

  const claimWinnings = useCallback(
    async (intervalIndex: number) => {
      if (!address) throw new Error("Wallet not connected");
      if (!marketData) throw new Error("Market data not loaded");

      try {
        setIsLoading(true);
        setError(null);

        const { request } = await simulateContract(config, {
          address: KURI_CONTRACT_ADDRESS,
          abi: KuriCoreABI,
          functionName: "claimKuriAmount",
          args: [intervalIndex],
          account: address,
        });

        await writeContract(config, request);
        await fetchMarketData();
      } catch (err) {
        console.error("Error claiming winnings:", err);
        setError(
          err instanceof Error ? err.message : "Failed to claim winnings"
        );
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [address, marketData, fetchMarketData]
  );

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    marketData,
    isLoading,
    error,
    initializeKuri,
    deposit,
    claimWinnings,
    refetch: fetchMarketData,
  };
};
