import { useState, useMemo } from "react";
import { useKuriFactory } from "../../hooks/contracts/useKuriFactory";
import { Button } from "../ui/button";
import { isUserRejection } from "../../utils/errors";
// import { LoadingSkeleton } from "../ui/loading-states";
import { parseUnits } from "viem";
import { toast } from "sonner";
import { sanitizeInput } from "../../utils/sanitize";
import { validateImageFile } from "../../utils/fileValidation";
import { Confetti } from "../ui/Confetti";
import { trackMarketCreation, trackError } from "../../utils/analytics";
import { apiClient } from "../../lib/apiClient";
import { formatErrorForUser } from "../../utils/apiErrors";
import { useAccount } from "@getpara/react-sdk";
import { ChevronDown, Check } from "lucide-react";

interface FormData {
  totalAmount: string;
  participantCount: string;
  intervalType: "0" | "1"; // 0 for WEEKLY, 1 for MONTHLY
  shortDescription: string;
  longDescription: string;
  image: File | null;
  imagePreview: string | null;
  joinAsFirstMember: boolean;
}

interface CreateMarketFormProps {
  onSuccess?: (market: any) => void;
  onClose?: () => void;
}

export const CreateMarketForm = ({
  onSuccess,
  onClose,
}: CreateMarketFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    totalAmount: "",
    participantCount: "",
    intervalType: "0", // Default to Weekly
    shortDescription: "",
    longDescription: "",
    image: null,
    imagePreview: null,
    joinAsFirstMember: true, // Default to joining as first member
  });
  const [error, setError] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasInvalidImage, setHasInvalidImage] = useState(false);
  const [isIntervalDropdownOpen, setIsIntervalDropdownOpen] = useState(false);

  // const navigate = useNavigate();
  const account = useAccount();
  const address = account.embedded.wallets?.[0]?.address;
  const { initialiseKuriMarket, isCreating } = useKuriFactory();

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
    const { name, value, type } = e.target;

    // Handle checkbox inputs
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      // Sanitize text inputs
      const sanitizedValue =
        name === "shortDescription" || name === "longDescription"
          ? sanitizeInput(value)
          : value;
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }));
    }
    setError("");
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

    // Simple validation: if no image OR invalid image, block submission
    if (!formData.image) {
      setError("Please add a circle image to continue");
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

  // Step-specific validation
  const validateCurrentStep = (): boolean => {
    setError("");

    switch (currentStep) {
      case 1: // Circle Basics
        if (!formData.totalAmount || Number(formData.totalAmount) <= 0) {
          setError("Please enter a valid total amount");
          return false;
        }
        if (
          !formData.participantCount ||
          Number(formData.participantCount) <= 0
        ) {
          setError("Please enter the number of participants");
          return false;
        }
        if (Number(formData.participantCount) > 500) {
          setError("Maximum 500 participants allowed per circle");
          return false;
        }
        return true;

      case 2: // Your Participation - no validation needed
        return true;

      case 3: // Circle Details
        if (!formData.shortDescription.trim()) {
          setError("Please add a short description for your circle");
          return false;
        }
        return true;

      case 4: // Image & Review
        if (!formData.image) {
          setError("Please add a circle image to continue");
          return false;
        }
        if (hasInvalidImage) {
          setError(
            "Your image is too large or wrong format. Please choose a smaller image (under 5MB)"
          );
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setError("");
      const result = await initialiseKuriMarket(
        parseUnits(formData.totalAmount, 6), // USDC has 6 decimal places - pass total kuri amount
        Number(formData.participantCount),
        Number(formData.intervalType) as 0 | 1,
        formData.joinAsFirstMember, // V1: creator participation choice
        0 // V1: currency index (hardcoded to 0 for USDC)
      );

      const { marketAddress, txHash } = result;

      // Small delay to ensure transaction is propagated to all RPC nodes
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Call backend API for metadata creation using transaction hash
      const marketData = await apiClient.createCircleMetadata({
        userAddress: address!,
        contractAddress: marketAddress,
        transactionHash: txHash,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        image: formData.image || undefined,
      });

      // Track successful market creation
      trackMarketCreation(
        marketAddress,
        formData.intervalType === "0" ? "weekly" : "monthly",
        Number(formData.participantCount),
        monthlyContribution
      );

      // Show success state
      setShowConfetti(true);

      // Create market data object
      const newMarket = {
        address: marketAddress,
        name: formData.shortDescription,
        totalParticipants: Number(formData.participantCount),
        activeParticipants: 0,
        kuriAmount: monthlyContribution,
        intervalType: Number(formData.intervalType),
        state: 0,
        ...marketData,
      };

      // Call success callback with market data
      onSuccess?.(newMarket);

      // NOTE: Removed onClose() call to fix circular dependency
      // Let parent component (MarketList) handle modal lifecycle
      // Modal will close naturally through user interaction
    } catch (err) {
      // Track market creation failure
      trackError(
        "market_creation_failed",
        "CreateMarketForm",
        err instanceof Error ? err.message : "Unknown error"
      );

      if (!isUserRejection(err)) {
        const errorMessage = formatErrorForUser(err);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }
  };

  // Step indicator component
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-4 sm:mb-6 px-1">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
              step === currentStep
                ? "bg-[#8B6F47] text-white"
                : step < currentStep
                ? "bg-[#E8DED1] text-[#8B6F47]"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            {step < currentStep ? "✓" : step}
          </div>
          {step < 4 && (
            <div
              className={`w-6 sm:w-8 md:w-12 h-1 mx-1 ${
                step < currentStep ? "bg-[#E8DED1]" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#8B6F47] mb-2">
                Circle Basics
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Set up the foundation of your savings circle
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#8B6F47] text-sm">
                Total Kuri Amount (USDC)
              </label>
              <input
                type="number"
                name="totalAmount"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400 text-sm sm:text-base"
                placeholder="1000"
                min="100"
                step="100"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is the total amount anyone can win on each cycle.
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#8B6F47] text-sm">
                Number of Participants
              </label>
              <input
                type="number"
                name="participantCount"
                value={formData.participantCount}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400 text-sm sm:text-base"
                placeholder="10"
                min="2"
                max="500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Min: 2, Max: 500 participants
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#8B6F47] text-sm">
                Monthly Deposit per Participant (USDC)
              </label>
              <input
                type="text"
                value={monthlyContribution}
                readOnly
                className="w-full px-3 py-2 sm:px-4 rounded-lg border border-[#E8DED1] bg-gray-100 focus:outline-none cursor-not-allowed text-gray-700 text-sm sm:text-base"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#8B6F47] text-sm">
                Contribution Interval
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsIntervalDropdownOpen(!isIntervalDropdownOpen)
                  }
                  className="w-full px-3 py-2 sm:px-4 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent cursor-pointer flex items-center justify-between text-left text-sm sm:text-base"
                >
                  <span>
                    {formData.intervalType === "0" ? "Weekly" : "Monthly"}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${
                      isIntervalDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isIntervalDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-[#E8DED1] rounded-lg shadow-lg z-10 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, intervalType: "1" }));
                        setIsIntervalDropdownOpen(false);
                        setError("");
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#F9F5F1] flex items-center justify-between transition-colors"
                    >
                      <span className="text-sm">Monthly</span>
                      {formData.intervalType === "1" && (
                        <Check className="h-4 w-4 text-[#8B6F47]" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, intervalType: "0" }));
                        setIsIntervalDropdownOpen(false);
                        setError("");
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-[#F9F5F1] flex items-center justify-between transition-colors"
                    >
                      <span className="text-sm">Weekly</span>
                      {formData.intervalType === "0" && (
                        <Check className="h-4 w-4 text-[#8B6F47]" />
                      )}
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                How often raffles will happen
              </p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#8B6F47] mb-2">
                Your Participation
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Choose how you want to participate in your circle
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-3 text-[#8B6F47] text-sm">
                Creator Participation
              </label>
              <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-lg border border-[#E8DED1] bg-[#F9F5F1]">
                <input
                  type="checkbox"
                  id="joinAsFirstMember"
                  name="joinAsFirstMember"
                  checked={formData.joinAsFirstMember}
                  onChange={handleChange}
                  className="w-4 h-4 text-[#8B6F47] bg-white border-[#E8DED1] rounded focus:ring-[#8B6F47] focus:ring-2 flex-shrink-0"
                />
                <label
                  htmlFor="joinAsFirstMember"
                  className="text-xs sm:text-sm text-gray-700 cursor-pointer"
                >
                  <span className="font-medium">
                    Join your own circle as the first member
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.joinAsFirstMember
                      ? "You'll participate in deposits and be eligible to win"
                      : "You'll only manage the circle as an administrator"}
                  </p>
                </label>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
              <h4 className="font-semibold text-orange-800 mb-2 text-sm">
                What does this mean?
              </h4>
              <ul className="text-xs sm:text-sm text-orange-700 space-y-1">
                <li>
                  • <strong>Join as member:</strong> You contribute{" "}
                  {monthlyContribution} USDC monthly and can win the pot
                </li>
                <li>
                  • <strong>Admin only:</strong> You manage the circle but don't
                  contribute or win
                </li>
              </ul>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#8B6F47] mb-2">
                Circle Details
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Tell others about your savings circle
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#8B6F47] text-sm">
                Short Description (1-2 lines)
              </label>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                maxLength={120}
                className="w-full px-3 py-2 sm:px-4 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400 text-sm sm:text-base"
                placeholder="A brief description of your circle"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.shortDescription.length}/120 characters
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#8B6F47] text-sm">
                Full Story (Optional)
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
                rows={3}
                className="w-full px-3 py-2 sm:px-4 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent placeholder-gray-400 text-sm sm:text-base resize-none"
                placeholder="Tell the full story of your circle... Why are you creating it? What's the goal?"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="text-center mb-3 sm:mb-4 md:mb-6">
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#8B6F47] mb-2">
                Circle Image & Review
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm px-2">
                Add an image and review your circle details
              </p>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[#8B6F47] text-sm">
                Circle Image
              </label>
              <div className="flex flex-col items-center gap-3 sm:gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs sm:text-sm text-gray-500 file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-[#E8DED1] file:text-[#8B6F47] hover:file:bg-[#e0d3b8] border border-[#E8DED1] rounded-lg p-2 bg-white"
                />
                {formData.imagePreview && (
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="rounded-lg border border-[#E8DED1] shadow w-24 h-24 sm:w-32 sm:h-32 object-cover"
                  />
                )}
              </div>
              {(!formData.image || hasInvalidImage) && (
                <p className="text-red-600 text-xs sm:text-sm mt-2">
                  {!formData.image
                    ? "Please add a circle image to continue"
                    : "Your image is too large or wrong format. Please choose a smaller image (under 5MB)"}
                </p>
              )}
            </div>

            {/* Review Summary */}
            <div className="bg-[#F9F5F1] border border-[#E8DED1] rounded-lg p-3 sm:p-4 mt-4 sm:mt-6">
              <h4 className="font-semibold text-[#8B6F47] mb-2 sm:mb-3 text-sm sm:text-base">
                Circle Summary
              </h4>
              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <p className="text-gray-700">
                  <span className="font-medium text-[#8B6F47]">
                    {formData.participantCount || "0"} people
                  </span>{" "}
                  will join this circle, and the winner of each round takes home{" "}
                  <span className="font-medium text-[#8B6F47]">
                    {formData.totalAmount || "0"} USDC
                  </span>
                  .
                </p>
                <p className="text-gray-700">
                  Each person contributes{" "}
                  <span className="font-medium text-[#8B6F47]">
                    {monthlyContribution} USDC
                  </span>{" "}
                  {formData.intervalType === "0" ? "every week" : "every month"}{" "}
                  until everyone has won once.
                </p>
                <p className="text-gray-700">
                  You will{" "}
                  {formData.joinAsFirstMember ? (
                    <>
                      join as a{" "}
                      <span className="font-medium text-[#8B6F47]">
                        participant
                      </span>
                      , contributing and eligible to win
                    </>
                  ) : (
                    <>
                      act as{" "}
                      <span className="font-medium text-[#8B6F47]">
                        admin only
                      </span>
                      , managing the circle without participating
                    </>
                  )}
                  .
                </p>
                {formData.shortDescription && (
                  <div className="pt-2 border-t border-[#E8DED1]">
                    <span className="text-gray-600 text-xs sm:text-sm">Description:</span>
                    <p className="font-medium mt-1 text-xs sm:text-sm">
                      {formData.shortDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="w-full bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-[#E8DED1] scrollbar-track-[#f5f5f5]">
        
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center pt-2">
          Create New Circle
        </h2>

        <StepIndicator />

        <form onSubmit={handleSubmit}>
          {renderStepContent()}

          {/* Error Message - Only show for steps 1-3, step 4 has inline validation */}
          {error && currentStep < 4 && (
            <div className="text-red-600 text-center font-semibold text-sm">
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-6">
            {currentStep === 1 ? (
              <Button
                type="button"
                onClick={onClose}
                variant="outline"
                className="flex-1 border-2 border-[#8B6F47] text-[#8B6F47] hover:bg-[#F9F5F1] hover:text-[#8B6F47] rounded-full py-2 font-semibold text-sm sm:text-base"
              >
                Cancel
              </Button>
            ) : (
              <Button
                type="button"
                onClick={prevStep}
                variant="outline"
                className="flex-1 border-2 border-[#8B6F47] text-[#8B6F47] hover:bg-[#F9F5F1] hover:text-[#8B6F47] rounded-full py-2 font-semibold text-sm sm:text-base"
              >
                Back
              </Button>
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex-1 bg-[#8B6F47] text-white hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200 rounded-full py-2 font-semibold text-sm sm:text-base"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 bg-[#8B6F47] text-white hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200 rounded-full py-2 font-semibold text-sm sm:text-base md:text-lg shadow-md"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white/20 border-t-white" />
                    <span className="text-xs sm:text-sm">Creating...</span>
                  </div>
                ) : (
                  "Create Circle"
                )}
              </Button>
            )}
          </div>
        </form>
      </div>
    </>
  );
};
