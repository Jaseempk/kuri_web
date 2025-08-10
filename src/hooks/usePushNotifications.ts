import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { OneSignalService } from '../services/oneSignalService';
import { useUserProfile } from './useUserProfile';
import { apiClient } from '../lib/apiClient';

export const usePushNotifications = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();
  const { profile } = useUserProfile();

  // Initialize OneSignal on mount
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Update subscription when wallet connects and profile is available
  useEffect(() => {
    if (address && profile && permissionGranted && isInitialized) {
      updateUserSubscription();
    }
  }, [address, profile, permissionGranted, isInitialized]);

  // Clear subscription when wallet disconnects
  useEffect(() => {
    if (!address && isInitialized) {
      clearUserSubscription();
    }
  }, [address, isInitialized]);

  const initializeNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if push notifications are supported
      if (!OneSignalService.isSupported()) {
        setError('Push notifications are not supported in this browser');
        return;
      }

      const service = OneSignalService.getInstance();
      await service.initialize();
      
      // Check current permission status
      const permission = await service.getNotificationPermission();
      setPermissionGranted(permission === 'granted');
      setIsInitialized(true);

      console.log('Push notifications initialized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize notifications';
      setError(errorMessage);
      console.error('Failed to initialize notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserSubscription = useCallback(async () => {
    if (!address || !isInitialized) return;

    try {
      setError(null);
      const service = OneSignalService.getInstance();
      const playerId = await service.subscribeUser(address);
      
      if (playerId) {
        // Store subscription in backend
        await apiClient.storePushSubscription({
          userAddress: address,
          playerId,
          platform: 'web',
          enabled: true,
        });
        
        // Update user's active circles for notification targeting
        await updateUserActiveCircles(address);
        
        console.log('User subscription updated successfully');
      }
    } catch (err) {
      console.error('Failed to update user subscription:', err);
      // Don't set error state for subscription failures to avoid UI disruption
    }
  }, [address, isInitialized]);

  const clearUserSubscription = useCallback(async () => {
    try {
      const service = OneSignalService.getInstance();
      await service.clearUserTags();
      console.log('User subscription cleared');
    } catch (err) {
      console.error('Failed to clear user subscription:', err);
    }
  }, []);

  const updateUserActiveCircles = async (userAddress: string) => {
    try {
      // Get user's active circles from existing markets data
      const activeCircles = await getUserActiveCircles(userAddress);
      
      const service = OneSignalService.getInstance();
      await service.updateUserCircles(userAddress, activeCircles);
    } catch (err) {
      console.error('Failed to update user active circles:', err);
    }
  };

  // Helper function to get user's active circles
  // This integrates with existing GraphQL infrastructure
  const getUserActiveCircles = async (userAddress: string): Promise<string[]> => {
    try {
      // For now, return empty array - this will be updated when GraphQL query is added
      // TODO: Implement USER_ACTIVE_CIRCLES_QUERY in graphql/queries.ts
      console.log('Getting active circles for user:', userAddress);
      return [];
    } catch (error) {
      console.error('Failed to get user active circles:', error);
      return [];
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const service = OneSignalService.getInstance();
      const granted = await service.requestPermission();
      setPermissionGranted(granted);
      
      if (granted && address && profile) {
        // Update subscription immediately after permission granted
        await updateUserSubscription();
      }
      
      return granted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      console.error('Failed to request push permission:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Method to manually refresh circle memberships
  const refreshCircleMemberships = useCallback(async () => {
    if (!address || !isInitialized) return;
    
    try {
      await updateUserActiveCircles(address);
    } catch (err) {
      console.error('Failed to refresh circle memberships:', err);
    }
  }, [address, isInitialized]);

  // Method to update user role (creator/member)
  const updateUserRole = useCallback(async (isCreator: boolean) => {
    if (!address || !isInitialized) return;
    
    try {
      const service = OneSignalService.getInstance();
      await service.updateUserRole(address, isCreator);
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  }, [address, isInitialized]);

  // Check if notifications are supported in current environment
  const isSupported = OneSignalService.isSupported();

  return {
    isInitialized,
    permissionGranted,
    isLoading,
    error,
    isSupported,
    requestPermission,
    refreshCircleMemberships,
    updateUserRole,
    // Utility methods
    clearError: () => setError(null),
  };
};