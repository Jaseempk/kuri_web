/**
 * Currency Utility Functions
 * Helper functions for currency formatting and conversion
 */

import { formatUnits } from 'viem';

/**
 * Format USDC amount (bigint with 6 decimals) to number
 */
export const usdcToNumber = (usdcAmount: bigint): number => {
  return Number(formatUnits(usdcAmount, 6));
};

/**
 * Format USD amount with $ symbol and proper decimals
 */
export const formatUsdAmount = (amount: number | bigint, decimals: number = 2): string => {
  const numAmount = typeof amount === 'bigint' ? usdcToNumber(amount) : amount;

  return `$${numAmount.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Format INR amount with ₹ symbol and proper decimals
 */
export const formatInrAmount = (amount: number, decimals: number = 2): string => {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

/**
 * Convert USDC bigint to INR
 */
export const usdcToInr = (usdcAmount: bigint, exchangeRate: number): number => {
  const usdAmount = usdcToNumber(usdcAmount);
  return usdAmount * exchangeRate;
};

/**
 * Format USDC amount as INR
 */
export const formatUsdcAsInr = (
  usdcAmount: bigint,
  exchangeRate: number,
  decimals: number = 2
): string => {
  const inrAmount = usdcToInr(usdcAmount, exchangeRate);
  return formatInrAmount(inrAmount, decimals);
};

/**
 * Format both currencies side by side
 * Example: "$10.00 (≈₹948.00)"
 */
export const formatBothCurrencies = (
  usdcAmount: bigint,
  exchangeRate: number,
  primaryCurrency: 'USD' | 'INR' = 'USD'
): string => {
  const usdAmount = usdcToNumber(usdcAmount);
  const inrAmount = usdAmount * exchangeRate;

  if (primaryCurrency === 'USD') {
    return `${formatUsdAmount(usdAmount)} (≈${formatInrAmount(inrAmount)})`;
  } else {
    return `${formatInrAmount(inrAmount)} (≈${formatUsdAmount(usdAmount)})`;
  }
};

/**
 * Format currency based on user preference
 */
export const formatCurrencyByPreference = (
  usdcAmount: bigint,
  exchangeRate: number,
  preferredCurrency: 'USD' | 'INR',
  decimals: number = 2
): string => {
  if (preferredCurrency === 'USD') {
    return formatUsdAmount(usdcToNumber(usdcAmount), decimals);
  } else {
    return formatUsdcAsInr(usdcAmount, exchangeRate, decimals);
  }
};

/**
 * Format number as USD
 */
export const formatNumberAsUsd = (amount: number, decimals: number = 2): string => {
  return formatUsdAmount(amount, decimals);
};

/**
 * Format number as INR
 */
export const formatNumberAsInr = (amount: number, decimals: number = 2): string => {
  return formatInrAmount(amount, decimals);
};

/**
 * Convert USD number to INR
 */
export const usdToInr = (usdAmount: number, exchangeRate: number): number => {
  return usdAmount * exchangeRate;
};

/**
 * Convert INR to USD
 */
export const inrToUsd = (inrAmount: number, exchangeRate: number): number => {
  return inrAmount / exchangeRate;
};

/**
 * Get compact notation for large numbers
 * Example: 100000 -> "1L" (in INR context) or "100K" (in USD context)
 */
export const formatCompact = (
  amount: number,
  currency: 'USD' | 'INR'
): string => {
  if (currency === 'INR') {
    // Indian numbering system: Lakhs and Crores
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(2)}K`;
    }
    return formatInrAmount(amount);
  } else {
    // Western numbering: Thousands, Millions
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(2)}K`;
    }
    return formatUsdAmount(amount);
  }
};

/**
 * Get currency symbol
 */
export const getCurrencySymbol = (currency: 'USD' | 'INR'): string => {
  return currency === 'USD' ? '$' : '₹';
};

/**
 * Get currency name
 */
export const getCurrencyName = (currency: 'USD' | 'INR'): string => {
  return currency === 'USD' ? 'US Dollar' : 'Indian Rupee';
};

/**
 * Parse currency string to number (removes symbols and commas)
 */
export const parseCurrencyString = (value: string): number => {
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
};
