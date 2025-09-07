/**
 * usePostCreationModal - React hook for modal integration
 * 
 * Provides a simple interface for showing the post-creation modal
 * while managing all the underlying service coordination.
 */

import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostCreationStore } from '../stores/postCreationStore';
import { KuriMarket } from '../types/market';
import { trackEvent } from '../utils/analytics';

interface UsePostCreationModalOptions {
  onClose?: () => void;
  onViewMarket?: (market: KuriMarket) => void;
  autoNavigateToMarket?: boolean;
}

/**
 * Safe analytics tracking that won't break the modal functionality
 */
const safeTrackEvent = (eventName: string, properties: Record<string, any>) => {
  try {
    trackEvent(eventName as any, properties);
  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
};

export function usePostCreationModal(options: UsePostCreationModalOptions = {}) {
  const navigate = useNavigate();
  
  // Memoize options to prevent unnecessary re-renders
  const stableOptions = useMemo(() => options, [
    options.onClose,
    options.onViewMarket,
    options.autoNavigateToMarket,
  ]);

  const {
    showModal,
    hideModal,
    isVisible,
    market,
    reset,
  } = usePostCreationStore();

  /**
   * Show the post-creation modal for a specific market
   */
  const show = useCallback((market: KuriMarket) => {
    console.log('🚀 usePostCreationModal.show called with market:', market);
    
    if (!market?.address) {
      console.error('Invalid market data provided to show modal');
      return;
    }

    console.log('✅ Calling showModal with valid market');
    showModal(market);
    
    // Track modal display with safe error handling
    safeTrackEvent('post_creation_modal_shown', {
      market_address: market.address,
      participant_count: market.totalParticipants || 0,
      interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
      source: 'use_post_creation_modal',
    });
  }, [showModal]);

  /**
   * Hide the modal with optional callback
   */
  const hide = useCallback(() => {
    // Use the current market from the hook's state instead of direct store access
    const currentMarket = market;
    
    hideModal();
    
    // Call onClose callback if provided
    if (stableOptions.onClose) {
      try {
        stableOptions.onClose();
      } catch (error) {
        console.error('onClose callback failed:', error);
      }
    }
    
    // Track modal close with safe error handling
    if (currentMarket?.address) {
      safeTrackEvent('post_creation_modal_closed', {
        market_address: currentMarket.address,
        source: 'use_post_creation_modal',
      });
    }
  }, [hideModal, market, stableOptions]);

  /**
   * Navigate to market detail page
   */
  const viewMarket = useCallback((marketToView?: KuriMarket) => {
    const targetMarket = marketToView || market;
    
    if (!targetMarket?.address) {
      console.warn('No valid market available to view');
      return;
    }

    // Call custom onViewMarket callback if provided
    if (stableOptions.onViewMarket) {
      try {
        stableOptions.onViewMarket(targetMarket);
      } catch (error) {
        console.error('onViewMarket callback failed:', error);
      }
    } else if (stableOptions.autoNavigateToMarket !== false) {
      // Default behavior: navigate to market detail page
      try {
        navigate(`/markets/${targetMarket.address}`);
      } catch (error) {
        console.error('Navigation failed:', error);
      }
    }

    // Track navigation with safe error handling
    safeTrackEvent('post_creation_view_market_clicked', {
      market_address: targetMarket.address,
      source: 'use_post_creation_modal',
    });

    // Hide modal after navigation
    hide();
  }, [market, navigate, hide, stableOptions]);

  /**
   * Complete reset of modal state
   */
  const resetModal = useCallback(() => {
    try {
      reset();
    } catch (error) {
      console.error('Modal reset failed:', error);
    }
  }, [reset]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    // State
    isVisible,
    market,
    
    // Actions
    show,
    hide,
    viewMarket,
    reset: resetModal,
    
    // Computed values
    isReady: market !== null && market.address !== undefined,
  }), [isVisible, market, show, hide, viewMarket, resetModal]);
}

/**
 * Hook specifically for MarketList integration
 * Provides the exact interface needed to replace PostCreationShare
 */
export function useMarketListPostCreation() {
  const modalConfig = useMemo(() => ({
    autoNavigateToMarket: true,
  }), []);

  const { show, hide, viewMarket } = usePostCreationModal(modalConfig);

  /**
   * Handler for successful market creation
   * Matches the interface expected by CreateMarketForm
   */
  const handleMarketCreated = useCallback((market: KuriMarket) => {
    console.log('🎯 handleMarketCreated called with:', market);
    
    if (!market) {
      console.error('handleMarketCreated called with invalid market data');
      return;
    }
    
    console.log('📞 Calling show() with market');
    show(market);
  }, [show]);

  /**
   * Handler for modal close
   * Matches the interface expected by MarketList
   */
  const handleModalClose = useCallback(() => {
    hide();
  }, [hide]);

  /**
   * Handler for viewing market
   * Matches the interface expected by the modal
   */
  const handleViewMarket = useCallback(() => {
    viewMarket();
  }, [viewMarket]);

  return useMemo(() => ({
    handleMarketCreated,
    handleModalClose,
    handleViewMarket,
    // For backward compatibility
    onSuccess: handleMarketCreated,
    onClose: handleModalClose,
    onViewMarket: handleViewMarket,
  }), [handleMarketCreated, handleModalClose, handleViewMarket]);
}

/**
 * Hook for components that need to listen to modal state changes
 */
export function usePostCreationModalListener() {
  const { isVisible, market } = usePostCreationStore();
  
  return useMemo(() => ({
    isModalVisible: isVisible,
    currentMarket: market,
    isValidMarket: market !== null && market.address !== undefined,
  }), [isVisible, market]);
}