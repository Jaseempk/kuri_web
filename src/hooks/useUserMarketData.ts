import { useQuery } from "@tanstack/react-query";
import { useOptimizedAuth } from "./useOptimizedAuth";
import { KuriMarket } from "./useKuriMarkets";
import {
  batchUserMarketData,
  filterRelevantMarkets,
  UserMarketData,
  BatchUserDataResult,
} from "../utils/batchContractCalls";

export interface UseUserMarketDataOptions {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchInterval?: number;
  includePaymentStatus?: boolean;
}

export interface UseUserMarketDataResult {
  data: Record<string, UserMarketData>;
  isLoading: boolean;
  error: Error | null;
  errors: string[];
  refetch: () => void;
}

/**
 * Hook to fetch user-specific data for multiple markets with batching and caching
 */
export const useUserMarketData = (
  markets: KuriMarket[],
  options: UseUserMarketDataOptions = {}
): UseUserMarketDataResult => {
  const { smartAddress } = useOptimizedAuth();

  const {
    enabled = true,
    staleTime = 30000, // 30 seconds
    gcTime = 300000, // 5 minutes (replaces cacheTime in React Query v5)
    refetchInterval = false,
    includePaymentStatus = true,
  } = options;

  // Filter markets where user data is relevant
  const relevantMarkets = filterRelevantMarkets(
    markets.map((m) => ({
      address: m.address,
      creator: m.creator,
      state: m.state,
    })),
    smartAddress || ""
  );

  const queryResult = useQuery<BatchUserDataResult, Error>({
    queryKey: [
      "userMarketData",
      smartAddress,
      relevantMarkets.map((m) => m.address).sort(),
      includePaymentStatus,
    ],
    queryFn: async (): Promise<BatchUserDataResult> => {
      if (!smartAddress || relevantMarkets.length === 0) {
        return { data: {}, errors: [] };
      }

      // Extract addresses, states, and creators for batch call
      const marketAddresses = relevantMarkets.map((m) => m.address);
      const marketStates = relevantMarkets.map((m) => m.state);
      const marketCreators = relevantMarkets.map((m) => m.creator);

      const result = await batchUserMarketData(
        marketAddresses,
        smartAddress,
        marketStates,
        marketCreators,
        includePaymentStatus
      );

      return result;
    },
    enabled: enabled && !!smartAddress && relevantMarkets.length > 0,
    staleTime,
    gcTime,
    refetchInterval,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    data: queryResult.data?.data || {},
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    errors: queryResult.data?.errors || [],
    refetch: queryResult.refetch,
  };
};

/**
 * Hook to get user data for a specific market
 */
export const useUserMarketDataForMarket = (
  market: KuriMarket,
  options: UseUserMarketDataOptions = {}
): UserMarketData | null => {
  const { data } = useUserMarketData([market], options);
  return data[market.address] || null;
};

/**
 * Hook to check if user has relevant data for any markets
 */
export const useHasUserMarketData = (markets: KuriMarket[]): boolean => {
  const { smartAddress } = useOptimizedAuth();

  if (!smartAddress) return false;

  const relevantMarkets = filterRelevantMarkets(
    markets.map((m) => ({
      address: m.address,
      creator: m.creator,
      state: m.state,
    })),
    smartAddress
  );

  return relevantMarkets.length > 0;
};

/**
 * Hook to invalidate user market data cache
 */
export const useInvalidateUserMarketData = () => {
  return {
    invalidateAll: () => {
      // This would be implemented with React Query's invalidateQueries
      // For now, we'll implement a simple refetch mechanism
      console.log("Invalidating user market data cache");
    },
    invalidateMarket: (marketAddress: string) => {
      console.log(`Invalidating user data for market: ${marketAddress}`);
    },
  };
};
