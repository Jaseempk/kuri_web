import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Back online');
      setIsOnline(true);
      
      if (wasOffline) {
        // Optional: Refresh data after coming back online
        // You can customize this behavior based on your needs
        setTimeout(() => {
          // Give user a moment to see the status change
          window.location.reload();
        }, 1000);
      }
    };
    
    const handleOffline = () => {
      console.log('Network: Gone offline');
      setIsOnline(false);
      setWasOffline(true);
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Additional check using a periodic ping (optional)
    const checkConnection = async () => {
      try {
        const response = await fetch('/manifest.json', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          throw new Error('Network check failed');
        }
        
        if (!isOnline) {
          setIsOnline(true);
        }
      } catch {
        if (isOnline) {
          setIsOnline(false);
          setWasOffline(true);
        }
      }
    };
    
    // Check connection every 30 seconds when offline
    const intervalId = setInterval(() => {
      if (!isOnline) {
        checkConnection();
      }
    }, 30000);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline, wasOffline]);
  
  return { 
    isOnline, 
    wasOffline,
    // Helper method to check if we should show offline content
    isOffline: !isOnline
  };
};