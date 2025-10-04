import { useState, useEffect } from "react";
import { KuriState, IntervalType } from "../../hooks/contracts/useKuriCore";
import { useMarketContext } from "../../contexts/MarketContext";
import { useAuthContext } from "../../contexts/AuthContext";

import { AlertTriangle } from "lucide-react";

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

interface ClaimInterfaceProps {
  marketData: KuriData;
  kuriAddress: `0x${string}`;
  onClaimSuccess?: () => void;
}

export const ClaimInterface: React.FC<ClaimInterfaceProps> = ({
  marketData,
  kuriAddress,
  onClaimSuccess,
}) => {
  // Use consolidated MarketContext instead of direct useKuriCore call
  const {
    claimKuriAmountSponsored,
    isLoadingCore,
    errorCore,
    checkPaymentStatusIfMember,
    currentWinner,
  } = useMarketContext();

  const { smartAddress: userAddress } = useAuthContext();
  
  const isLoading = isLoadingCore;
  const error = errorCore;
  
  // 🚀 FIXED: Use winner's interval index instead of hardcoded 0
  const claimInterval = currentWinner?.intervalIndex || 0;
  
  console.log("🎯 CLAIM INTERVAL DEBUG:", {
    currentWinner,
    winnerIntervalIndex: currentWinner?.intervalIndex,
    claimInterval,
  });

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

  const handleClaim = async () => {
    if (!kuriAddress) return;

    console.log("🚀 ATTEMPTING CLAIM:", {
      kuriAddress,
      claimInterval,
      currentWinner,
      userAddress,
    });

    try {
      await claimKuriAmountSponsored(claimInterval);
      console.log("✅ CLAIM SUCCESS:", { claimInterval });
      onClaimSuccess?.();
    } catch (err) {
      console.error("❌ CLAIM FAILED:", err);
    }
  };

  // 🚀 FIXED: Winner-based claim logic instead of raffle timing
  const canClaim = marketData.state === KuriState.ACTIVE;
  const isCurrentUserWinner = !!(currentWinner && userAddress && 
    currentWinner.winner.toLowerCase() === userAddress.toLowerCase());
  
  console.log("🎯 CLAIM INTERFACE LOGIC:", {
    canClaim,
    marketState: marketData.state,
    kuriStateActive: KuriState.ACTIVE,
    hasCurrentWinner: !!currentWinner,
    currentWinnerAddress: currentWinner?.winner,
    userAddress,
    isCurrentUserWinner,
    canClaimFinal: canClaim && isCurrentUserWinner,
  });

  // Calculate potential winnings (full pool amount)
  const potentialWinnings =
    (Number(marketData.kuriAmount) / 1_000_000) *
    marketData.totalParticipantsCount;

  return (
    <div className="relative rounded-2xl p-4 sm:p-6 md:p-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden min-h-[160px] sm:min-h-[200px]">
      {/* Gradient overlay for subtle color hint */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--forest))]/20 to-[hsl(var(--forest))]/10 rounded-2xl" />

      {/* Dotted texture overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(64,109,88,0.4) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="mb-4">
          <h3 className="text-lg text-[hsl(var(--forest))] mb-2 font-semibold">
            Claimable Amount
          </h3>
          <p className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">
            ${potentialWinnings.toFixed(2)}
          </p>
        </div>

        <div className="mt-auto">
          {canClaim && isCurrentUserWinner ? (
            <button
              type="button"
              onClick={handleClaim}
              disabled={isLoading}
              className="bg-[hsl(var(--forest))]/80 backdrop-blur-sm text-white border border-[hsl(var(--forest))]/30 hover:bg-[hsl(var(--forest))] transition-all duration-300 rounded-full px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <span className="hidden sm:inline">Claiming...</span>
                  <span className="sm:hidden">Claiming...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">🎉 Claim Your Winnings</span>
                  <span className="sm:hidden">🎉 Claim</span>
                </>
              )}
            </button>
          ) : (
            <button type="button" className="bg-white/20 backdrop-blur-sm text-[hsl(var(--muted-foreground))] border border-white/30 rounded-full px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm cursor-not-allowed">
              {!canClaim ? (
                <>
                  <span className="hidden sm:inline">Circle not active</span>
                  <span className="sm:hidden">Not active</span>
                </>
              ) : !isCurrentUserWinner ? (
                <>
                  <span className="hidden sm:inline">You are not the winner</span>
                  <span className="sm:hidden">Not winner</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Unable to claim</span>
                  <span className="sm:hidden">Can't claim</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-4 left-4 right-4 bg-red-500/90 backdrop-blur-sm rounded-lg p-3 text-white text-sm border border-red-400/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Claim failed: {error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
