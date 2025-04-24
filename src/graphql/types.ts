export enum MarketStatus {
  CREATED = "CREATED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
}

export interface Market {
  id: string;
  address: string;
  name: string;
  symbol: string;
  creator: string;
  totalSupply: string;
  memberCount: number;
  status: MarketStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MarketMember {
  id: string;
  address: string;
  market: Market;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  joinedAt: string;
}

export interface MarketQueryResult {
  markets: Market[];
}

export interface MarketQueryVariables {
  first: number;
  skip: number;
  orderBy: string;
  orderDirection: "asc" | "desc";
  where?: {
    status?: MarketStatus;
    creator?: string;
  };
}

export interface MarketMemberQueryResult {
  marketMembers: MarketMember[];
}

export interface MarketMemberQueryVariables {
  market: string;
  first: number;
  skip: number;
}
