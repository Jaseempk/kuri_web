import { useState } from "react";
import { useKuriFactory } from "../../hooks/contracts/useKuriFactory";
import { Button } from "../ui/button";
import { isUserRejection } from "../../utils/errors";
import { LoadingSkeleton } from "../ui/loading-states";
import { parseEther } from "viem";
import { DialogClose } from "@radix-ui/react-dialog";
import { toast } from "sonner";

interface FormData {
  kuriAmount: string;
  participantCount: string;
  intervalType: "0" | "1"; // 0 for WEEKLY, 1 for MONTHLY
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
    kuriAmount: "",
    participantCount: "",
    intervalType: "1", // Default to Monthly
  });
  const [error, setError] = useState<string>("");

  const { initialiseKuriMarket, isCreating, isCreationSuccess } =
    useKuriFactory();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = (): boolean => {
    if (!formData.kuriAmount || Number(formData.kuriAmount) <= 0) {
      setError("Please enter a valid contribution amount");
      return false;
    }
    if (!formData.participantCount || Number(formData.participantCount) <= 0) {
      setError("Please enter the number of participants");
      return false;
    }
    if (Number(formData.participantCount) > 25) {
      setError("Maximum 25 participants allowed per circle");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const tx = await initialiseKuriMarket(
        parseEther(formData.kuriAmount),
        Number(formData.participantCount),
        Number(formData.intervalType) as 0 | 1
      );

      toast.success("Circle created successfully! Redirecting to details...");
      onSuccess?.();
      onClose?.();

      // Redirect to the new circle after a short delay
      setTimeout(() => {
        window.location.href = `/markets/${tx}`;
      }, 2000);
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(
          err instanceof Error ? err.message : "Failed to create circle"
        );
      }
    }
  };

  return (
    <div className="py-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Monthly Contribution (ETH)
          </label>
          <input
            type="number"
            name="kuriAmount"
            value={formData.kuriAmount}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent"
            placeholder="0.1"
            min="0.01"
            step="0.01"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            This is the amount each participant will contribute per interval
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Number of Participants
          </label>
          <input
            type="number"
            name="participantCount"
            value={formData.participantCount}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent"
            placeholder="10"
            min="2"
            max="25"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Min: 2, Max: 25 participants
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Contribution Interval
          </label>
          <select
            name="intervalType"
            value={formData.intervalType}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-[#E8DED1] bg-white focus:outline-none focus:ring-2 focus:ring-[#8B6F47] focus:border-transparent"
          >
            <option value="1">Monthly</option>
            <option value="0">Weekly</option>
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            How often participants will contribute
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-[#8B6F47] text-[#8B6F47] hover:bg-[#8B6F47] hover:text-white rounded-full"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isCreating}
            className="flex-1 bg-[#8B6F47] text-white hover:bg-[#725A3A] rounded-full"
          >
            {isCreating ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingSkeleton className="w-4 h-4 rounded-full" />
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
