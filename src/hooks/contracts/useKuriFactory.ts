import { useState, useCallback } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { decodeEventLog } from "viem";
import { useAccount } from "wagmi";
import { KuriFactoryABI } from "../../contracts/abis/KuriFactory";
import { getContractAddress } from "../../config/contracts";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
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

        // If simulation succeeds, send the transaction
        const txHash = await writeContract(config, request);

        // Wait for the transaction to be mined
        const receipt = await waitForTransactionReceipt(config, {
          hash: txHash,
        });
        // Parse logs for the KuriMarketDeployed event
        let marketAddress = undefined;
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: KuriFactoryABI,
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === "KuriMarketDeployed") {
              marketAddress = decoded.args.marketAddress;
              break;
            }
          } catch (e) {
            // Not the right event, skip
          }
        }
        if (!marketAddress)
          throw new Error("Market address not found in event logs");
        console.log("New market address:", marketAddress);

        // Handle transaction status and notifications
        await handleTransaction(txHash, {
          loadingMessage: "Creating your Kuri market...",
          successMessage: "Kuri market created successfully!",
          errorMessage: "Failed to create Kuri market",
        });

        // Refetch markets after successful creation
        await refetchMarkets();
        return marketAddress;
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
  // Note: This function has been removed to prevent double refresh issues.
  // Use useKuriMarkets() hook directly instead.

  return {
    initialiseKuriMarket,
    isCreating,
    isCreationSuccess,
    isLoading: marketsLoading,
    error: marketsError,
  };
};
