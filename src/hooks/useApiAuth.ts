import { useAccount } from 'wagmi';
import { useSignMessage } from 'wagmi';
import { apiClient } from '../lib/apiClient';

interface SignedAuth {
  message: string;
  signature: string;
  address: string;
}

export const useApiAuth = () => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  /**
   * Get signed authentication for API calls
   * @param action - Type of action requiring authentication
   * @returns Signed authentication data
   */
  const getSignedAuth = async (action: 'create_profile' | 'create_market'): Promise<SignedAuth> => {
    if (!address) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Get message from backend
      const { message, timestamp } = await apiClient.getAuthMessage(action, address);
      
      // Sign message with wallet
      const signature = await signMessageAsync({ message });
      
      return { 
        message, 
        signature, 
        address 
      };
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  };

  return { 
    getSignedAuth,
    isConnected: !!address 
  };
};