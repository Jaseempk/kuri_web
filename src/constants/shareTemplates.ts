import { KuriMarket } from "../hooks/useKuriMarkets";

/**
 * Platform-specific character limits for optimized sharing
 */
export const PLATFORM_LIMITS = {
  TWITTER: 280,
  LINKEDIN: 700,
  FACEBOOK: 63206, // Practically unlimited
  TELEGRAM: 4096,
  WHATSAPP: 65536, // Practically unlimited
  EMAIL: 65536, // Practically unlimited
  SMS: 160, // Standard SMS length
} as const;

/**
 * Platform-specific URL templates for social media sharing
 */
export const PLATFORM_URLS = {
  TWITTER: "https://twitter.com/intent/tweet",
  LINKEDIN: "https://www.linkedin.com/sharing/share-offsite",
  FACEBOOK: "https://www.facebook.com/sharer/sharer.php",
  TELEGRAM: "https://t.me/share/url",
  WHATSAPP: "https://wa.me/",
  REDDIT: "https://reddit.com/submit",
  EMAIL: "mailto:",
  SMS: "sms:",
} as const;

/**
 * Default share message templates for different contexts
 */
export const SHARE_TEMPLATES = {
  DEFAULT: {
    short: "🎯 Join this Kuri Circle and start building your financial future!",
    medium:
      "🎯 Join this community savings circle on Kuri Finance! Contribute weekly/monthly and win the full pool. Start building your financial future today.",
    long: "🎯 Join this community savings circle on Kuri Finance!\n\n💰 Contribute weekly/monthly\n🏆 Win the full pool\n👥 Build with your community\n\nStart building your financial future with zero-interest community savings.",
  },
  URGENT: {
    short: "⏰ Limited spots left in this Kuri Circle!",
    medium:
      "⏰ Limited spots left! Join this community savings circle on Kuri Finance before it fills up.",
    long: "⏰ Limited spots left in this community savings circle!\n\n🎯 Join now on Kuri Finance\n💰 Win the full pool\n👥 Build with your community\n\nDon't miss out - start your financial journey today!",
  },
  COMMUNITY: {
    short: "👥 Building wealth together with Kuri Finance!",
    medium:
      "👥 Join our community savings circle! We're building wealth together through Kuri Finance's zero-interest platform.",
    long: "👥 Building wealth together through community savings!\n\n🎯 Join our Kuri Circle\n💰 Zero interest, fair distribution\n🏆 Win when it's your turn\n\nCommunity-powered financial growth on Kuri Finance.",
  },
  INVITATION: {
    short: "📩 You're invited to join my Kuri Circle!",
    medium:
      "📩 Personal invitation: Join my community savings circle on Kuri Finance. Let's build wealth together!",
    long: "📩 You're personally invited to join my Kuri Circle!\n\n🎯 Community savings made simple\n💰 Fair, transparent, zero-interest\n👥 Trusted members only\n\nJoin me on Kuri Finance and let's grow together!",
  },
  SUCCESS: {
    short: "🎉 Just created my Kuri Circle - join me!",
    medium:
      "🎉 Just launched my community savings circle on Kuri Finance! Join me and let's build wealth together.",
    long: "🎉 I just created my community savings circle on Kuri Finance!\n\n🎯 Fair, transparent, community-driven\n💰 Zero interest, maximum trust\n👥 Building wealth together\n\nJoin me and start your financial journey!",
  },
} as const;

/**
 * Platform customization configuration interface
 */
interface PlatformConfig {
  hashtags: readonly string[];
  maxHashtags: number;
  includeEmojis: boolean;
  preferShort?: boolean;
  preferMedium?: boolean;
  preferLong?: boolean;
  professionalTone?: boolean;
  personalTone?: boolean;
  formalTone?: boolean;
}

/**
 * Platform-specific message customization
 */
export const PLATFORM_CUSTOMIZATIONS: Record<string, PlatformConfig> = {
  TWITTER: {
    hashtags: ["#KuriFinance", "#CommunityWealth", "#DeFi", "#SavingsCircle"],
    maxHashtags: 3,
    includeEmojis: true,
    preferShort: true,
  },
  LINKEDIN: {
    hashtags: [
      "#FinTech",
      "#CommunityFinance",
      "#WealthBuilding",
      "#FinancialInclusion",
    ],
    maxHashtags: 5,
    includeEmojis: false,
    preferMedium: true,
    professionalTone: true,
  },
  FACEBOOK: {
    hashtags: ["#KuriFinance", "#CommunityWealth", "#SavingsCircle"],
    maxHashtags: 3,
    includeEmojis: true,
    preferLong: true,
  },
  TELEGRAM: {
    hashtags: ["#Kuri", "#DeFi", "#Community"],
    maxHashtags: 3,
    includeEmojis: true,
    preferMedium: true,
  },
  WHATSAPP: {
    hashtags: [],
    maxHashtags: 0,
    includeEmojis: true,
    preferMedium: true,
    personalTone: true,
  },
  EMAIL: {
    hashtags: [],
    maxHashtags: 0,
    includeEmojis: false,
    preferLong: true,
    formalTone: true,
  },
};

/**
 * Generate platform-specific share URL
 * @param platform - The target platform
 * @param shareUrl - The URL to share
 * @param shareText - The text to share
 * @param title - Optional title for the share
 * @returns Complete platform share URL
 */
