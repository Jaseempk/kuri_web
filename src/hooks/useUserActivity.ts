import { useQuery } from "@apollo/client";
import { USER_ACTIVITY_QUERY } from "../graphql/queries";
import {
  UserActivityQueryResult,
  UserActivityQueryVariables,
} from "../graphql/types";
import { useMemo, useState, useEffect } from "react";
import { useAccount, useSignMessage } from "@getpara/react-sdk";
import { getSmartWalletAddressCached } from "../utils/smartWalletMapping";
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
  const account = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [queryAddress, setQueryAddress] = useState<string | null>(null);

  // Generate query address (smart wallet) from EOA
  useEffect(() => {
    const generateQueryAddress = async () => {
      if (!userAddress) return;
      
      const paraWalletClient = account.embedded.wallets?.[0];
      if (!paraWalletClient) {
        // No Para wallet = no sponsored transactions yet, use EOA for backward compatibility
        setQueryAddress(userAddress);
        return;
      }

      try {
        const smartWalletAddress = await getSmartWalletAddressCached(
          paraWalletClient.id,
          userAddress as `0x${string}`,
          signMessageAsync
        );
        setQueryAddress(smartWalletAddress);
      } catch (error) {
        console.error("Failed to generate smart wallet address:", error);
        // Fallback to EOA address
        setQueryAddress(userAddress);
      }
    };

    generateQueryAddress();
  }, [userAddress, account, signMessageAsync]);

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
