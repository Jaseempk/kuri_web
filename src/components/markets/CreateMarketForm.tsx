import { useState, useMemo } from "react";
import { useKuriFactory } from "../../hooks/contracts/useKuriFactory";
import { Button } from "../ui/button";
import { isUserRejection } from "../../utils/errors";
import { LoadingSkeleton } from "../ui/loading-states";
import { parseUnits } from "viem";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { supabase } from "../../lib/supabase";

interface FormData {
  totalAmount: string;
  participantCount: string;
  intervalType: "0" | "1"; // 0 for WEEKLY, 1 for MONTHLY
  shortDescription: string;
  longDescription: string;
  image: File | null;
  imagePreview: string | null;
}

interface CreateMarketFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

export const CreateMarketForm = ({
  onSuccess,
  onClose,
}: CreateMarketFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    totalAmount: "",
    participantCount: "",
    intervalType: "1", // Default to Monthly
    shortDescription: "",
    longDescription: "",
    image: null,
    imagePreview: null,
  });
  const [error, setError] = useState<string>("");

  const { initialiseKuriMarket, isCreating, isCreationSuccess } =
    useKuriFactory();

  // Calculate monthly contribution per participant
  const monthlyContribution = useMemo(() => {
    if (!formData.totalAmount || !formData.participantCount) return "0";
    const total = parseFloat(formData.totalAmount);
    const participants = parseInt(formData.participantCount);
    if (isNaN(total) || isNaN(participants) || participants === 0) return "0";
    return (total / participants).toFixed(2);
  }, [formData.totalAmount, formData.participantCount]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormData((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
      setError("Please enter a valid total amount");
      return false;
    }
    if (!formData.participantCount || Number(formData.participantCount) <= 0) {
      setError("Please enter the number of participants");
      return false;
    }
    if (Number(formData.participantCount) > 500) {
      setError("Maximum 500 participants allowed per circle");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError("");
      const tx = await initialiseKuriMarket(
        parseUnits(monthlyContribution, 6), // USDC has 6 decimal places
        Number(formData.participantCount),
        Number(formData.intervalType) as 0 | 1
      );
      console.log("formData", formData);

      // Close the modal immediately after transaction confirmation
      onClose?.();

      // Show success toast with redirect message
      toast.success("Circle created successfully! Redirecting to details...", {
        duration: 4000,
      });

      // Call success callback if provided
      onSuccess?.();

      // 2. Get market address from transaction
      // TODO: Replace this with the correct extraction logic for the deployed market address
      // For now, assume tx has a property 'marketAddress' or similar
      const marketAddress = tx || "";
      console.log("Market Address:", marketAddress);

      console.log("file", formData.image);

      // 3. Save metadata
      let imageUrl = "";
      if (formData.image) {
        const filePath = formData.image.name;
        const { data, error } = await supabase.storage
          .from("kuri")
          .upload(filePath, formData.image);
        console.log("data", data);
        if (error) throw error;
        const {
          data: { publicUrl },
        } = supabase.storage.from("kuri").getPublicUrl(filePath);
        imageUrl = publicUrl;
      }
      await supabase.from("kuri_web").insert({
        market_address: marketAddress,
        short_description: formData.shortDescription,
        long_description: formData.longDescription,
        image_url: imageUrl,
      });

      // Redirect to the markets page after a delay to allow toast to be visible
      setTimeout(() => {
        window.location.href = `/markets`;
      }, 3000);
    } catch (err) {
      if (!isUserRejection(err)) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create circle";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-lg md:rounded-2xl shadow-xl p-4 md:p-8 space-y-8 max-h-[90vh] overflow-y-auto mt-2 md:mt-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-[#E8DED1] scrollbar-track-[#f5f5f5]">
      <h2 className="text-2xl font-bold text-center mb-4">Create New Circle</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Amount & Participants Section */}
        <div className="flex flex-col gap-6">
          <div>
            <label className="block font-semibold mb-1 text-[#8B6F47]">
              Total Kuri Amount (USDC)
            </label>
            <input
              type="number"
              name="totalAmount"
              value={formData.totalAmount}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400"
              placeholder="1000"
              min="100"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the total amount anyone can win monthly
            </p>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-[#8B6F47]">
              Number of Participants
            </label>
            <input
              type="number"
              name="participantCount"
              value={formData.participantCount}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400"
              placeholder="10"
              min="2"
              max="500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Min: 2, Max: 500 participants
            </p>
          </div>
          <div>
            <label className="block font-semibold mb-1 text-[#8B6F47]">
              Monthly Deposit per Participant (USDC)
            </label>
            <input
              type="text"
              value={monthlyContribution}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-gray-100 focus:outline-none cursor-not-allowed text-gray-700"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-[#8B6F47]">
              Contribution Interval
            </label>
            <select
              name="intervalType"
              value={formData.intervalType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="1">Monthly</option>
              <option value="0">Weekly</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              How often participants will contribute
            </p>
          </div>
        </div>
        <hr className="my-4 border-[#E8DED1]" />
        {/* Description Section */}
        <div className="flex flex-col gap-6">
          <div>
            <label className="block font-semibold mb-1 text-[#8B6F47]">
              Short Description (1-2 lines)
            </label>
            <input
              type="text"
              name="shortDescription"
              value={formData.shortDescription}
              onChange={handleChange}
              maxLength={120}
              className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400"
              placeholder="A brief description of your circle"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1 text-[#8B6F47]">
              Full Story
            </label>
            <textarea
              name="longDescription"
              value={formData.longDescription}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  longDescription: e.target.value,
                }))
              }
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400"
              placeholder="Tell the full story of your circle..."
            />
          </div>
        </div>
        <hr className="my-4 border-[#E8DED1]" />
        {/* Image Upload Section */}
        <div className="flex flex-col gap-4">
          <label className="block font-semibold mb-1 text-[#8B6F47]">
            Circle Image
          </label>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E8DED1] file:text-[#8B6F47] hover:file:bg-[#e0d3b8] border border-[#E8DED1] rounded-lg p-2 bg-white"
            />
            {formData.imagePreview && (
              <img
                src={formData.imagePreview}
                alt="Preview"
                className="rounded-lg border border-[#E8DED1] shadow w-32 h-32 object-cover"
              />
            )}
          </div>
        </div>
        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center font-semibold">
            {error}
          </div>
        )}
        {/* Buttons */}
        <div className="flex gap-4 pt-6">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-2 border-[#8B6F47] text-[#8B6F47] hover:bg-[#F9F5F1] hover:text-[#8B6F47] rounded-full py-2 font-semibold"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isCreating}
            className="flex-1 bg-[#8B6F47] text-white hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200 rounded-full py-2 font-semibold text-lg shadow-md"
          >
            {isCreating ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                Creating...
              </div>
            ) : (
              "Create Circle"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
