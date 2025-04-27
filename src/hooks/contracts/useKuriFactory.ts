import { useState, useCallback } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { useAccount } from "wagmi";
import { KuriFactoryABI } from "../../contracts/abis/KuriFactory";
import { getContractAddress } from "../../config/contracts";
import { handleContractError } from "../../utils/errors";
import { config } from "../../providers/Web3Provider";
import { baseSepolia } from "viem/chains";
import { useTransactionStatus } from "../useTransactionStatus";
import { useKuriMarkets } from "../useKuriMarkets";

export const useKuriFactory = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { address, chainId } = useAccount();
  const factoryAddress = getContractAddress(
    chainId ?? baseSepolia.id,
    "KuriFactory"
  );
  const account = getAccount(config);
  const { handleTransaction, isSuccess: isCreationSuccess } =
    useTransactionStatus();
  const {
    markets,
    loading: marketsLoading,
    error: marketsError,
    refetch: refetchMarkets,
  } = useKuriMarkets();

  // Initialize new Kuri market
  const initialiseKuriMarket = useCallback(
    async (
      kuriAmount: bigint,
      participantCount: number,
      intervalType: 0 | 1
    ) => {
      console.log("accountAddress:", account.address);
      if (!account.address) throw new Error("Wallet not connected");
      setIsCreating(true);
      console.log("factooryAddress:", factoryAddress);
      console.log("kuriAmount:", kuriAmount);
      console.log("participantCount:", participantCount);
      console.log("intervalType:", intervalType);

      try {
        // First simulate the transaction
        const { request } = await simulateContract(config, {
          abi: KuriFactoryABI,
          address: factoryAddress,
          functionName: "initialiseKuriMarket",
          args: [kuriAmount, participantCount, intervalType],
        });
        console.log("Simulation request:", request);

        // If simulation succeeds, send the transaction
        const tx = await writeContract(config, request);
        console.log("Transaction request:", tx);

        // Handle transaction status and notifications
        await handleTransaction(tx, {
          loadingMessage: "Creating your Kuri market...",
          successMessage: "Kuri market created successfully!",
          errorMessage: "Failed to create Kuri market",
        });

        // Refetch markets after successful creation
        await refetchMarkets();
        return tx;
      } catch (error) {
        console.error("Error creating Kuri market:", error);
        throw handleContractError(error);
      } finally {
        setIsCreating(false);
      }
    },
    [address, factoryAddress, handleTransaction, refetchMarkets]
  );

  // Get all deployed Kuri markets using subgraph
  const getAllMarkets = useCallback(async () => {
    console.log("markets:", markets);
    return markets;
  }, [markets]);

  return {
    initialiseKuriMarket,
    getAllMarkets,
    isCreating,
    isCreationSuccess,
    isLoading: marketsLoading,
    error: marketsError,
  };
};
