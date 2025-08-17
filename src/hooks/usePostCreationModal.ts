/**
 * usePostCreationModal - React hook for modal integration
 * 
 * Provides a simple interface for showing the post-creation modal
 * while managing all the underlying service coordination.
 */

import { useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePostCreationStore } from '../stores/postCreationStore';
import { KuriMarket } from '../types/market';
import { trackEvent } from '../utils/analytics';

interface UsePostCreationModalOptions {
  onClose?: () => void;
  onViewMarket?: (market: KuriMarket) => void;
  autoNavigateToMarket?: boolean;
}

export function usePostCreationModal(options: UsePostCreationModalOptions = {}) {
  const navigate = useNavigate();
  const optionsRef = useRef(options);
  
  // Update options ref when they change
  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

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
    showModal(market);
    
    // Track modal display
    trackEvent('post_creation_modal_shown', {
      market_address: market.address,
      participant_count: market.totalParticipants,
      interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
      source: 'use_post_creation_modal',
    });
  }, [showModal]);

  /**
   * Hide the modal with optional callback
   */
  const hide = useCallback(() => {
    const currentMarket = usePostCreationStore.getState().market;
    
    hideModal();
    
    // Call onClose callback if provided
    if (optionsRef.current.onClose) {
      optionsRef.current.onClose();
    }
    
    // Track modal close
    if (currentMarket) {
      trackEvent('post_creation_modal_closed', {
        market_address: currentMarket.address,
        source: 'use_post_creation_modal',
      });
    }
  }, [hideModal]);

  /**
   * Navigate to market detail page
   */
  const viewMarket = useCallback((marketToView?: KuriMarket) => {
    const targetMarket = marketToView || market;
    
    if (!targetMarket) {
      console.warn('No market available to view');
      return;
    }

    // Call custom onViewMarket callback if provided
    if (optionsRef.current.onViewMarket) {
      optionsRef.current.onViewMarket(targetMarket);
    } else if (optionsRef.current.autoNavigateToMarket !== false) {
      // Default behavior: navigate to market detail page
      navigate(`/markets/${targetMarket.address}`);
    }

    // Track navigation
    trackEvent('post_creation_view_market_clicked', {
      market_address: targetMarket.address,
      source: 'use_post_creation_modal',
    });

    // Hide modal after navigation
    hide();
  }, [market, navigate, hide]);

  /**
   * Complete reset of modal state
   */
  const resetModal = useCallback(() => {
    reset();
  }, [reset]);

  return {
    // State
    isVisible,
    market,
    
    // Actions
    show,
    hide,
    viewMarket,
    reset: resetModal,
    
    // Computed values
    isReady: market !== null,
  };
}

/**
 * Hook specifically for MarketList integration
 * Provides the exact interface needed to replace PostCreationShare
 */
export function useMarketListPostCreation() {
  const { show, hide, viewMarket } = usePostCreationModal({
    autoNavigateToMarket: true,
  });

  /**
   * Handler for successful market creation
   * Matches the interface expected by CreateMarketForm
   */
  const handleMarketCreated = useCallback((market: KuriMarket) => {
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

  return {
    handleMarketCreated,
    handleModalClose,
    handleViewMarket,
    // For backward compatibility
    onSuccess: handleMarketCreated,
    onClose: handleModalClose,
    onViewMarket: handleViewMarket,
  };
}

/**
 * Hook for components that need to listen to modal state changes
 */
export function usePostCreationModalListener() {
  const { isVisible, market } = usePostCreationStore();
  
  return {
    isModalVisible: isVisible,
    currentMarket: market,
  };
}