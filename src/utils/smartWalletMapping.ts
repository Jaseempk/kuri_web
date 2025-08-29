import { createModularAccountAlchemyClient } from "@account-kit/smart-contracts";
import { WalletClientSigner } from "@aa-sdk/core";
import { alchemy, baseSepolia } from "@account-kit/infra";
import { createWalletClient, http } from "viem";
import { generateSalt } from "./generateSalt";
import { customSignMessage } from "./customSignMessage";

export async function getSmartWalletAddressForEOA(
  paraWalletId: string,
  eoaAddress: `0x${string}`,
  signMessageAsync: any
): Promise<`0x${string}`> {
  try {
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

    const viemWalletClient = createWalletClient({
      account: customAccount as any,
      chain: baseSepolia,
      transport: http(
        `https://base-sepolia.g.alchemy.com/v2/${
          import.meta.env.VITE_ALCHEMY_API_KEY
        }`
      ),
    });

    const sponsoredClient = await createModularAccountAlchemyClient({
      transport: alchemy({
        rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${
          import.meta.env.VITE_ALCHEMY_API_KEY
        }`,
      }),
      chain: baseSepolia,
      signer: new WalletClientSigner(viemWalletClient, "wallet"),
      policyId: import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID,
      salt: generateSalt(paraWalletId, 0),
    });

    return sponsoredClient.account.address;
  } catch (error) {
    console.error("Failed to generate smart wallet address:", error);
    throw error;
  }
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
  
  const smartWalletAddress = await getSmartWalletAddressForEOA(paraWalletId, eoaAddress, signMessageAsync);
  smartWalletCache.set(cacheKey, smartWalletAddress);
  return smartWalletAddress;
}

export function clearSmartWalletCache(): void {
  smartWalletCache.clear();
}