import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount, useModal } from "@getpara/react-sdk";
import { useUserProfile } from "../hooks/useUserProfile";
import { toast } from "sonner";
import { sanitizeInput } from "../utils/sanitize";
import { validateImageFile } from "../utils/fileValidation";
import { trackEvent, trackError } from "../utils/analytics";
import { formatErrorForUser } from "../utils/apiErrors";
import { useSmartWallet } from "@/hooks/useSmartWallet";

enum OnboardingStep {
  EMAIL_AUTH = "email_auth",
  PROFILE_CREATION = "profile_creation",
}

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useAccount();
  const { openModal } = useModal();
  const address = account.embedded.wallets?.[0]?.address;
  const { profile, updateProfile, isLoading: profileLoading } = useUserProfile();
  const { smartAddress, isLoading: addressLoading } = useSmartWallet();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(
    OnboardingStep.EMAIL_AUTH
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [onboardingStartTime] = useState<number>(Date.now());
  const [hasInvalidImage, setHasInvalidImage] = useState(false);
  const returnUrl = location.state?.returnUrl || "/markets";

  const [formData, setFormData] = useState({
    username: "",
    display_name: "",
    image: null as File | null,
    imagePreview: null as string | null,
  });

  // Derived state for cleaner auth checks
  const authDependenciesResolved = !account.isLoading && !profileLoading && !addressLoading;
  const hasCompleteAuthState = account.isConnected && address && smartAddress;

  // Check authentication status and profile existence
  useEffect(() => {
    if (!authDependenciesResolved) return; // Wait for all data to stabilize

    if (hasCompleteAuthState && profile && !loading) {
      // Fully authenticated and not in the middle of profile creation - redirect
      const safeReturnUrl = returnUrl === "/onboarding" ? "/markets" : returnUrl;
      navigate(safeReturnUrl, { replace: true });
    } else if (hasCompleteAuthState && !profile) {
      // Need profile creation
      setCurrentStep(OnboardingStep.PROFILE_CREATION);
    } else if (!account.isConnected) {
      // Need authentication  
      setCurrentStep(OnboardingStep.EMAIL_AUTH);
    }
  }, [authDependenciesResolved, hasCompleteAuthState, profile, navigate, returnUrl, loading]);

  // Track onboarding start
  useEffect(() => {
    const source = location.state?.source || "direct";
    trackEvent("onboarding_started", {
      source: source as "landing" | "direct" | "share_link",
    });
  }, [location.state?.source]);

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }

    if (!formData.display_name.trim()) {
      setError("Display name is required");
      return false;
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError(
        "Username must be 3-20 characters and contain only letters, numbers, and underscores"
      );
      return false;
    }

    // Simple validation: if no image OR invalid image, block submission
    if (!formData.image) {
      setError("Please add a profile picture to continue");
      return false;
    }

    if (hasInvalidImage) {
      setError(
        "Your image is too large or wrong format. Please choose a smaller image (under 5MB)"
      );
      return false;
    }

    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Clear any previous errors first
    setError("");

    if (!file) {
      // Clear image if no file selected
      setFormData((prev) => ({ ...prev, image: null, imagePreview: null }));
      setHasInvalidImage(false);
      return;
    }

    // Use secure file validation
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || "Invalid file");
      setHasInvalidImage(true);
      // Don't clear the file input - let user see their invalid selection
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
      return;
    }

    // Valid image
    setHasInvalidImage(false);
    setFormData((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Call updateProfile with image file - backend will handle upload
      await updateProfile({
        username: sanitizeInput(formData.username),
        display_name: sanitizeInput(formData.display_name),
        image: formData.image || undefined,
        reputation_score: 0,
      });

      // Track successful profile creation
      trackEvent("profile_created", {
        has_display_name: Boolean(formData.display_name.trim()),
        has_bio: false, // No bio field in current form
      });

      // Track onboarding completion
      const duration = Math.floor((Date.now() - onboardingStartTime) / 1000);
      trackEvent("onboarding_completed", {
        duration,
        steps_completed: 1, // Single step onboarding
      });

      toast.success("Profile created successfully!");

      // Direct navigation - don't rely on useEffect
      navigate(returnUrl, { replace: true });
    } catch (error) {
      // Track onboarding failure
      trackError(
        "profile_creation_failed",
        "Onboarding",
        error instanceof Error ? error.message : "Unknown error"
      );

      console.error("Error creating profile:", error);
      const errorMessage = formatErrorForUser(error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = () => {
    openModal({ step: "AUTH_MAIN" });
  };

  const handleSkip = () => {
    // Track onboarding abandonment
    const duration = Math.floor((Date.now() - onboardingStartTime) / 1000);
    trackEvent("onboarding_abandoned", {
      step: currentStep,
      duration,
    });

    // Navigate back to the return URL, but use history.back() if possible to maintain state
    if (returnUrl && window.history.length > 1) {
      // Go back in history to maintain page state (scroll position, filters, etc.)
      navigate(-1);
    } else {
      // Fallback to direct navigation if no history or returnUrl
      navigate(returnUrl || "/markets", { replace: true });
    }
  };

  // Render email authentication step
  const renderEmailAuthStep = () => (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full">
      <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
        <div className="mb-6 lg:mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-800 mb-3 lg:mb-4">
            Welcome to Kuri
          </h1>
          <p className="text-stone-600 text-base sm:text-lg ">
            Login or Signup
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleEmailAuth}
            disabled={account.isLoading}
            className="w-full bg-[#8B735B] text-white py-3 sm:py-4 rounded-xl text-base sm:text-lg font-semibold flex items-center justify-center hover:bg-[#7a6550] transition-colors duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            {account.isLoading ? "Connecting..." : "Connect with Email"}
          </button>

          <p className="text-center text-xs sm:text-sm text-stone-500 mt-4">
            Join with just your email - no wallet installation needed.
          </p>
        </div>

        <div className="mt-6 lg:mt-8 text-center">
          <button
            onClick={handleSkip}
            className="text-stone-600 font-semibold py-2 px-4 rounded-lg hover:bg-stone-200/50 transition-colors duration-300 text-sm sm:text-base"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  );

  // Render profile creation step
  const renderProfileCreationStep = () => (
    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-4 sm:p-8 lg:p-16">
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4E342E] mb-2">
          Welcome to Kuri!
        </h1>
        <p className="text-base sm:text-lg text-[#8D6E63] px-2">
          Let's set up your profile to unlock full access and start connecting.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center md:items-start">
            <label className="block text-sm font-medium text-[#4E342E] mb-2 w-full text-left">
              Profile Picture
            </label>
            <div className="w-32 h-32 sm:w-40 sm:h-40 lg:w-48 lg:h-48 mb-4">
              <label
                className="border-2 border-dashed border-[#D1C4B0] flex items-center justify-center p-3 sm:p-4 lg:p-6 cursor-pointer rounded-xl text-center text-[#8D6E63] transition-colors hover:bg-[#F9F6F1] hover:border-[#A1887F] h-full"
                htmlFor="profile-picture"
              >
                {formData.imagePreview ? (
                  <img
                    src={formData.imagePreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-1 sm:mb-2 text-[#A1887F]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 17a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold text-xs sm:text-sm">
                      Click to upload
                    </span>
                    <span className="text-xs mt-1 text-gray-500">
                      PNG, JPG up to 5MB
                    </span>
                  </div>
                )}
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Form Fields Section */}
          <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#4E342E] mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#A1887F]">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14.243 5.757a6 6 0 10-.986 9.284 1 1 0 111.087 1.678A8 8 0 1118 10a3 3 0 01-4.8 2.401A4 4 0 1114 10a1 1 0 102 0c0-1.537-.586-3.07-1.757-4.243zM12 10a2 2 0 10-4 0 2 2 0 004 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Choose a unique username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  required
                  pattern="^[a-zA-Z0-9_]{3,20}$"
                  title="Username must be 3-20 characters and contain only letters, numbers, and underscores"
                  className="block w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#F9F6F1] border border-[#D1C4B0] rounded-xl focus:ring-[#8D6E63] focus:border-[#8D6E63] text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm sm:text-base"
                />
              </div>
              <p className="mt-1 sm:mt-2 text-xs text-gray-500">
                Must be 3-20 characters long.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#4E342E] mb-2">
                Display Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#A1887F]">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Enter your display name"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  required
                  maxLength={50}
                  className="block w-full pl-10 pr-4 py-2.5 sm:py-3 bg-[#F9F6F1] border border-[#D1C4B0] rounded-xl focus:ring-[#8D6E63] focus:border-[#8D6E63] text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-offset-0 text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mt-8 sm:mt-10">
          <button
            type="button"
            onClick={handleSkip}
            className="w-full sm:w-auto sm:max-w-xs py-2.5 sm:py-3 px-4 border border-[#A1887F] rounded-xl text-[#8D6E63] font-semibold hover:bg-[#F9F6F1] transition-colors text-sm sm:text-base"
          >
            Skip for Now
          </button>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto sm:max-w-xs py-2.5 sm:py-3 px-4 border border-transparent rounded-xl text-white font-semibold bg-[#8D6E63] hover:bg-[#795548] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8D6E63] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                <span className="hidden sm:inline">Creating Profile...</span>
                <span className="sm:hidden">Creating...</span>
              </div>
            ) : (
              <>
                <span className="sm:hidden">Complete</span>
                <span className="hidden sm:inline">Complete Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "radial-gradient(circle at top left, #FDF6E3, #F5EBE0)",
      }}
    >
      {currentStep === OnboardingStep.EMAIL_AUTH
        ? renderEmailAuthStep()
        : renderProfileCreationStep()}
    </div>
  );
}
