import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useKuriCore } from '../hooks/contracts/useKuriCore';
import { useKuriMarketDetail } from '../hooks/useKuriMarketDetail';
import type { MarketDetail } from '../hooks/useKuriMarketDetail';
import { useUserDeposits } from '../hooks/useUserDeposits';
import { useRaffleWinners, type ProcessedWinner } from '../hooks/useRaffleWinners';

interface MarketContextType {
  // Core market data
  marketData: ReturnType<typeof useKuriCore>['marketData'];
  isLoadingCore: boolean;
  errorCore: any;
  
  // Market detail data (excluding winners - now comes from dedicated hook)
  marketDetail: MarketDetail | null;
  isLoadingDetail: boolean;
  errorDetail: any;
  
  // Winner data (from dedicated hook)
  winners: ProcessedWinner[];
  currentWinner: ProcessedWinner | null;
  winnersLoading: boolean;
  winnersError: any;
  refetchWinners: () => void;
  
  // User deposits data
  userDeposits: any[];
  userDepositsLoading: boolean;
  userDepositsError: any;
  hasUserPaidForInterval: (userAddress: string, intervalIndex: number) => boolean;
  getDepositsForUser: (userAddress: string) => any[];
  getDepositsForInterval: (intervalIndex: number) => any[];
  
  // Circle members are handled by a separate context or component-level hooks
  
  // Actions
  refetchDetail: () => void;
  
  // KuriCore actions
  getMemberStatus: ReturnType<typeof useKuriCore>['getMemberStatus'];
  acceptMember: ReturnType<typeof useKuriCore>['acceptMemberSponsored'];
  acceptMultipleMembers: ReturnType<typeof useKuriCore>['acceptMultipleMembersSponsored'];
  rejectMember: ReturnType<typeof useKuriCore>['rejectMemberSponsored'];
  isAccepting: boolean;
  isRejecting: boolean;
  isRequesting: boolean;
  
  // Additional MarketDetail actions
  requestMembershipSponsored: ReturnType<typeof useKuriCore>['requestMembershipSponsored'];
  initializeKuriSponsored: ReturnType<typeof useKuriCore>['initializeKuriSponsored'];
  fetchMarketData: ReturnType<typeof useKuriCore>['fetchMarketData'];
  checkPaymentStatusIfMember: ReturnType<typeof useKuriCore>['checkPaymentStatusIfMember'];
  checkHasClaimed: ReturnType<typeof useKuriCore>['checkHasClaimed'];
  
  // DepositForm actions
  depositSponsored: ReturnType<typeof useKuriCore>['depositSponsored'];
  userPaymentStatus: ReturnType<typeof useKuriCore>['userPaymentStatus'];
  userBalance: ReturnType<typeof useKuriCore>['userBalance'];
  currentInterval: ReturnType<typeof useKuriCore>['currentInterval'];
  checkUserBalance: ReturnType<typeof useKuriCore>['checkUserBalance'];
  refreshUserData: ReturnType<typeof useKuriCore>['refreshUserData'];
  isApproving: boolean;
  
