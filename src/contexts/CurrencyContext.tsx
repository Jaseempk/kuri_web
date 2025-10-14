/**
 * Currency Context
 * Provides global currency state and conversion functions
 *
 * Note: This context handles a potential race condition between geolocation detection
 * and loading user preferences. We wait for geolocation to complete before loading
 * or applying any saved preferences to ensure the correct currency is displayed based
 * on the user's location and preferences.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { currencyService } from "../services/currencyService";
import type {
  ExchangeRate,
  CurrencyPreference,
} from "../services/currencyTypes";
import { useGeolocation } from "../hooks/useGeolocation";

interface CurrencyContextValue {
  // Exchange rate data
  exchangeRate: ExchangeRate | null;
  isConnected: boolean;
  isRateStale: boolean;
  rateAge: number;

  // User preferences
  displayCurrency: "USD" | "INR";
  isIndianUser: boolean;

  // Conversion functions
  convertUsdToInr: (usdAmount: number) => number;
  convertInrToUsd: (inrAmount: number) => number;

  // UI actions
  toggleCurrency: () => void;
  refreshRate: () => void;

  // Formatting
  formatCurrency: (
    amount: number,
    currency: "USD" | "INR",
    decimals?: number
  ) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(
  undefined
);

const PREFERENCE_KEY = "kuri_currency_preference";

interface CurrencyProviderProps {
  children: ReactNode;
}

export const CurrencyProvider: React.FC<CurrencyProviderProps> = ({
  children,
}) => {
  const { location, isLoading: isLocationLoading } = useGeolocation();
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(
    currencyService.getCurrentRate()
  );
  const [displayCurrency, setDisplayCurrency] = useState<"USD" | "INR">("USD");
  const [isConnected, setIsConnected] = useState(currencyService.isConnected());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Determine if user is from India or Malaysia
  const isIndianUser = location?.country === "IN" || location?.country === "MY";

  // Load user preference from localStorage only after geolocation is complete
  useEffect(() => {
    // Skip if geolocation is still loading or preferences already loaded
    if (isLocationLoading || preferencesLoaded) {
      return;
    }

    try {
      const saved = localStorage.getItem(PREFERENCE_KEY);

      if (saved) {
        const preference: CurrencyPreference = JSON.parse(saved);

        setDisplayCurrency(preference.displayCurrency);
      } else {
        // Default to INR for Indian users
        const defaultCurrency = isIndianUser ? "INR" : "USD";

        setDisplayCurrency(defaultCurrency);
      }

      // Mark preferences as loaded to prevent reloading
      setPreferencesLoaded(true);
    } catch (error) {
      console.error("[CurrencyContext] Failed to load preference:", error);
      setPreferencesLoaded(true); // Mark as loaded even on error to prevent infinite retries
    }
  }, [isIndianUser, isLocationLoading, preferencesLoaded]);

  // Initialize currency service and subscribe to updates
  useEffect(() => {
    currencyService.initialize();

    // Subscribe to rate updates
    const unsubscribe = currencyService.subscribe((rate) => {
      setExchangeRate(rate);
      setIsConnected(currencyService.isConnected());
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      // Don't disconnect - keep connection alive for other components
    };
  }, []);

  // Save preference to localStorage whenever it changes, but only after preferences are loaded
  useEffect(() => {
    // Don't save preferences until initial loading is complete
    if (!preferencesLoaded) {
      return;
    }

    try {
      const preference: CurrencyPreference = {
        displayCurrency,
        isIndianUser,
      };
    } catch (error) {
      console.error("[CurrencyContext] Failed to save preference:", error);
    }
  }, [displayCurrency, isIndianUser, preferencesLoaded]);

  // Conversion functions
  const convertUsdToInr = useCallback(
    (usdAmount: number): number => {
      return currencyService.convertUsdToInr(usdAmount);
    },
    [exchangeRate]
  ); // Re-memoize when rate changes

  const convertInrToUsd = useCallback(
    (inrAmount: number): number => {
      return currencyService.convertInrToUsd(inrAmount);
    },
    [exchangeRate]
  );

  // Toggle between USD and INR
  const toggleCurrency = useCallback(() => {
    setDisplayCurrency((prev) => (prev === "USD" ? "INR" : "USD"));
  }, []);

  // Refresh exchange rate
  const refreshRate = useCallback(() => {
    currencyService.refresh();
  }, []);

  // Format currency with proper symbols and decimals
  const formatCurrency = useCallback(
    (amount: number, currency: "USD" | "INR", decimals: number = 2): string => {
      if (currency === "USD") {
        return `$${amount.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`;
      } else {
        return `₹${amount.toLocaleString("en-IN", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })}`;
      }
    },
    []
  );

  // Calculate derived values
  const isRateStale = currencyService.isRateStale();
  const rateAge = currencyService.getRateAge();

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo<CurrencyContextValue>(
    () => ({
      exchangeRate,
      isConnected,
      isRateStale,
      rateAge,
      displayCurrency,
      isIndianUser,
      convertUsdToInr,
      convertInrToUsd,
      toggleCurrency,
      refreshRate,
      formatCurrency,
    }),
    [
      exchangeRate,
      isConnected,
      isRateStale,
      rateAge,
      displayCurrency,
      isIndianUser,
      convertUsdToInr,
      convertInrToUsd,
      toggleCurrency,
      refreshRate,
      formatCurrency,
    ]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom hook to use currency context
export const useCurrency = (): CurrencyContextValue => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};
