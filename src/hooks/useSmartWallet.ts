import { useState, useEffect, useCallback } from "react";
import { useAccount, useSignMessage } from "@getpara/react-sdk";
import { getSmartWalletAddressCached } from "../utils/smartWalletMapping";

interface UseSmartWalletReturn {
  smartAddress: `0x${string}` | null;
  embeddedAddress: `0x${string}` | null;
  isLoading: boolean;
  error: Error | null;
  isConnected: boolean;
  refetch: () => Promise<void>;
}

export const useSmartWallet = (): UseSmartWalletReturn => {
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [smartAddress, setSmartAddress] = useState<`0x${string}` | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get embedded wallet data
  const embeddedWallet = account.embedded.wallets?.[0];
  const embeddedAddress = embeddedWallet?.address as `0x${string}` | undefined;

  // Create stable key to prevent unnecessary callback recreation
  const walletKey = `${embeddedWallet?.id || ""}-${embeddedAddress || ""}`;

  const fetchSmartWallet = useCallback(async () => {
    if (!embeddedWallet || !embeddedAddress) {
      setSmartAddress(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const smartWalletAddress = await getSmartWalletAddressCached(
        embeddedWallet.id,
        embeddedAddress,
        signMessageAsync
      );
      console.log("Fetched smart wallet address:", smartWalletAddress);
      setSmartAddress(smartWalletAddress.toLowerCase() as `0x${string}`);
    } catch (err) {
      console.error("Failed to get smart wallet address:", err);
      setError(
        err instanceof Error
          ? err
          : new Error("Failed to get smart wallet address")
      );
      setSmartAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletKey, signMessageAsync]);

  // Fetch smart wallet when embedded wallet becomes available
  useEffect(() => {
    if (account.isConnected && embeddedAddress) {
      fetchSmartWallet();
    } else if (!account.isConnected && !account.isLoading) {
      // Only reset if truly disconnected, not just missing embedded address
      setSmartAddress(null);
      setError(null);
    }
  }, [account.isConnected, embeddedAddress, account.isLoading]); // Remove fetchSmartWallet!

  return {
    smartAddress,
    embeddedAddress: embeddedAddress || null,
    isLoading,
    error,
    isConnected: account.isConnected && !!smartAddress,
    refetch: fetchSmartWallet,
  };
};
