import { describe, it, expect } from 'vitest';
import { 
  transformV1KuriData, 
  transformV1KuriInitialised, 
  isV1Format, 
  safeTransformKuriData 
} from '../v1DataTransform';
import { KuriState, IntervalType } from '../../graphql/types';

describe('V1 Data Transformation', () => {
  describe('transformV1KuriData', () => {
    it('transforms V1 indexed fields to named fields correctly', () => {
      const v1Data = {
        _kuriData_0: '0x1234567890123456789012345678901234567890',
        _kuriData_1: '1000000',
        _kuriData_2: 10,
        _kuriData_3: 8,
        _kuriData_4: '2592000',
        _kuriData_5: '1703971200',
        _kuriData_6: '1703974800',
        _kuriData_7: '1703880000',
        _kuriData_8: '1703880000',
        _kuriData_9: '1704484800',
        _kuriData_10: 1,
        _kuriData_11: 2,
      };

      const result = transformV1KuriData(v1Data);

      expect(result).toEqual({
        creator: '0x1234567890123456789012345678901234567890',
        kuriAmount: '1000000',
        totalParticipantsCount: 10,
        totalActiveParticipantsCount: 8,
        intervalDuration: '2592000',
        nexRaffleTime: '1703971200',
        nextIntervalDepositTime: '1703974800',
        launchPeriod: '1703880000',
        startTime: '1703880000',
        endTime: '1704484800',
        intervalType: 1, // IntervalType.WEEKLY
        state: KuriState.ACTIVE,
      });
    });
  });

  describe('transformV1KuriInitialised', () => {
    it('transforms V1 KuriInitialised event data correctly', () => {
      const v1InitData = {
        id: '0x1234567890123456789012345678901234567890',
        _kuriData_creator: '0x1234567890123456789012345678901234567890',
        _kuriData_kuriAmount: '1000000',
        _kuriData_totalParticipantsCount: 10,
        _kuriData_totalActiveParticipantsCount: 8,
        _kuriData_intervalDuration: 2592000,
        _kuriData_nexRaffleTime: '1703971200',
        _kuriData_nextIntervalDepositTime: '1703974800',
        _kuriData_launchPeriod: '1703880000',
        _kuriData_startTime: '1703880000',
        _kuriData_endTime: '1704484800',
        _kuriData_intervalType: 1,
        _kuriData_state: 2,
        blockNumber: '12345',
        blockTimestamp: '1703880000',
        transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      };

      const result = transformV1KuriInitialised(v1InitData);

      expect(result.id).toBe('0x1234567890123456789012345678901234567890');
      expect(result.creator).toBe('0x1234567890123456789012345678901234567890');
      expect(result.kuriAmount).toBe('1000000');
      expect(result.totalParticipantsCount).toBe(10);
      expect(result.totalActiveParticipantsCount).toBe(8);
      expect(result.intervalType).toBe(1); // IntervalType.WEEKLY
      expect(result.state).toBe(KuriState.ACTIVE);
      expect(result.blockNumber).toBe('12345');
      expect(result.transactionHash).toBe('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890');
    });
  });

  describe('isV1Format', () => {
    it('correctly identifies V1 format data', () => {
      const v1Data = { _kuriData_0: 'test' };
      const nonV1Data = { creator: 'test' };
      
      expect(isV1Format(v1Data)).toBe(true);
      expect(isV1Format(nonV1Data)).toBe(false);
      expect(isV1Format(null)).toBe(false);
      expect(isV1Format(undefined)).toBe(false);
    });
  });

  describe('safeTransformKuriData', () => {
    it('transforms V1 data when detected', () => {
      const v1Data = {
        _kuriData_0: '0x1234567890123456789012345678901234567890',
        _kuriData_1: '1000000',
        _kuriData_2: 10,
        _kuriData_3: 8,
        _kuriData_4: '2592000',
        _kuriData_5: '1703971200',
        _kuriData_6: '1703974800',
        _kuriData_7: '1703880000',
        _kuriData_8: '1703880000',
        _kuriData_9: '1704484800',
        _kuriData_10: 1,
        _kuriData_11: 2,
      };

      const result = safeTransformKuriData(v1Data);
      
      expect(result?.creator).toBe('0x1234567890123456789012345678901234567890');
      expect(result?.kuriAmount).toBe('1000000');
      expect(result?.state).toBe(KuriState.ACTIVE);
    });

    it('returns data as-is when already in expected format', () => {
      const expectedData = {
        creator: '0x1234567890123456789012345678901234567890',
        kuriAmount: '1000000',
        totalParticipantsCount: 10,
        totalActiveParticipantsCount: 8,
        intervalDuration: '2592000',
        nexRaffleTime: '1703971200',
        nextIntervalDepositTime: '1703974800',
        launchPeriod: '1703880000',
        startTime: '1703880000',
        endTime: '1704484800',
        intervalType: 1, // IntervalType.WEEKLY
        state: KuriState.ACTIVE,
      };

      const result = safeTransformKuriData(expectedData);
      
      expect(result).toEqual(expectedData);
    });

    it('returns null for null/undefined input', () => {
      expect(safeTransformKuriData(null)).toBe(null);
      expect(safeTransformKuriData(undefined)).toBe(null);
    });
  });
});