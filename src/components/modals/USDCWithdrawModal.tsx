import { useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useUSDCWithdraw } from "../../hooks/useUSDCWithdraw";

interface USDCWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: bigint;
  onWithdrawSuccess?: () => void;
}

const PERCENTAGE_OPTIONS = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
];

export const USDCWithdrawModal = ({
  isOpen,
  onClose,
  userBalance,
  onWithdrawSuccess,
}: USDCWithdrawModalProps) => {
  const [withdrawMode, setWithdrawMode] = useState<"amount" | "percentage">("percentage");
  const [customAmount, setCustomAmount] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState(0);
  const [destinationAddress, setDestinationAddress] = useState("");

  const { withdrawUSDC, isWithdrawing } = useUSDCWithdraw();

  // Calculate withdrawal amounts
  const balanceInUSDC = parseFloat(formatUnits(userBalance, 6));
  const withdrawalAmount = withdrawMode === "percentage" 
    ? balanceInUSDC * selectedPercentage
    : parseFloat(customAmount || "0");
  const withdrawalAmountBigInt = parseUnits(withdrawalAmount.toString(), 6);

  // Input sanitization and validation
  const sanitizeAddress = (address: string): string => {
    // Remove any whitespace, invisible characters, and convert to lowercase
    return address.replace(/[\s\u200B-\u200D\uFEFF]/g, '').toLowerCase();
  };

  const isValidAmount = withdrawalAmount > 0 && withdrawalAmount <= balanceInUSDC;
  const sanitizedAddress = sanitizeAddress(destinationAddress);
  const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(sanitizedAddress);
  const canWithdraw = isValidAmount && isValidAddress && !isWithdrawing;

  const handlePercentageSelect = (percentage: number) => {
    setSelectedPercentage(percentage);
    setWithdrawMode("percentage");
    const calculatedAmount = balanceInUSDC * percentage;
    setCustomAmount(calculatedAmount.toFixed(2)); // Show calculated amount in input
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setWithdrawMode("amount");
    setSelectedPercentage(0); // Clear selected percentage when manually typing
  };

  const handleAddressChange = (value: string) => {
    // Basic input sanitization on change
    const cleaned = value.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
    setDestinationAddress(cleaned);
  };

  const handleMaxAmount = () => {
    setCustomAmount(balanceInUSDC.toFixed(2));
    setWithdrawMode("amount");
    setSelectedPercentage(0);
  };

  const handleWithdraw = async () => {
    if (!canWithdraw) return;

    try {
      await withdrawUSDC(
        withdrawalAmountBigInt,
        sanitizedAddress as `0x${string}`
      );
      toast.success(
        `Successfully withdrew $${withdrawalAmount.toFixed(2)} USDC!`
      );
      onWithdrawSuccess?.();
      resetForm(); // Reset form after success
      onClose();
    } catch (error) {
      console.error("Withdraw failed:", error);
      toast.error(error instanceof Error ? error.message : "Withdrawal failed");
    }
  };

  const resetForm = () => {
    setCustomAmount("");
    setSelectedPercentage(0);
    setDestinationAddress("");
    setWithdrawMode("percentage");
  };

  const handleClose = () => {
    if (isWithdrawing) return;
    resetForm(); // Reset form when closing
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="fixed left-[50%] top-[50%] z-50 w-[95vw] max-w-md sm:max-w-lg md:max-w-xl lg:max-w-md translate-x-[-50%] translate-y-[-50%] rounded-2xl shadow-2xl p-4 sm:p-6 bg-[#F9F4F1] border-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Accessibility components - visually hidden */}
        <DialogTitle className="sr-only">Withdraw USDC</DialogTitle>
        <DialogDescription className="sr-only">
          Transfer your USDC to an external wallet by selecting an amount and destination address.
        </DialogDescription>

        <button
          onClick={handleClose}
          disabled={isWithdrawing}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#8A7A70] hover:text-[#4A2E1A] transition-colors p-1 sm:p-0"
        >
          <span className="material-icons text-lg sm:text-xl">close</span>
        </button>

        <div className="flex flex-col items-center text-center mb-4 sm:mb-5">
          <div className="bg-[#D9C3B3]/20 p-2.5 sm:p-3 rounded-full mb-2 sm:mb-3 border-4 border-[#F9F4F1]">
            <span className="material-icons text-[#4A2E1A]" style={{ fontSize: '24px' }}>
              arrow_upward
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4A2E1A]">Withdraw USDC</h2>
          <p className="text-[#8A7A70] mt-1 text-sm px-2">Transfer your USDC to an external wallet.</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-white p-3 sm:p-4 rounded-lg border border-[#E5DCD4]">
            <p className="text-xs text-[#8A7A70] mb-1">Available to Withdraw</p>
            <div className="flex items-baseline justify-center sm:justify-start">
              <span className="text-xl sm:text-2xl font-bold text-[#4A2E1A]">
                ${balanceInUSDC.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-[#8A7A70] ml-2">USDC</span>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-3">
            <label className="block text-sm font-medium text-[#4A2E1A]">Amount</label>
            <div className="relative flex items-center w-full bg-white rounded-lg border border-[#E5DCD4] focus-within:ring-2 focus-within:ring-[#D9C3B3] focus-within:border-[#D9C3B3] transition">
              <span className="material-icons absolute left-3 text-[#8A7A70] text-base sm:text-lg">attach_money</span>
              <input
                className="flex-grow bg-transparent pl-9 sm:pl-10 pr-12 sm:pr-16 py-3 sm:py-2.5 border-0 focus:ring-0 focus:outline-none text-sm sm:text-base"
                placeholder="0.00"
                type="text"
                inputMode="decimal"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
              />
              <button
                onClick={handleMaxAmount}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4A2E1A] font-medium py-1.5 px-2 sm:py-1 sm:px-2 rounded text-xs transition hover:text-[#8A7A70] touch-manipulation"
              >
                Max
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {PERCENTAGE_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handlePercentageSelect(option.value)}
                  className={`text-center py-2 sm:py-1.5 px-2 rounded-lg sm:rounded border transition-all hover:border-[#D9C3B3] touch-manipulation ${
                    withdrawMode === "percentage" && selectedPercentage === option.value
                      ? "bg-[#D9C3B3] text-[#4A2E1A] border-[#D9C3B3] shadow-sm"
                      : "bg-[#EFE9E5] text-[#4A2E1A] border-[#E5DCD4] hover:bg-[#E8DDD3]"
                  }`}
                >
                  <span className="font-medium text-xs sm:text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4A2E1A]">Destination Address</label>
            <div className="relative flex items-center w-full bg-white rounded-lg border border-[#E5DCD4] focus-within:ring-2 focus-within:ring-[#D9C3B3] focus-within:border-[#D9C3B3] transition">
              <input
                className="flex-grow bg-transparent pl-3 pr-10 py-3 sm:py-2.5 border-0 focus:ring-0 focus:outline-none text-sm sm:text-base font-mono"
                placeholder="0x..."
                type="text"
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                value={destinationAddress}
                onChange={(e) => handleAddressChange(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedText = e.clipboardData.getData('text');
                  handleAddressChange(pastedText);
                }}
              />
              {destinationAddress && (
                <button
                  onClick={() => setDestinationAddress('')}
                  className="absolute right-2 p-1 text-[#8A7A70] hover:text-[#4A2E1A] transition-colors touch-manipulation"
                  type="button"
                  aria-label="Clear address"
                >
                  <span className="material-icons text-sm">clear</span>
                </button>
              )}
            </div>
            <p className="text-xs text-[#8A7A70] px-1">
              <span className="font-medium">Security tip:</span> Manually scroll through the address field to verify the complete address before withdrawing.
            </p>
          </div>

          {/* Validation Errors */}
          {withdrawalAmount > 0 && !isValidAmount && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="material-icons text-red-600 text-sm">error</span>
                <p className="text-xs sm:text-sm text-red-700 flex-1">
                  Invalid amount. Must be between $0.01 and ${balanceInUSDC.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {destinationAddress && !isValidAddress && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="material-icons text-red-600 text-sm">error</span>
                <p className="text-xs sm:text-sm text-red-700 flex-1">
                  Invalid address. Please enter a valid Ethereum address starting with 0x.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row sm:justify-between gap-3">
          <button
            onClick={handleClose}
            disabled={isWithdrawing}
            className="hidden sm:block w-full sm:w-auto py-3 sm:py-2.5 px-5 rounded-lg text-sm sm:text-base bg-transparent text-[#4A2E1A] border border-[#E5DCD4] hover:bg-[#EFE9E5] font-semibold transition touch-manipulation active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={!canWithdraw}
            className="w-full sm:w-auto flex items-center justify-center py-3 sm:py-2.5 px-5 rounded-lg text-sm sm:text-base bg-[#D9C3B3] text-[#4A2E1A] hover:bg-[#C8B2A2] disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition touch-manipulation active:scale-95"
          >
            {isWithdrawing ? (
              <>
                <Loader2 className="mr-2 w-4 h-4" />
                <span className="hidden xs:inline">Withdrawing...</span>
                <span className="xs:hidden">Processing...</span>
              </>
            ) : (
              <>
                <span className="material-icons mr-2 text-sm sm:text-base">send</span>
                <span className="hidden xs:inline">Withdraw Now</span>
                <span className="xs:hidden">Withdraw</span>
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};