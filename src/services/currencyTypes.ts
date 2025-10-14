/**
 * Currency Service Types
 * Defines types for currency conversion and exchange rate management
 */

export interface ExchangeRate {
  usdcToInr: number;
  usdtToInr: number | null; // Fallback reference
  lastUpdated: number; // Unix timestamp in milliseconds
  source: 'websocket' | 'cache' | 'fallback';
}

export interface CurrencyPreference {
  displayCurrency: 'USD' | 'INR';
  isIndianUser: boolean;
}

export interface CachedRate {
  rate: number;
  timestamp: number;
  source: 'USDC' | 'USDT';
}

export type CurrencyCode = 'USD' | 'INR';

export interface CurrencyConversionResult {
  amount: number;
  currency: CurrencyCode;
  rate: number;
  formattedAmount: string;
}
