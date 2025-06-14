import { KuriMarket } from "../hooks/useKuriMarkets";
import { generateMarketShareUrl } from "./urlGenerator";
import { toast } from "sonner";

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

interface NativeShareResult {
  success: boolean;
  method: "native" | "fallback";
  error?: string;
}

/**
 * Detect if the device supports native sharing
 */
export const detectNativeShare = (): boolean => {
  return (
    typeof navigator !== "undefined" &&
    "share" in navigator &&
    typeof navigator.share === "function"
  );
};

/**
 * Check if specific share data can be shared natively
 */
export const canShareData = (data: ShareData): boolean => {
  if (!detectNativeShare()) return false;

  try {
    if ("canShare" in navigator && typeof navigator.canShare === "function") {
      return navigator.canShare(data);
    }
    return true;
  } catch (error) {
    console.error("Error checking share capability:", error);
    return false;
  }
};

/**
 * Format share data for native sharing
 */
export const formatShareData = (
  market: KuriMarket,
  customMessage?: string
): ShareData => {
  const shareUrl = generateMarketShareUrl(market.address);
  const title = market.name
    ? `${market.name} | Kuri Finance`
    : "Join this Kuri Circle | Kuri Finance";

  const intervalText = market.intervalType === 0 ? "weekly" : "monthly";
  const contributionAmount = (Number(market.kuriAmount) / 1_000_000).toFixed(2);
  const totalPool = (
    (Number(market.kuriAmount) / 1_000_000) *
    market.totalParticipants
  ).toFixed(2);

  const defaultText = `Join this community savings circle with ${market.activeParticipants}/${market.totalParticipants} members. Contribute $${contributionAmount} ${intervalText} to win $${totalPool}. Start building your financial future with Kuri Finance.`;

  return {
    title,
    text: customMessage || defaultText,
    url: shareUrl,
  };
};

/**
 * Share content using native share API with fallback
 */
export const nativeShare = async (
  market: KuriMarket,
  customMessage?: string
): Promise<NativeShareResult> => {
  if (!detectNativeShare()) {
    return {
      success: false,
      method: "fallback",
      error: "Native sharing not supported",
    };
  }

  try {
    const shareData = formatShareData(market, customMessage);

    if (!canShareData(shareData)) {
      return {
        success: false,
        method: "fallback",
        error: "Cannot share this content",
      };
    }

    await navigator.share(shareData);
    toast.success("Shared successfully!");
    return { success: true, method: "native" };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        method: "native",
        error: "Share cancelled",
      };
    }

    console.error("Native share failed:", error);
    return {
      success: false,
      method: "fallback",
      error: error.message || "Share failed",
    };
  }
};

/**
 * Detect if the app is running in a native app
 */
export const detectNativeApp = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes("kuri") ||
    userAgent.includes("native") ||
    userAgent.includes("mobile")
  );
};

/**
 * Generate deep link for native app
 */
export const generateDeepLink = (market: KuriMarket): string => {
  const baseUrl = "kuri://market";
  const params = new URLSearchParams({
    address: market.address,
    name: market.name || "",
  });
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Handle deep linking for native apps
 */
export const handleDeepLink = (market: KuriMarket): void => {
  if (detectNativeApp()) {
    const deepLink = generateDeepLink(market);
    window.location.href = deepLink;
  }
};
