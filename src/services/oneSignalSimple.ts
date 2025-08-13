// Simplified OneSignal helper service
// Follows OneSignal SDK v16 best practices from official documentation

export interface NotificationPreferences {
  joinRequests: boolean;
  depositReminders: boolean;
  raffleResults: boolean;
  deadlineWarnings: boolean;
}

export interface SubscriptionState {
  id: string | null;
  token: string | null;
  optedIn: boolean;
  permission: boolean;
}

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export const OneSignalHelper = {
  // Check if OneSignal is available and properly initialized
  isAvailable(): boolean {
    const available = typeof window !== 'undefined' && 
                     !!window.OneSignal && 
                     typeof window.OneSignal.init === 'function';
    console.log('🔔 OneSignalHelper.isAvailable():', available);
    return available;
  },

  // Login user with external ID (wallet address)
  async login(userAddress: string): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available for login');
      return;
    }

    try {
      await window.OneSignal.login(userAddress.toLowerCase());
      console.log(`OneSignal user logged in: ${userAddress}`);
    } catch (error) {
      console.error('OneSignal login failed:', error);
    }
  },

  // Logout user
  async logout(): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available for logout');
      return;
    }

    try {
      // Check if User model is available before logout
      if (!window.OneSignal.User) {
        console.warn('OneSignal User model not ready for logout');
        return;
      }
      
      await window.OneSignal.logout();
      console.log('OneSignal user logged out');
    } catch (error) {
      console.warn('OneSignal logout failed (User model not ready):', error);
      // Don't treat this as a critical error - just log it
    }
  },

  // Request push notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available for permission request');
      return false;
    }

    try {
      await window.OneSignal.Notifications.requestPermission();
      const permission = window.OneSignal.Notifications.permission;
      console.log('Push permission granted:', permission);
      return permission;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  },

  // Get current subscription state
  getSubscriptionState(): SubscriptionState | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Check if User and PushSubscription are available
      if (!window.OneSignal.User || !window.OneSignal.User.PushSubscription) {
        return null;
      }

      return {
        id: window.OneSignal.User.PushSubscription.id || null,
        token: window.OneSignal.User.PushSubscription.token || null,
        optedIn: window.OneSignal.User.PushSubscription.optedIn || false,
        permission: window.OneSignal.Notifications?.permission || false,
      };
    } catch (error) {
      console.error('Failed to get subscription state:', error);
      return null;
    }
  },

  // Add tags (for user preferences)
  async addTags(tags: Record<string, string>): Promise<void> {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available for adding tags');
      return;
    }

    try {
      window.OneSignal.User.addTags(tags);
      console.log('OneSignal tags added:', tags);
    } catch (error) {
      console.error('Failed to add tags:', error);
    }
  },

  // Set notification preferences as tags
  async setPreferences(preferences: NotificationPreferences): Promise<void> {
    const tags = {
      pref_joinRequests: preferences.joinRequests.toString(),
      pref_depositReminders: preferences.depositReminders.toString(),
      pref_raffleResults: preferences.raffleResults.toString(),
      pref_deadlineWarnings: preferences.deadlineWarnings.toString(),
    };

    await this.addTags(tags);
  },

  // Get current OneSignal user ID
  getOneSignalId(): string | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Check if User is available
      if (!window.OneSignal.User) {
        return null;
      }
      return window.OneSignal.User.onesignalId || null;
    } catch (error) {
      console.warn('OneSignal User not fully initialized yet:', error);
      return null;
    }
  },

  // Get current external ID
  getExternalId(): string | null {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      // Check if User and the identity model are available
      if (!window.OneSignal.User || !window.OneSignal.User.externalId) {
        return null;
      }
      return window.OneSignal.User.externalId || null;
    } catch (error) {
      console.warn('OneSignal User not fully initialized yet:', error);
      return null;
    }
  },

  // Check if push notifications are supported
  isSupported(): boolean {
    if (!this.isAvailable()) {
      return false;
    }

    return window.OneSignal.Notifications.isPushSupported();
  },

  // Add subscription change listener
  addSubscriptionChangeListener(callback: (event: any) => void): (() => void) | null {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available for subscription listener');
      return null;
    }

    try {
      window.OneSignal.User.PushSubscription.addEventListener('change', callback);
      
      // Return cleanup function
      return () => {
        window.OneSignal.User.PushSubscription.removeEventListener('change', callback);
      };
    } catch (error) {
      console.error('Failed to add subscription listener:', error);
      return null;
    }
  },

  // Add notification click listener
  addNotificationClickListener(callback: (event: any) => void): (() => void) | null {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available for click listener');
      return null;
    }

    try {
      window.OneSignal.Notifications.addEventListener('click', callback);
      
      // Return cleanup function
      return () => {
        window.OneSignal.Notifications.removeEventListener('click', callback);
      };
    } catch (error) {
      console.error('Failed to add click listener:', error);
      return null;
    }
  },

  // Show/Hide the OneSignal notify button
  showNotifyButton(): void {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available to show notify button');
      return;
    }

    try {
      if (window.OneSignal.notifyButton) {
        window.OneSignal.notifyButton.launcher.show();
      }
    } catch (error) {
      console.error('Failed to show notify button:', error);
    }
  },

  hideNotifyButton(): void {
    if (!this.isAvailable()) {
      console.warn('OneSignal not available to hide notify button');
      return;
    }

    try {
      if (window.OneSignal.notifyButton) {
        window.OneSignal.notifyButton.launcher.hide();
      }
    } catch (error) {
      console.error('Failed to hide notify button:', error);
    }
  },
};