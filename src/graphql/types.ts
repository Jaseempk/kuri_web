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
  wannabeMember?: boolean;
  circleCurrencyAddress?: string;
  name?: string;
}

// V1 KuriInitialised with envio indexed fields
export interface KuriInitialised {
  id: string;
  _kuriData_0: string;   // creator
  _kuriData_1: string;   // kuriAmount
  _kuriData_2: number;   // totalParticipantsCount
  _kuriData_3: number;   // totalActiveParticipantsCount
  _kuriData_4: string;   // intervalDuration
  _kuriData_5: string;   // nexRaffleTime
  _kuriData_6: string;   // nextIntervalDepositTime
  _kuriData_7: string;   // launchPeriod
  _kuriData_8: string;   // startTime
  _kuriData_9: string;   // endTime
  _kuriData_10: number;  // intervalType
  _kuriData_11: number;  // state
  contractAddress?: string;
}

// Transformed KuriInitialised with named fields (for UI consumption)
export interface TransformedKuriInitialised {
  id: string;
  creator: string;
  kuriAmount: string;
  totalParticipantsCount: number;
  totalActiveParticipantsCount: number;
  intervalDuration: number;
  nexRaffleTime: string;
  nextIntervalDepositTime: string;
  launchPeriod: string;
  startTime: string;
  endTime: string;
  intervalType: IntervalType;
  state: KuriState;
  blockNumber?: string;
  blockTimestamp?: string;
  transactionHash?: string;
}

export interface UserDeposited {
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

export interface RaffleWinnerSelected {
  id: string;
  intervalIndex: number;
  winnerIndex: number;
  winnerAddress: string;
  winnerTimestamp: string;
  requestId?: string;
  contractAddress?: string;
  blockNumber?: string;
  blockTimestamp?: string;
  transactionHash?: string;
}

export interface MembershipRequested {
  id: string;
  user: string;
  timestamp: string;
  contractAddress: string;
  blockNumber?: string;
  blockTimestamp?: string;
  transactionHash?: string;
}

export interface UserAccepted {
  id: string;
  user: string;
  caller?: string;
  _totalActiveParticipantsCount: number;
  contractAddress?: string;
  blockNumber?: string;
  blockTimestamp?: string;
  transactionHash?: string;
}

export interface KuriSlotClaimed {
  id: string;
  user: string;
  timestamp: string;
  kuriAmount: string;
  intervalIndex: number;
  contractAddress: string;
  blockNumber?: string;
  blockTimestamp?: string;
  transactionHash?: string;
}

// Query Response Interfaces
export interface KuriMarketsQueryResult {
  kuriMarketDeployeds: KuriMarketDeployed[];
  kuriInitialiseds: KuriInitialised[];
}

// Transformed query result for UI consumption
export interface TransformedKuriMarketsResult {
  kuriMarketDeployeds: KuriMarketDeployed[];
  kuriInitialiseds: TransformedKuriInitialised[];
}

export interface KuriMarketDetailQueryResult {
  kuriInitialised: KuriInitialised[];
  userDepositeds: UserDeposited[];
  raffleWinnerSelecteds: RaffleWinnerSelected[];
  membershipRequesteds: MembershipRequested[];
  userAccepteds: UserAccepted[];
}

// Transformed market detail result for UI consumption
export interface TransformedKuriMarketDetailResult {
  kuriInitialised: TransformedKuriInitialised | null;
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

export interface MarketDeploymentQueryResult {
  kuriMarketDeployeds: KuriMarketDeployed[];
}

export interface MarketDeploymentQueryVariables {
  marketAddress: string;
}

export interface RaffleWinnersQueryVariables {
  marketAddress: string;
}

export interface RaffleWinnersQueryResult {
  raffleWinnerSelecteds: RaffleWinnerSelected[];
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
