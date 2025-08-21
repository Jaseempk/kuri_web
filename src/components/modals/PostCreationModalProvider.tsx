/**
 * PostCreationModalProvider - Integration with existing workflow
 * 
 * Provides the new modal system to the existing MarketList component
 * while maintaining backward compatibility with the current interface.
 */

import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { PostCreationModal } from './PostCreationModal';
import { usePostCreationStore } from '../../stores/postCreationStore';
import { useMarketListPostCreation } from '../../hooks/usePostCreationModal';
import { modalService } from '../../services/modalService';

interface PostCreationModalProviderProps {
  children: React.ReactNode;
}

/**
 * Error boundary for modal crashes
 */
class ModalErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('Modal error boundary caught:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Modal error details:', error, errorInfo);
    // Hide modal service on error
    try {
      if (modalService.isModalOpen()) {
        modalService.hide();
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup modal after error:', cleanupError);
    }
  }

  render() {
    if (this.state.hasError) {
      // Reset error state after a delay to allow retry
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 1000);
      return null; // Hide broken modal
    }
    return this.props.children;
  }
}

/**
 * Provider that makes the new modal system available throughout the app
 */
export const PostCreationModalProvider: React.FC<PostCreationModalProviderProps> = ({ 
  children 
}) => {
  const navigate = useNavigate();
  const { isVisible, market } = usePostCreationStore();
  
  const { handleViewMarket } = useMarketListPostCreation();

  // Handle view market navigation
  const onViewMarket = () => {
    if (market) {
      navigate(`/markets/${market.address}`);
      handleViewMarket();
    }
  };

  return (
    <>
      {children}
      {/* Render modal when visible with error boundary */}
      {isVisible && (
        <ModalErrorBoundary>
          <PostCreationModal 
            onViewMarket={onViewMarket}
          />
        </ModalErrorBoundary>
      )}
    </>
  );
};

/**
 * Hook that provides the interface expected by MarketList.tsx
 * This replaces the old PostCreationShare component usage
 */
export function usePostCreationShareReplacement() {
  const { 
    handleMarketCreated, 
    handleModalClose, 
    handleViewMarket 
  } = useMarketListPostCreation();
  
  const { isVisible } = usePostCreationStore();

  return {
    // State that MarketList checks
    showShareModal: isVisible,
    
    // Handlers that MarketList calls
    onSuccess: handleMarketCreated,
    onClose: handleModalClose,
    onViewMarket: handleViewMarket,
    
    // For backward compatibility
    setShowShareModal: (show: boolean) => {
      if (!show) {
        handleModalClose();
      }
    },
  };
}

/**
 * Integration component for gradual migration
 * This can be used to test the new modal alongside the old one
 */
interface PostCreationModalIntegrationProps {
  market: any;
  isVisible: boolean;
  onClose: () => void;
  onViewMarket: () => void;
  // Feature flag to enable new modal
  useNewModal?: boolean;
}

export const PostCreationModalIntegration: React.FC<PostCreationModalIntegrationProps> = ({
  market,
  isVisible,
  onViewMarket,
  useNewModal = false,
}) => {
  const { showModal, hideModal } = usePostCreationStore();

  // Sync with new modal system when using new modal
  useEffect(() => {
    if (useNewModal && isVisible && market) {
      showModal(market);
    } else if (useNewModal && !isVisible) {
      hideModal();
    }
  }, [useNewModal, isVisible, market, showModal, hideModal]);

  if (useNewModal) {
    // Use new modal system
    return (
      <PostCreationModal 
        onViewMarket={onViewMarket}
      />
    );
  }

  // Fallback to old modal (PostCreationShare)
  // This would be the existing component until migration is complete
  return null;
};