import { useQuery, useQueryClient } from "@tanstack/react-query";
import { keepPreviousData } from "@tanstack/react-query";
import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { getWalletService } from "../services/WalletService";
import { getProfileService } from "../services/ProfileService";
import { useSignMessage } from "@getpara/react-sdk";
import { useApiAuth } from "./useApiAuth";
import { formatErrorForUser } from "../utils/apiErrors";
import type { KuriUserProfile } from "../types/user";
import { useAccount } from "@getpara/react-sdk";

enum AuthFlowState {
  INITIALIZING = "initializing",
  PARA_LOADING = "para_loading",
  WALLET_RESOLVING = "wallet_resolving",
  PROFILE_LOADING = "profile_loading",
  PROFILE_REQUIRED = "profile_required",
  AUTHENTICATED = "authenticated",
  ERROR = "error",
}

interface AuthMachineContext {
  paraAccount: any;
  smartAddress: string | null;
  profile: KuriUserProfile | null;
  error: Error | null;
  returnUrl: string;
}

// State derivation function - matches existing useAuthStateMachine logic exactly
const deriveAuthState = (
  account: any,
  smartAddress: string | null,
  profile: KuriUserProfile | null | undefined,
  isLoading: boolean,
  addressLoading: boolean,
  profileLoading: boolean
): AuthFlowState => {
  if (!account || account.isLoading) return AuthFlowState.PARA_LOADING;
  if (!account.isConnected) return AuthFlowState.INITIALIZING;
  if (addressLoading || !smartAddress) return AuthFlowState.WALLET_RESOLVING;
  if (profileLoading) return AuthFlowState.PROFILE_LOADING;
  if (!profile) return AuthFlowState.PROFILE_REQUIRED;
  return AuthFlowState.AUTHENTICATED;
};