export const generatePlatformShareUrl = (
  platform: keyof typeof PLATFORM_URLS,
  shareUrl: string,
  shareText: string,
  title?: string
): string => {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = title ? encodeURIComponent(title) : "";

  switch (platform) {
    case "TWITTER":
      return `${PLATFORM_URLS.TWITTER}?text=${encodedText}&url=${encodedUrl}`;

    case "LINKEDIN":
      return `${PLATFORM_URLS.LINKEDIN}?url=${encodedUrl}`;

    case "FACEBOOK":
      return `${PLATFORM_URLS.FACEBOOK}?u=${encodedUrl}`;

    case "TELEGRAM":
      return `${PLATFORM_URLS.TELEGRAM}?url=${encodedUrl}&text=${encodedText}`;

    case "WHATSAPP":
      return `${PLATFORM_URLS.WHATSAPP}?text=${encodedText}%20${encodedUrl}`;

    case "REDDIT":
      return `${PLATFORM_URLS.REDDIT}?url=${encodedUrl}&title=${encodedTitle}`;

    case "EMAIL":
      const subject =
        encodedTitle || encodeURIComponent("Check out this Kuri Circle");
      const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
      return `${PLATFORM_URLS.EMAIL}?subject=${subject}&body=${body}`;

    case "SMS":
      const smsText = encodeURIComponent(`${shareText} ${shareUrl}`);
      return `${PLATFORM_URLS.SMS}?body=${smsText}`;

    default:
      return shareUrl;
  }
};

/**
 * Get optimized share text for specific platform
 * @param platform - The target platform
 * @param market - The market data
 * @param template - The message template type
 * @param customMessage - Optional custom message
 * @returns Optimized share text for the platform
 */
export const getOptimizedShareText = (
  platform: keyof typeof PLATFORM_CUSTOMIZATIONS,
  market: KuriMarket,
  template: keyof typeof SHARE_TEMPLATES = "DEFAULT",
  customMessage?: string
): string => {
  const platformConfig = PLATFORM_CUSTOMIZATIONS[platform];
  const templateData = SHARE_TEMPLATES[template];
  const limit = PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS];

  // Choose appropriate template length based on platform preference
  let baseText = "";
  if (platformConfig.preferShort) {
    baseText = templateData.short;
  } else if (platformConfig.preferMedium) {
    baseText = templateData.medium;
  } else if (platformConfig.preferLong) {
    baseText = templateData.long;
  } else {
    baseText = templateData.medium; // Default to medium
  }

  // Replace placeholders with market data
  const intervalText = market.intervalType === 0 ? "weekly" : "monthly";
  const contributionAmount = (Number(market.kuriAmount) / 1_000_000).toFixed(2);
  const totalPool = (
    (Number(market.kuriAmount) / 1_000_000) *
    market.totalParticipants
  ).toFixed(2);

  let shareText = baseText
    .replace(/weekly\/monthly/g, intervalText)
    .replace(/\$\d+\.?\d*/g, `$${contributionAmount}`)
    .replace(/full pool/g, `$${totalPool} pool`);

  // Add custom message if provided
  if (customMessage) {
    shareText = platformConfig.personalTone
      ? `${customMessage}\n\n${shareText}`
      : `${shareText}\n\n${customMessage}`;
  }

  // Add hashtags if supported
  if (platformConfig.hashtags.length > 0) {
    const hashtags = platformConfig.hashtags
      .slice(0, platformConfig.maxHashtags)
      .join(" ");
    shareText += `\n\n${hashtags}`;
  }

  // Trim to platform limit if needed
  if (shareText.length > limit) {
    shareText = shareText.substring(0, limit - 3) + "...";
  }

  return shareText;
};

/**
 * Get all available platforms for sharing
 * @returns Array of platform keys and display names
 */
export const getAvailablePlatforms = () =>
  [
    { key: "TWITTER", name: "Twitter", icon: "𝕏", color: "#000000" },
    { key: "LINKEDIN", name: "LinkedIn", icon: "💼", color: "#0077B5" },
    { key: "FACEBOOK", name: "Facebook", icon: "📘", color: "#1877F2" },
    { key: "TELEGRAM", name: "Telegram", icon: "✈️", color: "#0088CC" },
    { key: "WHATSAPP", name: "WhatsApp", icon: "💬", color: "#25D366" },
    { key: "EMAIL", name: "Email", icon: "📧", color: "#6B7280" },
    { key: "SMS", name: "SMS", icon: "💬", color: "#6B7280" },
  ] as const;

/**
 * Check if platform supports native sharing
 * @param platform - The platform to check
 * @returns Boolean indicating native share support
 */
export const supportsNativeShare = (
  platform: keyof typeof PLATFORM_URLS
): boolean => {
  return platform === "WHATSAPP" || platform === "SMS" || platform === "EMAIL";
};

/**
 * Generate complete share package for a platform
 * @param platform - Target platform
 * @param market - Market data
 * @param template - Message template
 * @param customMessage - Custom message
 * @returns Complete share data package
 */
export const generatePlatformShare = (
  platform: keyof typeof PLATFORM_CUSTOMIZATIONS,
  market: KuriMarket,
  template: keyof typeof SHARE_TEMPLATES = "DEFAULT",
  customMessage?: string
) => {
  const shareText = getOptimizedShareText(
    platform,
    market,
    template,
    customMessage
  );
  const shareUrl = `${
    typeof window !== "undefined"
      ? window.location.origin
      : "https://kuri.finance"
  }/markets/${market.address}`;
  const title = market.name
    ? `${market.name} | Kuri Finance`
    : "Join this Kuri Circle | Kuri Finance";

  const platformShareUrl = generatePlatformShareUrl(
    platform as keyof typeof PLATFORM_URLS,
    shareUrl,
    shareText,
    title
  );

  return {
    text: shareText,
    url: shareUrl,
    title,
    platformUrl: platformShareUrl,
    characterCount: shareText.length,
    characterLimit: PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS],
    isWithinLimit:
      shareText.length <=
      PLATFORM_LIMITS[platform as keyof typeof PLATFORM_LIMITS],
  };
};
