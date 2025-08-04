import { useState, useEffect, useMemo } from "react";
import { KuriState } from "./contracts/useKuriCore";

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
  intervalType: number;
  state: KuriState;
}

export function useMarketTimers(marketData: KuriData | null) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [raffleTimeLeft, setRaffleTimeLeft] = useState<string>("");
  const [depositTimeLeft, setDepositTimeLeft] = useState<string>("");

  // Calculate launch end time
  const launchEndTime = useMemo(() => {
    if (!marketData) return 0;
    return Number(marketData.launchPeriod) * 1000;
  }, [marketData]);

  useEffect(() => {
    if (!marketData) return;

    let timer: NodeJS.Timeout;

    const updateTimers = () => {
      const now = Date.now();

      // Handle INLAUNCH countdown (existing logic)
      if (marketData.state === KuriState.INLAUNCH) {
        const end = launchEndTime;
        const diff = end - now;

        if (diff <= 0) {
          setTimeLeft("Launch period ended");
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }

      // Handle ACTIVE market countdowns (new logic)
      if (marketData.state === KuriState.ACTIVE) {
        // Raffle countdown
        const raffleEnd = Number(marketData.nexRaffleTime) * 1000;
        const raffleDiff = raffleEnd - now;

        if (raffleDiff <= 0) {
          setRaffleTimeLeft("Raffle due now");
        } else {
          const days = Math.floor(raffleDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (raffleDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (raffleDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((raffleDiff % (1000 * 60)) / 1000);

          if (days > 0) {
            setRaffleTimeLeft(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setRaffleTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          } else {
            setRaffleTimeLeft(`${minutes}m ${seconds}s`);
          }
        }

        // Deposit countdown
        const depositEnd = Number(marketData.nextIntervalDepositTime) * 1000;
        const depositDiff = depositEnd - now;

        if (depositDiff <= 0) {
          setDepositTimeLeft("Payment due now");
        } else {
          const days = Math.floor(depositDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (depositDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (depositDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((depositDiff % (1000 * 60)) / 1000);

          if (days > 0) {
            setDepositTimeLeft(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setDepositTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          } else {
            setDepositTimeLeft(`${minutes}m ${seconds}s`);
          }
        }
      }
    };

    // Run timer for both INLAUNCH and ACTIVE states
    if (
      marketData.state === KuriState.INLAUNCH ||
      marketData.state === KuriState.ACTIVE
    ) {
      timer = setInterval(updateTimers, 1000);
      updateTimers(); // Initial update
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [marketData, launchEndTime]);

  return {
    timeLeft,
    raffleTimeLeft,
    depositTimeLeft
  };
}