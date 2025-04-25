export class ContractError extends Error {
  constructor(message: string, public cause?: unknown) {
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

export const handleContractError = (error: unknown): ContractError => {
  if (error instanceof ContractError) {
    return error;
  }

  // Handle specific error types
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // User rejected transaction
    if (message.includes("user rejected") || message.includes("user denied")) {
      return new ContractError("Transaction was rejected by user", error);
    }

    // Insufficient funds
    if (message.includes("insufficient funds")) {
      return new ContractError(
        "Insufficient funds to complete transaction",
        error
      );
    }

    // Gas estimation failed
    if (message.includes("gas required exceeds allowance")) {
      return new ContractError(
        "Transaction would fail - gas estimation error",
        error
      );
    }

    // Network error
    if (message.includes("network")) {
      return new ContractError(
        "Network error occurred. Please check your connection",
        error
      );
    }

    // Contract execution reverted
    if (message.includes("execution reverted")) {
      // Extract revert reason if available
      const revertReason = message.includes("reason:")
        ? message.split("reason:")[1].trim()
        : "Transaction failed - contract reverted";
      return new ContractError(revertReason, error);
    }

    // Kuri specific errors
    if (message.includes("not active")) {
      return new ContractError("Market is not active", error);
    }

    if (message.includes("already deposited")) {
      return new ContractError("Already deposited for this interval", error);
    }

    if (message.includes("not winner")) {
      return new ContractError(
        "You are not the winner for this interval",
        error
      );
    }

    if (message.includes("invalid interval")) {
      return new ContractError("Invalid interval for claiming", error);
    }

    if (message.includes("not member")) {
      return new ContractError("You are not a member of this Kuri", error);
    }
  }

  // Default error
  return new ContractError(
    "An unexpected error occurred during contract interaction",
    error
  );
};
