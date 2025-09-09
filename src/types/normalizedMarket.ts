// Normalized market data structure with stable references
// This prevents BigInt reference equality issues that cause excessive re-renders

import { IntervalType, KuriState } from '../hooks/contracts/useKuriCore';

export interface NormalizedKuriData {
  creator: `0x${string}`;
  kuriAmount: string;        // Stored as string, convert to BigInt when needed
  totalParticipantsCount: number;
  totalActiveParticipantsCount: number;
  intervalDuration: number;
  nexRaffleTime: string;     // Stored as string, convert to number for timestamps
  nextIntervalDepositTime: string;
  launchPeriod: string;
  startTime: string;
  endTime: string;
  intervalType: IntervalType;
  state: KuriState;
}

// Type for contract tuple response
export type KuriDataTuple = readonly [
  `0x${string}`, // creator
  bigint,        // kuriAmount
  number,        // totalParticipantsCount
  number,        // totalActiveParticipantsCount
  number,        // intervalDuration
  number,        // nexRaffleTime
  number,        // nextIntervalDepositTime
  number,        // launchPeriod
  number,        // startTime
  number,        // endTime
  number,        // intervalType
  number         // state
];

// Convert raw contract data to normalized format
export const normalizeKuriData = (tuple: KuriDataTuple): NormalizedKuriData => ({
  creator: tuple[0],
  kuriAmount: tuple[1].toString(),
  totalParticipantsCount: tuple[2],
  totalActiveParticipantsCount: tuple[3],
  intervalDuration: tuple[4],
  nexRaffleTime: BigInt(tuple[5]).toString(),
  nextIntervalDepositTime: BigInt(tuple[6]).toString(),
  launchPeriod: BigInt(tuple[7]).toString(),
  startTime: BigInt(tuple[8]).toString(),
  endTime: BigInt(tuple[9]).toString(),
  intervalType: tuple[10] as IntervalType,
  state: tuple[11] as KuriState,
});

// Helper functions to convert normalized data back to expected formats
export const getKuriAmountAsBigInt = (data: NormalizedKuriData): bigint => 
  BigInt(data.kuriAmount);

export const getTimestampAsNumber = (timestamp: string): number => 
  Number(timestamp);

// Create a hash of market data for change detection
export const createMarketDataHash = (tuple: KuriDataTuple): string => {
  return JSON.stringify([
    tuple[0], // creator
    tuple[1].toString(), // kuriAmount as string
    tuple[2], // totalParticipantsCount
    tuple[3], // totalActiveParticipantsCount
    tuple[11], // state (most important for UI changes)
  ]);
};