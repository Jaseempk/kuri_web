import { useQuery } from "@apollo/client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { RAFFLE_WINNERS_QUERY } from "../graphql/queries";
import {
  RaffleWinnersQueryResult,
  RaffleWinnersQueryVariables,
  RaffleWinnerSelected,
} from "../graphql/types";

export interface ProcessedWinner {
  intervalIndex: number;
  winner: string; // Smart wallet address
  timestamp: string;
  originalAddress: string; // Original address before resolution
  winnerIndex: number;
  requestId?: string;
  blockNumber?: string;
  transactionHash?: string;
}

export interface RaffleWinnersHookReturn {
  winners: ProcessedWinner[];
  rawWinners: RaffleWinnerSelected[];
  loading: boolean;
  error: any;
  refetch: () => void;
  currentWinner: ProcessedWinner | null;
  latestWinner: ProcessedWinner | null;
  winnersCount: number;
}

export const useRaffleWinners = (marketAddress: string, nexRaffleTime?: string): RaffleWinnersHookReturn => {

  // State for processed winners
  const [processedWinners, setProcessedWinners] = useState<ProcessedWinner[]>([]);

  const { data, loading, error, refetch } = useQuery<
    RaffleWinnersQueryResult,
    RaffleWinnersQueryVariables
  >(RAFFLE_WINNERS_QUERY, {
    variables: { marketAddress },
    notifyOnNetworkStatusChange: true,
    // No polling - use smart timing instead of constant 15s polling
  });

  // Handle query completion with useEffect instead of deprecated onCompleted
  useEffect(() => {
    // Query completion handling - no logging needed
  }, [data, marketAddress]);

  // Handle query errors with useEffect instead of deprecated onError
  useEffect(() => {
    if (error && process.env.NODE_ENV === 'development') {
      console.error("Raffle winners query error:", error.message);
    }
  }, [error, marketAddress]);

  // Process winners with address resolution
  const processWinners = useCallback(async () => {
    if (!data?.raffleWinnerSelecteds || data.raffleWinnerSelecteds.length === 0) {
      setProcessedWinners([]);
      return;
    }

    try {
      // Process each winner with original smart wallet address
      const processed: ProcessedWinner[] = data.raffleWinnerSelecteds.map((winner) => ({
        intervalIndex: winner.intervalIndex,
        winner: winner.winnerAddress, // Use smart wallet address directly
        timestamp: winner.winnerTimestamp,
        originalAddress: winner.winnerAddress,
        winnerIndex: winner.winnerIndex,
        requestId: winner.requestId,
        blockNumber: winner.blockNumber,
        transactionHash: winner.transactionHash,
      }));

      setProcessedWinners(processed);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Error processing winners:", error);
      }
      setProcessedWinners([]);
    }
  }, [data, marketAddress]);

  // Process winners when data changes
  useEffect(() => {
    processWinners();
  }, [processWinners]);

  // Smart timing: Check for winners at exact raffle time instead of continuous polling
  useEffect(() => {
    if (!nexRaffleTime) return;
    
    const raffleTimestamp = Number(nexRaffleTime) * 1000;
    const now = Date.now();
    
    if (raffleTimestamp > now) {
      // Raffle hasn't happened yet - set timeout to check exactly when it happens
      const timeUntilRaffle = raffleTimestamp - now;
      
      const timeout = setTimeout(() => {
        refetch();
      }, timeUntilRaffle + 30000); // Add 30s buffer for blockchain processing
      
      return () => clearTimeout(timeout);
    } else if (now - raffleTimestamp < 5 * 60 * 1000) {
      // Raffle happened within last 5 minutes - check once for winners
      refetch();
    }
  }, [nexRaffleTime, refetch]);

  // Get current winner (most recent)
  const currentWinner = useMemo(() => {
    if (processedWinners.length === 0) return null;
    
    // Get the winner with highest intervalIndex
    const winner = processedWinners.reduce((latest, current) =>
      current.intervalIndex > latest.intervalIndex ? current : latest
    );

    // Current winner determined from processed winners

    return winner;
  }, [processedWinners, marketAddress]);

  // Get latest winner (same as current winner for now)
  const latestWinner = currentWinner;

  // Hook state tracking - no logging needed

  const hookReturn: RaffleWinnersHookReturn = {
    winners: processedWinners,
    rawWinners: data?.raffleWinnerSelecteds || [],
    loading,
    error,
    refetch,
    currentWinner,
    latestWinner,
    winnersCount: processedWinners.length,
  };

  // Return processed winner data

  return hookReturn;
};