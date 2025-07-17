import { useMemo } from "react";
import { useKuriMarkets, KuriMarket } from "./useKuriMarkets";
import {
  useUserMarketData,
  UseUserMarketDataOptions,
} from "./useUserMarketData";
import { UserMarketData } from "../utils/batchContractCalls";

export interface OptimizedKuriMarket extends KuriMarket {
  userMarketData?: UserMarketData;
}

export interface UseOptimizedMarketsOptions {
  userDataOptions?: UseUserMarketDataOptions;
  includeUserData?: boolean;
}

export interface UseOptimizedMarketsResult {
  markets: OptimizedKuriMarket[];
  loading: boolean;
  error: any;
  userDataLoading: boolean;
  userDataError: Error | null;
  userDataErrors: string[];
  refetch: () => void;
  refetchUserData: () => void;
}

/**
 * Optimized hook that combines market data with user data for efficient rendering
 */
export const useOptimizedMarkets = (
  options: UseOptimizedMarketsOptions = {}
): UseOptimizedMarketsResult => {
  const { userDataOptions = {}, includeUserData = true } = options;

  // Fetch market data (already optimized with batch calls)
  const {
    markets: rawMarkets,
    loading: marketsLoading,
    error: marketsError,
    refetch: refetchMarkets,
  } = useKuriMarkets();

  // Fetch user data for all markets (batched)
  const {
    data: userMarketData,
    isLoading: userDataLoading,
    error: userDataError,
    errors: userDataErrors,
    refetch: refetchUserData,
  } = useUserMarketData(rawMarkets, {
    enabled: includeUserData,
    ...userDataOptions,
  });

  // Combine market data with user data
  const optimizedMarkets = useMemo((): OptimizedKuriMarket[] => {
    return rawMarkets.map((market) => ({
      ...market,
      userMarketData: includeUserData
        ? userMarketData[market.address]
        : undefined,
    }));
  }, [rawMarkets, userMarketData, includeUserData]);

  // Combined refetch function
  const refetch = () => {
    refetchMarkets();
    if (includeUserData) {
      refetchUserData();
    }
  };

  return {
    markets: optimizedMarkets,
    loading: marketsLoading,
    error: marketsError,
    userDataLoading,
    userDataError,
    userDataErrors,
    refetch,
    refetchUserData,
  };
};

/**
 * Hook to get optimized market data for a specific market address
 */
export const useOptimizedMarket = (
  marketAddress: string,
  options: UseOptimizedMarketsOptions = {}
): OptimizedKuriMarket | null => {
  const { markets } = useOptimizedMarkets(options);
  return markets.find((market) => market.address === marketAddress) || null;
};

/**
 * Hook to get markets filtered by user relationship
 */
export const useUserRelatedMarkets = (
  options: UseOptimizedMarketsOptions = {}
): {
  createdMarkets: OptimizedKuriMarket[];
  memberMarkets: OptimizedKuriMarket[];
  appliedMarkets: OptimizedKuriMarket[];
  availableMarkets: OptimizedKuriMarket[];
} => {
  const { markets } = useOptimizedMarkets(options);

  return useMemo(() => {
    const createdMarkets: OptimizedKuriMarket[] = [];
    const memberMarkets: OptimizedKuriMarket[] = [];
    const appliedMarkets: OptimizedKuriMarket[] = [];
    const availableMarkets: OptimizedKuriMarket[] = [];

    markets.forEach((market) => {
      const userData = market.userMarketData;

      if (userData?.isCreator) {
        createdMarkets.push(market);
      } else if (userData?.membershipStatus === 1) {
        // ACCEPTED member
        memberMarkets.push(market);
      } else if (userData?.membershipStatus === 4) {
        // APPLIED member
        appliedMarkets.push(market);
      } else if (market.state === 0 || market.state === 2) {
        // INLAUNCH or ACTIVE markets available for joining
        availableMarkets.push(market);
      }
    });

    return {
      createdMarkets,
      memberMarkets,
      appliedMarkets,
      availableMarkets,
    };
  }, [markets]);
};

/**
 * Hook to get market statistics with user context
 */
export const useMarketStatistics = (
  options: UseOptimizedMarketsOptions = {}
): {
  totalMarkets: number;
  activeMarkets: number;
  userCreatedMarkets: number;
  userMemberMarkets: number;
  totalValueLocked: bigint;
  totalParticipants: number;
} => {
  const { markets } = useOptimizedMarkets(options);

  return useMemo(() => {
    let totalMarkets = 0;
    let activeMarkets = 0;
    let userCreatedMarkets = 0;
    let userMemberMarkets = 0;
    let totalValueLocked = BigInt(0);
    let totalParticipants = 0;

    markets.forEach((market) => {
      totalMarkets++;

      if (market.state === 2) {
        activeMarkets++;
        // Add to TVL for active markets
        totalValueLocked +=
          BigInt(market.kuriAmount) * BigInt(market.activeParticipants);
      }

      totalParticipants += market.activeParticipants;

      const userData = market.userMarketData;
      if (userData?.isCreator) {
        userCreatedMarkets++;
      }
      if (userData?.membershipStatus === 1) {
        userMemberMarkets++;
      }
    });

    return {
      totalMarkets,
      activeMarkets,
      userCreatedMarkets,
      userMemberMarkets,
      totalValueLocked,
      totalParticipants,
    };
  }, [markets]);
};
