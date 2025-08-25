import { createModularAccountAlchemyClient } from "@account-kit/smart-contracts";
import { WalletClientSigner } from "@aa-sdk/core";
import { alchemy, baseSepolia } from "@account-kit/infra";
import { createWalletClient, http } from "viem";
import { customSignMessage } from "./customSignMessage";
import { generateSalt } from "./generateSalt";

export interface GasSponsorshipParams {
  userAddress: `0x${string}`;
  paraWalletClient: any;
  signMessageAsync: any;
}

export interface SponsoredClient {
  account: { address: `0x${string}` };
  sendUserOperation: (params: any) => Promise<any>;
  waitForUserOperationTransaction: (opResult: any) => Promise<any>;
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
  console.log("🔧 Creating Para-compatible Viem account for gas sponsorship...");

  // Create Para-compatible LocalAccount
  const customAccount = {
    address: userAddress,
    type: "local" as const,
    source: "para",
    signMessage: async ({ message }: { message: any }) => {
      console.log("🖊️  Custom signing message via Para...");
      return customSignMessage(
        signMessageAsync,
        paraWalletClient.id,
        message
      );
    },
    signTransaction: async (transaction: any) => {
      throw new Error("signTransaction not implemented for Para account");
    },
    signTypedData: async (parameters: any) => {
      throw new Error("signTypedData not implemented for Para account");
    },
    publicKey: userAddress as `0x${string}`,
  };

  console.log("🔗 Creating Viem wallet client with Para account...");

  // Create viem WalletClient with custom Para account
  const viemWalletClient = createWalletClient({
    account: customAccount as any,
    chain: baseSepolia,
    transport: http(
      `https://base-sepolia.g.alchemy.com/v2/${
        import.meta.env.VITE_ALCHEMY_API_KEY
      }`
    ),
  });

  // Create Alchemy-compatible signer from viem client
  const walletClientSigner = new WalletClientSigner(
    viemWalletClient,
    "wallet"
  );

  console.log("⚡ Creating Alchemy client with gas sponsorship...");

  // Generate proper deterministic salt using wallet ID
  const salt = generateSalt(paraWalletClient.id, 0);

  // Create Alchemy client with gas sponsorship enabled
  const sponsoredClient = await createModularAccountAlchemyClient({
    transport: alchemy({
      rpcUrl: `https://base-sepolia.g.alchemy.com/v2/${
        import.meta.env.VITE_ALCHEMY_API_KEY
      }`,
    }),
    chain: baseSepolia,
    signer: walletClientSigner,
    policyId: import.meta.env.VITE_ALCHEMY_GAS_POLICY_ID,
    salt,
  });

  console.log("✅ Smart wallet address:", sponsoredClient.account.address);

  return sponsoredClient;
}

/**
 * Helper function to execute a sponsored transaction with common error handling
 */
export async function executeSponsoredTransaction({
  sponsoredClient,
  target,
  callData,
  operationName = "transaction",
}: {
  sponsoredClient: SponsoredClient;
  target: `0x${string}`;
  callData: `0x${string}`;
  operationName?: string;
}): Promise<string> {
  console.log(`🚀 Sending gas-sponsored ${operationName}...`);

  // Send UserOperation (automatically sponsored by Alchemy policy)
  const userOpResult = await sponsoredClient.sendUserOperation({
    uo: {
      target,
      data: callData,
      value: 0n,
    },
  });

  console.log(`${operationName} UserOperation Hash:`, userOpResult.hash);

  // Wait for the transaction to be mined
  console.log(`⏳ Waiting for ${operationName} UserOperation to be mined...`);
  const txHash = await sponsoredClient.waitForUserOperationTransaction(userOpResult);
  console.log(`✅ ${operationName} transaction mined! Hash:`, txHash);

  return txHash;
}