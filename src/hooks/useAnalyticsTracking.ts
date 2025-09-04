import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import {
  trackWalletConnection,
  trackPageView,
  trackEvent,
} from "../utils/analytics";
import { getDefaultChainId } from "../config/contracts";

export function useAnalyticsTracking() {
  const { smartAddress: address, account } = useAuthContext();
  // Dynamic chain ID based on environment
  const chainId = getDefaultChainId();
  const connector = { name: 'Para' }; // Para connector info
  const location = useLocation();
  const previousAddress = useRef<string | undefined>();
  const sessionStartTime = useRef<number>(Date.now());

  // Track wallet connection/disconnection
  useEffect(() => {
    const currentAddress = address || undefined;
    const prevAddress = previousAddress.current;

    if (currentAddress && currentAddress !== prevAddress && connector) {
      // Wallet connected
      trackWalletConnection(connector.name, chainId);
      sessionStartTime.current = Date.now();
    } else if (!currentAddress && prevAddress) {
      // Wallet disconnected
      const sessionDuration = Math.floor(
        (Date.now() - sessionStartTime.current) / 1000
      );
      trackEvent("wallet_disconnected", {
        session_duration: sessionDuration,
      });
    }

    previousAddress.current = currentAddress;
  }, [address, connector, chainId]);

  // Track page views
  useEffect(() => {
    const page = location.pathname;
    trackPageView(page);
  }, [location.pathname]);

  // Track market detail views with additional context
  useEffect(() => {
    if (
      location.pathname.startsWith("/markets/") &&
      location.pathname !== "/markets"
    ) {
      const marketAddress = location.pathname.split("/markets/")[1];
      if (marketAddress && marketAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        trackEvent("market_detail_viewed", {
          market_address: marketAddress,
          market_state: "unknown", // This would need to be enhanced with actual market state
        });
      }
    }
  }, [location.pathname]);

  // Track profile views
  useEffect(() => {
    if (location.pathname.startsWith("/u/")) {
      const profileIdentifier = location.pathname.split("/u/")[1];
      if (profileIdentifier) {
        trackEvent("profile_viewed", {
          profile_address: profileIdentifier,
          viewer_address: address || undefined,
        });
      }
    }
  }, [location.pathname, address]);
}
