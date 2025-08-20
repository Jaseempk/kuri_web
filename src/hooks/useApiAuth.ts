import { useAccount } from "@getpara/react-sdk";
import { useViemClient } from "@getpara/react-sdk/evm/hooks";
import { baseSepolia } from "viem/chains";
import { http } from "viem";
import { apiClient } from "../lib/apiClient";

interface SignedAuth {
  message: string;
  signature: string;
  address: string;
}

export const useApiAuth = () => {
  const account = useAccount();

  // Get the wallet address for viem client configuration
  const walletAddress = account.embedded.wallets?.[0]?.address as
    | `0x${string}`
    | undefined;

  // Initialize Viem client with Base Sepolia configuration
  const { viemClient, isLoading: isViemLoading } = useViemClient({
    address: walletAddress,
    walletClientConfig: {
      chain: baseSepolia,
      transport: http(
        `https://base-sepolia.g.alchemy.com/v2/${
          import.meta.env.VITE_ALCHEMY_API_KEY
        }`
      ),
    },
  });

  /**
   * Get signed authentication for API calls using Viem client
   * @param action - Type of action requiring authentication
   * @returns Signed authentication data
   */
  const getSignedAuth = async (
    action: "create_profile" | "create_market"
  ): Promise<SignedAuth> => {
    const walletData = account.embedded.wallets?.[0];
    console.log("useApiAuth walletData:", walletData);

    if (!walletData?.address) {
      throw new Error("Para wallet not connected");
    }

    if (!viemClient) {
      throw new Error("Viem client not available");
    }

    try {
      const { message } = await apiClient.getAuthMessage(
        action,
        walletData.address
      );

      console.log("🟦 [VIEM AUTH DEBUG] Signing with Viem client:");
      console.log("  Action:", action);
      console.log("  Address:", walletData.address);
      console.log("  Raw message:", JSON.stringify(message));
      console.log("  Message length:", message.length);

      // Sign with Viem client (no Base64 encoding needed)
      const signature = await viemClient.signMessage({
        message: message, // Raw string message
      });

      console.log("🟦 [VIEM AUTH DEBUG] Signature result:", signature);

      // Return in same format as existing backend expects
      return {
        message,
        signature,
        address: walletData.address,
      };
    } catch (error) {
      console.error(
        "🔴 [VIEM AUTH DEBUG] Para Viem authentication error:",
        error
      );
      throw error;
    }
  };

  return {
    getSignedAuth,
    isConnected: !!account.embedded.wallets?.[0]?.address,
    isPending: isViemLoading,
    error: null, // Viem client errors are thrown directly
  };
};
