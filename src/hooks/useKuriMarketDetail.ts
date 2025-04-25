import { useQuery } from "@apollo/client";
import { KURI_MARKET_DETAIL_QUERY } from "../graphql/queries";
import {
  KuriMarketDetailQueryResult,
  KuriMarketDetailQueryVariables,
  KuriState,
} from "../graphql/types";
import { useMemo } from "react";

export interface MarketDetail {
  creator: string;
  kuriAmount: string;
  totalParticipants: number;
  activeParticipants: number;
  intervalDuration: number;
  nextRaffleTime: string;
  nextDepositTime: string;
  state: KuriState;
  deposits: {
    user: string;
    intervalIndex: string;
    amount: string;
    timestamp: string;
  }[];
  winners: {
    intervalIndex: number;
    winner: string;
    timestamp: string;
  }[];
  members: {
    address: string;
    status: "requested" | "accepted";
    timestamp: string;
  }[];
}

export const useKuriMarketDetail = (marketAddress: string) => {
  const { data, loading, error, refetch } = useQuery<
    KuriMarketDetailQueryResult,
    KuriMarketDetailQueryVariables
  >(KURI_MARKET_DETAIL_QUERY, {
    variables: { marketAddress },
    notifyOnNetworkStatusChange: true,
  });

  const marketDetail = useMemo((): MarketDetail | null => {
    if (!data?.kuriInitialised) return null;

    // Create a map of accepted members for quick lookup
    const acceptedMembersMap = new Map(
      data.userAccepteds.map((accepted) => [accepted.user, accepted])
    );

    return {
      creator: data.kuriInitialised._kuriData_creator,
      kuriAmount: data.kuriInitialised._kuriData_kuriAmount,
      totalParticipants: data.kuriInitialised._kuriData_totalParticipantsCount,
      activeParticipants:
        data.kuriInitialised._kuriData_totalActiveParticipantsCount,
      intervalDuration: data.kuriInitialised._kuriData_intervalDuration,
      nextRaffleTime: data.kuriInitialised._kuriData_nexRaffleTime,
      nextDepositTime: data.kuriInitialised._kuriData_nextIntervalDepositTime,
      state: data.kuriInitialised._kuriData_state as KuriState,
      deposits: data.userDepositeds.map((deposit) => ({
        user: deposit.user,
        intervalIndex: deposit.intervalIndex,
        amount: deposit.amountDeposited,
        timestamp: deposit.depositTimestamp,
      })),
      winners: data.raffleWinnerSelecteds.map((winner) => ({
        intervalIndex: winner.intervalIndex,
        winner: winner.winnerAddress,
        timestamp: winner.winnerTimestamp,
      })),
      members: data.membershipRequesteds.map((request) => ({
        address: request.user,
        status: acceptedMembersMap.has(request.user) ? "accepted" : "requested",
        timestamp: request.timestamp,
      })),
    };
  }, [data]);

  return {
    marketDetail,
    loading,
    error,
    refetch,
  };
};
