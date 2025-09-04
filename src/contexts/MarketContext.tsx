import React, { createContext, useContext, ReactNode } from 'react';
import { useKuriCore } from '../hooks/contracts/useKuriCore';
import { useKuriMarketDetail } from '../hooks/useKuriMarketDetail';
import { useMarketTimers } from '../hooks/useMarketTimers';
import type { MarketDetail } from '../hooks/useKuriMarketDetail';

interface MarketContextType {
  // Core market data
  marketData: ReturnType<typeof useKuriCore>['marketData'];
  isLoadingCore: boolean;
  errorCore: any;
  
  // Market detail data  
  marketDetail: MarketDetail | null;
  isLoadingDetail: boolean;
  errorDetail: any;
  
  // Timer data
  timeLeft: string;
  raffleTimeLeft: string;
  depositTimeLeft: string;
  
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
  
  // Single subscription to market detail
  const {
    marketDetail,
    loading: isLoadingDetail,
    error: errorDetail,
    refetch: refetchDetail,
  } = useKuriMarketDetail(marketAddress);
  
  // Single timer subscription
  const { timeLeft, raffleTimeLeft, depositTimeLeft } = useMarketTimers(marketData);

  const contextValue: MarketContextType = {
    // Core data
    marketData,
    isLoadingCore,
    errorCore,
    
    // Detail data
    marketDetail,
    isLoadingDetail,
    errorDetail,
    
    // Timer data
    timeLeft,
    raffleTimeLeft,
    depositTimeLeft,
    
    // Actions
    refetchDetail,
    getMemberStatus,
    acceptMember: acceptMemberSponsored,
    acceptMultipleMembers: acceptMultipleMembersSponsored,
    rejectMember: rejectMemberSponsored,
    isAccepting,
    isRejecting,
    
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
  };

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