import { useEffect } from "react";
import { useAuthNavigation } from "../../hooks/useAuthNavigation";
import { useAuthContext, AuthFlowState } from "../../contexts/AuthContext";
import { LoadingSkeleton } from "../ui/loading-states";

interface AuthGuardProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

export const AuthGuard = ({ children, requireProfile = true }: AuthGuardProps) => {
  const { authState } = useAuthContext();
  const { coordinatedNavigate } = useAuthNavigation();

  useEffect(() => {
    switch (authState) {
      case AuthFlowState.INITIALIZING:
      case AuthFlowState.PARA_LOADING:
        // Still loading, do nothing
        break;
      case AuthFlowState.PROFILE_REQUIRED:
        coordinatedNavigate("/onboarding?step=profile", "AuthGuard-profile", {
          state: { returnUrl: window.location.pathname }
        });
        break;
      case AuthFlowState.AUTHENTICATED:
        // Allow access
        break;
      default:
        coordinatedNavigate("/onboarding", "AuthGuard-auth", {
          state: { returnUrl: window.location.pathname }
        });
    }
  }, [authState, coordinatedNavigate]);

  // Simple state-based routing
  switch (authState) {
    case AuthFlowState.INITIALIZING:
    case AuthFlowState.PARA_LOADING:
    case AuthFlowState.WALLET_RESOLVING:
    case AuthFlowState.PROFILE_LOADING:
      return <LoadingSkeleton />;
      
    case AuthFlowState.PROFILE_REQUIRED:
      if (requireProfile) {
        return null; // Navigation handled in useEffect
      }
      return <>{children}</>;
      
    case AuthFlowState.AUTHENTICATED:
      return <>{children}</>;
      
    case AuthFlowState.ERROR:
      return null; // Navigation handled in useEffect
      
    default:
      return null; // Navigation handled in useEffect
  }
};