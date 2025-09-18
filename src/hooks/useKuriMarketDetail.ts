import { useQuery } from "@apollo/client";
import { KURI_MARKET_DETAIL_QUERY } from "../graphql/queries";
import {
  KuriMarketDetailQueryResult,
  KuriMarketDetailQueryVariables,
  KuriState,
} from "../graphql/types";
import { useState, useEffect, useCallback } from "react";
import { transformV1KuriInitialised } from "../utils/v1DataTransform";
import { resolveMultipleAddressesRobust } from "../utils/addressResolution";

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

  const [marketDetail, setMarketDetail] = useState<MarketDetail | null>(null);

  const resolveMarketDetail = useCallback(async () => {
      if (!data?.kuriInitialised) {
        setMarketDetail(null);
        return;
      }


      // Transform the indexed fields to named fields
      const transformedData = transformV1KuriInitialised(data.kuriInitialised);

      // Extract all user addresses that need resolution
      const depositUsers = data.userDepositeds.map((d) => d.user);
      const membershipUsers = data.membershipRequesteds.map((r) => r.user);
      const acceptedUsers = data.userAccepteds.map((a) => a.user);
      const winnerAddresses = data.raffleWinnerSelecteds.map(
        (w) => w.winnerAddress
      );

      const allUsers = [
        ...new Set([
          ...depositUsers,
          ...membershipUsers,
          ...acceptedUsers,
          ...winnerAddresses,
        ]),
      ];

      // Batch resolve addresses to EOAs
      const resolvedAddresses = await resolveMultipleAddressesRobust(allUsers);
      const addressMap = new Map(
        allUsers.map((addr, i) => [addr, resolvedAddresses[i]])
      );

      // Create a map of accepted members for quick lookup (using resolved addresses)
      const acceptedMembersMap = new Map(
        data.userAccepteds.map((accepted) => {
          const resolvedUser = addressMap.get(accepted.user) || accepted.user;
          return [resolvedUser, accepted];
        })
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
          user: addressMap.get(deposit.user) || deposit.user, // Resolved EOA
          intervalIndex: deposit.intervalIndex,
          amount: deposit.amountDeposited,
          timestamp: deposit.depositTimestamp,
        })),
        winners: data.raffleWinnerSelecteds.map((winner) => ({
          intervalIndex: winner.intervalIndex,
          winner: addressMap.get(winner.winnerAddress) || winner.winnerAddress, // Resolved EOA
          timestamp: winner.winnerTimestamp,
        })),
        members: data.membershipRequesteds.map((request) => {
          const resolvedUser = addressMap.get(request.user) || request.user;
          return {
            address: resolvedUser, // Resolved EOA
            status: acceptedMembersMap.has(resolvedUser)
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

  return {
    marketDetail,
    loading,
    error,
    refetch,
  };
};
