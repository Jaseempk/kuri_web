import { useState, useEffect } from "react";
import { Bell, BellOff, TestTube } from "lucide-react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { NotificationPreferences } from "../../services/oneSignalService";

// Custom Switch component using existing UI patterns
const Switch = ({
  checked,
  onCheckedChange,
  disabled = false,
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
      ${checked ? "bg-[hsl(var(--terracotta))]" : "bg-gray-200"}
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    <span
      className={`
        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
        ${checked ? "translate-x-6" : "translate-x-1"}
      `}
    />
  </button>
);

export const NotificationSettings = () => {
  const {
    isSupported,
    isInitialized,
    permission,
    isSubscribed,
    preferences,
    loading,
    requestPermission,
    updatePreferences,
    sendTestNotification,
  } = usePushNotifications();

  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handlePreferenceChange = async (
    key: keyof NotificationPreferences,
    value: boolean
  ) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);

    try {
      setSaving(true);
      const success = await updatePreferences(newPreferences);

      if (!success) {
        // Revert on failure
        setLocalPreferences(preferences);
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      setLocalPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    try {
      setTesting(true);
      await sendTestNotification();
    } catch (error) {
      console.error("Failed to send test notification:", error);
    } finally {
      setTesting(false);
    }
  };

  const enableNotifications = async () => {
    await requestPermission();
  };

  if (!isSupported) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <BellOff className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-lg font-semibold mb-2">
            Push Notifications Not Supported
          </h3>
          <p className="text-sm text-gray-500">
            Your browser doesn't support push notifications.
          </p>
        </div>
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

        {!isSubscribed && permission !== "denied" && (
          <Button
            onClick={enableNotifications}
            disabled={loading || !isInitialized}
            className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/90"
          >
            Enable
          </Button>
        )}
      </div>

      {permission === "denied" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            Push notifications are blocked. To enable them, click the lock icon
            in your browser's address bar and allow notifications.
          </p>
        </div>
      )}

      {isSubscribed ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="join-requests"
                className="flex flex-col cursor-pointer"
              >
                <span className="font-medium">Join Requests</span>
                <span className="text-sm text-gray-500">
                  When someone wants to join your circle
                </span>
              </Label>
              <Switch
                checked={localPreferences.joinRequests || false}
                disabled={saving}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("joinRequests", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="deposit-reminders"
                className="flex flex-col cursor-pointer"
              >
                <span className="font-medium">Deposit Reminders</span>
                <span className="text-sm text-gray-500">
                  When it's time to make your contribution
                </span>
              </Label>
              <Switch
                checked={localPreferences.depositReminders || false}
                disabled={saving}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("depositReminders", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="raffle-results"
                className="flex flex-col cursor-pointer"
              >
                <span className="font-medium">Raffle Results</span>
                <span className="text-sm text-gray-500">
                  When winners are selected
                </span>
              </Label>
              <Switch
                checked={localPreferences.raffleResults || false}
                disabled={saving}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("raffleResults", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label
                htmlFor="deadline-warnings"
                className="flex flex-col cursor-pointer"
              >
                <span className="font-medium">Deadline Warnings</span>
                <span className="text-sm text-gray-500">
                  Before deposit deadlines
                </span>
              </Label>
              <Switch
                checked={localPreferences.deadlineWarnings || false}
                disabled={saving}
                onCheckedChange={(checked) =>
                  handlePreferenceChange("deadlineWarnings", checked)
                }
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Test Notifications</h4>
                <p className="text-sm text-gray-500">
                  Send a test notification to verify it's working
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestNotification}
                disabled={testing || loading}
              >
                <TestTube className="h-4 w-4 mr-2" />
                {testing ? "Sending..." : "Test"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <BellOff className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h4 className="font-medium mb-2">Notifications Disabled</h4>
          <p className="text-sm text-gray-500 mb-4">
            Enable push notifications to customize your preferences and stay
            updated.
          </p>
          {permission !== "denied" && (
            <Button
              onClick={enableNotifications}
              disabled={loading || !isInitialized}
              className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/90"
            >
              Enable Notifications
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
