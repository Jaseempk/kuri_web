import { useState } from "react";
import { useKuriFactory } from "../../hooks/contracts/useKuriFactory";
import { Button } from "../ui/button";
import { isUserRejection } from "../../utils/errors";

interface FormData {
  kuriAmount: string;
  participantCount: string;
  intervalType: "0" | "1"; // 0 for WEEKLY, 1 for MONTHLY
}

export const CreateMarketForm = () => {
  const [formData, setFormData] = useState<FormData>({
    kuriAmount: "",
    participantCount: "",
    intervalType: "0",
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
      setError("Kuri amount must be greater than 0");
      return false;
    }
    if (!formData.participantCount || Number(formData.participantCount) <= 0) {
      setError("Participant count must be greater than 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const tx = await initialiseKuriMarket(
        Number(formData.kuriAmount),
        Number(formData.participantCount),
        Number(formData.intervalType) as 0 | 1
      );
      console.log("Transaction submitted:", tx);
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(
          err instanceof Error ? err.message : "Failed to create market"
        );
      }
    }
  };

  // Reset form on successful creation
  if (isCreationSuccess) {
    setFormData({
      kuriAmount: "",
      participantCount: "",
      intervalType: "0",
    });
    setError("");
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create New Market</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Kuri Amount
          </label>
          <input
            type="number"
            name="kuriAmount"
            value={formData.kuriAmount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter total amount"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Number of Participants
          </label>
          <input
            type="number"
            name="participantCount"
            value={formData.participantCount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter participant count"
            min="1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Interval Type
          </label>
          <select
            name="intervalType"
            value={formData.intervalType}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="0">Weekly</option>
            <option value="1">Monthly</option>
          </select>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <Button type="submit" disabled={isCreating} className="w-full">
          {isCreating ? "Creating..." : "Create Market"}
        </Button>
      </form>
    </div>
  );
};
