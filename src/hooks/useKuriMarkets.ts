import { useQuery } from "@apollo/client";
import { KURI_MARKETS_QUERY } from "../graphql/queries";
import { KuriMarketsQueryResult, KuriState } from "../graphql/types";
import { useMemo } from "react";
import { useMultipleKuriData } from "./useKuriData";
import { useQuery as useTanstackQuery } from "@tanstack/react-query";
import { transformV1KuriInitialised } from "../utils/v1DataTransform";
import { apiClient } from "../lib/apiClient";

export interface KuriMarket {
  address: string;
  creator: string;
  kuriAmount: string;
  totalParticipants: number;
  activeParticipants: number;
  intervalType: number;
  state: KuriState;
  nextDepositTime: string;
  nextRaffleTime: string;
  createdAt: string;
  name: string;
  nextDraw: string;
  launchPeriod: string;
  startTime: string;
  endTime: string;
}

export const useKuriMarkets = () => {
  const {
    data: subgraphData,
    loading: subgraphLoading,
    error: subgraphError,
    refetch,
  } = useQuery<KuriMarketsQueryResult>(KURI_MARKETS_QUERY, {
    errorPolicy: "all",
    fetchPolicy: "cache-and-network",
  });

  // Get market addresses
  const marketAddresses = useMemo(() => {
    return (
      subgraphData?.kuriMarketDeployeds.map(
        (m) => m.marketAddress as `0x${string}`
      ) ?? []
    );
  }, [subgraphData]);

  // Fetch metadata for all markets to filter out spam
  const { data: validMarketAddresses } = useTanstackQuery({
    queryKey: ["valid-market-addresses", marketAddresses],
    queryFn: async () => {
      if (marketAddresses.length === 0) return [];

      try {
        const validAddresses = await apiClient.validateMarketAddresses(marketAddresses);
        return validAddresses.map((addr) => addr.toLowerCase());
      } catch (error) {
        console.error("Error fetching valid market addresses:", error);
        return [];
      }
    },
    enabled: marketAddresses.length > 0,
    staleTime: 30 * 60 * 1000, // 30 minutes - backend caches this
    refetchOnWindowFocus: false,
  });

  // Filter market addresses to only include those with metadata
  const filteredMarketAddresses = useMemo(() => {
    if (!validMarketAddresses) return [];
    return marketAddresses.filter((addr) =>
      validMarketAddresses.includes(addr.toLowerCase())
    );
  }, [marketAddresses, validMarketAddresses]);

  // Fetch kuriData for filtered markets only
  const {
    data: kuriDataResults,
    isLoading: kuriDataLoading,
    error: kuriDataError,
  } = useMultipleKuriData(filteredMarketAddresses);

  const markets = useMemo(() => {
    if (!subgraphData || !kuriDataResults || !validMarketAddresses) return [];

    // Filter to only include markets with valid metadata
    const filteredDeployed = subgraphData.kuriMarketDeployeds.filter(
      (deployed) =>
        validMarketAddresses.includes(deployed.marketAddress.toLowerCase())
    );

    return filteredDeployed.map((deployed): KuriMarket => {
      // Find the corresponding kuriData by matching addresses
      const kuriDataIndex = filteredMarketAddresses.findIndex(
        (addr) => addr.toLowerCase() === deployed.marketAddress.toLowerCase()
      );
      const kuriData = kuriDataResults[kuriDataIndex];

      // Find corresponding initialized data from V1 GraphQL
      const initializedData = subgraphData.kuriInitialiseds.find(
        (init) => init.id.toLowerCase() === deployed.marketAddress.toLowerCase()
      );

      // Transform V1 data if available, otherwise use contract data
      const transformedData = initializedData
        ? transformV1KuriInitialised(initializedData)
        : null;

      // Convert interval type to number to handle string values from GraphQL
      const finalIntervalType = transformedData?._kuriData_intervalType || deployed.intervalType;

      return {
        address: deployed.marketAddress,
        creator: transformedData?._kuriData_creator || deployed.caller,
        kuriAmount:
          transformedData?._kuriData_kuriAmount ||
          kuriData?.kuriAmount.toString() ||
          "0",
        totalParticipants:
          transformedData?._kuriData_totalParticipantsCount ||
          kuriData?.totalParticipantsCount ||
          0,
        activeParticipants:
          transformedData?._kuriData_totalActiveParticipantsCount ||
          kuriData?.totalActiveParticipantsCount ||
          0,
        intervalType: Number(finalIntervalType), // Convert string to number for consistent typing
        state: (transformedData?._kuriData_state ??
          kuriData?.state ??
          0) as KuriState,
        nextDepositTime:
          transformedData?._kuriData_nextIntervalDepositTime ||
          kuriData?.nextIntervalDepositTime.toString() ||
          "0",
        nextRaffleTime:
          transformedData?._kuriData_nexRaffleTime ||
          kuriData?.nexRaffleTime.toString() ||
          "0",
        createdAt: deployed.timestamp,
        name: deployed.name || "",
        nextDraw:
          transformedData?._kuriData_nexRaffleTime ||
          kuriData?.nexRaffleTime.toString() ||
          "0",
        launchPeriod:
          transformedData?._kuriData_launchPeriod ||
          kuriData?.launchPeriod.toString() ||
          "0",
        startTime:
          transformedData?._kuriData_startTime ||
          kuriData?.startTime.toString() ||
          "0",
        endTime:
          transformedData?._kuriData_endTime ||
          kuriData?.endTime.toString() ||
          "0",
      };
    });
  }, [
    subgraphData,
    kuriDataResults,
    validMarketAddresses,
    filteredMarketAddresses,
  ]);

  return {
    markets,
    loading: subgraphLoading || kuriDataLoading,
    error: subgraphError || kuriDataError,
    refetch,
  };
};
