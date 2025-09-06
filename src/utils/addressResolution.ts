import { readContract } from "@wagmi/core";
import { config } from "../config/wagmi";
import { getDefaultChainId } from "../config/contracts";

// Alchemy smart account ABI for owner() function
const SMART_ACCOUNT_ABI = [{
  "inputs": [],
  "name": "owner",
  "outputs": [{"internalType": "address", "name": "", "type": "address"}],
  "stateMutability": "view",
  "type": "function"
}];

// Cache for resolved addresses
const resolutionCache = new Map<string, string>();

export async function resolveSmartWalletToEOA(smartWalletAddress: string): Promise<string> {
  if (resolutionCache.has(smartWalletAddress)) {
    return resolutionCache.get(smartWalletAddress)!;
  }

  try {
    const eoaAddress = await readContract(config, {
      address: smartWalletAddress as `0x${string}`,
      abi: SMART_ACCOUNT_ABI,
      functionName: "owner",
      chainId: getDefaultChainId() as 84532 | 8453, // Ensure we read from the correct network
    });
    
    const resolvedAddress = eoaAddress as string;
    resolutionCache.set(smartWalletAddress, resolvedAddress);
    return resolvedAddress;
  } catch (error) {
    // If owner() call fails, assume it's already an EOA
    console.warn(`Failed to resolve smart wallet ${smartWalletAddress}, assuming EOA:`, error);
    resolutionCache.set(smartWalletAddress, smartWalletAddress);
    return smartWalletAddress;
  }
}

export async function resolveMultipleAddresses(addresses: string[]): Promise<string[]> {
  return Promise.all(addresses.map(resolveSmartWalletToEOA));
}

// Batch resolve with error handling for individual failures
export async function resolveMultipleAddressesRobust(addresses: string[]): Promise<string[]> {
  const results = await Promise.allSettled(addresses.map(resolveSmartWalletToEOA));
  return results.map((result, index) => 
    result.status === 'fulfilled' ? result.value : addresses[index]
  );
}

export function clearResolutionCache(): void {
  resolutionCache.clear();
}

// Check if an address looks like a smart wallet (has code)
export function isLikelySmartWallet(address: string): boolean {
  // This is a heuristic - Alchemy smart wallets start with specific prefixes
  // We can enhance this later with actual contract code detection
  return address.toLowerCase().startsWith('0x') && address.length === 42;
}