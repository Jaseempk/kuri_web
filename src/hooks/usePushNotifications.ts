import { useEffect, useState, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { OneSignalHelper, NotificationPreferences, SubscriptionState } from '../services/oneSignalSimple';

export interface PushNotificationState {
  isInitialized: boolean;
  isSupported: boolean;
  subscriptionState: SubscriptionState | null;
  preferences: NotificationPreferences;
  loading: boolean;
  error?: string;
}

export const usePushNotifications = () => {
  const [state, setState] = useState<PushNotificationState>({
    isInitialized: false,
    isSupported: OneSignalHelper.isSupported(),
    subscriptionState: null,
    preferences: {
      joinRequests: true,
      depositReminders: true,
      raffleResults: true,
      deadlineWarnings: true,
    },
    loading: true,
  });

  const { address } = useAccount();

  // Wait for OneSignal to initialize
  useEffect(() => {
    console.log('🔔 usePushNotifications: Starting initialization check');
    let attempts = 0;
    const maxAttempts = 100; // 10 seconds
    
    const checkInit = () => {
      attempts++;
      console.log(`🔔 usePushNotifications: Check attempt ${attempts}/${maxAttempts}`);
      
      if (OneSignalHelper.isAvailable()) {
        console.log('✅ usePushNotifications: OneSignal is available, initializing hook');
        setState(prev => ({
          ...prev,
          isInitialized: true,
          subscriptionState: OneSignalHelper.getSubscriptionState(),
          loading: false,
        }));
      } else if (attempts < maxAttempts) {
        setTimeout(checkInit, 100);
      } else {
        console.error('❌ usePushNotifications: OneSignal failed to initialize after 10 seconds');
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'OneSignal failed to initialize',
        }));
      }
    };
    checkInit();
  }, []);

  // Handle user login/logout based on wallet connection
  useEffect(() => {
    if (!state.isInitialized) return;

    if (address) {
      console.log('Wallet connected, logging in to OneSignal:', address);
      OneSignalHelper.login(address);
    } else {
      console.log('Wallet disconnected, logging out from OneSignal');
      OneSignalHelper.logout();
    }
  }, [state.isInitialized, address]);

  // Set up subscription change listener
  useEffect(() => {
    if (!state.isInitialized) return;

    const handleSubscriptionChange = (event: any) => {
      console.log('Subscription changed:', event);
      const newState = OneSignalHelper.getSubscriptionState();
      setState(prev => ({ ...prev, subscriptionState: newState }));
      
      // If user gets a token and we have their address, login again to ensure linking
      if (event.current.token && address) {
        console.log('Token received, ensuring user is logged in');
        OneSignalHelper.login(address);
      }
    };

    const cleanup = OneSignalHelper.addSubscriptionChangeListener(handleSubscriptionChange);

    // Initial state update
    setState(prev => ({ 
      ...prev, 
      subscriptionState: OneSignalHelper.getSubscriptionState() 
    }));

    return cleanup || undefined;
  }, [state.isInitialized, address]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Push notifications not supported' }));
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const granted = await OneSignalHelper.requestPermission();
      
      setState(prev => ({
        ...prev,
        subscriptionState: OneSignalHelper.getSubscriptionState(),
        loading: false,
      }));

      return granted;
    } catch (error) {
      console.error('Failed to request permission:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to request push notification permission',
      }));
      return false;
    }
  }, [state.isSupported]);

  const updatePreferences = useCallback(async (
    newPreferences: NotificationPreferences
  ): Promise<boolean> => {
    if (!state.isInitialized) {
      console.warn('OneSignal not initialized');
      return false;
    }

    setState(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      await OneSignalHelper.setPreferences(newPreferences);
      setState(prev => ({
        ...prev,
        preferences: newPreferences,
        loading: false,
      }));
      return true;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to update notification preferences',
      }));
      return false;
    }
  }, [state.isInitialized]);

  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!address) {
      console.warn('No wallet address available for test notification');
      return false;
    }

    try {
      // This would need to call the backend API to send a test notification
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userAddress: address,
          message: 'Test notification from Kuri frontend!'
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }, [address]);

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: undefined }));
  }, []);

  // Computed properties
  const isSubscribed = state.subscriptionState?.optedIn && !!state.subscriptionState?.token;
  const permission = state.subscriptionState?.permission || false;

  return {
    ...state,
    isSubscribed,
    permission,
    playerId: state.subscriptionState?.id,
    externalId: OneSignalHelper.getExternalId(),
    requestPermission,
    updatePreferences,
    sendTestNotification,
    clearError,
  };
};