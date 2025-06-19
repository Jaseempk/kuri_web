import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { KuriUserProfile } from "../types/user";

interface BulkProfilesState {
  profiles: Record<string, KuriUserProfile | null>;
  loading: boolean;
  error: string | null;
}

export const useBulkUserProfiles = (addresses: string[]) => {
  const [state, setState] = useState<BulkProfilesState>({
    profiles: {},
    loading: false,
    error: null,
  });

  const fetchProfiles = useCallback(async (addressList: string[]) => {
    if (addressList.length === 0) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Convert addresses to lowercase for consistent querying
      const lowercaseAddresses = addressList.map((addr) => addr.toLowerCase());

      const { data, error } = await supabase
        .from("kuri_user_profiles")
        .select("*")
        .in("user_address", lowercaseAddresses);

      if (error) throw error;

      // Create a map of address -> profile
      const profileMap: Record<string, KuriUserProfile | null> = {};

      // Initialize all addresses with null
      addressList.forEach((addr) => {
        profileMap[addr.toLowerCase()] = null;
      });

      // Fill in the profiles we found
      data?.forEach((profile) => {
        profileMap[profile.user_address] = profile;
      });

      setState((prev) => ({
        ...prev,
        profiles: { ...prev.profiles, ...profileMap },
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching bulk profiles:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch profiles",
      }));
    }
  }, []);

  useEffect(() => {
    if (addresses.length > 0) {
      // Only fetch profiles we don't already have
      const addressesToFetch = addresses.filter(
        (addr) => !(addr.toLowerCase() in state.profiles)
      );

      if (addressesToFetch.length > 0) {
        fetchProfiles(addressesToFetch);
      }
    }
  }, [addresses, fetchProfiles, state.profiles]);

  const getProfile = useCallback(
    (address: string): KuriUserProfile | null => {
      return state.profiles[address.toLowerCase()] || null;
    },
    [state.profiles]
  );

  const isLoading = useCallback(
    (address?: string): boolean => {
      if (address) {
        return state.loading && !(address.toLowerCase() in state.profiles);
      }
      return state.loading;
    },
    [state.loading, state.profiles]
  );

  return {
    getProfile,
    isLoading,
    error: state.error,
    refetch: () => fetchProfiles(addresses),
  };
};
