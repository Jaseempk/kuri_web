import { readContract } from "@wagmi/core";
import { KuriCoreABI } from "../contracts/abis/KuriCore";
import { config } from "../config/wagmi";
import { getDefaultChainId } from "../config/contracts";
import { useCallback, useEffect, useState } from "react";

interface KuriData {
  creator: string;
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

export const useMultipleKuriData = (marketAddresses: `0x${string}`[]) => {
  const [kuriDataResults, setKuriDataResults] = useState<(KuriData | null)[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const chainId = getDefaultChainId(); // Use environment-configured chain (mainnet/testnet)

  const fetchKuriData = useCallback(async () => {
    if (!marketAddresses.length) {
      setKuriDataResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        marketAddresses.map(async (address) => {
          try {
            const data = await readContract(config, {
              address,
              abi: KuriCoreABI,
              functionName: "kuriData",
              chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
            });

            return {
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
            };
          } catch (err) {
            console.error(`Error fetching data for ${address}:`, err);
            return null;
          }
        })
      );

      setKuriDataResults(results);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [marketAddresses, chainId]);

  useEffect(() => {
    fetchKuriData();
  }, [fetchKuriData]);

  return {
    data: kuriDataResults,
    isLoading,
    error,
    refetch: fetchKuriData,
  };
};
