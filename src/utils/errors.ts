export class ContractError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = "ContractError";
  }
}

export const isUserRejection = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.message.toLowerCase().includes("user rejected") ||
      error.message.toLowerCase().includes("user denied")
    );
  }
  return false;
};

// Enhanced error handling with sanitized messages
export const handleContractError = (error: unknown): ContractError => {
  // Log the original error for debugging but don't expose to user
  console.error("Original error:", error);

  if (error instanceof ContractError) {
    return error;
  }

  // Handle specific error types with user-friendly messages
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // User rejected transaction
    if (message.includes("user rejected") || message.includes("user denied")) {
      return new ContractError("Transaction was cancelled by user", error);
    }

    // Insufficient funds
    if (message.includes("insufficient funds")) {
      return new ContractError(
        "Insufficient funds to complete this transaction",
        error
      );
    }

    // Gas estimation failed
    if (message.includes("gas required exceeds allowance")) {
      return new ContractError(
        "Transaction cannot be completed - gas estimation failed",
        error
      );
    }

    // Network error
    if (message.includes("network")) {
      return new ContractError(
        "Network connection issue. Please check your connection",
        error
      );
    }

    // Contract execution reverted
    if (message.includes("execution reverted")) {
      return new ContractError(
        "Transaction failed - contract requirements not met",
        error
      );
    }

    // Kuri specific errors with sanitized messages
    if (message.includes("not active")) {
      return new ContractError("This market is not currently active", error);
    }

    if (message.includes("already deposited")) {
      return new ContractError(
        "You have already made a deposit for this interval",
        error
      );
    }

    if (message.includes("not winner")) {
      return new ContractError(
        "You are not eligible to claim for this interval",
        error
      );
    }

    if (message.includes("invalid interval")) {
      return new ContractError("Invalid interval for this operation", error);
    }

    // Token approval specific errors
    if (
      message.includes("insufficient allowance") ||
      message.includes("erc20: transfer amount exceeds allowance")
    ) {
      return new ContractError(
        "Token approval required. Please approve the contract to spend your tokens",
        error
      );
    }

    if (
      message.includes("erc20: insufficient balance") ||
      message.includes("transfer amount exceeds balance")
    ) {
      return new ContractError(
        "Insufficient token balance to complete this transaction",
        error
      );
    }

    if (message.includes("approve")) {
      return new ContractError(
        "Token approval failed. Please try again",
        error
      );
    }
  }

  // Generic error for unknown cases
  return new ContractError(
    "An unexpected error occurred. Please try again later.",
    error
  );
};
