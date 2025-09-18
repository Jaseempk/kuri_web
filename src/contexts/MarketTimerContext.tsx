import React, { createContext, useContext, ReactNode, useMemo, useRef } from 'react';
import { useAdaptiveMarketTimers } from '../hooks/useAdaptiveMarketTimers';

// Debounce utility to reduce timer update frequency
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();

  React.useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

interface MarketTimerContextType {
  // Timer data only - isolated from actions
  timeLeft: string;
  raffleTimeLeft: string;
  depositTimeLeft: string;
}

const MarketTimerContext = createContext<MarketTimerContextType | undefined>(undefined);

interface MarketTimerProviderProps {
  children: ReactNode;
  marketData: any; // Market data needed for timers
}

export const MarketTimerProvider: React.FC<MarketTimerProviderProps> = ({
  children,
  marketData,
}) => {
  // Single timer subscription - isolated from main context
  const { timeLeft, raffleTimeLeft, depositTimeLeft } = useAdaptiveMarketTimers(marketData);

  // Debounce timer values to reduce update frequency (2 second delay)
  const debouncedTimeLeft = useDebounce(timeLeft, 2000);
  const debouncedRaffleTimeLeft = useDebounce(raffleTimeLeft, 2000);
  const debouncedDepositTimeLeft = useDebounce(depositTimeLeft, 2000);

  // Memoize timer context value separately with debounced values
  const contextValue: MarketTimerContextType = useMemo(() => ({
    timeLeft: debouncedTimeLeft,
    raffleTimeLeft: debouncedRaffleTimeLeft,
    depositTimeLeft: debouncedDepositTimeLeft,
  }), [debouncedTimeLeft, debouncedRaffleTimeLeft, debouncedDepositTimeLeft]);

  return (
    <MarketTimerContext.Provider value={contextValue}>
      {children}
    </MarketTimerContext.Provider>
  );
};

export const useMarketTimerContext = (): MarketTimerContextType => {
  const context = useContext(MarketTimerContext);
  if (context === undefined) {
    throw new Error('useMarketTimerContext must be used within a MarketTimerProvider');
  }
  return context;
};