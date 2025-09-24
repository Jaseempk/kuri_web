import { useQuery } from "@apollo/client";
import { KURI_MARKET_DETAIL_QUERY } from "../graphql/queries";
import {
  KuriMarketDetailQueryResult,
  KuriMarketDetailQueryVariables,
  KuriState,
} from "../graphql/types";
import { useState, useEffect, useCallback } from "react";
import { transformV1KuriInitialised } from "../utils/v1DataTransform";

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

  // Handle query completion with useEffect instead of deprecated onCompleted
  useEffect(() => {
    // Query completion handled silently for production performance
  }, [data, marketAddress]);

  // Handle query errors with useEffect instead of deprecated onError
  useEffect(() => {
    if (error && process.env.NODE_ENV === 'development') {
      console.error("Market detail query error:", error.message);
    }
  }, [error, marketAddress]);

  const [marketDetail, setMarketDetail] = useState<MarketDetail | null>(null);

  const resolveMarketDetail = useCallback(async () => {
      if (!data?.kuriInitialised || data.kuriInitialised.length === 0) {
        setMarketDetail(null);
        return;
      }

      // Transform the indexed fields to named fields
      const transformedData = transformV1KuriInitialised(data.kuriInitialised[0]);

      // Create a map of accepted members for quick lookup (using smart wallet addresses)
      const acceptedMembersMap = new Map(
        data.userAccepteds.map((accepted) => [accepted.user, accepted])
      );

      const resolvedDetail: MarketDetail = {
        creator: transformedData._kuriData_creator,
        kuriAmount: transformedData._kuriData_kuriAmount,
        totalParticipants: transformedData._kuriData_totalParticipantsCount,
        activeParticipants:
          transformedData._kuriData_totalActiveParticipantsCount,
        intervalDuration: Number(transformedData._kuriData_intervalDuration),
        nextRaffleTime: transformedData._kuriData_nexRaffleTime,
        nextDepositTime: transformedData._kuriData_nextIntervalDepositTime,
        state: transformedData._kuriData_state as KuriState,
        deposits: data.userDepositeds.map((deposit) => ({
          user: deposit.user, // Smart wallet address
          intervalIndex: deposit.intervalIndex,
          amount: deposit.amountDeposited,
          timestamp: deposit.depositTimestamp,
        })),
        winners: data.raffleWinnerSelecteds.map((winner) => ({
          intervalIndex: winner.intervalIndex,
          winner: winner.winnerAddress, // Smart wallet address
          timestamp: winner.winnerTimestamp,
        })),
        members: data.membershipRequesteds.map((request) => {
          return {
            address: request.user, // Smart wallet address
            status: acceptedMembersMap.has(request.user)
              ? "accepted"
              : "requested",
            timestamp: request.timestamp,
          };
        }),
      };

      setMarketDetail(resolvedDetail);
  }, [data, marketAddress]);

  useEffect(() => {
    resolveMarketDetail();
  }, [resolveMarketDetail]);

  const hookResult = {
    marketDetail,
    loading,
    error,
    refetch,
  };

  return hookResult;
};
