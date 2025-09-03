import { useState, useEffect } from "react";
import {
  useKuriCore,
  KuriState,
  IntervalType,
} from "../../hooks/contracts/useKuriCore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatEther, formatUnits } from "viem";
import { TransactionLoading, ErrorMessage } from "../ui/loading-states";
import { handleContractError } from "../../utils/errors";
import { hasSufficientBalance } from "../../utils/tokenUtils";
import { InsufficientBalanceModal } from "../modals/InsufficientBalanceModal";
import {
  DollarSign,
  AlertCircle,
  Clock,
  ArrowRight,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { trackDeposit, trackError } from "../../utils/analytics";

interface KuriData {
  creator: `0x${string}`;
  kuriAmount: bigint;
  totalParticipantsCount: number;
  totalActiveParticipantsCount: number;
  intervalDuration: number;
  nexRaffleTime: bigint;
  nextIntervalDepositTime: bigint;
  launchPeriod: bigint;
  startTime: bigint;
  endTime: bigint;
  intervalType: IntervalType;
  state: KuriState;
}

interface DepositFormProps {
  marketData: KuriData;
  kuriAddress: `0x${string}`;
}

export const DepositForm: React.FC<DepositFormProps> = ({
  marketData,
  kuriAddress,
}) => {
  const {
    depositSponsored,
    isLoading,
    error,
    isApproving,
    userPaymentStatus,
    userBalance,
    currentInterval,
    checkUserBalance,
    refreshUserData,
    checkPaymentStatusIfMember, // 🔥 NEW: Explicit payment status check
  } = useKuriCore(kuriAddress);

  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] =
    useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  // Check if this is user's first deposit (interval 1 and hasn't paid yet)
  const isFirstDeposit = currentInterval === 1 && userPaymentStatus === false;
  
  // Calculate required amount including fee for first deposit
  const baseAmount = marketData.kuriAmount;
  const requiredAmount = isFirstDeposit 
    ? baseAmount + (baseAmount / BigInt(100)) // Add 1% fee
    : baseAmount;

  const nextDepositTime = new Date(
    Number(marketData.nextIntervalDepositTime) * 1000
  );
  const raffleTime = new Date(Number(marketData.nexRaffleTime) * 1000);
  const now = new Date();
  const canDeposit = now >= nextDepositTime;
  const isAfterRaffle = now >= raffleTime;

  // 🔥 NEW: Explicitly check payment status when component mounts (lazy loading)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!kuriAddress) return;

      try {
        await checkPaymentStatusIfMember();
      } catch (err) {
        console.error("Error checking payment status:", err);
      }
    };

    checkPaymentStatus();
  }, [kuriAddress, checkPaymentStatusIfMember]);

  const handleDeposit = async () => {
    if (!kuriAddress) return;

    try {
      // First, check if user has sufficient balance
      const currentBalance = await checkUserBalance();

      if (!hasSufficientBalance(currentBalance, requiredAmount)) {
        setShowInsufficientBalanceModal(true);
        return;
      }

      // If balance is sufficient, proceed with deposit
      await depositSponsored();

      // Track successful deposit
      trackDeposit(
        kuriAddress,
        formatUnits(marketData.kuriAmount, 6),
        0 // TODO: Add proper interval index when available
      );

      // Additional refresh to ensure UI updates immediately
      // Wait a brief moment for blockchain state to be consistent
      await new Promise((resolve) => setTimeout(resolve, 500));
      try {
        await refreshUserData();
      } catch (err) {
        console.error("Failed to refresh user data in component:", err);
      }
    } catch (err) {
      // Track deposit failure
      const errorType =
        err instanceof Error && err.message.includes("insufficient")
          ? "insufficient_balance"
          : err instanceof Error && err.message.includes("approval")
          ? "approval_failed"
          : "transaction_failed";

      trackError(
        "deposit_failed",
        "DepositForm",
        err instanceof Error ? err.message : "Unknown error"
      );

      console.error("Deposit failed:", err);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true);
    try {
      await checkUserBalance();
    } catch (err) {
      console.error("Failed to refresh balance:", err);
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  // Calculate days until next deposit window
  const daysUntilDeposit = Math.ceil(
    (nextDepositTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  const getDepositButtonContent = () => {
    if (isApproving) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Approving Tokens...</span>
          <span className="sm:hidden">Approving...</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="hidden sm:inline">Processing Deposit...</span>
          <span className="sm:hidden">Processing...</span>
        </div>
      );
    }

    return (
      <>
        <span className="hidden sm:inline">Make Deposit</span>
        <span className="sm:hidden">Deposit</span>
      </>
    );
  };

  const getStatusMessage = () => {
    if (!canDeposit) return null;

    // If user has already paid, show paid status
    if (userPaymentStatus === true) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600"></div>
      );
    }

    if (isApproving) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Approving tokens for deposit...</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing deposit...</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span>Ready to deposit</span>
      </div>
    );
  };

  const renderActionButton = () => {
    // If user has already paid, show paid status
    if (userPaymentStatus === true) {
      return (
        <div className="bg-green-600/80 backdrop-blur-sm text-white border border-green-600/30 rounded-full px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm shadow-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Paid</span>
        </div>
      );
    }

    // Show deposit button if user hasn't paid
    return (
      <button
        onClick={handleDeposit}
        disabled={isLoading || isApproving}
        className="bg-[hsl(var(--terracotta))]/80 backdrop-blur-sm text-white border border-[hsl(var(--terracotta))]/30 hover:bg-[hsl(var(--terracotta))] transition-all duration-300 rounded-full px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getDepositButtonContent()}
      </button>
    );
  };

  return (
    <div className="relative rounded-2xl p-4 sm:p-6 md:p-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden min-h-[160px] sm:min-h-[200px]">
        {/* Gradient overlay for subtle color hint */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--terracotta))]/20 to-[hsl(var(--ochre))]/20 rounded-2xl" />

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(139,111,71,0.3) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {isFirstDeposit ? (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-[hsl(var(--terracotta))] mb-2">
                First Deposit Breakdown
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Kuri Amount:</span>
                  <span>${(Number(marketData.kuriAmount) / 1_000_000).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-orange-600">
                  <span>Platform Fee (1%):</span>
                  <span>${(Number(marketData.kuriAmount) / 100_000_000).toFixed(2)}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>${((Number(marketData.kuriAmount) * 1.01) / 1_000_000).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-[hsl(var(--terracotta))] mb-2">
                Required Amount
              </h3>
              <p className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))]">
                ${(Number(marketData.kuriAmount) / 1_000_000).toFixed(2)}
              </p>
            </div>
          )}

          <div className="mt-auto">
            {canDeposit ? (
              <div className="flex flex-col gap-2">
                {getStatusMessage()}
                {renderActionButton()}
              </div>
            ) : (
              <button className="bg-white/20 backdrop-blur-sm text-[hsl(var(--muted-foreground))] border border-white/30 rounded-full px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm cursor-not-allowed">
                <span className="hidden sm:inline">
                  Next deposit window opens in{" "}
                  {daysUntilDeposit > 0 ? `${daysUntilDeposit} days` : "soon"}
                </span>
                <span className="sm:hidden">
                  Opens in{" "}
                  {daysUntilDeposit > 0 ? `${daysUntilDeposit}d` : "soon"}
                </span>
              </button>
            )}
          </div>

          {/* Paid status information */}
          {userPaymentStatus === true && (
            <div className="bg-green-50/10 border border-green-200/20 rounded-lg p-3 text-sm text-green-700">
              {/* <p className="font-medium mb-1">Payment Status:</p> */}
              <p>The raffle will select the winner soon!</p>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm border border-red-400/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Deposit failed: {error}</span>
            </div>
          </div>
        )}

        {/* Insufficient Balance Modal */}
        <InsufficientBalanceModal
          isOpen={showInsufficientBalanceModal}
          onClose={() => setShowInsufficientBalanceModal(false)}
          userBalance={userBalance}
          requiredAmount={requiredAmount}
          onRefreshBalance={handleRefreshBalance}
          isRefreshing={isRefreshingBalance}
        />
      </div>
  );
};
