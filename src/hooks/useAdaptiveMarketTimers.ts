import { useState, useEffect, useMemo, useRef } from "react";
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

// Static Timer Pattern: Fetch once, countdown forever with pure math
// This is how Netflix, YouTube, etc. handle countdowns

export function useAdaptiveMarketTimers(marketData: KuriData | null) {
  console.log(`⏰ useAdaptiveMarketTimers called with marketData:`, marketData?.state, marketData?.creator);
  
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [raffleTimeLeft, setRaffleTimeLeft] = useState<string>("");
  const [depositTimeLeft, setDepositTimeLeft] = useState<string>("");

  // Single timer reference - only thing we need!
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Static timestamps - captured once on mount, never change
  const staticTimestampsRef = useRef<{
    launch: number;
    raffle: number;
    depositStart: number;
    depositEnd: number;
    capturedAt: number;  // When we captured the blockchain data
  } | null>(null);
  
  // Performance tracking
  const updateCountRef = useRef(0);
  
  // Ref to track current market state for timer updates
  const marketStateRef = useRef<KuriState | null>(null);
  
  // Memoize market data key properties to prevent unnecessary re-renders
  const marketDataKey = useMemo(() => {
    if (!marketData) return null;
    return {
      state: marketData.state,
      launchPeriod: marketData.launchPeriod.toString(),
      nexRaffleTime: marketData.nexRaffleTime.toString(),
      nextIntervalDepositTime: marketData.nextIntervalDepositTime.toString(),
    };
  }, [
    marketData?.state,
    marketData?.launchPeriod?.toString(),
    marketData?.nexRaffleTime?.toString(),
    marketData?.nextIntervalDepositTime?.toString(),
  ]);

  // Format time difference to human readable string
  const formatTimeLeft = (diff: number): string => {
    if (diff <= 0) return "0s";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    console.log(`⏰ useAdaptiveMarketTimers useEffect triggered. marketDataKey:`, marketDataKey);
    
    if (!marketData || !marketDataKey) {
      console.warn(`⏰ No marketData provided to useAdaptiveMarketTimers - timers will remain empty`);
      return;
    }

    console.log(`🎯 STATIC TIMER: Capturing blockchain data once for ${KuriState[marketData.state]} state`);

    // Update the market state ref
    marketStateRef.current = marketData.state;

    // 🔒 CAPTURE STATIC TIMESTAMPS - These never change until page refresh!
    const captureTime = Date.now();
    const depositPeriodStart = Number(marketData.nextIntervalDepositTime) * 1000;
    const depositPeriodEnd = depositPeriodStart + (3 * 24 * 60 * 60 * 1000); // +3 days
    
    staticTimestampsRef.current = {
      launch: Number(marketData.launchPeriod) * 1000,
      raffle: Number(marketData.nexRaffleTime) * 1000,
      depositStart: depositPeriodStart,
      depositEnd: depositPeriodEnd,
      capturedAt: captureTime
    };

    console.log(`   • Launch End: ${new Date(staticTimestampsRef.current.launch).toLocaleString()}`);
    console.log(`   • Raffle Time: ${new Date(staticTimestampsRef.current.raffle).toLocaleString()}`);  
    console.log(`   • Deposit Start: ${new Date(staticTimestampsRef.current.depositStart).toLocaleString()}`);
    console.log(`   • Deposit End: ${new Date(staticTimestampsRef.current.depositEnd).toLocaleString()}`);
    console.log(`   • 🔥 ZERO API calls from now until page refresh!`);

    // ⚡ PURE MATH COUNTDOWN - No external dependencies!
    const updateCountdown = () => {
      const now = Date.now();
      updateCountRef.current += 1;

      if (!staticTimestampsRef.current || !marketStateRef.current) return;

      // INLAUNCH countdown (using captured launch time)
      if (marketStateRef.current === KuriState.INLAUNCH) {
        const remainingMs = staticTimestampsRef.current.launch - now;
        const newTimeLeft = remainingMs <= 0 ? "Launch period ended" : formatTimeLeft(remainingMs);
        
        if (timeLeft !== newTimeLeft) {
          setTimeLeft(newTimeLeft);
          
          // Light logging every 10 updates
          if (updateCountRef.current % 10 === 0) {
            console.log(`⚡ STATIC UPDATE #${updateCountRef.current}: ${newTimeLeft} (pure math, zero API calls)`);
          }
        }
      }

      // ACTIVE state countdowns (using captured times)
      if (marketStateRef.current === KuriState.ACTIVE) {
        // Raffle countdown
        const raffleRemainingMs = staticTimestampsRef.current.raffle - now;
        const newRaffleTimeLeft = raffleRemainingMs <= 0 ? "Raffle due now" : formatTimeLeft(raffleRemainingMs);
        
        if (raffleTimeLeft !== newRaffleTimeLeft) {
          setRaffleTimeLeft(newRaffleTimeLeft);
        }

        // Deposit countdown - use depositEnd (3 days after depositStart)
        const depositRemainingMs = staticTimestampsRef.current.depositEnd - now;
        const newDepositTimeLeft = depositRemainingMs <= 0 ? "Payment due now" : formatTimeLeft(depositRemainingMs);
        
        if (depositTimeLeft !== newDepositTimeLeft) {
          setDepositTimeLeft(newDepositTimeLeft);
        }
      }
    };

    // 🚀 START SINGLE TIMER - Only thing running!
    if (
      marketData.state === KuriState.INLAUNCH ||
      marketData.state === KuriState.ACTIVE
    ) {
      timerRef.current = setInterval(updateCountdown, 1000);
      updateCountdown(); // Initial update
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      console.log(`🎯 STATIC TIMER CLEANUP:`);
      console.log(`   • Total Updates: ${updateCountRef.current}`);
      console.log(`   • API Calls: 0 (after initial data capture)`);
      console.log(`   • Performance: ⚡ MAXIMUM (pure math)`);
      console.log(`   • CPU Usage: 📉 MINIMAL (single 1s timer)`);
    };
  }, [marketDataKey]); // Only depend on stable memoized key - removes infinite loop

  // Separate effect to update market state ref when state changes
  useEffect(() => {
    if (marketData?.state !== undefined) {
      marketStateRef.current = marketData.state;
    }
  }, [marketData?.state]);

  return useMemo(() => ({
    timeLeft,
    raffleTimeLeft,
    depositTimeLeft,
    // Performance metrics for debugging
    performance: {
      updateCount: updateCountRef.current,
      apiCalls: 0, // Zero API calls after initial capture!
      pattern: "static",
      efficiency: "maximum"
    }
  }), [timeLeft, raffleTimeLeft, depositTimeLeft]);
}