import { useState, useEffect } from "react";
import {
  useKuriCore,
  KuriState,
  IntervalType,
} from "../../hooks/contracts/useKuriCore";

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
  const { claimKuriAmount, isLoading, error, checkPaymentStatusIfMember } =
    useKuriCore(kuriAddress);
  const [currentInterval] = useState(0);

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

    try {
      await claimKuriAmount(currentInterval);
      onClaimSuccess?.();
    } catch (err) {
      console.error("Claim failed:", err);
    }
  };

  const canClaim = marketData.state === KuriState.ACTIVE;
  const nextRaffleTime = new Date(Number(marketData.nexRaffleTime) * 1000);
  const now = new Date();
  const isRaffleDue = nextRaffleTime <= now;

  // Calculate potential winnings (full pool amount)
  const potentialWinnings =
    (Number(marketData.kuriAmount) / 1_000_000) *
    marketData.totalParticipantsCount;

  // Calculate days until next raffle
  const daysUntilRaffle = Math.ceil(
    (nextRaffleTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
        Claim Winnings
      </h2>
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

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 h-full">
          <div className="flex-1">
            <h3 className="text-lg text-[hsl(var(--forest))] mb-2 font-semibold">
              Claimable Amount
            </h3>
            <p className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))]">
              ${potentialWinnings.toFixed(2)}
            </p>
          </div>

          <div className="sm:flex-shrink-0">
            {canClaim && isRaffleDue ? (
              <button
                onClick={handleClaim}
                disabled={isLoading}
                className="bg-[hsl(var(--forest))]/80 backdrop-blur-sm text-white border border-[hsl(var(--forest))]/30 hover:bg-[hsl(var(--forest))] transition-all duration-300 rounded-full px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <span className="hidden sm:inline">Checking...</span>
                    <span className="sm:hidden">Checking...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Claim winnings</span>
                    <span className="sm:hidden">Claim</span>
                  </>
                )}
              </button>
            ) : (
              <button className="bg-white/20 backdrop-blur-sm text-[hsl(var(--muted-foreground))] border border-white/30 rounded-full px-3 sm:px-4 py-2 font-medium text-xs sm:text-sm cursor-not-allowed">
                {!canClaim ? (
                  <>
                    <span className="hidden sm:inline">Circle not active</span>
                    <span className="sm:hidden">Not active</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">
                      Next raffle in{" "}
                      {daysUntilRaffle > 0 ? `${daysUntilRaffle} days` : "soon"}
                    </span>
                    <span className="sm:hidden">
                      Raffle in{" "}
                      {daysUntilRaffle > 0 ? `${daysUntilRaffle}d` : "soon"}
                    </span>
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
    </div>
  );
};
