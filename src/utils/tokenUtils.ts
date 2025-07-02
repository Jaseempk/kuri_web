import { parseUnits, formatUnits } from "viem";

/**
 * Calculate approval amount with buffer for precision issues
 * @param requiredAmount - The exact amount required for the transaction
 * @param bufferUnits - Number of smallest units to add as buffer (default: 1)
 * @returns Approval amount with buffer
 */
export const calculateApprovalAmount = (
  requiredAmount: bigint,
  bufferUnits: number = 1
): bigint => {
  return requiredAmount + BigInt(bufferUnits);
};

/**
 * Format USDC amount for display (6 decimal places)
 * @param amount - Amount in wei (smallest units)
 * @returns Formatted string with 2 decimal places
 */
export const formatUSDC = (amount: bigint): string => {
  const formatted = formatUnits(amount, 6);
  const num = parseFloat(formatted);
  return num.toFixed(2);
};

/**
 * Parse USDC amount from user input
 * @param amount - Amount as string (e.g., "100.50")
 * @returns Amount in wei (smallest units)
 */
export const parseUSDC = (amount: string): bigint => {
  return parseUnits(amount, 6);
};

/**
 * Check if allowance is sufficient for the required amount
 * @param allowance - Current allowance amount
 * @param required - Required amount for transaction
 * @returns True if allowance is sufficient
 */
export const isAllowanceSufficient = (
  allowance: bigint,
  required: bigint
): boolean => {
  return allowance >= required;
};

/**
 * Convert seconds timestamp to Date object
 * @param timestamp - Timestamp in seconds (from smart contract)
 * @returns Date object
 */
export const timestampToDate = (timestamp: bigint): Date => {
  return new Date(Number(timestamp) * 1000);
};

/**
 * Format USDC balance with full precision (6 decimal places)
 * @param balance - Balance in wei (smallest units)
 * @returns Formatted string with 6 decimal places
 */
export const formatUSDCBalance = (balance: bigint): string => {
  const formatted = formatUnits(balance, 6);
  const num = parseFloat(formatted);
  return num.toFixed(6);
};

/**
 * Calculate the deficit between required and current balance
 * @param required - Required amount for transaction
 * @param current - Current user balance
 * @returns Deficit amount (0 if sufficient)
 */
export const calculateDeficit = (required: bigint, current: bigint): bigint => {
  return required > current ? required - current : BigInt(0);
};

/**
 * Check if user has sufficient balance for the transaction
 * @param userBalance - Current user balance
 * @param requiredAmount - Required amount for transaction
 * @returns True if balance is sufficient
 */
export const hasSufficientBalance = (
  userBalance: bigint,
  requiredAmount: bigint
): boolean => {
  return userBalance >= requiredAmount;
};
