import { gql } from "@apollo/client";

export const MARKETS_QUERY = gql`
  query Markets(
    $first: Int!
    $skip: Int!
    $orderBy: String!
    $orderDirection: String!
    $where: Market_filter
  ) {
    markets(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      address
      name
      symbol
      creator
      totalSupply
      memberCount
      status
      createdAt
      updatedAt
    }
  }
`;

export const MARKET_MEMBERS_QUERY = gql`
  query MarketMembers($market: String!, $first: Int!, $skip: Int!) {
    marketMembers(first: $first, skip: $skip, where: { market: $market }) {
      id
      address
      status
      joinedAt
      market {
        id
        address
        name
        symbol
      }
    }
  }
`;

export const USER_MARKETS_QUERY = gql`
  query UserMarkets($address: String!, $first: Int!, $skip: Int!) {
    marketMembers(first: $first, skip: $skip, where: { address: $address }) {
      id
      status
      joinedAt
      market {
        id
        address
        name
        symbol
        creator
        totalSupply
        memberCount
        status
        createdAt
        updatedAt
      }
    }
  }
`;

export const KURI_MARKETS_QUERY = gql`
  query KuriMarkets {
    kuriMarketDeployeds: KuriCoreFactory_KuriMarketDeployed(
      order_by: { timestamp: desc }
    ) {
      id
      caller
      marketAddress
      intervalType
      timestamp
      wannabeMember
      circleCurrencyAddress
    }
    kuriInitialiseds: KuriCore_KuriInitialised {
      id
      _kuriData_0
      _kuriData_1
      _kuriData_10
      _kuriData_11
      _kuriData_2
      _kuriData_3
      _kuriData_4
      _kuriData_5
      _kuriData_6
      _kuriData_7
      _kuriData_8
      _kuriData_9
      contractAddress
    }
  }
`;

export const MEMBERSHIP_REQUESTS_QUERY = gql`
  query MembershipRequests($marketAddress: String!) {
    membershipRequesteds: KuriCore_MembershipRequested(
      where: { contractAddress: { _eq: $marketAddress } }
      order_by: { timestamp: desc }
    ) {
      id
      user
      timestamp
      contractAddress
    }
  }
`;

export const KURI_MARKET_DETAIL_QUERY = gql`
  query KuriMarketDetail($marketAddress: String!) {
    kuriInitialised: KuriCore_KuriInitialised_by_pk(id: $marketAddress) {
      id
      _kuriData_0
      _kuriData_1
      _kuriData_10
      _kuriData_11
      _kuriData_2
      _kuriData_3
      _kuriData_4
      _kuriData_5
      _kuriData_6
      _kuriData_7
      _kuriData_8
      _kuriData_9
      contractAddress
    }
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
      blockNumber
      blockTimestamp
      transactionHash
    }
    raffleWinnerSelecteds: KuriCore_RaffleWinnerSelected(
      where: { contractAddress: { _ilike: $marketAddress } }
      order_by: { winnerTimestamp: desc }
    ) {
      id
      intervalIndex
      winnerIndex
      winnerAddress
      winnerTimestamp
      requestId
      contractAddress
    }
    membershipRequesteds: KuriCore_MembershipRequested(
      where: { contractAddress: { _eq: $marketAddress } }
    ) {
      id
      user
      timestamp
      contractAddress
      blockNumber
      blockTimestamp
      transactionHash
    }
    userAccepteds: KuriCore_UserAccepted(
      where: { contractAddress: { _ilike: $marketAddress } }
    ) {
      id
      user
      caller
      _totalActiveParticipantsCount
      contractAddress
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const USER_ACTIVITY_QUERY = gql`
  query UserActivity($userAddress: String!) {
    membershipRequesteds: KuriCore_MembershipRequested(
      where: { user: { _eq: $userAddress } }
      order_by: { timestamp: desc }
    ) {
      id
      user
      timestamp
      contractAddress
      blockNumber
      blockTimestamp
      transactionHash
    }
    userDepositeds: KuriCore_UserDeposited(
      where: { user: { _eq: $userAddress } }
      order_by: { depositTimestamp: desc }
    ) {
      id
      user
      userIndex
      intervalIndex
      amountDeposited
      depositTimestamp
      contractAddress
      blockNumber
      blockTimestamp
      transactionHash
    }
    kuriSlotClaimeds: KuriCore_KuriSlotClaimed(
      where: { user: { _eq: $userAddress } }
      order_by: { timestamp: desc }
    ) {
      id
      user
      timestamp
      kuriAmount
      intervalIndex
      contractAddress
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export const MARKET_DEPLOYMENT_QUERY = gql`
  query MarketDeployment($marketAddress: String!) {
    kuriMarketDeployeds: KuriCoreFactory_KuriMarketDeployed(
      where: { marketAddress: { _ilike: $marketAddress } }
    ) {
      id
      caller
      marketAddress
      intervalType
      timestamp
      wannabeMember
      circleCurrencyAddress
    }
  }
`;
