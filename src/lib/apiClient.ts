import { KuriUserProfile } from "../types/user";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

interface AuthMessageResponse {
  message: string;
  timestamp: number;
}

interface ProfileData {
  userAddress: string;
  username: string;
  displayName: string;
  image?: File;
  message: string;
  signature: string;
}

interface CircleData {
  userAddress: string;
  contractAddress: string;
  transactionHash: string;
  shortDescription: string;
  longDescription?: string;
  image?: File;
}

class KuriApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (!this.baseUrl) {
      console.error('VITE_BACKEND_URL environment variable is required');
      this.baseUrl = 'http://localhost:3001'; // fallback for development
    }
    
    // Remove trailing slash
    this.baseUrl = this.baseUrl.replace(/\/$/, '');
  }

  /**
   * Get authentication message from backend
   */
  async getAuthMessage(action: 'create_profile' | 'create_market', address: string): Promise<AuthMessageResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/message/${action}/${address}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but received: ${text.substring(0, 100)}...`);
      }

      const result: ApiResponse<AuthMessageResponse> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get auth message');
      }
      
      return result.data!;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Create or update user profile via backend API
   * SECURITY NOTE: Backend must verify the signature cryptographically
   * to ensure the message was actually signed by the claimed address
   */
  async createOrUpdateProfile(data: ProfileData): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('address', data.userAddress);        // ✅ Fixed: 'address' instead of 'userAddress'
      formData.append('userAddress', data.userAddress);     // Keep for backend controller
      formData.append('username', data.username);
      formData.append('displayName', data.displayName);
      formData.append('message', data.message);
      formData.append('signature', data.signature);
      
      if (data.image) {
        formData.append('image', data.image);
      }

      const response = await fetch(`${this.baseUrl}/api/users/profile`, {
        method: 'POST',
        body: formData,
      });

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Expected JSON but received: ${text.substring(0, 100)}...`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to create profile');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Create circle metadata via backend API
   * SECURITY NOTE: Backend should verify the transaction hash exists
   * and that the userAddress is the actual creator of the contract
   */
  async createCircleMetadata(data: CircleData): Promise<any> {
    const formData = new FormData();
    formData.append('userAddress', data.userAddress);
    formData.append('contractAddress', data.contractAddress);
    formData.append('transactionHash', data.transactionHash);
    formData.append('shortDescription', data.shortDescription);
    
    if (data.longDescription) {
      formData.append('longDescription', data.longDescription);
    }
    
    if (data.image) {
      formData.append('image', data.image);
    }

    const response = await fetch(`${this.baseUrl}/api/circles/metadata`, {
      method: 'POST',
      body: formData,
    });

    const result: ApiResponse<any> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create metadata');
    }
    
    return result.data;
  }

  /**
   * Get single user profile by address
   */
  async getUserProfile(address: string): Promise<KuriUserProfile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/profile/${address.toLowerCase()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Profile not found
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<KuriUserProfile> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get user profile');
      }
      
      return result.data || null;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get multiple user profiles by addresses
   */
  async getUserProfiles(addresses: string[]): Promise<KuriUserProfile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/profiles/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: addresses.map(addr => addr.toLowerCase()) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{profiles: KuriUserProfile[], totalFound: number, totalRequested: number}> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get user profiles');
      }
      
      return result.data?.profiles || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Validate market addresses (replaces useKuriMarkets validation)
   */
  async validateMarketAddresses(addresses: string[]): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/markets/validation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: addresses.map(addr => addr.toLowerCase()) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{validAddresses: string[]}> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to validate market addresses');
      }
      
      return result.data?.validAddresses || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get all valid market addresses
   */
  async getAllValidMarketAddresses(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/markets/valid-addresses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<string[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get valid market addresses');
      }
      
      return result.data || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get single market metadata by address
   */
  async getMarketMetadata(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/markets/${address.toLowerCase()}/metadata`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get market metadata');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get bulk market metadata by addresses
   */
  async getBulkMarketMetadata(addresses: string[]): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/markets/metadata/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: addresses.map(addr => addr.toLowerCase()) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<{metadata: any[], totalFound: number, totalRequested: number}> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get bulk market metadata');
      }
      
      return result.data?.metadata || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Store push subscription for notifications
   */
  async storePushSubscription(data: {
    userAddress: string;
    playerId: string;
    platform: string;
    enabled: boolean;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/push-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to store push subscription');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Update push notification preferences
   */
  async updatePushPreferences(data: {
    userAddress: string;
    platform?: string;
    preferences: {
      joinRequests?: boolean;
      depositReminders?: boolean;
      raffleResults?: boolean;
      deadlineWarnings?: boolean;
    };
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/push-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to update push preferences');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(data: {
    userAddress: string;
    message?: string;
  }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/notifications/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to send test notification');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Get push subscription status
   */
  async getPushStatus(userAddress: string, platform: string = 'web'): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/users/push-status?userAddress=${encodeURIComponent(userAddress)}&platform=${encodeURIComponent(platform)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<any> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to get push status');
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to backend server. Please check your connection.');
      }
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/`);
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiClient = new KuriApiClient();
export type { ProfileData, CircleData, ApiResponse, AuthMessageResponse, KuriUserProfile };