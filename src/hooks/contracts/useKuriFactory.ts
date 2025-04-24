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
import { parseEther } from "viem";
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

  // Create new Kuri with error handling
  const createKuri = useCallback(
    async (name: string, symbol: string, initialSupply: number) => {
      if (!account.address) throw new Error("Wallet not connected");
      setIsCreating(true);

      try {
        // First simulate the transaction
        const { request } = await simulateContract(config, {
          address: factoryAddress,
          abi: KuriFactoryABI,
          functionName: "createKuri",
          args: [name, symbol, parseEther(initialSupply.toString())],
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

  // Get user's Kuri
  const getUserKuri = useCallback(async () => {
    if (!account.address) return null;
    try {
      return await readContract(config, {
        address: factoryAddress,
        abi: KuriFactoryABI,
        functionName: "creatorToKuri",
        args: [account.address],
      });
    } catch (error) {
      console.error("Error fetching user Kuri:", error);
      return null;
    }
  }, [account.address, factoryAddress]);

  // Get all Kuris
  const getAllKuris = useCallback(async () => {
    try {
      return await readContract(config, {
        address: factoryAddress,
        abi: KuriFactoryABI,
        functionName: "getAllKuris",
      });
    } catch (error) {
      console.error("Error fetching all Kuris:", error);
      return [];
    }
  }, [factoryAddress]);

  return {
    // Creation
    createKuri,
    isCreating,
    isCreationSuccess,

    // Queries
    getUserKuri,
    getAllKuris,
  };
};
