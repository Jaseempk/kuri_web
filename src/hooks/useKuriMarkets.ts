import { useQuery } from "@apollo/client";
import { KURI_MARKETS_QUERY } from "../graphql/queries";
import { KuriMarketsQueryResult, KuriState } from "../graphql/types";
import { useMemo } from "react";

export interface KuriMarket {
  address: string;
  creator: string;
  kuriAmount: string;
  totalParticipants: number;
  activeParticipants: number;
  intervalType: number;
  state: KuriState;
  createdAt: string;
}

export const useKuriMarkets = () => {
  const { data, loading, error, refetch } = useQuery<KuriMarketsQueryResult>(
    KURI_MARKETS_QUERY,
    {
      notifyOnNetworkStatusChange: true,
    }
  );

  const markets = useMemo(() => {
    if (!data) return [];

    // Create a map of initialized markets for quick lookup
    const initializedMarketsMap = new Map(
      data.kuriInitialiseds.map((market) => [market.id, market])
    );

    // Combine deployed and initialized data
    return data.kuriMarketDeployeds.map((deployed): KuriMarket => {
      const initialized = initializedMarketsMap.get(deployed.marketAddress);

      return {
        address: deployed.marketAddress,
        creator: deployed.caller,
        kuriAmount: initialized?._kuriData_kuriAmount ?? "0",
        totalParticipants: initialized?._kuriData_totalParticipantsCount ?? 0,
        activeParticipants:
          initialized?._kuriData_totalActiveParticipantsCount ?? 0,
        intervalType: deployed.intervalType,
        state: (initialized?._kuriData_state ?? 0) as KuriState,
        createdAt: deployed.timestamp,
      };
    });
  }, [data]);

  return {
    markets,
    loading,
    error,
    refetch,
  };
};
