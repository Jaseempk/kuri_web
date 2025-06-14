import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { KuriUserProfile } from "../types/user";
import { useAccount } from "wagmi";

export const useUserProfile = () => {
  const { address } = useAccount();
  const [profile, setProfile] = useState<KuriUserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from("kuri_user_profiles")
        .select("*")
        .eq("user_address", address.toLowerCase())
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  const updateProfile = async (updates: Partial<KuriUserProfile>) => {
    if (!address) return;

    try {
      const { data, error } = await supabase
        .from("kuri_user_profiles")
        .upsert({
          user_address: address.toLowerCase(),
          ...updates,
          last_active: new Date(),
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
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
        .single();

      if (error) throw error;
      return data;
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
