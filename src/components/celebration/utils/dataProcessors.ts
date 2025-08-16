import { KuriMarket } from "../../../types/market";
import { ProcessedMarketData } from "../types";

export const processMarketData = (market: KuriMarket, userAddress: string): ProcessedMarketData => {
  // Calculate total amount if not directly available
  const totalAmount = market.totalAmount || (market.kuriAmount * market.totalParticipants);
  
  // Format contribution amount
  const contribution = typeof market.kuriAmount === 'string' 
    ? market.kuriAmount 
    : market.kuriAmount.toFixed(2);

  return {
    circleName: market.name || 'Untitled Circle',
    totalAmount: `$${totalAmount.toLocaleString()} USDC`,
    participantCount: market.totalParticipants,
    contribution: `$${contribution} USDC`,
    interval: market.intervalType === 0 ? 'Weekly' : 'Monthly',
    creatorAddress: formatAddress(userAddress),
    shareUrl: `${window.location.origin}/markets/${market.address}`,
    description: market.shortDescription || market.name || 'Join this amazing savings circle!'
  };
};

export const formatAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatCurrency = (amount: number | string, decimals: number = 2): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0';
  
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

export const validateMarketData = (market: KuriMarket): boolean => {
  return !!(
    market &&
    market.address &&
    market.name &&
    typeof market.totalParticipants === 'number' &&
    market.totalParticipants > 0
  );
};