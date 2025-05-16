import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserProfile } from "../hooks/useUserProfile";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Input } from "../components/ui/input";
import { toast } from "sonner";

export default function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAccount();
  const { profile, updateProfile } = useUserProfile();
  const [loading, setLoading] = useState(false);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setLoading(true);
    try {
      let profile_image_url = "";
      if (formData.image) {
        const filePath = `${address.toLowerCase()}_${Date.now()}_${
          formData.image.name
        }`;
        const { error: uploadError } = await supabase.storage
          .from("kuriprofiles")
          .upload(filePath, formData.image);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("kuriprofiles").getPublicUrl(filePath);

        profile_image_url = publicUrl;
      }

      await updateProfile({
        username: formData.username,
        display_name: formData.display_name,
        profile_image_url,
        reputation_score: 0,
      });

      toast.success("Profile created successfully!");
      navigate(returnUrl, { replace: true });
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate("/markets", { replace: true });
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