export const useOptimizedAuth = () => {
  const { signMessageAsync } = useSignMessage();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const queryClient = useQueryClient();
  const { getSignedAuth } = useApiAuth();
  const account = useAccount(); // ✅ Use live Para SDK state directly

  // Performance monitoring - track render frequency
  const renderCount = useRef(0);
  renderCount.current++;
  if (renderCount.current % 10 === 0) {
    console.log(`🔄 useOptimizedAuth rendered ${renderCount.current} times`);
  }

  // Get service instances
  const walletService = getWalletService();
  const profileService = getProfileService();

  // Extract stable primitive values from account to prevent infinite loops
  const accountIsConnected = account?.isConnected ?? false;
  const accountIsLoading = account?.isLoading ?? false;
  const accountUserEmail = account?.user?.email;
  const embeddedWalletId = account?.embedded?.wallets?.[0]?.id;
  const embeddedWalletAddress = account?.embedded?.wallets?.[0]?.address;

  // Create stable references for complex objects using serialized keys
  const accountUserKey = useMemo(
    () => JSON.stringify({ email: accountUserEmail }),
    [accountUserEmail]
  );

  const accountEmbeddedKey = useMemo(
    () =>
      JSON.stringify({
        walletId: embeddedWalletId,
        walletAddress: embeddedWalletAddress,
      }),
    [embeddedWalletId, embeddedWalletAddress]
  );

  // Level 1: Smart Wallet (depends on Para having embedded wallet) - Use stable account values
  const walletQuery = useQuery({
    queryKey: ["auth", "smart-wallet", embeddedWalletId],
    queryFn: async () => {
      if (!embeddedWalletId || !embeddedWalletAddress || !signMessageAsync) {
        throw new Error("Para account or signing not available");
      }
      // Convert stable values to service-compatible format
      const paraAccountData = {
        isConnected: accountIsConnected,
        isLoading: accountIsLoading,
        user: { email: accountUserEmail },
        embedded: {
          wallets: [
            {
              id: embeddedWalletId,
              address: embeddedWalletAddress,
            },
          ],
        },
      };
      return walletService.resolveSmartWallet(
        paraAccountData,
        signMessageAsync
      );
    },
    enabled: !!(embeddedWalletId && accountIsConnected),
    staleTime: 10 * 60 * 1000, // 10 minutes for wallet resolution
    refetchOnWindowFocus: false,
    retry: 2,
  });

  // Level 2: Profile (depends on Smart Wallet address)
  const profileQuery = useQuery({
    queryKey: ["auth", "profile", walletQuery.data?.address?.toLowerCase()],
    queryFn: async () => {
      if (!walletQuery.data?.address) {
        throw new Error("Smart wallet address not available");
      }

      const profile = await profileService.fetchProfileSilent(
        walletQuery.data.address
      );

      return profile;
    },
    enabled: !!walletQuery.data?.address,
    staleTime: 30 * 1000, // 30 seconds for auth-critical profile data
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    retry: (failureCount, error) => {
      // Only retry on network errors, not 404s (user doesn't exist)
      const status = (error as any)?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

  // Track transition state for profile queries
  useEffect(() => {
    if (walletQuery.data?.address && profileQuery.status === "pending") {
      setIsTransitioning(true);
    } else if (
      profileQuery.status === "success" ||
      profileQuery.status === "error"
    ) {
      setIsTransitioning(false);
    }
  }, [walletQuery.data?.address, profileQuery.status]);

  // Derive auth state using stable primitive values
  const authState = useMemo(() => {
    // Handle query errors
    if (walletQuery.error || profileQuery.error) {
      console.log("🚨 Auth Error State:", {
        walletError: walletQuery.error ? String(walletQuery.error) : null,
        profileError: profileQuery.error ? String(profileQuery.error) : null,
      });
      return AuthFlowState.ERROR;
    }

    // Create stable account object from primitives
    const stableAccount = {
      isConnected: accountIsConnected,
      isLoading: accountIsLoading,
      user: { email: accountUserEmail },
      embedded: {
        wallets: embeddedWalletId
          ? [
              {
                id: embeddedWalletId,
                address: embeddedWalletAddress,
              },
            ]
          : undefined,
      },
    };

    const state = deriveAuthState(
      stableAccount,
      walletQuery.data?.address || null,
      profileQuery.data,
      false, // Live account isLoading is used directly
      walletQuery.isLoading,
      profileQuery.isLoading
    );

    return state;
  }, [
    accountIsConnected, // ✅ Stable primitive dependencies
    accountIsLoading,
    accountUserKey, // ✅ Serialized stable key
    accountEmbeddedKey, // ✅ Serialized stable key
    walletQuery.data,
    walletQuery.isLoading,
    walletQuery.error,
    profileQuery.data,
    profileQuery.isLoading,
    profileQuery.error,
  ]);

  // updateProfile implementation - matches existing useUserProfile interface exactly
  const updateProfile = useCallback(
    async (updates: Partial<KuriUserProfile> & { image?: File }) => {
      const smartAddress = walletQuery.data?.address;
      if (!smartAddress) return;

      // Optimistic update: Set cache immediately
      const optimisticProfile: KuriUserProfile = {
        id: 0,
        user_address: smartAddress,
        username: updates.username || "",
        display_name: updates.display_name || "",
        profile_image_url: updates.image
          ? URL.createObjectURL(updates.image)
          : null,
        reputation_score: updates.reputation_score || 0,
        created_at: new Date(),
        last_active: new Date(),
      };

      queryClient.setQueryData(
        ["auth", "profile", smartAddress.toLowerCase()],
        optimisticProfile
      );

      try {
        // Get signed auth for backend verification
        const { message, signature } = await getSignedAuth(
          "create_profile",
          smartAddress
        );

        const result = await profileService.createProfile({
          userAddress: smartAddress,
          username: updates.username || "",
          display_name: updates.display_name || "",
          image: updates.image,
          message,
          signature,
        });

        // Update cache with real backend data
        queryClient.setQueryData(
          ["auth", "profile", smartAddress.toLowerCase()],
          result
        );

        return result;
      } catch (error) {
        // Rollback optimistic update on failure
        queryClient.setQueryData(
          ["auth", "profile", smartAddress.toLowerCase()],
          null
        );

        console.error("Error updating profile:", error);
        const formattedError = new Error(formatErrorForUser(error));
        throw formattedError;
      }
    },
    [walletQuery.data?.address, getSignedAuth, queryClient, profileService]
  );

  // Create stable account object to prevent infinite re-renders
  const stableAccount = useMemo(
    () => ({
      isConnected: accountIsConnected,
      isLoading: accountIsLoading,
      user: { email: accountUserEmail },
      embedded: {
        wallets: embeddedWalletId
          ? [
              {
                id: embeddedWalletId,
                address: embeddedWalletAddress,
              },
            ]
          : undefined,
      },
    }),
    [accountIsConnected, accountIsLoading, accountUserKey, accountEmbeddedKey]
  );

  const context: AuthMachineContext = {
    paraAccount: stableAccount,
    smartAddress: walletQuery.data?.address || null,
    profile: profileQuery.data || null,
    error: walletQuery.error || profileQuery.error || null,
    returnUrl: "/markets",
  };

  // Return interface compatible with existing useAuthStateMachine
  return {
    authState,
    context,
    // Backwards compatibility - exact same interface using stable account data
    account: stableAccount, // ✅ Return stable account object
    profile: profileQuery.data,
    smartAddress: walletQuery.data?.address || null,
    isLoading:
      accountIsLoading || walletQuery.isLoading || profileQuery.isLoading,
    isTransitioning,
    updateProfile,
    // Additional data for advanced usage
    paraAccount: stableAccount,
    smartWallet: walletQuery.data,
  };
};

export { AuthFlowState };
export type { AuthMachineContext };
