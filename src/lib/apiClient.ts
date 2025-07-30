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
   * Health check endpoint
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export const apiClient = new KuriApiClient();
export type { ProfileData, CircleData, ApiResponse, AuthMessageResponse };