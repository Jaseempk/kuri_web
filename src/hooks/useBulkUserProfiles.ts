import { useCallback } from "react";
import { KuriUserProfile } from "../types/user";
import { apiClient } from "../lib/apiClient";
import { useQuery } from "@tanstack/react-query";


export const useBulkUserProfiles = (addresses: string[]) => {
  const lowercaseAddresses = addresses.map(addr => addr.toLowerCase());

  const {
    data: profilesArray = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bulk-user-profiles', lowercaseAddresses.sort().join(',')],
    queryFn: () => apiClient.getUserProfiles(lowercaseAddresses),
    enabled: addresses.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Convert array to address-keyed object for compatibility
  const profiles = profilesArray.reduce((acc, profile) => {
    if (profile) {
      acc[profile.user_address.toLowerCase()] = profile;
    }
    return acc;
  }, {} as Record<string, KuriUserProfile | null>);

  // Add null entries for addresses without profiles
  lowercaseAddresses.forEach(addr => {
    if (!(addr in profiles)) {
      profiles[addr] = null;
    }
  });

  const getProfile = useCallback(
    (address: string): KuriUserProfile | null => {
      return profiles[address.toLowerCase()] || null;
    },
    [profiles]
  );

  const isProfileLoading = useCallback(
    (address?: string): boolean => {
      if (address) {
        return isLoading && !(address.toLowerCase() in profiles);
      }
      return isLoading;
    },
    [isLoading, profiles]
  );

  return {
    getProfile,
    isLoading: isProfileLoading,
    error,
    refetch,
    profiles, // Raw profiles object for advanced use cases
  };
};
