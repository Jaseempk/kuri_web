import OneSignal from 'react-onesignal';

export interface NotificationData {
  type: 'JOIN_REQUEST' | 'JOIN_APPROVED' | 'DEPOSIT_TIME' | 'DEPOSIT_DEADLINE' | 'RAFFLE_WINNER' | 'WINNER_PAYOUT';
  circleAddress?: string;
  userAddress?: string;
  metadata?: Record<string, any>;
}

export class OneSignalService {
  private static instance: OneSignalService;
  private initialized = false;

  public static getInstance(): OneSignalService {
    if (!OneSignalService.instance) {
      OneSignalService.instance = new OneSignalService();
    }
    return OneSignalService.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await OneSignal.init({
        appId: import.meta.env.VITE_ONESIGNAL_APP_ID || "5ad950da-8f42-4194-bbe0-b2b7d64c79c1",
        safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID || "web.onesignal.auto.1f7edc6b-077e-4a04-b244-6d0a0c671761",
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: true,
      });

      this.initialized = true;
      console.log('OneSignal initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OneSignal:', error);
      throw error;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const permission = await OneSignal.getNotificationPermission();
      if (permission === 'granted') return true;
      
      const granted = await OneSignal.requestPermission();
      console.log('Push permission granted:', granted);
      return granted;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      return false;
    }
  }

  async subscribeUser(userAddress: string): Promise<string | null> {
    try {
      const userId = await OneSignal.getUserId();
      if (!userId) {
        console.warn('No OneSignal user ID available');
        return null;
      }

      // Tag user for targeted notifications
      await OneSignal.sendTags({
        user_address: userAddress.toLowerCase(),
        role: 'user',
        platform: 'web',
        last_updated: Date.now().toString(),
      });

      console.log(`OneSignal user subscribed: ${userId} for address: ${userAddress}`);
      return userId;
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      return null;
    }
  }

  async updateUserCircles(userAddress: string, activeCircles: string[]): Promise<void> {
    try {
      // Clear existing circle tags first (up to 5 circles max due to OneSignal tag limits)
      const clearTags: Record<string, string> = {
        user_address: userAddress.toLowerCase(),
        circle_count: activeCircles.length.toString(),
        circle_0: '',
        circle_1: '',
        circle_2: '',
        circle_3: '',
        circle_4: '',
        last_updated: Date.now().toString(),
      };
      
      // Set active circle tags
      activeCircles.forEach((circleAddress, index) => {
        if (index < 5) { // OneSignal tag limit consideration
          clearTags[`circle_${index}`] = circleAddress.toLowerCase();
        }
      });

      await OneSignal.sendTags(clearTags);
      console.log(`Updated OneSignal tags for ${userAddress}: ${activeCircles.length} circles`);
    } catch (error) {
      console.error('Failed to update user circles:', error);
      throw error;
    }
  }

  async updateUserRole(userAddress: string, isCreator: boolean): Promise<void> {
    try {
      await OneSignal.sendTags({
        user_address: userAddress.toLowerCase(),
        role: isCreator ? 'creator' : 'member',
        last_updated: Date.now().toString(),
      });
      
      console.log(`Updated user role for ${userAddress}: ${isCreator ? 'creator' : 'member'}`);
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  }

  onNotificationClick(callback: (data: NotificationData) => void): void {
    try {
      OneSignal.on('notificationClick', (event) => {
        console.log('Notification clicked:', event);
        const { data } = event.data || {};
        if (data) {
          callback(data as NotificationData);
        }
      });
    } catch (error) {
      console.error('Failed to set up notification click handler:', error);
    }
  }

  async getNotificationPermission(): Promise<string> {
    try {
      return await OneSignal.getNotificationPermission();
    } catch (error) {
      console.error('Failed to get notification permission:', error);
      return 'default';
    }
  }

  async isInitialized(): Promise<boolean> {
    return this.initialized;
  }

  async getUserId(): Promise<string | null> {
    try {
      return await OneSignal.getUserId();
    } catch (error) {
      console.error('Failed to get user ID:', error);
      return null;
    }
  }

  // Helper method to check if OneSignal is supported in current browser
  static isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Clean up user tags when user disconnects wallet
  async clearUserTags(): Promise<void> {
    try {
      await OneSignal.sendTags({
        user_address: '',
        role: '',
        circle_count: '0',
        circle_0: '',
        circle_1: '',
        circle_2: '',
        circle_3: '',
        circle_4: '',
      });
      
      console.log('OneSignal user tags cleared');
    } catch (error) {
      console.error('Failed to clear user tags:', error);
    }
  }
}