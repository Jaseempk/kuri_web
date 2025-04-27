import { useQuery } from "@apollo/client";
import { KURI_MARKETS_QUERY } from "../graphql/queries";
import { KuriMarketsQueryResult, KuriState } from "../graphql/types";
import { useMemo } from "react";
import { useMultipleKuriData } from "./useKuriData";

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
}

export const useKuriMarkets = () => {
  const {
    data: subgraphData,
    loading: subgraphLoading,
    error: subgraphError,
    refetch,
  } = useQuery<KuriMarketsQueryResult>(KURI_MARKETS_QUERY, {
    notifyOnNetworkStatusChange: true,
  });

  // Get market addresses
  const marketAddresses = useMemo(() => {
    return (
      subgraphData?.kuriMarketDeployeds.map(
        (m) => m.marketAddress as `0x${string}`
      ) ?? []
    );
  }, [subgraphData]);

  // Fetch kuriData for all markets
  const {
    data: kuriDataResults,
    isLoading: kuriDataLoading,
    error: kuriDataError,
  } = useMultipleKuriData(marketAddresses);

  const markets = useMemo(() => {
    if (!subgraphData || !kuriDataResults) return [];

    return subgraphData.kuriMarketDeployeds.map(
      (deployed, index): KuriMarket => {
        const kuriData = kuriDataResults[index];

        return {
          address: deployed.marketAddress,
          creator: deployed.caller,
          kuriAmount: kuriData?.kuriAmount.toString() ?? "0",
          totalParticipants: kuriData?.totalParticipantsCount ?? 0,
          activeParticipants: kuriData?.totalActiveParticipantsCount ?? 0,
          intervalType: deployed.intervalType,
          state: (kuriData?.state ?? 0) as KuriState,
          nextDepositTime: kuriData?.nextIntervalDepositTime.toString() ?? "0",
          nextRaffleTime: kuriData?.nexRaffleTime.toString() ?? "0",
          createdAt: deployed.timestamp,
        };
      }
    );
  }, [subgraphData, kuriDataResults]);

  return {
    markets,
    loading: subgraphLoading || kuriDataLoading,
    error: subgraphError || kuriDataError,
    refetch,
  };
};
