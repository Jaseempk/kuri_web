import { useCallback } from "react";
import { KuriUserProfile } from "../types/user";
import { useAccount } from "@getpara/react-sdk";
import { useApiAuth } from "./useApiAuth";
import { apiClient } from "../lib/apiClient";
import { formatErrorForUser } from "../utils/apiErrors";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const useUserProfile = () => {
  const account = useAccount();
  const address = account.embedded.wallets?.[0]?.address;
  const { getSignedAuth } = useApiAuth();
  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error,
    refetch: refreshProfile,
  } = useQuery({
    queryKey: ['user-profile', address?.toLowerCase()],
    queryFn: () => apiClient.getUserProfile(address!),
    enabled: !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const updateProfile = useCallback(async (updates: Partial<KuriUserProfile> & { image?: File }) => {
    if (!address) return;

    // Optimistic update: Set cache immediately
    const optimisticProfile: KuriUserProfile = {
      id: 0,
      user_address: address,
      username: updates.username || '',
      display_name: updates.display_name || '',
      profile_image_url: updates.image ? URL.createObjectURL(updates.image) : null,
      reputation_score: updates.reputation_score || 0,
      created_at: new Date(),
      last_active: new Date(),
    };

    queryClient.setQueryData(['user-profile', address?.toLowerCase()], optimisticProfile);

    try {
      // Background API call
      const { message, signature } = await getSignedAuth('create_profile');
      
      const result = await apiClient.createOrUpdateProfile({
        userAddress: address,
        username: updates.username || '',
        displayName: updates.display_name || '',
        image: updates.image,
        message,
        signature,
      });

      // Update cache with real backend data
      queryClient.setQueryData(['user-profile', address?.toLowerCase()], result);
      
      return result;
    } catch (error) {
      // Rollback optimistic update on failure
      queryClient.setQueryData(['user-profile', address?.toLowerCase()], null);
      
      console.error("Error updating profile:", error);
      const formattedError = new Error(formatErrorForUser(error));
      throw formattedError;
    }
  }, [address, getSignedAuth, queryClient]);

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
    queryKey: ['user-profile-by-address', userAddress?.toLowerCase()],
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
