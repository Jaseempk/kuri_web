/**
 * PostCreationModal - Portal-free modal component
 * 
 * Replaces PostCreationShare.tsx with service-based architecture
 * that eliminates all circular dependency issues while maintaining
 * full functionality including backdrop click.
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Copy, Download, ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner';
import { imageGenerationService, useImageGeneration } from '../../services/imageGenerationService';
import { usePostCreationStore, usePostCreationSelectors, TemplateType } from '../../stores/postCreationStore';
import { useClipboard } from '../../hooks/useClipboard';
import { useEventBus } from '../../utils/eventBus';
import { trackEvent } from '../../utils/analytics';
import { copyImageToClipboard } from '../celebration/utils/exportUtils';
import { Button } from '../ui/button';

interface PostCreationModalProps {
  onViewMarket?: () => void;
}

export const PostCreationModal: React.FC<PostCreationModalProps> = ({ 
  onViewMarket 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const generationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Zustand store state
  const {
    isVisible,
    market,
    selectedTemplate,
    generatedImage,
    downloadUrl,
    customMessage,
    isSharing,
    imageGenerationTime,
    setTemplate,
    setGeneratedImage,
    setCustomMessage,
    setSharing,
    hideModal,
  } = usePostCreationStore();

  // Computed selectors
  const {
    isReady,
    canShare,
    shareUrl,
    shareTitle,
    defaultShareMessage,
  } = usePostCreationSelectors();

  // Hooks
  const { copyToClipboard } = useClipboard();
  const { generateImage, isWorkerSupported, generateImageFallback } = useImageGeneration();
  const { emit, on } = useEventBus();

  // Local state for image generation
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStage, setGenerationStage] = useState('');

  // Component lifecycle management
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cancel any ongoing generation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (generationTimeoutRef.current) {
        clearTimeout(generationTimeoutRef.current);
      }
    };
  }, []);

  // Helper function to cancel ongoing generation
  const cancelCurrentGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (generationTimeoutRef.current) {
      clearTimeout(generationTimeoutRef.current);
      generationTimeoutRef.current = null;
    }
    setIsGeneratingImage(false);
  };

  // Event bus subscriptions
  useEffect(() => {
    const unsubscribeProgress = on('image:generate-progress', (data) => {
      if (isMountedRef.current) {
        setGenerationProgress(data.progress);
        setGenerationStage(data.stage);
      }
    });

    const unsubscribeComplete = on('image:generate-complete', (data) => {
      if (isMountedRef.current) {
        setGeneratedImage(data.imageData, data.downloadUrl, data.generationTime);
        setIsGeneratingImage(false);
      }
    });

    const unsubscribeError = on('image:generate-error', (data) => {
      if (isMountedRef.current) {
        toast.error(`Image generation failed: ${data.error}`);
        setIsGeneratingImage(false);
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
    };
  }, [on, setGeneratedImage]);

  // Auto-generate image when modal opens or template changes (with debouncing)
  useEffect(() => {
    if (isVisible && market && !generatedImage) {
      // Cancel any existing generation
      cancelCurrentGeneration();
      
      // Debounce template changes
      generationTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && !isGeneratingImage) {
          handleGenerateImage();
        }
      }, 300); // 300ms debounce for template changes
      
      return () => {
        if (generationTimeoutRef.current) {
          clearTimeout(generationTimeoutRef.current);
        }
      };
    }
  }, [isVisible, market, selectedTemplate, generatedImage]);

  // Create portal container
  useEffect(() => {
    // Ensure we have a portal container
    if (!document.getElementById('modal-portal')) {
      const portalContainer = document.createElement('div');
      portalContainer.id = 'modal-portal';
      document.body.appendChild(portalContainer);
    }
  }, []);

  /**
   * Generate celebration image
   */
  const handleGenerateImage = async () => {
    if (!market || isGeneratingImage) return;

    // Create new abort controller for this generation
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsGeneratingImage(true);
    setGenerationProgress(0);
    setGenerationStage('Initializing...');

    try {
      const userAddress = '0x' + '1'.repeat(40); // Placeholder - get from actual wallet
      
      let result;
      
      // Check if request was cancelled before proceeding
      if (signal.aborted) return;
      
      // Skip worker entirely since it always fails - go directly to fallback
      // This eliminates the confusing error notifications
      result = await generateImageFallback(market, selectedTemplate, userAddress);

      // Check if request was cancelled during generation
      if (signal.aborted || !isMountedRef.current) {
        return;
      }

      // Handle success
      if (result && result.imageData) {
        setGeneratedImage(result.imageData, result.downloadUrl, result.generationTime);
        setIsGeneratingImage(false);
        
        // Emit success event for consistency
        emit('image:generate-complete', {
          imageData: result.imageData,
          downloadUrl: result.downloadUrl,
          generationTime: result.generationTime,
        });
      }
    } catch (error) {
      // Only show error if request wasn't cancelled
      if (!signal.aborted && isMountedRef.current) {
        console.error('Image generation failed:', error);
        toast.error('Failed to generate celebration image');
        setIsGeneratingImage(false);
      }
    } finally {
      // Clean up abort controller
      if (abortControllerRef.current === abortControllerRef.current) {
        abortControllerRef.current = null;
      }
    }
  };

  /**
   * Handle template selection
   */
  const handleTemplateChange = (template: TemplateType) => {
    if (template === selectedTemplate) return;
    
    // Cancel any ongoing generation immediately
    cancelCurrentGeneration();
    
    setTemplate(template);
    
    // Clear existing image to trigger regeneration
    if (generatedImage) {
      setGeneratedImage('', '', 0);
    }
    
    // The useEffect will handle the debounced regeneration
  };

  /**
   * Handle link copying
   */
  const handleCopyLink = async () => {
    try {
      await copyToClipboard(shareUrl);
      toast.success('Link copied to clipboard!');
      
      trackEvent('post_creation_link_copied', {
        market_address: market?.address || '',
        source: 'new_modal',
      });
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  /**
   * Handle image download
   */
  const handleDownloadImage = () => {
    if (!downloadUrl || !market) {
      toast.error('No image available to download');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `kuri-circle-${market.address.slice(0, 8)}-${selectedTemplate}.png`;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Safe cleanup
      setTimeout(() => {
        try {
          if (link.parentNode === document.body) {
            document.body.removeChild(link);
          }
        } catch (cleanupError) {
          console.warn('Download link cleanup failed:', cleanupError);
          if (link.remove) {
            link.remove();
          }
        }
      }, 100);

      toast.success('Celebration image downloaded!');
      
      trackEvent('celebration_image_downloaded', {
        template: selectedTemplate,
        market_address: market.address,
        participant_count: market.totalParticipants,
        interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
        generation_time: imageGenerationTime,
        source: 'new_modal',
      });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download image');
    }
  };

  /**
   * Handle image sharing
   */
  const handleShareImage = async () => {
    if (!generatedImage || !market) {
      toast.error('No image available to share');
      return;
    }

    setSharing(true);

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], `kuri-circle-${market.name?.replace(/\s+/g, '-') || 'circle'}.png`, {
        type: 'image/png'
      });

      const shareData = {
        title: shareTitle,
        text: customMessage || defaultShareMessage,
        files: [file],
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Celebration image shared successfully!');
        
        trackEvent('celebration_image_shared', {
          template: selectedTemplate,
          method: 'native_share',
          market_address: market.address,
          participant_count: market.totalParticipants,
          interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
          source: 'new_modal',
        });
      } else {
        // Fallback to clipboard
        await copyImageToClipboard(generatedImage);
        toast.success('Image copied to clipboard! Paste it anywhere to share.');
        
        trackEvent('celebration_image_shared', {
          template: selectedTemplate,
          method: 'clipboard',
          market_address: market.address,
          participant_count: market.totalParticipants,
          interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
          source: 'new_modal',
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled
        return;
      }
      
      console.error('Share failed:', error);
      toast.error('Failed to share image. Try downloading instead.');
      
      trackEvent('celebration_image_share_failed', {
        template: selectedTemplate,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        market_address: market?.address,
        source: 'new_modal',
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

  // Get portal container
  const portalContainer = document.getElementById('modal-portal');
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

      {/* Template Selector */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center gap-1 xs:gap-2 flex-wrap mb-4"
      >
        {(['hero', 'stats', 'minimal'] as TemplateType[]).map(template => (
          <button
            key={template}
            onClick={() => handleTemplateChange(template)}
            disabled={isGeneratingImage}
            className={`px-2 py-1 rounded-full text-xs font-medium transition-all touch-manipulation ${
              selectedTemplate === template 
                ? 'bg-[#C84E31] text-white shadow-sm' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
            }`}
          >
            {template === 'hero' ? '🎉 Party' : template === 'stats' ? '📈 Stats' : '✨ Clean'}
          </button>
        ))}
      </motion.div>

      {/* Image Display */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center w-full mb-4"
      >
        {isGeneratingImage ? (
          <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[16/10] rounded-lg bg-gray-100 border border-[#E8DED1] flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#C84E31] border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-gray-500 text-xs text-center px-2">
              {generationStage || 'Generating image...'}
            </span>
            {generationProgress > 0 && (
              <div className="w-24 h-1 bg-gray-200 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-[#C84E31] transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            )}
          </div>
        ) : generatedImage ? (
          <div className="w-full max-w-[280px] sm:max-w-[320px]">
            <img 
              src={generatedImage} 
              alt="Circle celebration" 
              loading="lazy"
              className="w-full aspect-[16/10] rounded-lg shadow-sm object-cover border border-[#E8DED1]"
            />
          </div>
        ) : (
          <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-[16/10] rounded-lg bg-gray-100 border border-[#E8DED1] flex items-center justify-center">
            <span className="text-gray-500 text-xs text-center px-2">
              Failed to generate image
            </span>
          </div>
        )}
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
        className="grid grid-cols-3 gap-2 mb-4"
      >
        <Button
          onClick={handleDownloadImage}
          disabled={!downloadUrl || isGeneratingImage}
          className="bg-[#8B6F47] hover:bg-[#8B6F47]/90 text-white rounded font-medium text-xs py-2 px-2 h-auto touch-manipulation disabled:opacity-50"
        >
          <Download className="w-3 h-3 mr-1" />
          <span>Download</span>
        </Button>
        
        <Button
          onClick={handleShareImage}
          disabled={!canShare || isGeneratingImage}
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
          <span>Copy</span>
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