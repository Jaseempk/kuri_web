import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useAdaptiveMarketTimers } from '../hooks/useAdaptiveMarketTimers';

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

  // Memoize timer context value separately
  const contextValue: MarketTimerContextType = useMemo(() => ({
    timeLeft,
    raffleTimeLeft,
    depositTimeLeft,
  }), [timeLeft, raffleTimeLeft, depositTimeLeft]);

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