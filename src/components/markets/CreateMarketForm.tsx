import { useState, useEffect } from "react";
import { useKuriFactory } from "../../hooks/contracts/useKuriFactory";
import { Button } from "../ui/button";
import { isUserRejection } from "../../utils/errors";

interface FormData {
  name: string;
  symbol: string;
  initialSupply: string;
}

export const CreateMarketForm = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    symbol: "",
    initialSupply: "",
  });
  const [error, setError] = useState<string>("");
  const [userKuri, setUserKuri] = useState<`0x${string}` | null>(null);

  const { createKuri, isCreating, isCreationSuccess, getUserKuri } =
    useKuriFactory();

  // Fetch user's Kuri on mount
  useEffect(() => {
    const fetchUserKuri = async () => {
      const kuri = await getUserKuri();
      setUserKuri(kuri as `0x${string}` | null);
    };
    fetchUserKuri();
  }, [getUserKuri]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Market name is required");
      return false;
    }
    if (!formData.symbol.trim()) {
      setError("Market symbol is required");
      return false;
    }
    if (!formData.initialSupply || Number(formData.initialSupply) <= 0) {
      setError("Initial supply must be greater than 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const tx = await createKuri(
        formData.name,
        formData.symbol,
        Number(formData.initialSupply)
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
  useEffect(() => {
    if (isCreationSuccess) {
      setFormData({
        name: "",
        symbol: "",
        initialSupply: "",
      });
      setError("");
      // Refresh user's Kuri data
      getUserKuri().then((kuri) => setUserKuri(kuri as `0x${string}` | null));
    }
  }, [isCreationSuccess, getUserKuri]);

  // If user already has a Kuri, show message instead of form
  if (userKuri) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Your Market</h2>
        <p className="text-gray-600">
          You already have a Kuri market at address: {userKuri}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Create New Market</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Market Name
            </label>
            <input
              type="text"
              name="name"
              required
              className="w-full px-3 py-2 border border-[hsl(var(--gold))/20] rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
              placeholder="Enter market name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              name="description"
              required
              rows={3}
              className="w-full px-3 py-2 border border-[hsl(var(--gold))/20] rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
              placeholder="Enter market description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Entry Fee (ETH)
            </label>
            <input
              type="number"
              name="entryFee"
              required
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-[hsl(var(--gold))/20] rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
              placeholder="0.00"
            />
          </div>

          {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

          <Button
            type="submit"
            variant="default"
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Creating..." : "Create Market"}
          </Button>
        </div>
      </form>
    </div>
  );
};
