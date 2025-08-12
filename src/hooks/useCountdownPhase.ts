import { useState, useEffect, useMemo } from "react";

export type CountdownPhase = "deposit" | "raffle" | "transition";

export interface PhaseInfo {
  phase: CountdownPhase;
  activeTimestamp: number;
  nextPhase: CountdownPhase | null;
  phaseDescription: string;
  isTransitioning: boolean;
}

export const useCountdownPhase = (
  depositTimestamp: number,
  raffleTimestamp: number
): PhaseInfo => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const phaseInfo = useMemo((): PhaseInfo => {
    const now = currentTime;

    // Phase 1: Deposit period active
    if (now < depositTimestamp) {
      return {
        phase: "deposit",
        activeTimestamp: depositTimestamp,
        nextPhase: "raffle",
        phaseDescription: "Members can make their deposits now",
        isTransitioning: false,
      };
    }

    // Phase 2: Raffle period active (deposit window closed, waiting for raffle)
    if (now >= depositTimestamp && now < raffleTimestamp) {
      return {
        phase: "raffle",
        activeTimestamp: raffleTimestamp,
        nextPhase: "deposit", // Will transition to next deposit cycle
        phaseDescription: "Waiting for raffle to select winner",
        isTransitioning: false,
      };
    }

    // Phase 3: Transition period (raffle completed, waiting for next cycle)
    return {
      phase: "transition",
      activeTimestamp: raffleTimestamp, // Show the passed raffle time
      nextPhase: null, // Depends on contract state update
      phaseDescription: "Raffle completed, next cycle starting soon",
      isTransitioning: true,
    };
  }, [currentTime, depositTimestamp, raffleTimestamp]);

  return phaseInfo;
};

// Helper function to determine if we should show a countdown
export const shouldShowCountdown = (phaseInfo: PhaseInfo): boolean => {
  return phaseInfo.phase !== "transition";
};

// Helper function to get countdown title based on phase
export const getCountdownTitle = (phase: CountdownPhase): string => {
  switch (phase) {
    case "deposit":
      return "Next Deposit In:";
    case "raffle":
      return "Next Raffle";
    case "transition":
      return "Cycle Complete";
  }
};

// Helper function to get countdown accent color
export const getCountdownAccentColor = (
  phase: CountdownPhase
): "forest" | "ochre" | "terracotta" => {
  switch (phase) {
    case "deposit":
      return "ochre";
    case "raffle":
      return "forest";
    case "transition":
      return "terracotta";
  }
};
