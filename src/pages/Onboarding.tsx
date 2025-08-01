import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserProfile } from "../hooks/useUserProfile";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { sanitizeInput } from "../utils/sanitize";
import { validateImageFile } from "../utils/fileValidation";
import { trackEvent, trackError } from "../utils/analytics";
import { formatErrorForUser } from "../utils/apiErrors";

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const { profile, updateProfile } = useUserProfile();
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


  // Redirect if user already has a profile
  useEffect(() => {
    if (profile) {
      navigate(returnUrl);
    }
  }, [profile, navigate, returnUrl]);

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
      setError("Your image is too large or wrong format. Please choose a smaller image (under 5MB)");
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
      setFormData((prev) => ({ ...prev, image: file, imagePreview: URL.createObjectURL(file) }));
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

  const handleSkip = () => {
    // Track onboarding abandonment
    const duration = Math.floor((Date.now() - onboardingStartTime) / 1000);
    trackEvent("onboarding_abandoned", {
      step: "profile_creation",
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

  return (
    <div className="min-h-screen bg-[#F9F5F1] py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#8B6F47] mb-2">
            Complete Your Profile
          </h1>
          <p className="text-gray-600 mb-8">
            Set up your profile to unlock full access to Kuri's features,
            including creating and joining circles.
          </p>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-4">
              <label className="block font-semibold text-[#8B6F47]">
                Profile Picture
              </label>
              <div className="flex flex-col md:flex-row items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E8DED1] file:text-[#8B6F47] hover:file:bg-[#e0d3b8] border border-[#E8DED1] rounded-lg p-2"
                />
                {formData.imagePreview && (
                  <img
                    src={formData.imagePreview}
                    alt="Profile Preview"
                    className="rounded-full border border-[#E8DED1] shadow w-24 h-24 object-cover"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#8B6F47] mb-2">
                Username
              </label>
              <Input
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
                className="border-[#E8DED1]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#8B6F47] mb-2">
                Display Name
              </label>
              <Input
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
                className="border-[#E8DED1]"
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="flex-1 border-2 border-[#8B6F47] text-[#8B6F47] hover:bg-[#F9F5F1]"
              >
                Skip for Now
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#8B6F47] text-white hover:bg-[#725A3A]"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                    Creating Profile...
                  </div>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
