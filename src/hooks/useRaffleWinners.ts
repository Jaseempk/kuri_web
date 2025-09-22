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

export const useRaffleWinners = (marketAddress: string): RaffleWinnersHookReturn => {
  console.log("🏆 RAFFLE WINNERS HOOK INITIALIZATION:", {
    marketAddress,
    hookName: "useRaffleWinners",
    timestamp: new Date().toISOString(),
  });

  // State for processed winners
  const [processedWinners, setProcessedWinners] = useState<ProcessedWinner[]>([]);

  const { data, loading, error, refetch } = useQuery<
    RaffleWinnersQueryResult,
    RaffleWinnersQueryVariables
  >(RAFFLE_WINNERS_QUERY, {
    variables: { marketAddress },
    notifyOnNetworkStatusChange: true,
    // Enable polling for real-time updates
    pollInterval: 15000, // Poll every 15 seconds
  });

  // Handle query completion with useEffect instead of deprecated onCompleted
  useEffect(() => {
    if (data) {
      console.log("✅ RAFFLE WINNERS QUERY COMPLETED:", {
        marketAddress,
        timestamp: new Date().toISOString(),
        hasData: !!data,
        winnersCount: data?.raffleWinnerSelecteds?.length || 0,
        rawWinners: data?.raffleWinnerSelecteds || [],
      });

      // Detailed logging of each winner
      if (data?.raffleWinnerSelecteds && data.raffleWinnerSelecteds.length > 0) {
        console.log("🏅 DETAILED RAFFLE WINNERS FROM SUBGRAPH:", {
          totalWinners: data.raffleWinnerSelecteds.length,
          marketAddress,
          winners: data.raffleWinnerSelecteds.map((winner, index) => ({
            index,
            id: winner.id,
            intervalIndex: winner.intervalIndex,
            winnerIndex: winner.winnerIndex,
            winnerAddress: winner.winnerAddress,
            winnerTimestamp: winner.winnerTimestamp,
            winnerTimestampFormatted: new Date(Number(winner.winnerTimestamp) * 1000).toISOString(),
            requestId: winner.requestId,
            contractAddress: winner.contractAddress,
            blockNumber: winner.blockNumber,
            blockTimestamp: winner.blockTimestamp,
            transactionHash: winner.transactionHash,
          })),
        });
      } else {
        console.log("❌ NO RAFFLE WINNERS FOUND IN SUBGRAPH:", {
          raffleWinnerSelecteds: data?.raffleWinnerSelecteds,
          isArray: Array.isArray(data?.raffleWinnerSelecteds),
          length: data?.raffleWinnerSelecteds?.length,
          marketAddress,
          rawData: data,
        });
      }
    }
  }, [data, marketAddress]);

  // Handle query errors with useEffect instead of deprecated onError
  useEffect(() => {
    if (error) {
      console.error("❌ RAFFLE WINNERS QUERY ERROR:", {
        marketAddress,
        timestamp: new Date().toISOString(),
        error: error.message,
        networkError: error.networkError,
        graphQLErrors: error.graphQLErrors,
        fullError: error,
      });
    }
  }, [error, marketAddress]);

  // Process winners with address resolution
  const processWinners = useCallback(async () => {
    if (!data?.raffleWinnerSelecteds || data.raffleWinnerSelecteds.length === 0) {
      console.log("🔄 No winners to process");
      setProcessedWinners([]);
      return;
    }

    console.log("🔄 PROCESSING RAFFLE WINNERS:", {
      winnersToProcess: data.raffleWinnerSelecteds.length,
      marketAddress,
    });

    try {
      // Process each winner with original smart wallet address
      const processed: ProcessedWinner[] = data.raffleWinnerSelecteds.map((winner) => {
        console.log("🏆 Processing individual winner:", {
          winnerAddress: winner.winnerAddress,
          intervalIndex: winner.intervalIndex,
          timestamp: winner.winnerTimestamp,
          winnerTimestampFormatted: new Date(Number(winner.winnerTimestamp) * 1000).toISOString(),
        });

        return {
          intervalIndex: winner.intervalIndex,
          winner: winner.winnerAddress, // Use smart wallet address directly
          timestamp: winner.winnerTimestamp,
          originalAddress: winner.winnerAddress,
          winnerIndex: winner.winnerIndex,
          requestId: winner.requestId,
          blockNumber: winner.blockNumber,
          transactionHash: winner.transactionHash,
        };
      });

      console.log("✅ WINNERS PROCESSING COMPLETED:", {
        processedCount: processed.length,
        processedWinners: processed,
        marketAddress,
      });

      setProcessedWinners(processed);
    } catch (error) {
      console.error("❌ ERROR PROCESSING WINNERS:", {
        error,
        marketAddress,
        winnersCount: data.raffleWinnerSelecteds.length,
      });
      setProcessedWinners([]);
    }
  }, [data, marketAddress]);

  // Process winners when data changes
  useEffect(() => {
    processWinners();
  }, [processWinners]);

  // Get current winner (most recent)
  const currentWinner = useMemo(() => {
    if (processedWinners.length === 0) return null;
    
    // Get the winner with highest intervalIndex
    const winner = processedWinners.reduce((latest, current) =>
      current.intervalIndex > latest.intervalIndex ? current : latest
    );

    console.log("🎯 CURRENT WINNER DETERMINED:", {
      winner,
      totalWinners: processedWinners.length,
      marketAddress,
    });

    return winner;
  }, [processedWinners, marketAddress]);

  // Get latest winner (same as current winner for now)
  const latestWinner = currentWinner;

  // Log hook state changes
  console.log("🔄 RAFFLE WINNERS HOOK STATE:", {
    marketAddress,
    loading,
    hasError: !!error,
    errorMessage: error?.message,
    winnersCount: processedWinners.length,
    hasCurrentWinner: !!currentWinner,
    currentWinnerInterval: currentWinner?.intervalIndex,
    timestamp: new Date().toISOString(),
  });

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

  console.log("🎯 RAFFLE WINNERS HOOK RETURN:", {
    marketAddress,
    winnersCount: hookReturn.winnersCount,
    hasCurrentWinner: !!hookReturn.currentWinner,
    currentWinnerAddress: hookReturn.currentWinner?.winner,
    currentWinnerInterval: hookReturn.currentWinner?.intervalIndex,
    loading: hookReturn.loading,
    hasError: !!hookReturn.error,
    timestamp: new Date().toISOString(),
  });

  return hookReturn;
};