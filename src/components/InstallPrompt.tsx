import { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Function to detect if device is mobile/tablet
  const isMobileOrTablet = () => {
    // Check user agent for mobile/tablet indicators
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // Check screen size (mobile: <768px, tablet: 768px-1024px)
    const screenWidth = window.innerWidth;
    const isMobileScreen = screenWidth <= 1024; // Include tablets up to 1024px
    
    // Check for touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check for mobile platform
    const isMobilePlatform = /android|ios|iphone|ipad/i.test(navigator.platform);
    
    // Device is considered mobile/tablet if it meets multiple criteria
    return (isMobileUA && isTouchDevice) || (isMobileScreen && isTouchDevice) || isMobilePlatform;
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setInstallPrompt(event);
      
      // Only show on mobile/tablet devices
      if (!isMobileOrTablet()) {
        return;
      }
      
      // Check if user hasn't dismissed recently
      const dismissedTime = localStorage.getItem('kuri-install-dismissed');
      const daysSinceDismissed = dismissedTime 
        ? (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24) 
        : 999;
      
      if (daysSinceDismissed >= 30) {
        setShowPrompt(true);
      }
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      try {
        await installPrompt.prompt();
        const choiceResult = await installPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted');
        }
        
        setInstallPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('Error during PWA installation:', error);
      }
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('kuri-install-dismissed', Date.now().toString());
  };

  // Double-check: Don't render on desktop even if state is somehow set
  if (!showPrompt || !installPrompt || !isMobileOrTablet()) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-[#8B6F47]/20 p-4 z-50 mx-auto max-w-sm animate-fade-up lg:hidden xl:hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-[#8B6F47] text-sm">Install Kuri App</h3>
          <p className="text-xs text-gray-600 mt-1">Get the full app experience</p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDismiss}
            className="text-xs px-3 py-1 border-gray-300 hover:bg-gray-50"
          >
            Later
          </Button>
          <Button 
            size="sm" 
            onClick={handleInstall} 
            className="bg-[#8B6F47] hover:bg-[#725A3A] text-white text-xs px-3 py-1"
          >
            Install
          </Button>
        </div>
      </div>
    </div>
  );
};