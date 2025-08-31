import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface NavigationState {
  isNavigating: boolean;
  source: string | null;
  timestamp: number | null;
}

export const useAuthNavigation = () => {
  const navigate = useNavigate();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    isNavigating: false,
    source: null,
    timestamp: null,
  });
  const resetTimeoutRef = useRef<NodeJS.Timeout>();

  const coordinatedNavigate = useCallback((
    to: string, 
    source: string, 
    options?: any
  ): boolean => {
    // Prevent multiple simultaneous navigations
    if (navigationState.isNavigating) {
      console.log(`Navigation blocked: already navigating from ${navigationState.source} to ${to}`);
      return false;
    }

    // Prevent rapid successive navigations (within 200ms)
    const now = Date.now();
    if (navigationState.timestamp && (now - navigationState.timestamp) < 200) {
      console.log(`Navigation blocked: too soon after previous navigation from ${navigationState.source}`);
      return false;
    }

    console.log(`Navigation initiated: ${source} -> ${to}`);
    
    setNavigationState({
      isNavigating: true,
      source,
      timestamp: now,
    });

    // Perform the navigation
    navigate(to, options);

    // Reset navigation state after completion
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    
    resetTimeoutRef.current = setTimeout(() => {
      setNavigationState({
        isNavigating: false,
        source: null,
        timestamp: now,
      });
    }, 100);

    return true;
  }, [navigate, navigationState]);

  const resetNavigation = useCallback(() => {
    setNavigationState({
      isNavigating: false,
      source: null,
      timestamp: null,
    });
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
  }, []);

  return {
    coordinatedNavigate,
    isNavigating: navigationState.isNavigating,
    navigationSource: navigationState.source,
    resetNavigation,
  };
};