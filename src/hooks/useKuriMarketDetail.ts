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
  console.log("🔍 GRAPHQL QUERY INITIALIZATION:", {
    marketAddress,
    queryName: "KURI_MARKET_DETAIL_QUERY",
    variables: { marketAddress },
    timestamp: new Date().toISOString(),
  });

  // Log the actual GraphQL query being executed
  console.log("📋 EXECUTING GRAPHQL QUERY:", {
    query: `
    query KuriMarketDetail($marketAddress: String!) {
      kuriInitialised: KuriCore_KuriInitialised_by_pk(id: $marketAddress) { ... }
      userDepositeds: KuriCore_UserDeposited(where: { contractAddress: { _eq: $marketAddress } }) { ... }
      raffleWinnerSelecteds: KuriCore_RaffleWinnerSelected(where: { contractAddress: { _ilike: $marketAddress } }) {
        id, intervalIndex, winnerIndex, winnerAddress, winnerTimestamp, requestId, contractAddress
      }
      membershipRequesteds: KuriCore_MembershipRequested(where: { contractAddress: { _eq: $marketAddress } }) { ... }
      userAccepteds: KuriCore_UserAccepted(where: { contractAddress: { _ilike: $marketAddress } }) { ... }
    }`,
    variables: { marketAddress },
    targetEntity: "KuriCore_RaffleWinnerSelected",
    whereClause: `contractAddress: { _ilike: "${marketAddress}" }`,
  });

  const { data, loading, error, refetch } = useQuery<
    KuriMarketDetailQueryResult,
    KuriMarketDetailQueryVariables
  >(KURI_MARKET_DETAIL_QUERY, {
    variables: { marketAddress },
    notifyOnNetworkStatusChange: true,
  });

  // Handle query completion with useEffect instead of deprecated onCompleted
  useEffect(() => {
    if (data) {
      console.log("✅ GRAPHQL QUERY COMPLETED:", {
        marketAddress,
        timestamp: new Date().toISOString(),
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        kuriInitialised: !!data?.kuriInitialised,
        raffleWinnerSelecteds: {
          count: data?.raffleWinnerSelecteds?.length || 0,
          data: data?.raffleWinnerSelecteds || [],
        },
        userDepositeds: {
          count: data?.userDepositeds?.length || 0,
        },
        membershipRequesteds: {
          count: data?.membershipRequesteds?.length || 0,
        },
        userAccepteds: {
          count: data?.userAccepteds?.length || 0,
        },
        rawData: data,
      });
    }
  }, [data, marketAddress]);

  // Handle query errors with useEffect instead of deprecated onError
  useEffect(() => {
    if (error) {
      console.error("❌ GRAPHQL QUERY ERROR:", {
        marketAddress,
        timestamp: new Date().toISOString(),
        error: error.message,
        networkError: error.networkError,
        graphQLErrors: error.graphQLErrors,
        fullError: error,
      });
    }
  }, [error, marketAddress]);

  const [marketDetail, setMarketDetail] = useState<MarketDetail | null>(null);

  // Log loading state changes
  console.log("🔄 GRAPHQL QUERY STATE:", {
    marketAddress,
    loading,
    hasError: !!error,
    errorMessage: error?.message,
    hasData: !!data,
    timestamp: new Date().toISOString(),
  });

  const resolveMarketDetail = useCallback(async () => {
      console.log("🔄 MARKET DETAIL RESOLUTION DEBUG:", {
        marketAddress,
        hasData: !!data,
        kuriInitialised: !!data?.kuriInitialised,
        loadingState: loading,
        errorState: error?.message,
        rawGraphQLData: data,
      });

      if (!data?.kuriInitialised || data.kuriInitialised.length === 0) {
        console.log("❌ No kuriInitialised data found");
        setMarketDetail(null);
        return;
      }

      console.log("📊 Raw GraphQL Winners Data:", {
        raffleWinnerSelecteds: data.raffleWinnerSelecteds,
        winnersCount: data.raffleWinnerSelecteds?.length || 0,
        userDepositeds: data.userDepositeds?.length || 0,
        membershipRequesteds: data.membershipRequesteds?.length || 0,
        userAccepteds: data.userAccepteds?.length || 0,
      });

      // Detailed winner data inspection
      if (data.raffleWinnerSelecteds && data.raffleWinnerSelecteds.length > 0) {
        console.log("🏆 DETAILED WINNER DATA FROM SUBGRAPH:", {
          totalWinners: data.raffleWinnerSelecteds.length,
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
        console.log("❌ NO WINNER DATA FOUND IN SUBGRAPH:", {
          raffleWinnerSelecteds: data.raffleWinnerSelecteds,
          isArray: Array.isArray(data.raffleWinnerSelecteds),
          length: data.raffleWinnerSelecteds?.length,
          marketAddress,
          allDataKeys: Object.keys(data),
        });
      }

      // Transform the indexed fields to named fields
      const transformedData = transformV1KuriInitialised(data.kuriInitialised[0]);
      
      console.log("🔄 Transformed market data:", {
        creator: transformedData._kuriData_creator,
        state: transformedData._kuriData_state,
        nexRaffleTime: transformedData._kuriData_nexRaffleTime,
        nextIntervalDepositTime: transformedData._kuriData_nextIntervalDepositTime,
      });

      console.log("🏆 Raw winners before processing:", data.raffleWinnerSelecteds.map(w => ({
        intervalIndex: w.intervalIndex,
        winnerAddress: w.winnerAddress,
        winnerTimestamp: w.winnerTimestamp,
        requestId: w.requestId,
      })));

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
        winners: data.raffleWinnerSelecteds.map((winner) => {
          console.log("🏆 Processing winner:", {
            winnerAddress: winner.winnerAddress,
            intervalIndex: winner.intervalIndex,
            timestamp: winner.winnerTimestamp,
            winnerTimestampFormatted: new Date(Number(winner.winnerTimestamp) * 1000).toISOString(),
          });
          return {
            intervalIndex: winner.intervalIndex,
            winner: winner.winnerAddress, // Smart wallet address
            timestamp: winner.winnerTimestamp,
          };
        }),
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

      console.log("✅ FINAL RESOLVED MARKET DETAIL:", {
        ...resolvedDetail,
        winnersCount: resolvedDetail.winners.length,
        winners: resolvedDetail.winners,
      });

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

  console.log("🎯 HOOK RETURN VALUE:", {
    marketAddress,
    hasMarketDetail: !!marketDetail,
    marketDetailWinnersCount: marketDetail?.winners?.length || 0,
    marketDetailWinners: marketDetail?.winners || [],
    loading,
    hasError: !!error,
    errorMessage: error?.message,
    timestamp: new Date().toISOString(),
  });

  return hookResult;
};
