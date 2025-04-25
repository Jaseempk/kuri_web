import { useState, useCallback } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { KuriFactoryABI } from "../../contracts/abis/KuriFactory";
import { getContractAddress } from "../../config/contracts";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
import { baseSepolia } from "viem/chains";
import { useTransactionStatus } from "../useTransactionStatus";

export const useKuriFactory = () => {
  const [isCreating, setIsCreating] = useState(false);
  const account = getAccount(config);
  const chainId = account.chainId ?? baseSepolia.id;
  const factoryAddress = getContractAddress(chainId, "KuriFactory");
  const { handleTransaction, isSuccess: isCreationSuccess } =
    useTransactionStatus();

  // Initialize new Kuri market
  const initialiseKuriMarket = useCallback(
    async (
      kuriAmount: number,
      participantCount: number,
      intervalType: 0 | 1
    ) => {
      if (!account.address) throw new Error("Wallet not connected");
      setIsCreating(true);

      try {
        // First simulate the transaction
        const { request } = await simulateContract(config, {
          address: factoryAddress,
          abi: KuriFactoryABI,
          functionName: "initialiseKuriMarket",
          args: [BigInt(kuriAmount), participantCount, intervalType],
        });

        // If simulation succeeds, send the transaction
        const tx = await writeContract(config, request);

        // Handle transaction status and notifications
        await handleTransaction(tx, {
          loadingMessage: "Creating your Kuri market...",
          successMessage: "Kuri market created successfully!",
          errorMessage: "Failed to create Kuri market",
        });

        return tx;
      } catch (error) {
        throw handleContractError(error);
      } finally {
        setIsCreating(false);
      }
    },
    [account.address, factoryAddress, handleTransaction]
  );

  // Get all deployed Kuri markets
  const getAllMarkets = useCallback(async () => {
    try {
      // Note: This will be replaced with subgraph query to get KuriMarketDeployed events
      // For now, we'll use a direct contract call if available
      return await readContract(config, {
        address: factoryAddress,
        abi: KuriFactoryABI,
        functionName: "getAllKuris",
      });
    } catch (error) {
      console.error("Error fetching markets:", error);
      return [];
    }
  }, [factoryAddress]);

  return {
    initialiseKuriMarket,
    getAllMarkets,
    isCreating,
    isCreationSuccess,
  };
};
