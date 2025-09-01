import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useOptimizedAuth } from '../../hooks/useOptimizedAuth';

export const PushPermissionPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { smartAddress: address, profile } = useOptimizedAuth();
  const { isInitialized, permission, isSubscribed, requestPermission, isSupported, loading } = usePushNotifications();

  useEffect(() => {
    checkShouldShowPrompt();
  }, [address, profile, isInitialized, permission, isSubscribed, isSupported]);

  const checkShouldShowPrompt = () => {
    // Don't show if no wallet, no profile, not initialized, or already granted permission
    if (!address || !profile || !isInitialized || permission || isSubscribed || !isSupported) {
      setShowPrompt(false);
      return;
    }

    // Check if user has dismissed the prompt recently
    const dismissedTime = localStorage.getItem('push-permission-dismissed');
    const daysSinceDismissed = dismissedTime 
      ? (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24) 
      : 999;
      
    // Show prompt if never dismissed or dismissed more than 7 days ago
    setShowPrompt(daysSinceDismissed > 7);
  };

  const handleEnableNotifications = async () => {
    try {
      const granted = await requestPermission();
      if (granted) {
        setShowPrompt(false);
        // Clear any previous dismissal to reset the timer
        localStorage.removeItem('push-permission-dismissed');
      }
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push-permission-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white shadow-xl border-[hsl(var(--terracotta))]/20 z-50 animate-in slide-in-from-bottom-full duration-300">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-[hsl(var(--terracotta))] mr-2" />
            <h3 className="font-semibold text-[hsl(var(--terracotta))]">Enable Notifications</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleDismiss}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
          Get notified about deposit reminders, raffle winners, and circle updates. Stay connected with your savings community!
        </p>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDismiss} 
            className="flex-1 border-[hsl(var(--terracotta))] text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--sand))]"
          >
            Later
          </Button>
          <Button 
            size="sm" 
            onClick={handleEnableNotifications}
            disabled={loading}
            className="flex-1 bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/90 text-white"
          >
            {loading ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                <span className="text-xs">Enabling...</span>
              </div>
            ) : (
              'Enable'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};