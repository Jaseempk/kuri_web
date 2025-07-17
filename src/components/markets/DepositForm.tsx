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
    deposit,
    isLoading,
    error,
    isApproving,
    userPaymentStatus,
    userBalance,
    checkUserBalance,
    refreshUserData,
  } = useKuriCore(kuriAddress);

  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] =
    useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);

  console.log("kuriAddress:", kuriAddress);

  const nextDepositTime = new Date(
    Number(marketData.nextIntervalDepositTime) * 1000
  );
  const raffleTime = new Date(Number(marketData.nexRaffleTime) * 1000);
  const now = new Date();
  const canDeposit = now >= nextDepositTime;
  const isAfterRaffle = now >= raffleTime;

  const handleDeposit = async () => {
    if (!kuriAddress) return;

    try {
      // First, check if user has sufficient balance
      const currentBalance = await checkUserBalance();
      const requiredAmount = marketData.kuriAmount;

      if (!hasSufficientBalance(currentBalance, requiredAmount)) {
        setShowInsufficientBalanceModal(true);
        return;
      }

      // If balance is sufficient, proceed with deposit
      await deposit();

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
          <span>Approving Tokens...</span>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Processing Deposit...</span>
        </div>
      );
    }

    return "Make Deposit";
  };

  const getStatusMessage = () => {
    if (!canDeposit) return null;

    // If user has already paid, show paid status
    if (userPaymentStatus === true) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span>Payment completed for this interval</span>
        </div>
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
        <div className="bg-green-600/80 backdrop-blur-sm text-white border border-green-600/30 rounded-full px-4 py-2 font-medium text-xs shadow-lg flex items-center gap-2">
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
        className="bg-[hsl(var(--terracotta))]/80 backdrop-blur-sm text-white border border-[hsl(var(--terracotta))]/30 hover:bg-[hsl(var(--terracotta))] transition-all duration-300 rounded-full px-4 py-2 font-medium text-xs shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {getDepositButtonContent()}
      </button>
    );
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Make Deposit</h2>
      <div className="relative rounded-2xl p-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden min-h-[200px]">
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

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-[hsl(var(--terracotta))] mb-2">
                Required Amount
              </h3>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
                ${(Number(marketData.kuriAmount) / 1_000_000).toFixed(2)}
              </p>
            </div>

            {canDeposit ? (
              <div className="flex flex-col items-end gap-2">
                {getStatusMessage()}
                {renderActionButton()}
              </div>
            ) : (
              <button className="bg-white/20 backdrop-blur-sm text-[hsl(var(--muted-foreground))] border border-white/30 rounded-full px-4 py-2 font-medium text-xs cursor-not-allowed">
                Next deposit window opens in{" "}
                {daysUntilDeposit > 0 ? `${daysUntilDeposit} days` : "soon"}
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
      </div>

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={showInsufficientBalanceModal}
        onClose={() => setShowInsufficientBalanceModal(false)}
        userBalance={userBalance}
        requiredAmount={marketData.kuriAmount}
        onRefreshBalance={handleRefreshBalance}
        isRefreshing={isRefreshingBalance}
      />
    </div>
  );
};
