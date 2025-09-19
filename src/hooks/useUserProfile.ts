import { KuriUserProfile } from "../types/user";
import { getProfileService } from "../services/ProfileService";
import { useQuery } from "@tanstack/react-query";

// Hook to fetch any user's profile by address
export const useUserProfileByAddress = (userAddress: string | null) => {
  const profileService = getProfileService();
  const {
    data: profile,
    isLoading,
    error,
    refetch: fetchProfileByAddress,
  } = useQuery({
    queryKey: ["user-profile-by-address", userAddress?.toLowerCase()],
    queryFn: () => {
      return profileService.fetchProfileSilent(userAddress!);
    },
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
