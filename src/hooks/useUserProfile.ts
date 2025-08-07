import { useCallback } from "react";
import { KuriUserProfile } from "../types/user";
import { useAccount } from "wagmi";
import { useApiAuth } from "./useApiAuth";
import { apiClient } from "../lib/apiClient";
import { formatErrorForUser } from "../utils/apiErrors";
import { useQuery } from "@tanstack/react-query";

export const useUserProfile = () => {
  const { address } = useAccount();
  const { getSignedAuth } = useApiAuth();

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

    try {
      // Get signed authentication for profile creation
      const { message, signature } = await getSignedAuth('create_profile');
      
      // Call backend API
      const result = await apiClient.createOrUpdateProfile({
        userAddress: address,
        username: updates.username || '',
        displayName: updates.display_name || '',
        image: updates.image,
        message,
        signature,
      });
      
      // Refresh profile data to ensure consistency
      await refreshProfile();
      
      return result;
    } catch (error) {
      console.error("Error updating profile:", error);
      // Format error for better user experience
      const formattedError = new Error(formatErrorForUser(error));
      throw formattedError;
    }
  }, [address, getSignedAuth, refreshProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refreshProfile,
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
