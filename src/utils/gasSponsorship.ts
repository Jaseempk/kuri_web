import { createModularAccountAlchemyClient } from "@account-kit/smart-contracts";
import { WalletClientSigner } from "@aa-sdk/core";
import { alchemy, base, baseSepolia } from "@account-kit/infra";
import { createWalletClient, http } from "viem";
import { customSignMessage, customSignTypedData } from "./customSignMessage";
import { generateSalt } from "./generateSalt";
import { getDefaultChain } from "../config/contracts";

export interface GasSponsorshipParams {
  userAddress: `0x${string}`;
  paraWalletClient: any;
  signMessageAsync: any;
}

export interface SponsoredClient {
  account: {
    address: `0x${string}`;
    isAccountDeployed: () => Promise<boolean>;
  };
  sendUserOperation: (params: any) => Promise<any>;
  waitForUserOperationTransaction: (opResult: any) => Promise<any>;
  signMessage: (params: { message: string }) => Promise<string>;
  buildUserOperation: (params: any) => Promise<any>;
  estimateUserOperationGas: (userOp: any, entryPoint?: any, stateOverride?: any) => Promise<any>;
}

/**
 * Creates a gas-sponsored client using Para wallet and Alchemy Account Kit
 * This eliminates the ~100 lines of boilerplate repeated in each sponsored function
 */
export async function createGasSponsoredClient({
  userAddress,
  paraWalletClient,
  signMessageAsync,
}: GasSponsorshipParams): Promise<SponsoredClient> {
  const defaultChain = getDefaultChain();
  
  // Get the appropriate Alchemy chain object based on the current network
  const alchemyChain = defaultChain.id === 84532 ? baseSepolia : base;

  // Create Para-compatible LocalAccount
  const customAccount = {
    address: userAddress,
    type: "local" as const,
    source: "para",
    signMessage: async ({ message }: { message: any }) => {
      return customSignMessage(
        signMessageAsync,
        paraWalletClient.id,
        message
      );
    },
    signTransaction: async () => {
      throw new Error("signTransaction not implemented for Para account");
    },
    signTypedData: async (parameters: any) => {
      return customSignTypedData(
        signMessageAsync,
        paraWalletClient.id,
        parameters
      );
    },
    publicKey: userAddress as `0x${string}`,
  };

  const rpcUrl = `https://${defaultChain.id === 84532 ? 'base-sepolia' : 'base-mainnet'}.g.alchemy.com/v2/${
    import.meta.env.VITE_ALCHEMY_API_KEY
  }`;

  // Create viem WalletClient with custom Para account
  const viemWalletClient = createWalletClient({
    account: customAccount as any,
    chain: defaultChain,
    transport: http(rpcUrl),
  });

  // Create Alchemy-compatible signer from viem client
  const walletClientSigner = new WalletClientSigner(
    viemWalletClient,
    "wallet"
  );

  // Generate proper deterministic salt using wallet ID
  const salt = generateSalt(paraWalletClient.id, 0);

  // Create Alchemy client with gas sponsorship enabled
  const sponsoredClient = await createModularAccountAlchemyClient({
    transport: alchemy({
      rpcUrl,
    }),
    chain: alchemyChain, // Use Alchemy's chain object here
    signer: walletClientSigner,
    policyId: import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID,
    salt,
  });

  return sponsoredClient;
}

/**
 * Helper function to execute a sponsored transaction with common error handling
 */
export async function executeSponsoredTransaction({
  sponsoredClient,
  target,
  callData,
}: {
  sponsoredClient: SponsoredClient;
  target: `0x${string}`;
  callData: `0x${string}`;
  operationName?: string;
}): Promise<string> {

  // Send UserOperation (automatically sponsored by Alchemy policy)
  const userOpResult = await sponsoredClient.sendUserOperation({
    uo: {
      target,
      data: callData,
      value: 0n,
    },
  });


  // Wait for the transaction to be mined
  const txHash = await sponsoredClient.waitForUserOperationTransaction(userOpResult);

  return txHash;
}

/**
 * Smart wallet message signing using Alchemy Account Kit
 * @param sponsoredClient - The Alchemy sponsored client
 * @param message - Message to sign
 * @returns Signature from smart wallet
 */
export async function signMessageWithSmartWallet({
  sponsoredClient,
  message,
}: {
  sponsoredClient: SponsoredClient;
  message: string;
}): Promise<string> {

  try {
    // Try direct smart wallet message signing
    const signature = await sponsoredClient.signMessage({ message });
    return signature;
  } catch (error) {
    throw new Error(`Smart wallet message signing failed: ${error}`);
  }
}