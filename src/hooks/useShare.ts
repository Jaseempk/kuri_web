import { useState, useCallback } from "react";
import { toast } from "sonner";
import { KuriMarket } from "./useKuriMarkets";
import {
  copyToClipboard,
  generateShareData,
  detectWebShareSupport,
  canShareData,
  getShareUrl,
} from "../utils/shareUtils";
import {
  generatePlatformShare,
  generatePlatformShareUrl,
  PLATFORM_URLS,
  SHARE_TEMPLATES,
} from "../constants/shareTemplates";

export interface ShareOptions {
  customMessage?: string;
  template?: keyof typeof SHARE_TEMPLATES;
  platform?: keyof typeof PLATFORM_URLS;
  fallbackToModal?: boolean;
  title?: string;
  text?: string;
  url?: string;
}

export interface ShareResult {
  success: boolean;
  method: "native" | "platform" | "clipboard" | "modal";
  error?: string;
}

/**
 * Hook for sharing market data with Web Share API integration and fallbacks
 * @returns Share utilities and state
 */
export const useShare = () => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [lastSharedMarket, setLastSharedMarket] = useState<KuriMarket | null>(
    null
  );

  /**
   * Share a market using the best available method
   * @param market - The market to share
   * @param options - Share options
   * @returns Promise with share result
   */
  const shareMarket = useCallback(
    async (
      market: KuriMarket,
      options: ShareOptions = {}
    ): Promise<ShareResult> => {
      const {
        customMessage,
        template = "DEFAULT",
        platform,
        fallbackToModal = true,
      } = options;

      setIsSharing(true);
      setLastSharedMarket(market);

      try {
        // If specific platform is requested, use platform sharing
        if (platform) {
          return await shareToPlatform(market, platform, {
            customMessage,
            template,
          });
        }

        // Try Web Share API first (native sharing)
        if (detectWebShareSupport()) {
          const shareData = generateShareData(market, customMessage);

          if (canShareData(shareData)) {
            try {
              await navigator.share(shareData);
              toast.success("Shared successfully!");
              return { success: true, method: "native" };
            } catch (error: any) {
              // User cancelled or share failed
              if (error.name === "AbortError") {
                return {
                  success: false,
                  method: "native",
                  error: "Share cancelled",
                };
              }
              // Fall through to other methods
              console.warn("Native share failed:", error);
            }
          }
        }

        // Fallback to clipboard copy
        return await copyShareLink(market, { customMessage, template });
      } catch (error: any) {
        const errorMessage = error.message || "Failed to share";
        toast.error(`Share failed: ${errorMessage}`);
        return { success: false, method: "clipboard", error: errorMessage };
      } finally {
        setIsSharing(false);
      }
    },
    []
  );

  /**
   * Share to a specific platform
   * @param market - The market to share
   * @param platform - The target platform
   * @param options - Share options
   * @returns Promise with share result
   */
  const shareToPlatform = useCallback(
    async (
      market: KuriMarket,
      platform: keyof typeof PLATFORM_URLS,
      options: ShareOptions = {}
    ): Promise<ShareResult> => {
      const { customMessage, template = "DEFAULT" } = options;

      try {
        const platformKey = platform as keyof typeof PLATFORM_URLS;
        const shareData = generatePlatformShare(
          platformKey as any, // Type assertion for platform compatibility
          market,
          template,
          customMessage
        );

        // Open platform share URL
        window.open(shareData.platformUrl, "_blank", "noopener,noreferrer");

        toast.success(`Opening ${platform.toLowerCase()} share...`);
        return { success: true, method: "platform" };
      } catch (error: any) {
        const errorMessage = error.message || `Failed to share to ${platform}`;
        toast.error(errorMessage);
        return { success: false, method: "platform", error: errorMessage };
      }
    },
    []
  );

  /**
   * Copy share link to clipboard
   * @param market - The market to share
   * @param options - Share options
   * @returns Promise with share result
   */
  const copyShareLink = useCallback(
    async (
      market: KuriMarket,
      options: ShareOptions = {}
    ): Promise<ShareResult> => {
      const { customMessage, template = "DEFAULT" } = options;

      try {
        const shareUrl = getShareUrl(market.address);
        let textToCopy = shareUrl;

        // Include custom message or generated text if provided
        if (customMessage || template !== "DEFAULT") {
          const shareData = generateShareData(market, customMessage);
          textToCopy = `${shareData.text}\n\n${shareUrl}`;
        }

        const success = await copyToClipboard(textToCopy);

        if (success) {
          toast.success("Link copied to clipboard!");
          return { success: true, method: "clipboard" };
        } else {
          toast.error("Failed to copy to clipboard");
          return {
            success: false,
            method: "clipboard",
            error: "Clipboard access denied",
          };
        }
      } catch (error: any) {
        const errorMessage = error.message || "Failed to copy link";
        toast.error(errorMessage);
        return { success: false, method: "clipboard", error: errorMessage };
      }
    },
    []
  );

  /**
   * Open share modal as fallback
   * @param market - The market to share
   */
  const openShareModal = useCallback((market: KuriMarket) => {
    setLastSharedMarket(market);
    setShareModalOpen(true);
  }, []);

  /**
   * Close share modal
   */
  const closeShareModal = useCallback(() => {
    setShareModalOpen(false);
    setLastSharedMarket(null);
  }, []);

  /**
   * Quick share with clipboard copy (for share buttons)
   * @param market - The market to share
   * @returns Promise with share result
   */
  const quickShare = useCallback(
    async (market: KuriMarket): Promise<ShareResult> => {
      // Try native share first, then fallback to clipboard
      if (detectWebShareSupport()) {
        return await shareMarket(market, { fallbackToModal: false });
      } else {
        return await copyShareLink(market);
      }
    },
    [shareMarket, copyShareLink]
  );

  /**
   * Check if native sharing is available
   * @returns Boolean indicating Web Share API support
   */
  const canNativeShare = useCallback((): boolean => {
    return detectWebShareSupport();
  }, []);

  /**
   * Generate share preview data
   * @param market - The market
   * @param options - Share options
   * @returns Share preview data
   */
  const getSharePreview = useCallback(
    (market: KuriMarket, options: ShareOptions = {}) => {
      const { customMessage, template = "DEFAULT" } = options;
      return generateShareData(market, customMessage);
    },
    []
  );

  /**
   * Batch share to multiple platforms
   * @param market - The market to share
   * @param platforms - Array of platforms
   * @param options - Share options
   * @returns Promise with results array
   */
  const shareToMultiplePlatforms = useCallback(
    async (
      market: KuriMarket,
      platforms: (keyof typeof PLATFORM_URLS)[],
      options: ShareOptions = {}
    ): Promise<ShareResult[]> => {
      const results: ShareResult[] = [];

      for (const platform of platforms) {
        try {
          const result = await shareToPlatform(market, platform, options);
          results.push(result);
        } catch (error) {
          results.push({
            success: false,
            method: "platform",
            error: `Failed to share to ${platform}`,
          });
        }
      }

      return results;
    },
    [shareToPlatform]
  );

  const share = async (options: ShareOptions): Promise<void> => {
    if (!navigator.share) {
      throw new Error("Web Share API not supported");
    }

    try {
      await navigator.share(options);
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        throw new Error("Failed to share");
      }
    }
  };

  return {
    // Main sharing function
    shareMarket,

    // Platform-specific sharing
    shareToPlatform,

    // Clipboard sharing
    copyShareLink,

    // Quick share for buttons
    quickShare,

    // Modal management
    openShareModal,
    closeShareModal,
    shareModalOpen,
    lastSharedMarket,

    // Utility functions
    canNativeShare,
    getSharePreview,
    shareToMultiplePlatforms,

    // State
    isSharing,

    // New share function
    share,
  };
};
