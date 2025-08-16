import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Download, ExternalLink } from "lucide-react";
import { useClipboard } from "../../hooks/useClipboard";
import { useAccount } from "wagmi";
import { KuriMarket } from "../../types/market";
import { CelebrationImageGenerator } from "../celebration/CelebrationImageGenerator";
import { trackEvent } from "../../utils/analytics";
import { copyImageToClipboard, revokeDownloadUrl } from "../celebration/utils/exportUtils";
import { createPortal } from "react-dom";

interface PostCreationShareProps {
  market: KuriMarket;
  onClose: () => void;
  onViewMarket: () => void;
}

export const PostCreationShare = ({
  market,
  onClose,
  onViewMarket,
}: PostCreationShareProps) => {
  // Cleanup function for memory management
  const cleanup = () => {
    if (downloadUrl) {
      revokeDownloadUrl(downloadUrl);
      setDownloadUrl('');
    }
    if (generatedImage) {
      setGeneratedImage('');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, []);

  // Cleanup when new image is generated
  const handleNewImageGeneration = (imageData: string, newDownloadUrl: string, generationTime?: number) => {
    // Clean up previous URLs
    if (downloadUrl) {
      revokeDownloadUrl(downloadUrl);
    }
    
    setGeneratedImage(imageData);
    setDownloadUrl(newDownloadUrl);
    setImageGenerationTime(generationTime || 0);
  };
  const [customMessage, setCustomMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'hero' | 'stats' | 'minimal'>('hero');
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [imageGenerationTime, setImageGenerationTime] = useState<number>(0);
  const { copyToClipboard } = useClipboard();
  const { address } = useAccount();

  const shareUrl = `${window.location.origin}/markets/${market.address}`;

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleDownloadImage = () => {
    if (!downloadUrl) {
      toast.error('No image available to download');
      return;
    }
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `kuri-circle-${market.address.slice(0,8)}-${selectedTemplate}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Celebration image downloaded!');
    
    // Enhanced analytics tracking
    trackEvent('celebration_image_downloaded', {
      template: selectedTemplate,
      market_address: market.address,
      participant_count: market.totalParticipants,
      interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
      generation_time: imageGenerationTime,
      source: 'post_creation'
    });
  };

  const handleShareImage = async () => {
    if (!generatedImage) {
      toast.error('No image available to share');
      return;
    }
    
    try {
      setIsSharing(true);
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const file = new File([blob], `kuri-circle-${market.name.replace(/\s+/g, '-')}.png`, { 
        type: 'image/png' 
      });
      
      const shareData = {
        title: `🎉 I just created a Kuri Circle: ${market.name}`,
        text: customMessage || `Join my savings circle "${market.name}" and let's achieve our financial goals together! 💰`,
        files: [file]
      };
      
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Celebration image shared successfully!');
        
        // Enhanced analytics tracking
        trackEvent('celebration_image_shared', {
          template: selectedTemplate,
          method: 'native_share',
          market_address: market.address,
          participant_count: market.totalParticipants,
          interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
          source: 'post_creation'
        });
      } else {
        // Fallback: copy to clipboard using utility function
        await copyImageToClipboard(generatedImage);
        toast.success('Image copied to clipboard! Paste it anywhere to share.');
        
        // Enhanced analytics tracking
        trackEvent('celebration_image_shared', {
          template: selectedTemplate,
          method: 'clipboard',
          market_address: market.address,
          participant_count: market.totalParticipants,
          interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
          source: 'post_creation'
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled share dialog
        return;
      }
      console.error('Share failed:', error);
      
      // Enhanced error tracking
      trackEvent('celebration_image_share_failed', {
        template: selectedTemplate,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        market_address: market.address,
        source: 'post_creation'
      });
      
      toast.error('Failed to share image. Try downloading instead.');
    } finally {
      setIsSharing(false);
    }
  };


  const modalContent = (
    <>
      {/* Overlay */}
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999
        }}
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div 
        className="fixed inset-4 flex items-center justify-center z-[9999999]"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-[calc(100vw-32px)] xs:w-[calc(100vw-48px)] sm:w-[90%] sm:max-w-[400px] max-h-[calc(100vh-32px)] overflow-y-auto"
          style={{
            backgroundColor: 'rgba(245, 245, 220, 0.95)',
            border: '1px solid rgba(184, 134, 11, 0.2)',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-2 text-center mb-4">
            <h2 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-[#C84E31] leading-tight">
              Circle Created Successfully!
            </h2>
            <p className="text-[#B8860B] text-xs opacity-80">
              Share your circle with your community
            </p>
          </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-3 mt-3 sm:space-y-4 sm:mt-6"
        >

          {/* Template Selector - Compact */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center gap-1 xs:gap-2 flex-wrap"
          >
            {(['hero', 'stats', 'minimal'] as const).map(template => (
              <button
                key={template}
                onClick={() => setSelectedTemplate(template)}
                className={`px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  selectedTemplate === template 
                    ? 'bg-[#C84E31] text-white shadow-sm' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {template === 'hero' ? '🎉 Party' : template === 'stats' ? '📈 Stats' : '✨ Clean'}
              </button>
            ))}
          </motion.div>

          {/* Image Generator */}
          {address && (
            <CelebrationImageGenerator
              market={market}
              userAddress={address}
              template={selectedTemplate}
              onImageGenerated={(imageData, downloadUrl, generationTime) => {
                handleNewImageGeneration(imageData, downloadUrl, generationTime);
                
                // Track successful image generation
                trackEvent('celebration_image_generated', {
                  template: selectedTemplate,
                  market_address: market.address,
                  participant_count: market.totalParticipants,
                  interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
                  generation_time: generationTime || 0,
                  source: 'post_creation'
                });
              }}
              onError={(error) => {
                console.error('Image generation failed:', error);
                toast.error('Failed to generate celebration image');
                
                // Enhanced error tracking
                trackEvent('celebration_image_generation_failed', {
                  template: selectedTemplate,
                  error_message: error.message,
                  market_address: market.address,
                  user_agent: navigator.userAgent,
                  source: 'post_creation'
                });
              }}
            />
          )}

          {/* Generated Image Display - Compact for modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center w-full"
          >
            {generatedImage ? (
              <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-md mx-auto">
                <img 
                  src={generatedImage} 
                  alt="Circle celebration" 
                  loading="lazy"
                  className="w-full aspect-[16/10] sm:aspect-[3/2] rounded-lg shadow-sm object-cover border border-[#E8DED1]"
                />
              </div>
            ) : (
              <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-md aspect-[16/10] sm:aspect-[3/2] rounded-lg bg-gray-100 border border-[#E8DED1] flex items-center justify-center mx-auto">
                <span className="text-gray-500 text-xs text-center px-2">Generating image...</span>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-2"
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

            <div className="relative w-full">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a custom message (optional)"
                className="w-full px-2 py-1.5 rounded bg-[#F5F5DC] border border-[#B8860B]/30 focus:outline-none focus:ring-1 focus:ring-[#C84E31] resize-none text-xs touch-manipulation"
                rows={2}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-3 gap-2"
          >
            <Button
              onClick={handleDownloadImage}
              disabled={!downloadUrl}
              className="bg-[#8B6F47] hover:bg-[#8B6F47]/90 text-white rounded font-medium text-xs py-2 px-2 h-auto touch-manipulation"
            >
              <Download className="w-3 h-3 mr-1" />
              <span>Download</span>
            </Button>
            
            <Button
              onClick={handleShareImage}
              disabled={!generatedImage || isSharing}
              className="bg-[#C84E31] hover:bg-[#C84E31]/90 text-white rounded font-medium text-xs py-2 px-2 h-auto touch-manipulation"
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
                    <Share2 className="w-3 h-3 mr-1" />
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
          
          <Button
            onClick={onViewMarket}
            variant="outline"
            className="w-full border border-[#8B6F47] text-[#8B6F47] hover:bg-[#8B6F47]/10 rounded py-2 font-medium transition-all duration-300 text-xs h-auto touch-manipulation"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View Circle
          </Button>
        </motion.div>
        </div>
      </div>
    </>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};