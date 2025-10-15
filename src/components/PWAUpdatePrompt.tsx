import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from './ui/button';
import { RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log('✅ Service Worker registered:', swUrl);

      // 🔥 Check for updates every 30 seconds (aggressive for instant updates)
      if (registration) {
        const interval = setInterval(() => {
          console.log('🔄 Checking for SW updates...');
          registration.update().catch((err) => {
            console.warn('Update check failed:', err);
          });
        }, 30000); // 30 seconds

        // Cleanup on unmount
        return () => clearInterval(interval);
      }
    },
    onRegisterError(error) {
      console.error('❌ Service Worker registration failed:', error);
    },
    onOfflineReady() {
      console.log('📴 App is ready to work offline');
      // Silent - don't show toast for offline ready
    },
    onNeedRefresh() {
      console.log('🆕 New version detected!');
      setShowPrompt(true);

      // Show persistent toast notification
      toast.info('New version available!', {
        description: 'Tap to reload and get the latest updates',
        duration: 10000, // 10 seconds
        action: {
          label: 'Reload',
          onClick: () => {
            handleUpdate();
          },
        },
      });
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setShowPrompt(false);

    // Auto-reload is handled by updateServiceWorker(true)
    await updateServiceWorker(true);

    // Force reload if auto-reload didn't work
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Don't set needRefresh to false - let user update later
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white border border-[#E8DED1] rounded-2xl shadow-2xl p-4 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-[hsl(var(--terracotta))]/10 rounded-full flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-[hsl(var(--terracotta))]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              New Version Available! 🎉
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              We've released new features and improvements. Update now to get the latest version.
            </p>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                disabled={isUpdating}
                className="flex-1 bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))]/90 text-white disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isUpdating ? 'animate-spin' : ''}`} />
                {isUpdating ? 'Updating...' : 'Reload Now'}
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
                disabled={isUpdating}
                className="border-[#E8DED1] text-gray-600 hover:bg-gray-50"
              >
                Later
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
