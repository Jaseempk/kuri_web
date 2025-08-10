import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export interface NotificationPreferences {
  joinRequests: boolean;
  depositReminders: boolean;
  raffleResults: boolean;
  deadlineWarnings: boolean;
}

// Custom Switch component using existing UI patterns
const Switch = ({ 
  checked, 
  onCheckedChange, 
  disabled = false 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void; 
  disabled?: boolean;
}) => (
  <button
    type="button"
    onClick={() => !disabled && onCheckedChange(!checked)}
    disabled={disabled}
    className={`
      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))] focus:ring-offset-2
      ${checked ? 'bg-[hsl(var(--terracotta))]' : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}
      `}
    />
  </button>
);

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    joinRequests: true,
    depositReminders: true,
    raffleResults: true,
    deadlineWarnings: true,
  });
  
  const { permissionGranted, requestPermission, isSupported, isLoading } = usePushNotifications();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      try {
        const parsedPreferences = JSON.parse(saved);
        setPreferences(parsedPreferences);
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }
  };

  const updatePreferences = (newPreferences: NotificationPreferences) => {
    setPreferences(newPreferences);
    localStorage.setItem('notification-preferences', JSON.stringify(newPreferences));
  };

  const toggleNotifications = async () => {
    if (!permissionGranted && isSupported) {
      await requestPermission();
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <BellOff className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-500">Push Notifications</h3>
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          Push notifications are not supported in this browser. Please use Chrome, Firefox, or Safari for notification support.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-[hsl(var(--terracotta))] mr-2" />
          <h3 className="text-lg font-semibold">Push Notifications</h3>
        </div>
        {!permissionGranted && (
          <Button 
            onClick={toggleNotifications} 
            disabled={isLoading}
            className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/90"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                Enabling...
              </div>
            ) : (
              'Enable'
            )}
          </Button>
        )}
      </div>

      {permissionGranted ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="join-requests" className="flex flex-col cursor-pointer">
              <span className="text-base font-medium">Join Requests</span>
              <span className="text-sm text-gray-500 font-normal">When someone wants to join your circle</span>
            </Label>
            <Switch
              checked={preferences.joinRequests}
              onCheckedChange={(checked) => 
                updatePreferences({ ...preferences, joinRequests: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="deposit-reminders" className="flex flex-col cursor-pointer">
              <span className="text-base font-medium">Deposit Reminders</span>
              <span className="text-sm text-gray-500 font-normal">When it's time to make your contribution</span>
            </Label>
            <Switch
              checked={preferences.depositReminders}
              onCheckedChange={(checked) => 
                updatePreferences({ ...preferences, depositReminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="raffle-results" className="flex flex-col cursor-pointer">
              <span className="text-base font-medium">Raffle Results</span>
              <span className="text-sm text-gray-500 font-normal">When winners are selected</span>
            </Label>
            <Switch
              checked={preferences.raffleResults}
              onCheckedChange={(checked) => 
                updatePreferences({ ...preferences, raffleResults: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="deadline-warnings" className="flex flex-col cursor-pointer">
              <span className="text-base font-medium">Deadline Warnings</span>
              <span className="text-sm text-gray-500 font-normal">Before deposit deadlines</span>
            </Label>
            <Switch
              checked={preferences.deadlineWarnings}
              onCheckedChange={(checked) => 
                updatePreferences({ ...preferences, deadlineWarnings: checked })
              }
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Preferences are saved locally and will be respected when the backend sends notifications.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm text-gray-500 mb-4">
            Enable push notifications to customize your preferences and stay updated with your circles.
          </p>
          <Button 
            onClick={toggleNotifications}
            disabled={isLoading}
            variant="outline"
            className="border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--sand))]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-[hsl(var(--terracotta))]/30 border-t-[hsl(var(--terracotta))] rounded-full animate-spin" />
                Enabling...
              </div>
            ) : (
              'Enable Notifications'
            )}
          </Button>
        </div>
      )}
    </Card>
  );
};