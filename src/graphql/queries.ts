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
