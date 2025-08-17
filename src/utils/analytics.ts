import { track } from "@vercel/analytics";

// Define event types for type safety
export interface AnalyticsEvents {
  // Market-related events
  market_created: {
    market_address: string;
    interval_type: "weekly" | "monthly";
    participants: number;
    amount: string;
  };
  market_joined: {
    market_address: string;
    interval_type: "weekly" | "monthly";
    participants: number;
  };
  market_shared: {
    market_address: string;
    platform: "twitter" | "telegram" | "whatsapp" | "copy" | "native" | "download" | "clipboard";
    source: "card" | "detail" | "post_creation";
  };
  market_initialized: {
    market_address: string;
    participants: number;
    amount: string;
  };

  // Celebration image events
  celebration_image_generated: {
    template: string;
    market_address: string;
    participant_count: number;
    interval_type: "weekly" | "monthly";
    generation_time: number;
    source: string;
  };
  celebration_image_downloaded: {
    template: string;
    market_address: string;
    participant_count: number;
    interval_type: "weekly" | "monthly";
    generation_time: number;
    source: string;
  };
  celebration_image_shared: {
    template: string;
    method: "native_share" | "clipboard";
    market_address: string;
    participant_count: number;
    interval_type: "weekly" | "monthly";
    source: string;
  };
  celebration_image_generation_failed: {
    template: string;
    error_message: string;
    market_address: string;
    user_agent: string;
    source: string;
  };
  celebration_image_share_failed: {
    template: string;
    error_message: string;
    market_address: string;
    source: string;
  };

  // Post creation modal events
  post_creation_link_copied: {
    market_address: string;
    source: string;
  };

  // User interaction events
  wallet_connected: {
    wallet_type: string;
    chain_id: number;
  };
  wallet_disconnected: {
    session_duration: number; // in seconds
  };
  profile_created: {
    has_display_name: boolean;
    has_bio: boolean;
  };
  profile_updated: {
    fields_updated: string; // comma-separated string instead of array
  };

  // Transaction events
  deposit_made: {
    market_address: string;
    amount: string;
    interval_index: number;
  };
  deposit_failed: {
    market_address: string;
    error_type:
      | "insufficient_balance"
      | "approval_failed"
      | "transaction_failed";
  };
  claim_made: {
    market_address: string;
    amount: string;
    interval_index: number;
  };
  claim_failed: {
    market_address: string;
    error_type: "not_winner" | "already_claimed" | "transaction_failed";
  };

  // Navigation events
  page_view: {
    page: string;
    referrer?: string;
  };
  market_detail_viewed: {
    market_address: string;
    market_state: "inlaunch" | "active" | "completed" | "failed" | "unknown";
  };
  profile_viewed: {
    profile_address: string;
    viewer_address?: string;
  };

  // Onboarding events
  onboarding_started: {
    source: "landing" | "direct" | "share_link";
  };
  onboarding_completed: {
    duration: number; // in seconds
    steps_completed: number;
  };
  onboarding_abandoned: {
    step: string;
    duration: number;
  };

  // Error events
  error_occurred: {
    error_type: string;
    page: string;
    message: string;
  };
}

/**
 * Type-safe analytics tracking function
 * @param event - The event name (must be a key from AnalyticsEvents)
 * @param properties - The event properties (must match the event type)
 */
export function trackEvent<T extends keyof AnalyticsEvents>(
  event: T,
  properties: AnalyticsEvents[T]
): void {
  try {
    // Only track in production or if explicitly enabled
    if (
      import.meta.env.MODE === "development" &&
      !import.meta.env.VITE_ENABLE_ANALYTICS
    ) {
      console.log(`[Analytics] ${event}:`, properties);
      return;
    }

    track(event, properties as any);
  } catch (error) {
    // Silently fail to avoid breaking the app
    console.warn("Analytics tracking failed:", error);
  }
}

/**
 * Track page views with additional context
 */
export function trackPageView(
  page: string,
  additionalData?: Record<string, any>
): void {
  trackEvent("page_view", {
    page,
    referrer: document.referrer || undefined,
    ...additionalData,
  });
}

/**
 * Track wallet connection events
 */
export function trackWalletConnection(
  walletType: string,
  chainId: number
): void {
  trackEvent("wallet_connected", {
    wallet_type: walletType,
    chain_id: chainId,
  });
}

/**
 * Track market creation with metadata
 */
export function trackMarketCreation(
  marketAddress: string,
  intervalType: "weekly" | "monthly",
  participants: number,
  amount: string
): void {
  trackEvent("market_created", {
    market_address: marketAddress,
    interval_type: intervalType,
    participants,
    amount,
  });
}

/**
 * Track market sharing events
 */
export function trackMarketShare(
  marketAddress: string,
  platform: "twitter" | "telegram" | "whatsapp" | "copy" | "native",
  source: "card" | "detail" | "post_creation"
): void {
  trackEvent("market_shared", {
    market_address: marketAddress,
    platform,
    source,
  });
}

/**
 * Track deposit events
 */
export function trackDeposit(
  marketAddress: string,
  amount: string,
  intervalIndex: number
): void {
  trackEvent("deposit_made", {
    market_address: marketAddress,
    amount,
    interval_index: intervalIndex,
  });
}

/**
 * Track claim events
 */
export function trackClaim(
  marketAddress: string,
  amount: string,
  intervalIndex: number
): void {
  trackEvent("claim_made", {
    market_address: marketAddress,
    amount,
    interval_index: intervalIndex,
  });
}

/**
 * Track error events
 */
export function trackError(
  errorType: string,
  page: string,
  message: string
): void {
  trackEvent("error_occurred", {
    error_type: errorType,
    page,
    message,
  });
}

/**
 * Track profile updates with field list as comma-separated string
 */
export function trackProfileUpdate(fieldsUpdated: string[]): void {
  trackEvent("profile_updated", {
    fields_updated: fieldsUpdated.join(", "),
  });
}
