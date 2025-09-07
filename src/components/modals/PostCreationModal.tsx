/**
 * PostCreationModal - Portal-free modal component
 * 
 * Replaces PostCreationShare.tsx with service-based architecture
 * that eliminates all circular dependency issues while maintaining
 * full functionality including backdrop click.
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import { usePostCreationStore, usePostCreationSelectors } from '../../stores/postCreationStore';
import { useClipboard } from '../../hooks/useClipboard';
import { trackEvent } from '../../utils/analytics';
import { Button } from '../ui/button';

interface PostCreationModalProps {
  onViewMarket?: () => void;
}

export const PostCreationModal: React.FC<PostCreationModalProps> = ({ 
  onViewMarket 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zustand store state
  const {
    isVisible,
    market,
    customMessage,
    isSharing,
    setCustomMessage,
    setSharing,
    hideModal,
  } = usePostCreationStore();

  // Computed selectors
  const {
    shareUrl,
    shareTitle,
    defaultShareMessage,
  } = usePostCreationSelectors();

  // Hooks
  const { copyToClipboard } = useClipboard();

  // No longer needed - removed image generation state

  // Component lifecycle management
  useEffect(() => {
    // Modal lifecycle tracking if needed
  }, [isVisible, market]);

  // Removed image generation logic - no longer needed

  // Create portal container synchronously during render
  // This ensures the container exists before we check for it
  const ensurePortalContainer = () => {
    let portalContainer = document.getElementById('modal-portal');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'modal-portal';
      document.body.appendChild(portalContainer);
    }
    return portalContainer;
  };

  // Removed image generation function - no longer needed

  /**
   * Handle link copying
   */
  const handleCopyLink = async () => {
    try {
      await copyToClipboard(shareUrl);
      toast.success('Link copied to clipboard!');
      
      trackEvent('market_shared', {
        market_address: market?.address || '',
        platform: 'copy',
        source: 'post_creation',
      });
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  /**
   * Handle text sharing
   */
  const handleShareText = async () => {
    if (!shareUrl || !market) {
      toast.error('No share URL available');
      return;
    }

    setSharing(true);

    try {
      const shareData = {
        title: shareTitle,
        text: customMessage || defaultShareMessage,
        url: shareUrl,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Circle shared successfully!');
        
        trackEvent('market_shared', {
          market_address: market.address,
          platform: 'native',
          source: 'post_creation',
        });
      } else {
        // Fallback to clipboard
        await copyToClipboard(`${customMessage || defaultShareMessage}\n\n${shareUrl}`);
        toast.success('Share text copied to clipboard!');
        
        trackEvent('market_shared', {
          market_address: market.address,
          platform: 'clipboard',
          source: 'post_creation',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled
        return;
      }
      
      console.error('Share failed:', error);
      toast.error('Failed to share. Try copying the link instead.');
      
      trackEvent('error_occurred' as any, {
        error_type: 'share_failed',
        page: 'post_creation_modal',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSharing(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    hideModal();
  };

  /**
   * Handle view market
   */
  const handleViewMarket = () => {
    if (onViewMarket) {
      onViewMarket();
    }
    handleClose();
  };

  // Don't render if not visible or no market
  if (!isVisible || !market) {
    return null;
  }

  // Get or create portal container synchronously
  const portalContainer = ensurePortalContainer();
  if (!portalContainer) {
    return null;
  }

  // Modal overlay and content
  const modalContent = (
    <div 
      className="fixed inset-0 z-[50] flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div 
        className="relative max-w-[400px] max-h-[90vh] overflow-y-auto rounded-xl p-3"
        style={{
          background: 'rgba(245, 245, 220, 0.95)',
          border: '1px solid rgba(184, 134, 11, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          width: '100%',
          maxWidth: '400px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          ref={containerRef}
          className="flex flex-col gap-2 text-center relative"
        >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-[#C84E31] leading-tight">
          Circle Created Successfully!
        </h2>
        <p className="text-[#B8860B] text-xs opacity-80">
          Share your circle with your community
        </p>
      </div>


      {/* QR Code Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center w-full mb-4"
      >
        <div className="w-full max-w-[200px] sm:max-w-[220px] aspect-square rounded-lg bg-white border border-[#E8DED1] shadow-sm p-4 flex flex-col items-center justify-center">
          {shareUrl ? (
            <>
              <div className="w-full h-full flex items-center justify-center mb-2">
                <QRCode
                  value={shareUrl}
                  size={160}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  viewBox={`0 0 256 256`}
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                />
              </div>
              <p className="text-xs text-[#8B6F47] font-medium text-center">
                Scan to Join Circle
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-[#C84E31] border-t-transparent rounded-full animate-spin mb-2"></div>
              <span className="text-gray-500 text-xs text-center">
                Generating QR Code...
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Share URL */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-4"
      >
        <div className="flex items-center w-full bg-[#F5F5DC] border border-[#B8860B]/30 rounded overflow-hidden">
          <div className="flex-1 px-2 py-1.5 text-xs min-w-0">
            <span className="text-gray-700">
              {shareUrl.length > 25 ? `${shareUrl.slice(0, 15)}...${shareUrl.slice(-10)}` : shareUrl}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            className="p-1.5 m-1 rounded bg-[#C84E31]/10 hover:bg-[#C84E31]/20 text-[#C84E31] transition-colors touch-manipulation flex-shrink-0"
            style={{ minHeight: '28px', minWidth: '28px' }}
          >
            <Copy className="w-3 h-3" />
          </motion.button>
        </div>
      </motion.div>

      {/* Custom Message */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-4"
      >
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Add a custom message (optional)"
          className="w-full px-2 py-1.5 rounded bg-[#F5F5DC] border border-[#B8860B]/30 focus:outline-none focus:ring-1 focus:ring-[#C84E31] resize-none text-xs touch-manipulation"
          rows={2}
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 gap-2 mb-4"
      >
        <Button
          onClick={handleShareText}
          disabled={!shareUrl || isSharing}
          className="bg-[#C84E31] hover:bg-[#C84E31]/90 text-white rounded font-medium text-xs py-2 px-2 h-auto touch-manipulation disabled:opacity-50"
        >
          <AnimatePresence mode="wait">
            {isSharing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Sharing...</span>
              </motion.div>
            ) : (
              <motion.div
                key="share"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
        
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="border border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B]/10 rounded font-medium text-xs py-2 px-2 h-auto touch-manipulation"
        >
          <Copy className="w-3 h-3 mr-1" />
          <span>Copy Link</span>
        </Button>
      </motion.div>
      
      {/* View Circle Button */}
      <Button
        onClick={handleViewMarket}
        variant="outline"
        className="w-full border border-[#8B6F47] text-[#8B6F47] hover:bg-[#8B6F47]/10 rounded py-2 font-medium transition-all duration-300 text-xs h-auto touch-manipulation"
      >
        <ExternalLink className="w-3 h-3 mr-1" />
        View Circle
      </Button>
        </div>
      </div>
    </div>
  );

  // Use React portal instead of modalService
  return createPortal(modalContent, portalContainer);
};