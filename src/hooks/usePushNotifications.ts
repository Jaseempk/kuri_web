import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { OneSignalService, NotificationPreferences } from '../services/oneSignalService';
import { useUserProfile } from './useUserProfile';

export interface PushNotificationState {
  isInitialized: boolean;
  isSupported: boolean;
  permission: NotificationPermission | 'default';
  isSubscribed: boolean;
  playerId?: string;
  externalId?: string;
  preferences: NotificationPreferences;
  loading: boolean;
  error?: string;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isInitialized: false,
    isSupported: OneSignalService.isSupported(),
    permission: 'default',
    isSubscribed: false,
    preferences: {
      joinRequests: true,
      depositReminders: true,
      raffleResults: true,
      deadlineWarnings: true,
    },
    loading: true,
  });

  const { address } = useAccount();
  const { profile } = useUserProfile();

  // Initialize OneSignal service
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Update subscription when user connects/disconnects
  useEffect(() => {
    if (address && state.isInitialized) {
      updateSubscriptionForUser(address);
    } else if (!address && state.isInitialized) {
      handleUserDisconnect();
    }
  }, [address, state.isInitialized]);

  const initializeNotifications = async () => {
    try {
      if (!state.isSupported) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Push notifications not supported in this browser',
        }));
        return;
      }

      const service = OneSignalService.getInstance();
      await service.initialize();

      const subscriptionState = await service.getSubscriptionState();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        permission: subscriptionState.permission as NotificationPermission,
        isSubscribed: subscriptionState.isSubscribed,
        playerId: subscriptionState.playerId,
        externalId: subscriptionState.externalId,
        loading: false,
      }));

      // Set up notification click handler
      service.onNotificationClick(handleNotificationClick);

    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to initialize push notifications',
      }));
    }
  };

  const updateSubscriptionForUser = async (userAddress: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const service = OneSignalService.getInstance();
      
      // Get user preferences
      const preferences = await service.getUserPreferences(userAddress);
      
      // Subscribe user with external_id
      const playerId = await service.subscribeUser(userAddress);
      
      // Get updated subscription state
      const subscriptionState = await service.getSubscriptionState();

      setState(prev => ({
        ...prev,
        isSubscribed: subscriptionState.isSubscribed,
        playerId: subscriptionState.playerId,
        externalId: subscriptionState.externalId,
        preferences,
        loading: false,
        error: undefined,
      }));

      console.log(`Push notifications updated for user: ${userAddress}`);
    } catch (error) {
      console.error('Failed to update user subscription:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to update push notification subscription',
      }));
    }
  };

  const handleUserDisconnect = async () => {
    try {
      const service = OneSignalService.getInstance();
      await service.logoutUser();

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        playerId: undefined,
        externalId: undefined,
        preferences: {
          joinRequests: true,
          depositReminders: true,
          raffleResults: true,
          deadlineWarnings: true,
        },
      }));

      console.log('Push notifications cleared for disconnected user');
    } catch (error) {
      console.error('Failed to handle user disconnect:', error);
    }
  };

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const service = OneSignalService.getInstance();
      const granted = await service.requestPermission();

      if (granted && address) {
        await updateSubscriptionForUser(address);
      } else {
        setState(prev => ({
          ...prev,
          permission: granted ? 'granted' : 'denied',
          loading: false,
        }));
      }

      return granted;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to request push permission',
      }));
      return false;
    }
  }, [address]);

  const updatePreferences = useCallback(async (
    newPreferences: NotificationPreferences
  ): Promise<boolean> => {
    if (!address) {
      console.warn('No user address available for preference update');
      return false;
    }

    try {
      setState(prev => ({ ...prev, loading: true }));

      const service = OneSignalService.getInstance();
      const success = await service.updateUserPreferences(address, newPreferences);

      if (success) {
        setState(prev => ({
          ...prev,
          preferences: newPreferences,
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to update notification preferences',
        }));
      }

      return success;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to update notification preferences',
      }));
      return false;
    }
  }, [address]);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!address) {
      console.warn('No user address available for test notification');
      return false;
    }

    try {
      const service = OneSignalService.getInstance();
      return await service.sendTestNotification(address);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }, [address]);

  const handleNotificationClick = (data: any) => {
    console.log('Notification clicked in hook:', data);
    // Navigation will be handled by NotificationHandler component
  };

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  return {
    ...state,
    requestPermission,
    updatePreferences,
    sendTestNotification,
    clearError,
  };
};