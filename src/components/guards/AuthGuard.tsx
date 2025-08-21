import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAccount } from "@getpara/react-sdk";
import { useUserProfile } from "../../hooks/useUserProfile";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const account = useAccount();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const address = account.embedded.wallets?.[0]?.address;

  useEffect(() => {
    // Don't redirect while still loading account or profile data
    if (account.isLoading || profileLoading) {
      return;
    }

    // If not connected, redirect to onboarding
    if (!account.isConnected || !address) {
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
      navigate("/onboarding", { 
        state: { 
          returnUrl: window.location.pathname + window.location.search,
          source: "profile_required" 
        } 
      });
      return;
    }
  }, [account.isConnected, account.isLoading, address, profile, profileLoading, navigate]);

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