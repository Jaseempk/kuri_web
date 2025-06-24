import { useState } from "react";
import {
  useKuriCore,
  KuriState,
  IntervalType,
} from "../../hooks/contracts/useKuriCore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatEther } from "viem";
import { TransactionLoading, ErrorMessage } from "../ui/loading-states";
import { handleContractError } from "../../utils/errors";
import { DollarSign, AlertCircle, Clock, ArrowRight } from "lucide-react";

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
  const { deposit, isLoading, error } = useKuriCore(kuriAddress);

  const nextDepositTime = new Date(
    Number(marketData.nextIntervalDepositTime) * 1000
  );
  const now = new Date();
  const canDeposit = now >= nextDepositTime;

  const handleDeposit = async () => {
    if (!kuriAddress) return;

    try {
      await deposit();
    } catch (err) {
      console.error("Deposit failed:", err);
    }
  };

  // Calculate days until next deposit window
  const daysUntilDeposit = Math.ceil(
    (nextDepositTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

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

        <div className="relative z-10 flex items-center justify-between h-full">
          <div>
            <h3 className="text-lg font-medium text-[hsl(var(--terracotta))] mb-2 font-semibold">
              Required Amount
            </h3>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              ${(Number(marketData.kuriAmount) / 1_000_000).toFixed(2)}
            </p>
          </div>

          {canDeposit ? (
            <button
              onClick={handleDeposit}
              disabled={isLoading}
              className="bg-[hsl(var(--terracotta))]/80 backdrop-blur-sm text-white border border-[hsl(var(--terracotta))]/30 hover:bg-[hsl(var(--terracotta))] transition-all duration-300 rounded-full px-4 py-2 font-medium text-xs shadow-lg hover:shadow-xl"
            >
              {isLoading ? "Processing..." : "Make Deposit"}
            </button>
          ) : (
            <button className="bg-white/20 backdrop-blur-sm text-[hsl(var(--muted-foreground))] border border-white/30 rounded-full px-4 py-2 font-medium text-xs cursor-not-allowed">
              Next deposit window opens in{" "}
              {daysUntilDeposit > 0 ? `${daysUntilDeposit} days` : "soon"}
            </button>
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
    </div>
  );
};
