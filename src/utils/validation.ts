import { isValidContractAddress } from "./urlGenerator";

/**
 * Validate contract address and handle errors
 * @param address - The address to validate
 * @returns Validation result with error message if invalid
 */
export interface AddressValidationResult {
  isValid: boolean;
  error?: string;
  normalizedAddress?: string;
}

/**
 * Comprehensive contract address validation
 * @param address - The address to validate
 * @returns Validation result object
 */
export const validateContractAddress = (
  address: string
): AddressValidationResult => {
  if (!address) {
    return {
      isValid: false,
      error: "Address is required",
    };
  }

  if (typeof address !== "string") {
    return {
      isValid: false,
      error: "Address must be a string",
    };
  }

  if (!address.startsWith("0x")) {
    return {
      isValid: false,
      error: "Address must start with 0x",
    };
  }

  if (address.length !== 42) {
    return {
      isValid: false,
      error: "Address must be 42 characters long (0x + 40 hex characters)",
    };
  }

  const hexPart = address.slice(2);
  const hexRegex = /^[0-9a-fA-F]{40}$/;

  if (!hexRegex.test(hexPart)) {
    return {
      isValid: false,
      error: "Address contains invalid characters",
    };
  }

  if (!isValidContractAddress(address)) {
    return {
      isValid: false,
      error: "Invalid Ethereum address format",
    };
  }

  return {
    isValid: true,
    normalizedAddress: address.toLowerCase(),
  };
};

/**
 * Redirect logic for malformed URLs
 * @param address - The address from URL params
 * @param navigate - React Router navigate function
 * @returns Whether redirect was triggered
 */
export const handleInvalidAddress = (
  address: string | undefined,
  navigate: (path: string) => void
): boolean => {
  if (!address) {
    navigate("/markets");
    return true;
  }

  const validation = validateContractAddress(address);
  if (!validation.isValid) {
    navigate("/markets");
    return true;
  }

  return false;
};

/**
 * Error messages for different validation failures
 */
export const ADDRESS_ERROR_MESSAGES = {
  REQUIRED: "Market address is required",
  INVALID_FORMAT: "Invalid market address format",
  INVALID_LENGTH: "Market address must be 42 characters",
  INVALID_CHARACTERS: "Market address contains invalid characters",
  NOT_FOUND: "Market not found",
  NETWORK_ERROR: "Unable to load market data",
} as const;

/**
 * Get user-friendly error message for address validation
 * @param error - Error type or message
 * @returns User-friendly error message
 */
export const getAddressErrorMessage = (error: string): string => {
  switch (error) {
    case "Address is required":
      return ADDRESS_ERROR_MESSAGES.REQUIRED;
    case "Address must start with 0x":
    case "Address contains invalid characters":
    case "Invalid Ethereum address format":
      return ADDRESS_ERROR_MESSAGES.INVALID_FORMAT;
    case "Address must be 42 characters long (0x + 40 hex characters)":
      return ADDRESS_ERROR_MESSAGES.INVALID_LENGTH;
    default:
      return ADDRESS_ERROR_MESSAGES.INVALID_FORMAT;
  }
};
