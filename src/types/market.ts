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
  kuriAmount: bigint;
  totalParticipantsCount: number;
  totalActiveParticipantsCount: number;
  intervalDuration: number;
  nextRaffleTime: number;
  nextIntervalDepositTime: number;
  launchPeriod: number;
  startTime: number;
  endTime: number;
  intervalType: IntervalType;
  state: KuriState;
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
