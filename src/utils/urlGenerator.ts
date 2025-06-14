import { getAddress, isAddress } from "viem";

/**
 * Generate a shareable URL for a market
 * @param address - The contract address of the market
 * @returns The complete shareable URL
 */
export const generateMarketShareUrl = (address: string): string => {
  if (!isValidContractAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }

  const baseUrl = getBaseUrl();
  const checksummedAddress = getAddress(address); // Viem's checksumming

  return `${baseUrl}/markets/${checksummedAddress}`;
};

/**
 * Get the base URL based on environment
 * @returns The base URL for the current environment
 */
export const getBaseUrl = (): string => {
  // Check for environment variable first (production/staging)
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL;
  }

  // Fallback to current window location for development
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Default fallback for SSR/testing environments
  return "https://kuri.finance";
};

/**
 * Validate if a string is a valid Ethereum contract address
 * @param address - The address to validate
 * @returns True if valid contract address
 */
export const isValidContractAddress = (address: string): boolean => {
  if (!address || typeof address !== "string") {
    return false;
  }

  // Check if it's a valid Ethereum address format
  if (!isAddress(address)) {
    return false;
  }

  // Additional validation: must be 42 characters (0x + 40 hex chars)
  if (address.length !== 42) {
    return false;
  }

  // Ensure it starts with 0x
  if (!address.startsWith("0x")) {
    return false;
  }

  // Ensure the rest are valid hex characters
  const hexPart = address.slice(2);
  const hexRegex = /^[0-9a-fA-F]{40}$/;

  return hexRegex.test(hexPart);
};

/**
 * Get checksummed address for consistency
 * @param address - The address to checksum
 * @returns Checksummed address or null if invalid
 */
export const getChecksummedAddress = (address: string): string | null => {
  if (!isValidContractAddress(address)) {
    return null;
  }

  try {
    return getAddress(address);
  } catch {
    return null;
  }
};
