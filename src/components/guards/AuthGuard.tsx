import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@getpara/react-sdk";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useSmartWallet } from "../../hooks/useSmartWallet";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const account = useAccount();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { smartAddress: address, isLoading: addressLoading } = useSmartWallet();
  const [hasNavigated, setHasNavigated] = useState(false);
  const navigationTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear any pending navigation
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }

    // Don't navigate if we already navigated recently
    if (hasNavigated) {
      return;
    }

    // Don't redirect while still loading account, profile, or address data
    if (account.isLoading || profileLoading || addressLoading) {
      return;
    }

    // Add small delay to prevent rapid navigation and allow state to stabilize
    navigationTimeoutRef.current = setTimeout(() => {
      // If not connected, redirect to onboarding
      if (!account.isConnected || !address) {
        setHasNavigated(true);
        navigate("/onboarding", { 
          state: { 
            returnUrl: window.location.pathname + window.location.search,
            source: "auth_required" 
          } 
        });
        return;
      }

      // If connected but no profile, redirect to onboarding
      if (!profile) {
        setHasNavigated(true);
        navigate("/onboarding", { 
          state: { 
            returnUrl: window.location.pathname + window.location.search,
            source: "profile_required" 
          } 
        });
        return;
      }
    }, 500); // Delay to allow smart wallet resolution and profile loading
  }, [account.isConnected, account.isLoading, address, profile, profileLoading, addressLoading]);

  // Reset navigation flag when component unmounts or when auth state changes significantly
  useEffect(() => {
    return () => {
      setHasNavigated(false);
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  // Reset navigation flag when user becomes authenticated
  useEffect(() => {
    if (account.isConnected && address && profile && hasNavigated) {
      setHasNavigated(false);
    }
  }, [account.isConnected, address, profile, hasNavigated]);

  // Show loading state while checking authentication
  if (account.isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5F1] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#8B6F47]/20 border-t-[#8B6F47] mx-auto mb-4" />
          <p className="text-[#8B6F47]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated or no profile
  if (!account.isConnected || !address || !profile) {
    return null;
  }

  // User is authenticated and has profile - render protected content
  return <>{children}</>;
};