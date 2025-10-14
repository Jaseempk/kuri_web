import * as React from "react";
import {
  AlertTriangle,
  DollarSign,
  ExternalLink,
  RefreshCw,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { calculateDeficit } from "../../utils/tokenUtils";
import { CurrencyDisplay } from "../ui/CurrencyDisplay";

interface InsufficientBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  userBalance: bigint;
  requiredAmount: bigint;
  onRefreshBalance: () => void;
  isRefreshing?: boolean;
}

export const InsufficientBalanceModal: React.FC<
  InsufficientBalanceModalProps
> = ({
  isOpen,
  onClose,
  userBalance,
  requiredAmount,
  onRefreshBalance,
  isRefreshing = false,
}) => {
  const deficit = calculateDeficit(requiredAmount, userBalance);

  const handleBuyUSDC = () => {
    // Open external link to buy USDC (you can customize this URL)
    window.open(
      "https://app.uniswap.org/#/swap?outputCurrency=0xA0b86a33E6441986C4190574d5F5E6d5bFDbF3d9",
      "_blank"
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
            Insufficient Balance
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Balance Comparison */}
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Balance Details
              </h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Current Balance:</span>
                  <span className="font-mono font-medium">
                    <CurrencyDisplay amount={userBalance} decimals={2} showBoth />
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Required Amount:</span>
                  <span className="font-mono font-medium">
                    <CurrencyDisplay amount={requiredAmount} decimals={2} showBoth />
                  </span>
                </div>

                <hr className="border-red-200" />

                <div className="flex justify-between">
                  <span className="text-red-700 font-medium">You Need:</span>
                  <span className="font-mono font-bold text-red-700">
                    <CurrencyDisplay amount={deficit} decimals={2} showBoth />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              <strong>What to do next:</strong> You need to add more USDC to
              your wallet before you can make this deposit. You can buy USDC
              from exchanges or swap other tokens for USDC.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleBuyUSDC}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Buy USDC (Uniswap)
            </Button>

            <Button
              onClick={onRefreshBalance}
              variant="outline"
              disabled={isRefreshing}
              className="w-full"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Balance
                </>
              )}
            </Button>

            <Button onClick={onClose} variant="ghost" className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
