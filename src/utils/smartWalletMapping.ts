import { createModularAccountAlchemyClient } from "@account-kit/smart-contracts";
import { WalletClientSigner } from "@aa-sdk/core";
import { alchemy, base, baseSepolia } from "@account-kit/infra";
import { createWalletClient, http } from "viem";
import { generateSalt } from "./generateSalt";
import { customSignMessage } from "./customSignMessage";
import { getDefaultChain } from "../config/contracts";

// Helper function to retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on validation errors (invalid params)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('Invalid') ||
        errorMessage.includes('not implemented') ||
        errorMessage.includes('Missing')
      ) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(
          `Smart wallet resolution attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
          error
        );
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

export async function getSmartWalletAddressForEOA(
  paraWalletId: string,
  eoaAddress: `0x${string}`,
  signMessageAsync: any
): Promise<`0x${string}`> {
  // Validation before attempting
  if (!paraWalletId || !eoaAddress) {
    throw new Error('Missing required parameters: paraWalletId or eoaAddress');
  }

  if (!signMessageAsync || typeof signMessageAsync !== 'function') {
    throw new Error('Invalid signMessageAsync function provided');
  }

  // Wrap the entire operation in retry logic
  return retryWithBackoff(async () => {
    const defaultChain = getDefaultChain();

    // Get the appropriate Alchemy chain object based on the current network
    const alchemyChain = defaultChain.id === 84532 ? baseSepolia : base;

    const customAccount = {
      address: eoaAddress,
      type: "local" as const,
      source: "para",
      signMessage: async ({ message }: { message: any }) => {
        return customSignMessage(signMessageAsync, paraWalletId, message);
      },
      signTransaction: async (transaction: any) => {
        throw new Error("signTransaction not implemented for Para account");
      },
      signTypedData: async (parameters: any) => {
        throw new Error("signTypedData not implemented for Para account");
      },
      publicKey: eoaAddress,
    };

    const rpcUrl = `https://${
      defaultChain.id === 84532 ? "base-sepolia" : "base-mainnet"
    }.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_API_KEY}`;

    const viemWalletClient = createWalletClient({
      account: customAccount as any,
      chain: alchemyChain,
      transport: http(rpcUrl),
    });

    const sponsoredClient = await createModularAccountAlchemyClient({
      transport: alchemy({
        rpcUrl,
      }),
      chain: alchemyChain, // Use Alchemy's chain object here
      signer: new WalletClientSigner(viemWalletClient, "wallet"),
      policyId: import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID,
      salt: generateSalt(paraWalletId, 0),
    });

    return sponsoredClient.account.address;
  }, 3, 1000); // 3 retries with 1s base delay
}

// Cache to avoid regenerating addresses
const smartWalletCache = new Map<string, string>();

export async function getSmartWalletAddressCached(
  paraWalletId: string,
  eoaAddress: `0x${string}`,
  signMessageAsync: any
): Promise<`0x${string}`> {
  const cacheKey = `${paraWalletId}-${eoaAddress}`;

  if (smartWalletCache.has(cacheKey)) {
    return smartWalletCache.get(cacheKey) as `0x${string}`;
  }

  const smartWalletAddress = await getSmartWalletAddressForEOA(
    paraWalletId,
    eoaAddress,
    signMessageAsync
  );

  const normalizedAddress = smartWalletAddress.toLowerCase() as `0x${string}`;
  smartWalletCache.set(cacheKey, normalizedAddress);
  return normalizedAddress;
}

export function clearSmartWalletCache(): void {
  smartWalletCache.clear();
}
