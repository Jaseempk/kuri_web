export interface NotificationData {
  type: 'JOIN_REQUEST' | 'JOIN_APPROVED' | 'DEPOSIT_TIME' | 'DEPOSIT_DEADLINE' | 'RAFFLE_WINNER' | 'WINNER_PAYOUT';
  circleAddress?: string;
  userAddress?: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  joinRequests?: boolean;
  depositReminders?: boolean;
  raffleResults?: boolean;
  deadlineWarnings?: boolean;
}

export interface UserSubscriptionData {
  userAddress: string;
  playerId: string;
  platform: 'web' | 'ios' | 'android';
  enabled: boolean;
}

export class OneSignalService {
  private static instance: OneSignalService;
  private initialized = false;
  private apiClient: any;

  private constructor() {
    this.initApiClient();
  }

  private async initApiClient() {
    try {
      const { apiClient } = await import('../lib/apiClient');
      this.apiClient = apiClient;
    } catch (error) {
      console.error('Failed to initialize API client:', error);
    }
  }

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await this.waitForOneSignal();
      this.initialized = true;
      console.log('OneSignal service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OneSignal service:', error);
      throw error;
    }
  }

  private waitForOneSignal(): Promise<void> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds timeout
      
      const checkOneSignal = () => {
        if (window.OneSignal) {
          resolve();
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkOneSignal, 100);
        } else {
          reject(new Error('OneSignal SDK not loaded'));
        }
      };
      
      checkOneSignal();
    });
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!window.OneSignal) {
        console.error('OneSignal not available');
        return false;
      }

      const permission = await window.OneSignal.Notifications.permission;
      if (permission === 'granted') return true;
      
      const granted = await window.OneSignal.Notifications.requestPermission();
      console.log('Push permission granted:', granted);
      return granted;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      return false;
    }
  }

  async subscribeUser(userAddress: string): Promise<string | null> {
    try {
      if (!window.OneSignal || !userAddress) {
        console.warn('OneSignal not available or invalid user address');
        return null;
      }

      const externalId = userAddress.toLowerCase();
      await window.OneSignal.login(externalId);

      const user = await window.OneSignal.User.getUser();
      const playerId = user?.onesignalId;

      if (!playerId) {
        console.warn('No OneSignal player ID available');
        return null;
      }

      if (this.apiClient) {
        try {
          await this.apiClient.storePushSubscription({
            userAddress: externalId,
            playerId,
            platform: 'web',
            enabled: true,
          });
          
          console.log(`Backend subscription stored for ${userAddress} with external_id: ${externalId}`);
        } catch (error) {
          console.error('Failed to store subscription in backend:', error);
        }
      }

      console.log(`OneSignal user subscribed: ${playerId} with external_id: ${externalId}`);
      return playerId;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      return null;
    }
  }

  async updateUserPreferences(
    userAddress: string,
    preferences: NotificationPreferences
  ): Promise<boolean> {
    try {
      if (!this.apiClient) {
        console.error('API client not available');
        return false;
      }

      const response = await this.apiClient.updatePushPreferences({
        userAddress: userAddress.toLowerCase(),
        platform: 'web',
        preferences,
      });

      if (response.success) {
        localStorage.setItem(
          `notification-preferences-${userAddress.toLowerCase()}`,
          JSON.stringify(preferences)
        );
        
        console.log(`Updated preferences for ${userAddress}:`, preferences);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to update user preferences:', error);
      return false;
    }
  }

  async getUserPreferences(userAddress: string): Promise<NotificationPreferences> {
    try {
      // Try localStorage first for immediate response
      const localPrefs = localStorage.getItem(`notification-preferences-${userAddress.toLowerCase()}`);
      if (localPrefs) {
        return JSON.parse(localPrefs);
      }

      // Try to get preferences from backend if available
      if (this.apiClient) {
        try {
          const status = await this.apiClient.getPushStatus(userAddress.toLowerCase(), 'web');
          if (status.subscribed && status.preferences) {
            // Cache preferences locally for future use
            localStorage.setItem(
              `notification-preferences-${userAddress.toLowerCase()}`,
              JSON.stringify(status.preferences)
            );
            return status.preferences;
          }
        } catch (error) {
          console.log('Backend preferences not available, using defaults');
        }
      }

      // Return defaults
      return {
        joinRequests: true,
        depositReminders: true,
        raffleResults: true,
        deadlineWarnings: true,
      };
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return {
        joinRequests: true,
        depositReminders: true,
        raffleResults: true,
        deadlineWarnings: true,
      };
    }
  }

  onNotificationClick(callback: (data: NotificationData) => void): void {
    try {
      if (!window.OneSignal) {
        console.error('OneSignal not available for click handler');
        return;
      }

      window.OneSignal.Notifications.addEventListener('click', (event: any) => {
        console.log('Notification clicked:', event);
        const data = event.notification?.additionalData;
        if (data) {
          callback(data as NotificationData);
        }
      });
    } catch (error) {
      console.error('Failed to set up notification click handler:', error);
    }
  }

  async getSubscriptionState(): Promise<{
    isSubscribed: boolean;
    permission: string;
    playerId?: string;
    externalId?: string;
  }> {
    try {
      if (!window.OneSignal) {
        return {
          isSubscribed: false,
          permission: 'default',
        };
      }

      const permission = await window.OneSignal.Notifications.permission;
      const user = await window.OneSignal.User.getUser();
      
      return {
        isSubscribed: permission === 'granted' && !!user?.onesignalId,
        permission,
        playerId: user?.onesignalId,
        externalId: user?.externalId,
      };
    } catch (error) {
      console.error('Failed to get subscription state:', error);
      return {
        isSubscribed: false,
        permission: 'default',
      };
    }
  }

  async logoutUser(): Promise<void> {
    try {
      if (!window.OneSignal) {
        console.warn('OneSignal not available for logout');
        return;
      }

      await window.OneSignal.logout();
      console.log('OneSignal user logged out');
    } catch (error) {
      console.error('Failed to logout OneSignal user:', error);
    }
  }

  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  async sendTestNotification(userAddress: string): Promise<boolean> {
    try {
      if (!this.apiClient) {
        console.error('API client not available for test notification');
        return false;
      }

      const response = await this.apiClient.sendTestNotification({
        userAddress: userAddress.toLowerCase(),
        message: 'Test notification from Kuri Frontend!',
      });

      return response?.success || false;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }
}

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}