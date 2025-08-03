// V1 Data Transformation Utilities
// Transforms V1 indexed GraphQL fields to expected named field format

import { KuriState, IntervalType } from "../graphql/types";

// V1 GraphQL returns indexed fields instead of named fields
export interface V1KuriData {
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
}

// Expected UI format (what the rest of the app expects)
export interface TransformedKuriData {
  creator: string;
  kuriAmount: string;
  totalParticipantsCount: number;
  totalActiveParticipantsCount: number;
  intervalDuration: string;
  nexRaffleTime: string;
  nextIntervalDepositTime: string;
  launchPeriod: string;
  startTime: string;
  endTime: string;
  intervalType: IntervalType;
  state: KuriState;
}

/**
 * Transforms V1 indexed field format to expected named field format
 */
export const transformV1KuriData = (v1Data: V1KuriData): TransformedKuriData => ({
  creator: v1Data._kuriData_0,
  kuriAmount: v1Data._kuriData_1,
  totalParticipantsCount: v1Data._kuriData_2,
  totalActiveParticipantsCount: v1Data._kuriData_3,
  intervalDuration: v1Data._kuriData_4,
  nexRaffleTime: v1Data._kuriData_5,
  nextIntervalDepositTime: v1Data._kuriData_6,
  launchPeriod: v1Data._kuriData_7,
  startTime: v1Data._kuriData_8,
  endTime: v1Data._kuriData_9,
  intervalType: v1Data._kuriData_10 as IntervalType,
  state: v1Data._kuriData_11 as KuriState,
});

/**
 * Transforms V1 KuriInitialised event data (envio format with indexed fields)
 */
export interface V1KuriInitialised {
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

export const transformV1KuriInitialised = (v1Data: V1KuriInitialised) => ({
  id: v1Data.id,
  _kuriData_creator: v1Data._kuriData_0,
  _kuriData_kuriAmount: v1Data._kuriData_1,
  _kuriData_totalParticipantsCount: v1Data._kuriData_2,
  _kuriData_totalActiveParticipantsCount: v1Data._kuriData_3,
  _kuriData_intervalDuration: v1Data._kuriData_4,
  _kuriData_nexRaffleTime: v1Data._kuriData_5,
  _kuriData_nextIntervalDepositTime: v1Data._kuriData_6,
  _kuriData_launchPeriod: v1Data._kuriData_7,
  _kuriData_startTime: v1Data._kuriData_8,
  _kuriData_endTime: v1Data._kuriData_9,
  _kuriData_intervalType: v1Data._kuriData_10 as IntervalType,
  _kuriData_state: v1Data._kuriData_11 as KuriState,
  contractAddress: v1Data.contractAddress,
});

/**
 * Helper to check if data is in V1 format (has indexed fields)
 */
export const isV1Format = (data: any): data is V1KuriData => {
  return data != null && typeof data._kuriData_0 !== 'undefined';
};

/**
 * Safe transformation that handles both V0 and V1 formats
 */
export const safeTransformKuriData = (data: any): TransformedKuriData | null => {
  if (data == null) return null;
  
  if (isV1Format(data)) {
    return transformV1KuriData(data);
  }
  
  // Already in expected format or V0 format
  return data as TransformedKuriData;
};