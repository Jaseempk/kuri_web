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
    kuriMarketDeployeds(orderBy: timestamp, orderDirection: desc) {
      id
      caller
      marketAddress
      intervalType
      timestamp
      blockTimestamp
    }
    kuriInitialiseds {
      id
      _kuriData_creator
      _kuriData_kuriAmount
      _kuriData_totalParticipantsCount
      _kuriData_totalActiveParticipantsCount
      _kuriData_intervalDuration
      _kuriData_nexRaffleTime
      _kuriData_nextIntervalDepositTime
      _kuriData_launchPeriod
      _kuriData_startTime
      _kuriData_endTime
      _kuriData_intervalType
      _kuriData_state
    }
  }
`;

export const MEMBERSHIP_REQUESTS_QUERY = gql`
  query MembershipRequests($marketAddress: String!) {
    membershipRequesteds(
      where: { contractAddress: $marketAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      user
      timestamp
    }
  }
`;

export const KURI_MARKET_DETAIL_QUERY = gql`
  query KuriMarketDetail($marketAddress: String!) {
    kuriInitialised(id: $marketAddress) {
      id
      _kuriData_creator
      _kuriData_kuriAmount
      _kuriData_totalParticipantsCount
      _kuriData_totalActiveParticipantsCount
      _kuriData_intervalDuration
      _kuriData_nexRaffleTime
      _kuriData_nextIntervalDepositTime
      _kuriData_state
    }
    userDepositeds(
      where: { id_contains: $marketAddress }
      orderBy: depositTimestamp
      orderDirection: desc
    ) {
      id
      user
      userIndex
      intervalIndex
      amountDeposited
      depositTimestamp
    }
    raffleWinnerSelecteds(
      where: { id_contains: $marketAddress }
      orderBy: winnerTimestamp
      orderDirection: desc
    ) {
      id
      intervalIndex
      winnerIndex
      winnerAddress
      winnerTimestamp
    }
    membershipRequesteds(where: { id_contains: $marketAddress }) {
      id
      user
      timestamp
    }
    userAccepteds(where: { id_contains: $marketAddress }) {
      id
      user
      _totalActiveParticipantsCount
    }
  }
`;

export const USER_ACTIVITY_QUERY = gql`
  query UserActivity($userAddress: String!) {
    membershipRequesteds(
      where: { user: $userAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      timestamp
    }
    userDepositeds(
      where: { user: $userAddress }
      orderBy: depositTimestamp
      orderDirection: desc
    ) {
      id
      intervalIndex
      amountDeposited
      depositTimestamp
    }
    kuriSlotClaimeds(
      where: { user: $userAddress }
      orderBy: timestamp
      orderDirection: desc
    ) {
      id
      timestamp
      kuriAmount
      intervalIndex
    }
  }
`;
