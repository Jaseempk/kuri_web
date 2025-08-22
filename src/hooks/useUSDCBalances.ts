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
          // Add additional validation for the contract address
          if (!address || !address.startsWith('0x') || address.length !== 42) {
            console.warn(`Invalid contract address: ${address}`);
            return {
              contractAddress: address,
              balance: BigInt(0),
            };
          }

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
          // Check if this is a user rejection error and handle it silently
          if (err instanceof Error && err.message.includes("User rejected")) {
            console.warn(`User rejected request for ${address}:`, err);
          } else {
            console.error(`Error fetching USDC balance for ${address}:`, err);
          }
          return {
            contractAddress: address,
            balance: BigInt(0),
          };
        }
      });

      const results = await Promise.all(balancePromises);
      setBalances(results);
    } catch (err) {
      // Handle user rejection errors more gracefully
      if (err instanceof Error && err.message.includes("User rejected")) {
        console.warn("User rejected USDC balance request:", err);
        // Don't set this as an error since it's expected behavior
        setBalances([]);
      } else {
        setError(err as Error);
      }
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

// Hook for fetching user's USDC balance
export const useUserUSDCBalance = (userAddress: `0x${string}` | undefined) => {
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserBalance = useCallback(async () => {
    if (!userAddress) {
      setBalance(BigInt(0));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Validate user address
      if (!userAddress.startsWith('0x') || userAddress.length !== 42) {
        throw new Error(`Invalid user address: ${userAddress}`);
      }

      const balance = await readContract(config, {
        address: USDC_ADDRESS,
        abi: ERC20ABI,
        functionName: "balanceOf",
        args: [userAddress],
      });

      setBalance(balance as bigint);
    } catch (err) {
      // Handle user rejection errors gracefully
      if (err instanceof Error && err.message.includes("User rejected")) {
        console.warn("User rejected USDC balance request:", err);
        setBalance(BigInt(0));
      } else {
        console.error(`Error fetching user USDC balance for ${userAddress}:`, err);
        setError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchUserBalance();
  }, [fetchUserBalance]);

  return {
    balance,
    isLoading,
    error,
    refetch: fetchUserBalance,
  };
};
