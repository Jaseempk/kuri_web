import { apiClient } from "../lib/apiClient";
import type { KuriUserProfile, UserProfileFormData } from "../types/user";

export interface ProfileCreateData extends UserProfileFormData {
  userAddress: string;
  image?: File | null;
  message?: string;
  signature?: string;
}

export interface ProfileUpdateData extends Partial<UserProfileFormData> {
  profile_image_url?: string;
}

export interface ProfileService {
  fetchProfile(address: string): Promise<KuriUserProfile | null>;
  fetchProfileSilent(address: string): Promise<KuriUserProfile | null>;
  createProfile(data: ProfileCreateData): Promise<KuriUserProfile>;
  updateProfile(
    address: string,
    data: ProfileUpdateData
  ): Promise<KuriUserProfile>;
  onProfileChange(
    callback: (profile: KuriUserProfile | null) => void
  ): () => void;
}

export class KuriProfileService implements ProfileService {
  private listeners = new Set<(profile: KuriUserProfile | null) => void>();
  private currentProfile: KuriUserProfile | null = null;
  private currentAddress: string | null = null;

  async fetchProfile(address: string): Promise<KuriUserProfile | null> {
    console.log(`🔍 PROFILE SERVICE: Fetching profile for address: ${address}`);
    try {
      const profile = await apiClient.getUserProfile(address);
      console.log(
        `✅ PROFILE SERVICE: Successfully fetched profile for ${address}:`,
        profile
      );

      // Update current profile and notify listeners if address matches
      if (address.toLowerCase() === this.currentAddress?.toLowerCase()) {
        this.currentProfile = profile;
        this.notifyListeners();
      }

      return profile;
    } catch (error) {
      const isNotFound = (error as any)?.response?.status === 404;

      console.log(
        `❌ PROFILE SERVICE: Error fetching profile for ${address}:`,
        {
          error,
          status: (error as any)?.response?.status,
          statusText: (error as any)?.response?.statusText,
          data: (error as any)?.response?.data,
          isNotFound,
        }
      );

      // Clear current profile on error if address matches
      if (address.toLowerCase() === this.currentAddress?.toLowerCase()) {
        this.currentProfile = null;

        // 🔑 KEY FIX: Only notify listeners for non-404 errors
        // 404 = expected (new user), don't trigger invalidation
        // Other errors = unexpected, should trigger retry
        if (!isNotFound) {
          this.notifyListeners();
        }
      }

      return null;
    }
  }

  async fetchProfileSilent(address: string): Promise<KuriUserProfile | null> {
    try {
      const profile = await apiClient.getUserProfile(address);

      return profile;
    } catch (error) {
      const isNotFound = (error as any)?.response?.status === 404;
      console.log(
        `❌ PROFILE SERVICE (SILENT): Error fetching profile for ${address}:`,
        {
          error,
          status: (error as any)?.response?.status,
          statusText: (error as any)?.response?.statusText,
          isNotFound,
        }
      );
      return null;
    }
  }

  async createProfile(data: ProfileCreateData): Promise<KuriUserProfile> {
    try {
      // Use the comprehensive create or update API
      const profile = await apiClient.createOrUpdateProfile({
        userAddress: data.userAddress,
        username: data.username || "",
        displayName: data.display_name || "",
        image: data.image || undefined,
        message: data.message || "",
        signature: data.signature || "",
      });

      // Update current profile and notify listeners
      this.currentAddress = data.userAddress.toLowerCase();
      this.currentProfile = profile;
      this.notifyListeners();

      return profile;
    } catch (error) {
      console.error("Failed to create profile:", error);
      throw error;
    }
  }

  async updateProfile(
    address: string,
    data: ProfileUpdateData
  ): Promise<KuriUserProfile> {
    try {
      // Use the same createOrUpdateProfile method for updates
      const profile = await apiClient.createOrUpdateProfile({
        userAddress: address,
        username: data.username || "",
        displayName: data.display_name || "",
        image: undefined, // Updates don't support image changes yet
        message: "", // Auth will be handled elsewhere
        signature: "",
      });

      // Update current profile and notify listeners if address matches
      if (address.toLowerCase() === this.currentAddress?.toLowerCase()) {
        this.currentProfile = profile;
        this.notifyListeners();
      }

      return profile;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  }

  onProfileChange(
    callback: (profile: KuriUserProfile | null) => void
  ): () => void {
    this.listeners.add(callback);

    // REMOVED: Immediate callback to prevent infinite invalidation loops
    // Components should handle initial loading states properly

    // Return cleanup function
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback(this.currentProfile);
      } catch (error) {
        console.error("ProfileService listener error:", error);
      }
    });
  }

  // Set the current address for tracking
  setCurrentAddress(address: string): void {
    const normalizedAddress = address.toLowerCase();
    if (this.currentAddress !== normalizedAddress) {
      this.currentAddress = normalizedAddress;
      this.currentProfile = null; // Clear profile when address changes
      this.notifyListeners();
    }
  }

  // Get current profile without fetching
  getCurrentProfile(): KuriUserProfile | null {
    return this.currentProfile;
  }

  // Clear all cached data
  clearCache(): void {
    this.currentProfile = null;
    this.currentAddress = null;
    this.notifyListeners();
  }
}

// Singleton instance
let profileServiceInstance: KuriProfileService | null = null;

export function getProfileService(): KuriProfileService {
  if (!profileServiceInstance) {
    profileServiceInstance = new KuriProfileService();
  }
  return profileServiceInstance;
}
