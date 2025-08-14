import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';

export const FloatingNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { address } = useAccount();
  const { profile } = useUserProfile();
  const { 
    isInitialized, 
    permission, 
    isSubscribed, 
    requestPermission, 
    isSupported, 
    loading 
  } = usePushNotifications();

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
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-4 left-4 right-4 z-50 flex justify-center"
      >
        <Card className="w-full max-w-md bg-white/95 backdrop-blur-xl shadow-2xl 
                        border border-[hsl(var(--terracotta))]/20 animate-none hover:transform-none">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  <Bell className="h-5 w-5 text-[hsl(var(--terracotta))] mr-3" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--terracotta))] text-sm">
                    Stay Updated with Kuri
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Get notified about your savings circles
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDismiss}
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full shrink-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismiss} 
                className="flex-1 text-xs border-[hsl(var(--terracotta))]/30 text-[hsl(var(--terracotta))] 
                           hover:bg-[hsl(var(--sand))]/50 h-8"
              >
                Later
              </Button>
              <Button 
                size="sm" 
                onClick={handleEnableNotifications}
                disabled={loading}
                className="flex-1 text-xs bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/90 
                           text-white h-8"
              >
                {loading ? (
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Enabling...</span>
                  </div>
                ) : (
                  'Enable'
                )}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};