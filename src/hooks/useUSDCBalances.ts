import { useState, useEffect, useCallback } from "react";
import { readContract } from "@wagmi/core";
import { config } from "../config/wagmi";
import { ERC20ABI } from "../contracts/abis/ERC20";

const USDC_ADDRESS = "0xC129124eA2Fd4D63C1Fc64059456D8f231eBbed1" as const;

export interface USDCBalance {
  contractAddress: string;
  balance: bigint;
}

export const useUSDCBalances = (
  contractAddresses: `0x${string}`[],
  marketStates?: number[]
) => {
  const [balances, setBalances] = useState<USDCBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Create stable string dependencies to prevent callback recreation
  const addressesKey = contractAddresses.join(",");
  const statesKey = marketStates?.join(",") || "";

  const fetchBalances = useCallback(async () => {
    if (!contractAddresses.length) {
      setBalances([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const balancePromises = contractAddresses.map(async (address, index) => {
        try {
          const balance = await readContract(config, {
            address: USDC_ADDRESS,
            abi: ERC20ABI,
            functionName: "balanceOf",
            args: [address],
          });

          return {
            contractAddress: address,
            balance: balance as bigint,
          };
        } catch (err) {
          console.error(`Error fetching USDC balance for ${address}:`, err);
          return {
            contractAddress: address,
            balance: BigInt(0),
          };
        }
      });

      const results = await Promise.all(balancePromises);
      setBalances(results);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [addressesKey, statesKey]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  // Calculate total TVL from all balances
  const totalTVL = balances.reduce(
    (acc, item) => acc + item.balance,
    BigInt(0)
  );

  return {
    balances,
    totalTVL,
    isLoading,
    error,
    refetch: fetchBalances,
  };
};
