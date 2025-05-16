import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "./useUserProfile";

type ProfileRequiredOptions = {
  strict?: boolean; // If true, always redirect to onboarding. If false, allow skipping.
  action?: string; // The action being attempted (e.g., "create_circle")
};

export const useProfileRequired = (options: ProfileRequiredOptions = {}) => {
  const { profile, loading } = useUserProfile();
  const navigate = useNavigate();
  const { strict = false, action } = options;

  useEffect(() => {
    // Only redirect if in strict mode
    if (strict && !loading && !profile) {
      navigate("/onboarding", {
        state: {
          returnUrl: window.location.pathname,
          action,
        },
      });
    }
  }, [profile, loading, navigate, strict, action]);

  return {
    hasProfile: !!profile,
    isLoading: loading,
    requireProfile: () => {
      if (!profile) {
        navigate("/onboarding", {
          state: {
            returnUrl: window.location.pathname,
            action,
          },
        });
        return false;
      }
      return true;
    },
  };
};
