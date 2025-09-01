import { useQuery } from "@apollo/client";
import { USER_ACTIVITY_QUERY } from "../graphql/queries";
import {
  UserActivityQueryResult,
  UserActivityQueryVariables,
} from "../graphql/types";
import { useMemo, useState, useEffect } from "react";
import { useOptimizedAuth } from "./useOptimizedAuth";
import { resolveMultipleAddressesRobust } from "../utils/addressResolution";

export interface UserActivity {
  memberships: {
    marketId: string;
    timestamp: string;
    userAddress: string;
  }[];
  deposits: {
    marketId: string;
    intervalIndex: string;
    amount: string;
    timestamp: string;
    userAddress: string;
  }[];
  claims: {
    marketId: string;
    intervalIndex: number;
    amount: string;
    timestamp: string;
    userAddress: string;
  }[];
}

export const useUserActivity = (userAddress: string) => {
  const { smartAddress } = useOptimizedAuth();
  
  // Use smart wallet address if it matches the requested user, otherwise use provided address
  const queryAddress = userAddress && smartAddress && 
    userAddress.toLowerCase() === smartAddress.toLowerCase() 
    ? smartAddress 
    : userAddress;

  const { data, loading, error, refetch } = useQuery<
    UserActivityQueryResult,
    UserActivityQueryVariables
  >(USER_ACTIVITY_QUERY, {
    variables: { userAddress: queryAddress || "" },
    skip: !queryAddress,
    notifyOnNetworkStatusChange: true,
  });

  const activity = useMemo(async (): Promise<UserActivity> => {
    if (!data) {
      return {
        memberships: [],
        deposits: [],
        claims: [],
      };
    }

    // Extract all user addresses from events
    const membershipUsers = data.membershipRequesteds.map(r => r.user);
    const depositUsers = data.userDepositeds.map(d => d.user);
    const claimUsers = data.kuriSlotClaimeds.map(c => c.user);
    
    const allUsers = [...new Set([...membershipUsers, ...depositUsers, ...claimUsers])];
    
    // Batch resolve all addresses to EOAs
    const resolvedAddresses = await resolveMultipleAddressesRobust(allUsers);
    const addressMap = new Map(allUsers.map((addr, i) => [addr, resolvedAddresses[i]]));

    return {
      memberships: data.membershipRequesteds.map((request) => ({
        marketId: request.contractAddress,
        timestamp: request.timestamp,
        userAddress: addressMap.get(request.user) || request.user, // Resolved EOA
      })),
      deposits: data.userDepositeds.map((deposit) => ({
        marketId: deposit.contractAddress,
        intervalIndex: deposit.intervalIndex,
        amount: deposit.amountDeposited,
        timestamp: deposit.depositTimestamp,
        userAddress: addressMap.get(deposit.user) || deposit.user, // Resolved EOA
      })),
      claims: data.kuriSlotClaimeds.map((claim) => ({
        marketId: claim.contractAddress,
        intervalIndex: claim.intervalIndex,
        amount: claim.kuriAmount,
        timestamp: claim.timestamp,
        userAddress: addressMap.get(claim.user) || claim.user, // Resolved EOA
      })),
    };
  }, [data]);

  const [resolvedActivity, setResolvedActivity] = useState<UserActivity>({
    memberships: [],
    deposits: [],
    claims: [],
  });

  useEffect(() => {
    const resolveActivity = async () => {
      const resolved = await activity;
      setResolvedActivity(resolved);
    };
    resolveActivity();
  }, [activity]);

  return {
    activity: resolvedActivity,
    loading,
    error,
    refetch,
  };
};
