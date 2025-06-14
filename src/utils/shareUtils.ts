import { generateMarketShareUrl } from "./urlGenerator";
import { KuriMarket } from "../hooks/useKuriMarkets";

/**
 * Copy text to clipboard with fallback handling for older browsers
 * @param text - The text to copy to clipboard
 * @returns Promise<boolean> - Success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    // Modern clipboard API (preferred method)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    const success = document.execCommand("copy");
    document.body.removeChild(textArea);
    return success;
  } catch (error) {
    console.error("Failed to copy to clipboard:", error);
    return false;
  }
};

/**
 * Generate share text for a market with optional custom message
 * @param market - The KuriMarket object
 * @param customMessage - Optional custom message to include
 * @returns Formatted share text
 */
export const generateShareText = (
  market: KuriMarket,
  customMessage?: string
): string => {
  const intervalText = market.intervalType === 0 ? "weekly" : "monthly";
  const contributionAmount = (Number(market.kuriAmount) / 1_000_000).toFixed(2);
  const totalPool = (
    (Number(market.kuriAmount) / 1_000_000) *
    market.totalParticipants
  ).toFixed(2);

  // Generate market description
  const marketDescription = market.name
    ? `"${market.name}"`
    : "this community savings circle";

  // Build the share text
  let shareText = "";

  if (customMessage) {
    shareText += `${customMessage}\n\n`;
  }

  shareText += `🎯 Join ${marketDescription} on Kuri Finance!\n\n`;
  shareText += `💰 Contribute $${contributionAmount} ${intervalText}\n`;
  shareText += `🏆 Win $${totalPool} total pool\n`;
  shareText += `👥 ${market.activeParticipants}/${market.totalParticipants} members joined\n\n`;
  shareText += `Start building your financial future with community savings circles.`;

  return shareText;
};

/**
 * Get the complete shareable URL for a market
 * @param marketAddress - The contract address of the market
 * @returns The complete shareable URL with environment handling
 */
export const getShareUrl = (marketAddress: string): string => {
  try {
    return generateMarketShareUrl(marketAddress);
  } catch (error) {
    console.error("Failed to generate share URL:", error);
    // Fallback URL construction
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://kuri.finance";
    return `${baseUrl}/markets/${marketAddress}`;
  }
};

/**
 * Detect if the browser supports the Web Share API
 * @returns Boolean indicating Web Share API support
 */
export const detectWebShareSupport = (): boolean => {
  return (
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    typeof navigator.share === "function"
  );
};

/**
 * Check if the browser can share specific data
 * @param data - The share data to check
 * @returns Boolean indicating if the data can be shared
 */
export const canShareData = (data: ShareData): boolean => {
  if (!detectWebShareSupport()) return false;

  try {
    // Use canShare if available (Chrome 89+)
    if ("canShare" in navigator && typeof navigator.canShare === "function") {
      return navigator.canShare(data);
    }
    // Fallback: assume we can share if Web Share API is available
    return true;
  } catch (error) {
    console.error("Error checking share capability:", error);
    return false;
  }
};

/**
 * Generate complete share data object for Web Share API
 * @param market - The KuriMarket object
 * @param customMessage - Optional custom message
 * @returns ShareData object ready for navigator.share()
 */
export const generateShareData = (
  market: KuriMarket,
  customMessage?: string
): ShareData => {
  const shareText = generateShareText(market, customMessage);
  const shareUrl = getShareUrl(market.address);

  const title = market.name
    ? `${market.name} | Kuri Finance`
    : "Join this Kuri Circle | Kuri Finance";

  return {
    title,
    text: shareText,
    url: shareUrl,
  };
};

/**
 * Validate if a string looks like a valid share URL
 * @param url - The URL to validate
 * @returns Boolean indicating if URL appears valid
 */
export const isValidShareUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.protocol === "https:" ||
      (urlObj.protocol === "http:" && urlObj.pathname.includes("/markets/"))
    );
  } catch {
    return false;
  }
};

/**
 * Sanitize text for sharing (remove potentially problematic characters)
 * @param text - The text to sanitize
 * @returns Sanitized text safe for sharing
 */
export const sanitizeShareText = (text: string): string => {
  // Remove or replace characters that might cause issues in URLs or social media
  return text
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};
