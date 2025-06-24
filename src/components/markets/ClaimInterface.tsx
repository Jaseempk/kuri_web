import { useState } from "react";
import {
  useKuriCore,
  KuriState,
  IntervalType,
} from "../../hooks/contracts/useKuriCore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { TransactionLoading, ErrorMessage } from "../ui/loading-states";
import { handleContractError } from "../../utils/errors";
import { Gift, AlertTriangle, XCircle, Clock, Trophy } from "lucide-react";

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
}

export const ClaimInterface: React.FC<ClaimInterfaceProps> = ({
  marketData,
  kuriAddress,
}) => {
  const { claimKuriAmount, isLoading, error } = useKuriCore(kuriAddress);
  const [currentInterval, setCurrentInterval] = useState(0);

  const handleClaim = async () => {
    if (!kuriAddress) return;

    try {
      await claimKuriAmount(currentInterval);
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
      <h2 className="text-xl font-semibold mb-4">Claim Winnings</h2>
      <div className="relative rounded-2xl p-8 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden min-h-[200px]">
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

        <div className="relative z-10 flex items-end justify-between h-full">
          <div>
            <h3 className="text-lg font-medium text-[hsl(var(--forest))] mb-2 font-semibold">
              Claimable Amount
            </h3>
            <p className="text-4xl font-bold text-[hsl(var(--foreground))]">
              ${potentialWinnings.toFixed(2)}
            </p>
          </div>

          {canClaim && isRaffleDue ? (
            <button
              onClick={handleClaim}
              disabled={isLoading}
              className="bg-[hsl(var(--forest))]/80 backdrop-blur-sm text-white border border-[hsl(var(--forest))]/30 hover:bg-[hsl(var(--forest))] transition-all duration-300 rounded-full px-4 py-2 font-medium text-sm shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Checking..." : "Claim winnings"}
            </button>
          ) : (
            <button className="bg-white/20 backdrop-blur-sm text-[hsl(var(--muted-foreground))] border border-white/30 rounded-full px-4 py-2 font-medium text-sm cursor-not-allowed">
              {!canClaim
                ? "Circle not active"
                : `Next raffle in ${
                    daysUntilRaffle > 0 ? `${daysUntilRaffle} days` : "soon"
                  }`}
            </button>
          )}
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
