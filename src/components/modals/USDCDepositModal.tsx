import { Copy, Check, Info } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useClipboard } from "../../hooks/useClipboard";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useAuthContext } from "../../contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  getCurrentNetworkConfig,
  getContractAddress,
  getDefaultChainId,
} from "../../config/contracts";
import {
  generateUPIDeeplink,
  openUPIApp,
  generateTransactionNote,
  validateUPIAmount,
} from "../../utils/upiPayment";

interface USDCDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  smartWalletAddress: string;
}

const networkConfig = getCurrentNetworkConfig();
const NETWORK_NAME = networkConfig.name;

// UPI Configuration from environment
const UPI_ID = import.meta.env.VITE_UPI_ID || "kuriapp@okaxis";
const UPI_PAYEE_NAME = import.meta.env.VITE_UPI_PAYEE_NAME || "Kuri App";

type DepositTab = "crypto" | "upi";

export const USDCDepositModal = ({
  isOpen,
  onClose,
  smartWalletAddress,
}: USDCDepositModalProps) => {
  const { copyToClipboard, isCopied } = useClipboard();
  const { location } = useGeolocation();
  const { profile } = useAuthContext();

  // State for tabs and UPI
  const [activeTab, setActiveTab] = useState<DepositTab>("upi");
  const [upiAmount, setUpiAmount] = useState<string>("");
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);

  // Check if user is in India or Malaysia
  const isIndianUser = location?.country === "IN" || location?.country === "MY";

  // Set default tab based on user location
  useEffect(() => {
    if (isOpen) {
      // Default to UPI for IN/MY users, crypto for others
      setActiveTab(isIndianUser ? "upi" : "crypto");
    }
  }, [isOpen, isIndianUser]);

  const handleCopyAddress = async () => {
    try {
      await copyToClipboard(smartWalletAddress);
      toast.success("Wallet address copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const handleCopyUPIId = async () => {
    try {
      await copyToClipboard(UPI_ID);
      toast.success("UPI ID copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy UPI ID");
    }
  };

  const handleUPIPayment = async () => {
    const amount = parseFloat(upiAmount);

    // Validate amount
    const validation = validateUPIAmount(amount);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsProcessingUPI(true);

      // Generate transaction note with username for reconciliation
      const username = profile?.username || "user";
      const transactionNote = generateTransactionNote(username);

      // Generate UPI deeplink
      const upiLink = generateUPIDeeplink({
        upiId: UPI_ID,
        payeeName: UPI_PAYEE_NAME,
        amount,
        transactionNote,
      });

      // Open UPI app
      openUPIApp(upiLink);

      toast.success("Opening UPI app...", {
        description: "Complete the payment in your UPI app",
      });

      // TODO: Log payment attempt to backend for reconciliation
      console.log("UPI Payment Attempt:", {
        amount,
        username,
        transactionNote,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("UPI payment failed:", error);
      toast.error("Failed to open UPI app", {
        description: "Please ensure you have a UPI app installed",
      });
    } finally {
      setIsProcessingUPI(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[400px] p-0 gap-0">
        <DialogHeader className="p-4 pb-3">
          <DialogTitle className="text-lg font-bold text-[#4E342E]">
            Add Funds
          </DialogTitle>
          <DialogDescription className="text-[#8D6E63] text-sm">
            Choose your preferred deposit method
          </DialogDescription>
        </DialogHeader>

        {/* Tab Navigation */}
        {isIndianUser && (
          <div className="flex border-b border-[#E8DED1] px-4">
            <button
              onClick={() => setActiveTab("upi")}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "upi"
                  ? "text-[#8D6E63]"
                  : "text-[#4E342E]/50 hover:text-[#4E342E]/75"
              }`}
            >
              UPI Payment
              {activeTab === "upi" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8D6E63]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("crypto")}
              className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                activeTab === "crypto"
                  ? "text-[#8D6E63]"
                  : "text-[#4E342E]/50 hover:text-[#4E342E]/75"
              }`}
            >
              USD Deposit
              {activeTab === "crypto" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8D6E63]" />
              )}
            </button>
          </div>
        )}

        <div className="px-4 pb-4 space-y-4 pt-4">
          {/* Crypto Deposit Tab */}
          {activeTab === "crypto" && (
            <>
              {/* Wallet Address Section */}
              <div>
                <label className="block text-sm font-medium text-[#4E342E] mb-2">
                  Your Wallet Address
                </label>
                <div className="bg-[#F9F6F1] border border-[#D1C4B0] rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-[#4E342E] break-all">
                        {smartWalletAddress}
                      </p>
                    </div>
                    <Button
                      onClick={handleCopyAddress}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 border-[#8D6E63] text-[#8D6E63] hover:bg-[#8D6E63] hover:text-white"
                    >
                      {isCopied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-amber-700">
                      <span className="font-medium">
                        Only send USDC on {NETWORK_NAME}.
                      </span>{" "}
                      Sending other tokens or wrong network may result in loss.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  onClick={handleCopyAddress}
                  className="w-full bg-[#8D6E63] text-white hover:bg-[#795548]"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Address Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Address
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* UPI Payment Tab */}
          {activeTab === "upi" && isIndianUser && (
            <>
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-[#4E342E] mb-2">
                  Enter Amount (INR)
                </label>
                <div className="bg-[#F9F6F1] border border-[#D1C4B0] rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#4E342E] font-medium">₹</span>
                    <input
                      type="number"
                      value={upiAmount}
                      onChange={(e) => setUpiAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 bg-transparent border-none outline-none text-[#4E342E] placeholder:text-[#8D6E63]/50"
                      min="10"
                      max="100000"
                    />
                  </div>
                </div>
                <p className="text-xs text-[#8D6E63] mt-1">
                  Min: ₹10 | Max: ₹1,00,000
                </p>
              </div>

              {/* UPI Info Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs text-amber-700">
                      <span className="font-medium">Payment Process:</span>
                    </p>
                    <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
                      <li>Click "Pay with UPI" to open your UPI app</li>
                      <li>Complete payment in your UPI app</li>
                      <li>Wallet Balance will be updated within 24 hours</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* UPI ID Display (Fallback) */}
              <div>
                <label className="block text-sm font-medium text-[#4E342E] mb-2">
                  Or Pay Manually to UPI ID
                </label>
                <div className="bg-[#F9F6F1] border border-[#D1C4B0] rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#4E342E] font-mono">{UPI_ID}</p>
                    <Button
                      onClick={handleCopyUPIId}
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 border-[#8D6E63] text-[#8D6E63] hover:bg-[#8D6E63] hover:text-white"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  onClick={handleUPIPayment}
                  disabled={!upiAmount || isProcessingUPI}
                  className="w-full bg-[#8D6E63] text-white hover:bg-[#795548] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessingUPI ? "Opening UPI App..." : "Pay with UPI"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
