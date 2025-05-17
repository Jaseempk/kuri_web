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

// Event Interfaces
export interface KuriMarketDeployed {
  id: string;
  caller: string;
  marketAddress: string;
  intervalType: number;
  timestamp: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
  name: string;
}

export interface KuriInitialised {
  id: string;
  _kuriData_creator: string;
  _kuriData_kuriAmount: string;
  _kuriData_totalParticipantsCount: number;
  _kuriData_totalActiveParticipantsCount: number;
  _kuriData_intervalDuration: number;
  _kuriData_nexRaffleTime: string;
  _kuriData_nextIntervalDepositTime: string;
  _kuriData_launchPeriod: string;
  _kuriData_startTime: string;
  _kuriData_endTime: string;
  _kuriData_intervalType: number;
  _kuriData_state: number;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface UserDeposited {
  id: string;
  user: string;
  userIndex: string;
  intervalIndex: string;
  amountDeposited: string;
  depositTimestamp: string;
  contractAddress: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface RaffleWinnerSelected {
  id: string;
  intervalIndex: number;
  winnerIndex: number;
  winnerAddress: string;
  winnerTimestamp: string;
  requestId: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface MembershipRequested {
  id: string;
  user: string;
  timestamp: string;
  contractAddress: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface UserAccepted {
  id: string;
  user: string;
  caller: string;
  _totalActiveParticipantsCount: number;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface KuriSlotClaimed {
  id: string;
  user: string;
  timestamp: string;
  kuriAmount: string;
  intervalIndex: number;
  contractAddress: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

// Query Response Interfaces
export interface KuriMarketsQueryResult {
  kuriMarketDeployeds: KuriMarketDeployed[];
  kuriInitialiseds: KuriInitialised[];
}

export interface KuriMarketDetailQueryResult {
  kuriInitialised: KuriInitialised;
  userDepositeds: UserDeposited[];
  raffleWinnerSelecteds: RaffleWinnerSelected[];
  membershipRequesteds: MembershipRequested[];
  userAccepteds: UserAccepted[];
}

export interface UserActivityQueryResult {
  membershipRequesteds: MembershipRequested[];
  userDepositeds: UserDeposited[];
  kuriSlotClaimeds: KuriSlotClaimed[];
}

// Query Variables Interfaces
export interface KuriMarketDetailQueryVariables {
  marketAddress: string;
}

export interface UserActivityQueryVariables {
  userAddress: string;
}

// Enums
export enum KuriState {
  UNINITIALIZED = 0,
  INITIALIZED = 1,
  ACTIVE = 2,
  COMPLETED = 3,
  FAILED = 4,
}

export enum IntervalType {
  DAILY = 0,
  WEEKLY = 1,
  BIWEEKLY = 2,
  MONTHLY = 3,
}