  // ClaimInterface actions
  claimKuriAmountSponsored: ReturnType<typeof useKuriCore>['claimKuriAmountSponsored'];
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

interface MarketProviderProps {
  children: ReactNode;
  marketAddress: string;
}

export const MarketProvider: React.FC<MarketProviderProps> = ({
  children,
  marketAddress,
}) => {
  // Single subscription to core market data
  const {
    marketData,
    isLoading: isLoadingCore,
    error: errorCore,
    getMemberStatus,
    acceptMemberSponsored,
    acceptMultipleMembersSponsored,
    rejectMemberSponsored,
    isAccepting,
    isRejecting,
    isRequesting,
    requestMembershipSponsored,
    initializeKuriSponsored,
    fetchMarketData,
    checkPaymentStatusIfMember,
    checkHasClaimed,
    depositSponsored,
    userPaymentStatus,
    userBalance,
    currentInterval,
    checkUserBalance,
    refreshUserData,
    claimKuriAmountSponsored,
    isApproving,
  } = useKuriCore(marketAddress as `0x${string}`);
  
  // Single subscription to market detail (excluding winners)
  const {
    marketDetail,
    loading: isLoadingDetail,
    error: errorDetail,
    refetch: refetchDetail,
  } = useKuriMarketDetail(marketAddress);

  // Dedicated subscription to winner data
  const {
    winners,
    currentWinner,
    loading: winnersLoading,
    error: winnersError,
    refetch: refetchWinners,
  } = useRaffleWinners(marketAddress, marketDetail?.nextRaffleTime);

  // Market context integration logging reduced for performance

  // Single subscription to user deposits
  const {
    deposits: userDeposits,
    loading: userDepositsLoading,
    error: userDepositsError,
    hasUserPaidForInterval,
    getDepositsForUser,
    getDepositsForInterval,
  } = useUserDeposits(marketAddress);

  // 🔥 MEMOIZE CONTEXT VALUE - Stable data and actions only (no timers)
  const contextValue: MarketContextType = useMemo(() => ({
    // Core data
    marketData,
    isLoadingCore,
    errorCore,
    
    // Detail data (excluding winners)
    marketDetail,
    isLoadingDetail,
    errorDetail,
    
    // Winner data (from dedicated hook)
    winners,
    currentWinner,
    winnersLoading,
    winnersError,
    refetchWinners,
    
    // User deposits data
    userDeposits,
    userDepositsLoading,
    userDepositsError,
    hasUserPaidForInterval,
    getDepositsForUser,
    getDepositsForInterval,
    
    // Actions
    refetchDetail,
    getMemberStatus,
    acceptMember: acceptMemberSponsored,
    acceptMultipleMembers: acceptMultipleMembersSponsored,
    rejectMember: rejectMemberSponsored,
    isAccepting,
    isRejecting,
    isRequesting,
    
    // Additional MarketDetail actions
    requestMembershipSponsored,
    initializeKuriSponsored,
    fetchMarketData,
    checkPaymentStatusIfMember,
    checkHasClaimed,
    
    // DepositForm actions
    depositSponsored,
    userPaymentStatus,
    userBalance,
    currentInterval,
    checkUserBalance,
    refreshUserData,
    
    // ClaimInterface actions
    claimKuriAmountSponsored,
    
    // DepositForm state
    isApproving,
  }), [
    // Core data - only primitive values and stable refs
    marketData,
    isLoadingCore,
    errorCore,
    
    // Detail data - only primitive values and stable refs
    marketDetail,
    isLoadingDetail,
    errorDetail,
    
    // Winner data - stable refs from dedicated hook
    winners?.length,
    currentWinner?.intervalIndex,
    winnersLoading,
    winnersError,
    refetchWinners,
    
    // User deposits data - ONLY length and loading states (not function refs)
    userDeposits?.length,
    userDepositsLoading,
    userDepositsError,
    // ❌ REMOVED UNSTABLE FUNCTION DEPENDENCIES:
    // hasUserPaidForInterval, getDepositsForUser, getDepositsForInterval
    
    // Actions - stable function references from hooks
    refetchDetail,
    getMemberStatus,
    acceptMemberSponsored,
    acceptMultipleMembersSponsored,
    rejectMemberSponsored,
    isAccepting,
    isRejecting,
    isRequesting,
    requestMembershipSponsored,
    initializeKuriSponsored,
    fetchMarketData,
    checkPaymentStatusIfMember,
    checkHasClaimed,
    depositSponsored,
    userPaymentStatus,
    userBalance,
    currentInterval,
    checkUserBalance,
    refreshUserData,
    claimKuriAmountSponsored,
    isApproving,
  ]);

  return (
    <MarketContext.Provider value={contextValue}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarketContext = (): MarketContextType => {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarketContext must be used within a MarketProvider');
  }
  return context;
};