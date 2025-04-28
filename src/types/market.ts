export enum KuriState {
  INLAUNCH = 0,
  LAUNCHFAILED = 1,
  ACTIVE = 2,
  COMPLETED = 3,
}

export enum IntervalType {
  WEEK = "WEEK",
  MONTH = "MONTH",
}

export interface KuriData {
  creator: string;
  kuriAmount: string;
  totalParticipantsCount: string;
  currentParticipantsCount: string;
  intervalType: string;
  intervalCount: string;
  startTime: string;
  endTime: string;
  lastContributionTime: string;
  isActive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  name: string;
}

export interface MarketTimings {
  nextRaffle: Date | null;
  nextDeposit: Date | null;
  launchEnd: Date | null;
  cycleEnd: Date | null;
}

export interface MarketParticipation {
  isCreator: boolean;
  isMember: boolean;
  hasWon: boolean;
  hasClaimed: boolean;
  currentInterval: number;
  hasDepositedForCurrentInterval: boolean;
}

export interface KuriContractData {
  creator: string;
  kuriAmount: bigint;
  totalParticipantsCount: bigint;
  state: KuriState;
  nextRaffleTime: bigint;
  nextIntervalDepositTime: bigint;
  launchPeriod: bigint;
  endTime: bigint;
  intervalType: IntervalType;
  intervalCount: bigint;
  currentInterval: bigint;
  winnerAddress: string;
  winnerAmount: bigint;
}
