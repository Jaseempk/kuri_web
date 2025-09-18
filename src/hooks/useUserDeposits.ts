import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

// Standalone query specifically for UserDeposited events
const USER_DEPOSITS_QUERY = gql`
  query UserDeposits($marketAddress: String!) {
    userDepositeds: KuriCore_UserDeposited(
      where: { contractAddress: { _eq: $marketAddress } }
      order_by: { depositTimestamp: desc }
    ) {
      id
      user
      userIndex
      intervalIndex
      amountDeposited
      depositTimestamp
      contractAddress
    }
  }
`;

export interface UserDeposit {
  id: string;
  user: string;
  userIndex: string;
  intervalIndex: string;
  amountDeposited: string;
  depositTimestamp: string;
  contractAddress: string;
  blockNumber?: string;
  blockTimestamp?: string;
  transactionHash?: string;
}

export interface UserDepositsQueryResult {
  userDepositeds: UserDeposit[];
}

export interface UserDepositsQueryVariables {
  marketAddress: string;
}

export const useUserDeposits = (marketAddress: string) => {
  const { data, loading, error, refetch } = useQuery<
    UserDepositsQueryResult,
    UserDepositsQueryVariables
  >(USER_DEPOSITS_QUERY, {
    variables: { marketAddress },
    notifyOnNetworkStatusChange: true,
    skip: !marketAddress,
  });


  return {
    deposits: data?.userDepositeds || [],
    loading,
    error,
    refetch,
    // Additional utility functions
    getDepositsForUser: (userAddress: string) => {
      if (!data?.userDepositeds) return [];
      return data.userDepositeds.filter(
        (deposit) => deposit.user.toLowerCase() === userAddress.toLowerCase()
      );
    },
    getDepositsForInterval: (intervalIndex: number) => {
      if (!data?.userDepositeds) return [];
      return data.userDepositeds.filter(
        (deposit) => parseInt(deposit.intervalIndex) === intervalIndex
      );
    },
    hasUserPaidForInterval: (userAddress: string, intervalIndex: number) => {
      if (!data?.userDepositeds) return false;
      return data.userDepositeds.some(
        (deposit) =>
          deposit.user.toLowerCase() === userAddress.toLowerCase() &&
          parseInt(deposit.intervalIndex) === intervalIndex
      );
    },
  };
};
