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
    const response = await fetch(`${this.baseUrl}/api/auth/message/${action}/${address}`);
    const result: ApiResponse<AuthMessageResponse> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to get auth message');
    }
    
    return result.data!;
  }

  /**
   * Create or update user profile via backend API
   */
  async createOrUpdateProfile(data: ProfileData): Promise<any> {
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

    const result: ApiResponse<any> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Failed to create profile');
    }
    
    return result.data;
  }

  /**
   * Create circle metadata via backend API
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