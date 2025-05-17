import { useQuery } from "@apollo/client";
import { USER_ACTIVITY_QUERY } from "../graphql/queries";
import {
  UserActivityQueryResult,
  UserActivityQueryVariables,
} from "../graphql/types";
import { useMemo } from "react";

export interface UserActivity {
  memberships: {
    marketId: string;
    timestamp: string;
  }[];
  deposits: {
    marketId: string;
    intervalIndex: string;
    amount: string;
    timestamp: string;
  }[];
  claims: {
    marketId: string;
    intervalIndex: number;
    amount: string;
    timestamp: string;
  }[];
}

export const useUserActivity = (userAddress: string) => {
  const { data, loading, error, refetch } = useQuery<
    UserActivityQueryResult,
    UserActivityQueryVariables
  >(USER_ACTIVITY_QUERY, {
    variables: { userAddress },
    notifyOnNetworkStatusChange: true,
  });

  const activity = useMemo((): UserActivity => {
    if (!data) {
      return {
        memberships: [],
        deposits: [],
        claims: [],
      };
    }

    return {
      memberships: data.membershipRequesteds.map((request) => ({
        marketId: request.contractAddress,
        timestamp: request.timestamp,
      })),
      deposits: data.userDepositeds.map((deposit) => ({
        marketId: deposit.contractAddress,
        intervalIndex: deposit.intervalIndex,
        amount: deposit.amountDeposited,
        timestamp: deposit.depositTimestamp,
      })),
      claims: data.kuriSlotClaimeds.map((claim) => ({
        marketId: claim.contractAddress,
        intervalIndex: claim.intervalIndex,
        amount: claim.kuriAmount,
        timestamp: claim.timestamp,
      })),
    };
  }, [data]);

  return {
    activity,
    loading,
    error,
    refetch,
  };
};
