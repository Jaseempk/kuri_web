import { useSignMessage } from "@getpara/react-sdk";
import { useViemClient } from "@getpara/react-sdk/evm/hooks";
import { http } from "viem";
import { useAuthenticationService } from "../services/AuthenticationService";
import { apiClient } from "../lib/apiClient";
import { createGasSponsoredClient, signMessageWithSmartWallet } from "../utils/gasSponsorship";
import { getDefaultChain } from "../config/contracts";

interface SignedAuth {
  message: string;
  signature: string;
  address: string;
}

export const useApiAuth = () => {
  const authService = useAuthenticationService();
  const account = authService.getAccount();
  const { signMessageAsync } = useSignMessage();

  // Get the wallet address for viem client configuration
  const walletAddress = account?.embedded?.wallets?.[0]?.address as
    | `0x${string}`
    | undefined;

  // Initialize Viem client with dynamic chain configuration
  const defaultChain = getDefaultChain();
  const { viemClient, isLoading: isViemLoading } = useViemClient({
    address: walletAddress,
    walletClientConfig: {
      chain: defaultChain,
      transport: http(
        `https://${defaultChain.id === 84532 ? 'base-sepolia' : 'base-mainnet'}.g.alchemy.com/v2/${
          import.meta.env.VITE_ALCHEMY_API_KEY
        }`
      ),
    },
  });

  /**
   * Get signed authentication for API calls using Viem client
   * @param action - Type of action requiring authentication
   * @param targetAddress - Optional smart wallet address to use for authentication
   * @returns Signed authentication data
   */
  const getSignedAuth = async (
    action: "create_profile" | "create_market",
    targetAddress?: string
  ): Promise<SignedAuth> => {
    const walletData = account?.embedded?.wallets?.[0];

    if (!walletData?.address) {
      throw new Error("Para wallet not connected");
    }

    if (!viemClient) {
      throw new Error("Viem client not available");
    }

    try {
      // Use smart wallet address if provided, otherwise use embedded wallet address
      const addressForAuth = targetAddress || walletData.address;
      
      const { message } = await apiClient.getAuthMessage(
        action,
        addressForAuth
      );


      let signature: string;

      // If target address is provided (smart wallet), try smart wallet signing first
      if (targetAddress) {
        try {
          
          // Create sponsored client for smart wallet signing
          const sponsoredClient = await createGasSponsoredClient({
            userAddress: walletData.address as `0x${string}`,
            paraWalletClient: walletData,
            signMessageAsync,
          });

          // Try signing with smart wallet
          signature = await signMessageWithSmartWallet({
            sponsoredClient,
            message,
          });


        } catch (smartWalletError) {
          
          // Fallback: Sign with embedded wallet for smart wallet
          signature = await viemClient.signMessage({
            message: message,
          });

        }
      } else {
        // Standard embedded wallet signing
        signature = await viemClient.signMessage({
          message: message,
        });

      }


      return {
        message,
        signature,
        address: addressForAuth,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      throw error;
    }
  };

  return {
    getSignedAuth,
    isConnected: !!account?.embedded?.wallets?.[0]?.address,
    isPending: isViemLoading,
    error: null, // Viem client errors are thrown directly
  };
};
