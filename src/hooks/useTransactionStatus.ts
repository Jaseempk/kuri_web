import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Hash } from "viem";

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

      try {
        // If we have a hash, the transaction was successful
        setStatus({ isLoading: false, isSuccess: true, error: null });
        toast.success(successMessage);
        return { status: "success", hash };
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : errorMessage;
        setStatus({
          isLoading: false,
          isSuccess: false,
          error: error as Error,
        });
        toast.error(errorMsg);
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
