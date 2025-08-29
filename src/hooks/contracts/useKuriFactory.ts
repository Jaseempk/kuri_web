import { useState, useCallback } from "react";
import {
  // readContract,
  writeContract,
  simulateContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { decodeEventLog, encodeFunctionData } from "viem";
import { useAccount, useSignMessage } from "@getpara/react-sdk";
import { useSmartWallet } from "../useSmartWallet";
import { KuriFactoryABI } from "../../contracts/abis/KuriFactoryV1";
import { getContractAddress } from "../../config/contracts";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
import { baseSepolia } from "viem/chains";
import { useTransactionStatus } from "../useTransactionStatus";
import { useKuriMarkets } from "../useKuriMarkets";
import { createGasSponsoredClient, executeSponsoredTransaction } from "../../utils/gasSponsorship";

export const useKuriFactory = () => {
  const [isCreating, setIsCreating] = useState(false);
  const paraAccount = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { smartAddress: address } = useSmartWallet();
  const chainId = baseSepolia.id; // Use Para with Base Sepolia
  const factoryAddress = getContractAddress(
    chainId ?? baseSepolia.id,
    "KuriFactory"
  );
  const { handleTransaction, isSuccess: isCreationSuccess } =
    useTransactionStatus();
  const {
    // markets,
    loading: marketsLoading,
    error: marketsError,
    refetch: refetchMarkets,
  } = useKuriMarkets();

  // Initialize new Kuri market
  const initialiseKuriMarket = useCallback(
    async (
      kuriAmount: bigint,
      participantCount: number,
      intervalType: 0 | 1,
      wannabeMember: boolean = true,
      currencyIndex: number = 0
    ) => {
      if (!address) throw new Error("Wallet not connected");
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
          args: [
            kuriAmount,
            participantCount,
            intervalType,
            wannabeMember,
            currencyIndex,
          ],
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
              marketAddress = (decoded.args as any)?.marketAddress;
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

        // Note: refetch is handled by the parent component to avoid double refresh
        return { marketAddress, txHash };
      } catch (error) {
        console.error("Error creating Kuri market:", error);
        throw handleContractError(error);
      } finally {
        setIsCreating(false);
      }
    },
    [address, factoryAddress, handleTransaction, refetchMarkets]
  );

  // 🚀 NEW: Gas-sponsored initialize Kuri market using Alchemy Account Kit
  const initialiseKuriMarketSponsored = useCallback(
    async (
      kuriAmount: bigint,
      participantCount: number,
      intervalType: 0 | 1,
      wannabeMember: boolean = true,
      currencyIndex: number = 0
    ) => {
      if (!address) throw new Error("Wallet not connected");
      setIsCreating(true);

      console.log("🚀 Gas-sponsored factory deployment:");
      console.log("factoryAddress:", factoryAddress);
      console.log("kuriAmount:", kuriAmount);
      console.log("participantCount:", participantCount);
      console.log("intervalType:", intervalType);

      try {
        // Get Para's wallet client
        const paraWalletClient = paraAccount.embedded.wallets?.[0];
        if (!paraWalletClient) throw new Error("Para wallet not available");

        // Create sponsored client using the helper
        const sponsoredClient = await createGasSponsoredClient({
          userAddress: paraWalletClient.address as `0x${string}`,
          paraWalletClient,
          signMessageAsync,
        });

        // Encode the contract call data
        const callData = encodeFunctionData({
          abi: KuriFactoryABI,
          functionName: "initialiseKuriMarket",
          args: [
            kuriAmount,
            participantCount,
            intervalType,
            wannabeMember,
            currencyIndex,
          ],
        });

        // Execute sponsored transaction
        const txHash = await executeSponsoredTransaction({
          sponsoredClient,
          target: factoryAddress,
          callData,
          operationName: "market creation",
        });

        console.log("🎉 Market creation gas fees sponsored by Alchemy Gas Manager!");

        const receipt = await waitForTransactionReceipt(config, {
          hash: txHash as `0x${string}`,
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
              marketAddress = (decoded.args as any)?.marketAddress;
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
        await handleTransaction(txHash as `0x${string}`, {
          loadingMessage: "Creating your Kuri market (gas-sponsored)...",
          successMessage:
            "Kuri market created successfully! 🎉 Gas was sponsored!",
          errorMessage: "Failed to create Kuri market (sponsored)",
        });

        // Return both market address and transaction hash
        return { marketAddress, txHash };
      } catch (error) {
        console.error("Error creating gas-sponsored Kuri market:", error);
        throw handleContractError(error);
      } finally {
        setIsCreating(false);
      }
    },
    [address, factoryAddress, handleTransaction, refetchMarkets, paraAccount, signMessageAsync]
  );

  // Get all deployed Kuri markets using subgraph
  // Note: This function has been removed to prevent double refresh issues.
  // Use useKuriMarkets() hook directly instead.

  return {
    initialiseKuriMarket,
    initialiseKuriMarketSponsored, // 🚀 NEW: Gas-sponsored version
    isCreating,
    isCreationSuccess,
    isLoading: marketsLoading,
    error: marketsError,
  };
};
