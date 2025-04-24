import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Hash } from "viem";
import { waitForTransaction } from "@wagmi/core";
import { config } from "../config/wagmi";

interface TransactionStatus {
  isLoading: boolean;
  isSuccess: boolean;
  error: Error | null;
}

export const useTransactionStatus = () => {
  const [status, setStatus] = useState<TransactionStatus>({
    isLoading: false,
    isSuccess: false,
    error: null,
  });

  const handleTransaction = useCallback(
    async (
      hash: Hash,
      options?: {
        successMessage?: string;
        loadingMessage?: string;
        errorMessage?: string;
      }
    ) => {
      const {
        successMessage = "Transaction successful",
        loadingMessage = "Transaction in progress...",
        errorMessage = "Transaction failed",
      } = options || {};

      setStatus({ isLoading: true, isSuccess: false, error: null });
      const toastId = toast.loading(loadingMessage);

      try {
        const receipt = await waitForTransaction(config, {
          hash,
        });

        if (receipt.status === "success") {
          setStatus({ isLoading: false, isSuccess: true, error: null });
          toast.success(successMessage, { id: toastId });
          return receipt;
        } else {
          throw new Error("Transaction failed");
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : errorMessage;
        setStatus({
          isLoading: false,
          isSuccess: false,
          error: error as Error,
        });
        toast.error(errorMsg, { id: toastId });
        throw error;
      }
    },
    []
  );

  return {
    ...status,
    handleTransaction,
  };
};
