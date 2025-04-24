export class ContractError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "ContractError";
  }
}

export const handleContractError = (error: unknown): ContractError => {
  if (error instanceof ContractError) {
    return error;
  }

  // Handle specific error types
  if (error instanceof Error) {
    // User rejected transaction
    if (error.message.includes("User rejected")) {
      return new ContractError("Transaction was rejected by user", error);
    }

    // Insufficient funds
    if (error.message.includes("insufficient funds")) {
      return new ContractError(
        "Insufficient funds to complete transaction",
        error
      );
    }

    // Gas estimation failed
    if (error.message.includes("gas required exceeds allowance")) {
      return new ContractError(
        "Transaction would fail - gas estimation error",
        error
      );
    }

    // Network error
    if (error.message.includes("network")) {
      return new ContractError(
        "Network error occurred. Please check your connection",
        error
      );
    }

    // Contract execution reverted
    if (error.message.includes("execution reverted")) {
      return new ContractError("Transaction failed - contract reverted", error);
    }
  }

  // Default error
  return new ContractError(
    "An unexpected error occurred during contract interaction",
    error
  );
};

export const isUserRejection = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes("User rejected");
  }
  return false;
};
