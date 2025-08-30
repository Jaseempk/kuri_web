import { useCallback, useMemo } from "react";
import { KuriUserProfile } from "../types/user";
import { useAccount } from "@getpara/react-sdk";
import { useApiAuth } from "./useApiAuth";
import { apiClient } from "../lib/apiClient";
import { formatErrorForUser } from "../utils/apiErrors";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSmartWallet } from "./useSmartWallet";

export const useUserProfile = () => {
  const account = useAccount();
  const { smartAddress } = useSmartWallet();
  const { getSignedAuth } = useApiAuth();
  const queryClient = useQueryClient();

  const queryOptions = useMemo(
    () => ({
      queryKey: ["user-profile-smart", smartAddress?.toLowerCase()],
      queryFn: async () => {
        if (!smartAddress)
          throw new Error("Smart wallet address not available");
        return apiClient.getUserProfile(smartAddress);
      },
      enabled: !!smartAddress,
      staleTime: 10 * 60 * 1000, // 10 minutes - longer to prevent excessive fetching
      refetchOnWindowFocus: false,
      placeholderData: (previousData: KuriUserProfile | null | undefined) =>
        previousData || null, // Keep previous data during transitions
    }),
    [smartAddress]
  );

  const {
    data: profile,
    isLoading,
    error,
    refetch: refreshProfile,
  } = useQuery(queryOptions);

  // console.log("User profile data:", profile, "for address:", smartAddress);

  const updateProfile = useCallback(
    async (updates: Partial<KuriUserProfile> & { image?: File }) => {
      if (!smartAddress) return;

      // Use smart wallet address for profile creation

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
        ["user-profile-smart", smartAddress?.toLowerCase()],
        optimisticProfile
      );

      try {
        // Background API call with smart wallet address
        const { message, signature } = await getSignedAuth(
          "create_profile",
          smartAddress
        );

        const result = await apiClient.createOrUpdateProfile({
          userAddress: smartAddress,
          username: updates.username || "",
          displayName: updates.display_name || "",
          image: updates.image,
          message,
          signature,
        });

        // Update cache with real backend data
        queryClient.setQueryData(
          ["user-profile-smart", smartAddress?.toLowerCase()],
          result
        );

        return result;
      } catch (error) {
        // Rollback optimistic update on failure
        queryClient.setQueryData(
          ["user-profile-smart", smartAddress?.toLowerCase()],
          null
        );

        console.error("Error updating profile:", error);
        const formattedError = new Error(formatErrorForUser(error));
        throw formattedError;
      }
    },
    [smartAddress, getSignedAuth, queryClient]
  );

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile,
    email: account.user?.email,
  };
};

// Hook to fetch any user's profile by address
export const useUserProfileByAddress = (userAddress: string | null) => {
  const {
    data: profile,
    isLoading,
    error,
    refetch: fetchProfileByAddress,
  } = useQuery({
    queryKey: ["user-profile-by-address", userAddress?.toLowerCase()],
    queryFn: () => apiClient.getUserProfile(userAddress!),
    enabled: !!userAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return {
    profile,
    isLoading,
    error,
    fetchProfileByAddress,
  };
};
