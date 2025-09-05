import { useState, useCallback } from "react";
import { writeContract, simulateContract } from "@wagmi/core";
import { ERC20ABI } from "../contracts/abis/ERC20";
import { config } from "../config/wagmi";
import { useAuthContext } from "../contexts/AuthContext";
import { useAccount, useSignMessage } from "@getpara/react-sdk";
import { handleContractError } from "../utils/errors";
import { useTransactionStatus } from "./useTransactionStatus";
import {
  createGasSponsoredClient,
  executeSponsoredTransaction,
} from "../utils/gasSponsorship";
import { encodeFunctionData } from "viem";
import { getContractAddress, getDefaultChainId } from "../config/contracts";

// Use dynamic USDC address based on network configuration
const getUSDCAddress = (): `0x${string}` => {
  return getContractAddress(getDefaultChainId(), 'USDC');
};

export const useUSDCWithdraw = () => {
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const { smartAddress: userAddress } = useAuthContext();
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { handleTransaction } = useTransactionStatus();

  // Gas-sponsored USDC withdrawal
  const withdrawUSDC = useCallback(
    async (amount: bigint, destinationAddress: `0x${string}`) => {
      if (!userAddress) throw new Error("User address not available");
      if (amount <= 0) throw new Error("Invalid withdrawal amount");
      if (!destinationAddress) throw new Error("Destination address required");

      setIsWithdrawing(true);

      try {
        // Get Para's wallet client
        const paraWalletClient = account.embedded.wallets?.[0];
        if (!paraWalletClient) throw new Error("Para wallet not available");

        // Create sponsored client using the helper
        const sponsoredClient = await createGasSponsoredClient({
          userAddress: paraWalletClient.address as `0x${string}`,
          paraWalletClient,
          signMessageAsync,
        });

        // Encode the ERC20 transfer call data
        const callData = encodeFunctionData({
          abi: ERC20ABI,
          functionName: "transfer",
          args: [destinationAddress, amount],
        });

        // Execute sponsored transaction
        const txHash = await executeSponsoredTransaction({
          sponsoredClient,
          target: getUSDCAddress(),
          callData,
          operationName: "USDC withdrawal",
        });

        console.log(
          "🎉 USDC withdrawal gas fees sponsored by Alchemy Gas Manager!"
        );

        await handleTransaction(txHash as `0x${string}`, {
          loadingMessage: "Processing withdrawal (gas-sponsored)...",
          successMessage: "USDC withdrawn successfully! 🎉 Gas was sponsored!",
          errorMessage: "Failed to withdraw USDC (sponsored)",
        });

        return txHash;
      } catch (error) {
        console.error("Gas-sponsored USDC withdrawal failed:", error);
        throw handleContractError(error);
      } finally {
        setIsWithdrawing(false);
      }
    },
    [userAddress, account, signMessageAsync, handleTransaction]
  );

  // Non-sponsored withdrawal (fallback)
  const withdrawUSDCRegular = useCallback(
    async (amount: bigint, destinationAddress: `0x${string}`) => {
      if (!userAddress) throw new Error("User address not available");
      if (amount <= 0) throw new Error("Invalid withdrawal amount");
      if (!destinationAddress) throw new Error("Destination address required");

      setIsWithdrawing(true);

      try {
        const { request } = await simulateContract(config, {
          address: getUSDCAddress(),
          abi: ERC20ABI,
          functionName: "transfer",
          args: [destinationAddress, amount],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: "Processing withdrawal...",
          successMessage: "USDC withdrawn successfully!",
          errorMessage: "Failed to withdraw USDC",
        });

        return tx;
      } catch (error) {
        throw handleContractError(error);
      } finally {
        setIsWithdrawing(false);
      }
    },
    [userAddress, handleTransaction]
  );

  return {
    withdrawUSDC,
    withdrawUSDCRegular,
    isWithdrawing,
  };
};
