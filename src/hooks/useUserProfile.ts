import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { KuriUserProfile } from "../types/user";
import { useAccount } from "wagmi";
import { useApiAuth } from "./useApiAuth";
import { apiClient } from "../lib/apiClient";
import { formatErrorForUser } from "../utils/apiErrors";

export const useUserProfile = () => {
  const { address } = useAccount();
  const { getSignedAuth } = useApiAuth();
  const [profile, setProfile] = useState<KuriUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from("kuri_user_profiles")
        .select("*")
        .eq("user_address", address.toLowerCase())
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

      if (error) throw error;
      setProfile(data); // data will be null if no profile exists
    } catch (error) {
      console.error("Error fetching profile:", error);
      setProfile(null); // Explicitly set to null on error
    } finally {
      setLoading(false);
    }
  }, [address]);

  const updateProfile = async (updates: Partial<KuriUserProfile> & { image?: File }) => {
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

      setProfile(result);
      
      // Refresh profile data to ensure consistency
      await fetchProfile();
      
      return result;
    } catch (error) {
      console.error("Error updating profile:", error);
      // Format error for better user experience
      const formattedError = new Error(formatErrorForUser(error));
      throw formattedError;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    updateProfile,
    refreshProfile: fetchProfile,
  };
};

// Hook to fetch any user's profile by address
export const useUserProfileByAddress = (userAddress: string | null) => {
  const [profile, setProfile] = useState<KuriUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileByAddress = useCallback(async (address: string) => {
    try {
      const { data, error } = await supabase
        .from("kuri_user_profiles")
        .select("*")
        .eq("user_address", address.toLowerCase())
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

      if (error) throw error;
      return data; // Will be null if no profile exists
    } catch (error) {
      console.error("Error fetching profile by address:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userAddress) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const profileData = await fetchProfileByAddress(userAddress);
      setProfile(profileData);
      setLoading(false);
    };

    fetchProfile();
  }, [userAddress, fetchProfileByAddress]);

  return {
    profile,
    loading,
    fetchProfileByAddress,
  };
};
