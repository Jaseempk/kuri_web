/**
 * Currency Service
 * Manages real-time USDC-INR exchange rates via Backend REST API
 * Replaces direct CoinDCX WebSocket connection to avoid CORS issues
 *
 * Architecture: Frontend polls backend API → Backend maintains WebSocket to CoinDCX
 */

import type { ExchangeRate, CachedRate } from "./currencyTypes";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const CACHE_KEY = "kuri_usdc_inr_rate";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const FALLBACK_RATE = 85;
const POLL_INTERVAL = 2.5 * 60 * 1000; // 2.5 minutes (150 seconds)

class CurrencyService {
  private currentRate: ExchangeRate | null = null;
  private listeners: Set<(rate: ExchangeRate) => void> = new Set();
  private pollInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  constructor() {
    // Load cached rate on initialization
    this.loadCachedRate();
  }

  /**
   * Initialize polling from backend API (replaces WebSocket)
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Fetch immediately
    this.fetchRateFromBackend();

    // Poll every 10 seconds
    this.pollInterval = setInterval(() => {
      this.fetchRateFromBackend();
    }, POLL_INTERVAL);
  }

  /**
   * Fetch rate from backend API
   */
  private async fetchRateFromBackend(): Promise<void> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/currency/usdc-inr`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Backend response matches ExchangeRate interface exactly
        this.updateRate({
          usdcToInr: result.data.usdcToInr,
          usdtToInr: result.data.usdtToInr,
          lastUpdated: result.data.lastUpdated,
          source: result.data.source, // 'websocket' | 'cache' | 'fallback' | 'stale'
        });
      }
    } catch (error) {
      console.error(
        "[CurrencyService] Failed to fetch rate from backend:",
        error
      );
      // Keep using cached rate if fetch fails
      // No need to update - current rate remains unchanged
    }
  }

  /**
   * Update current rate and notify listeners
   */
  private updateRate(rate: ExchangeRate): void {
    this.currentRate = rate;
    this.cacheRate(rate);
    this.notifyListeners(rate);
  }

  /**
   * Cache rate to localStorage
   */
  private cacheRate(rate: ExchangeRate): void {
    try {
      const cached: CachedRate = {
        rate: rate.usdcToInr,
        timestamp: rate.lastUpdated,
        source: rate.usdtToInr === rate.usdcToInr ? "USDT" : "USDC",
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
    } catch (error) {
      console.error("[CurrencyService] Failed to cache rate:", error);
    }
  }

  /**
   * Load cached rate from localStorage
   */
  private loadCachedRate(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) {
        this.setFallbackRate();
        return;
      }

      const parsedCache: CachedRate = JSON.parse(cached);
      const age = Date.now() - parsedCache.timestamp;

      if (age < CACHE_DURATION) {
        this.currentRate = {
          usdcToInr: parsedCache.rate,
          usdtToInr: null,
          lastUpdated: parsedCache.timestamp,
          source: "cache",
        };
      } else {
        this.setFallbackRate();
      }
    } catch (error) {
      console.error("[CurrencyService] Failed to load cached rate:", error);
      this.setFallbackRate();
    }
  }

  /**
   * Set fallback rate when cache and backend are unavailable
   */
  private setFallbackRate(): void {
    this.currentRate = {
      usdcToInr: FALLBACK_RATE,
      usdtToInr: null,
      lastUpdated: Date.now(),
      source: "fallback",
    };
  }

  /**
   * Notify all listeners of rate updates
   */
  private notifyListeners(rate: ExchangeRate): void {
    this.listeners.forEach((listener) => {
      try {
        listener(rate);
      } catch (error) {
        console.error("[CurrencyService] Error notifying listener:", error);
      }
    });
  }

  /**
   * Subscribe to rate updates
   */
  public subscribe(listener: (rate: ExchangeRate) => void): () => void {
    this.listeners.add(listener);

    // Immediately notify with current rate if available
    if (this.currentRate) {
      listener(this.currentRate);
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current exchange rate
   */
  public getCurrentRate(): ExchangeRate | null {
    return this.currentRate;
  }

  /**
   * Convert USD to INR
   */
  public convertUsdToInr(usdAmount: number): number {
    const rate = this.currentRate?.usdcToInr || FALLBACK_RATE;
    return usdAmount * rate;
  }

  /**
   * Convert INR to USD
   */
  public convertInrToUsd(inrAmount: number): number {
    const rate = this.currentRate?.usdcToInr || FALLBACK_RATE;
    return inrAmount / rate;
  }

  /**
   * Check if rate is stale (older than 5 minutes)
   */
  public isRateStale(): boolean {
    if (!this.currentRate) return true;
    const age = Date.now() - this.currentRate.lastUpdated;
    return age > CACHE_DURATION;
  }

  /**
   * Get rate age in seconds
   */
  public getRateAge(): number {
    if (!this.currentRate) return Infinity;
    return Math.floor((Date.now() - this.currentRate.lastUpdated) / 1000);
  }

  /**
   * Manually refresh rate (force fetch)
   */
  public refresh(): void {
    this.fetchRateFromBackend();
  }

  /**
   * Stop polling (cleanup)
   */
  public disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isInitialized = false;
  }

  /**
   * Check if service is initialized
   */
  public isConnected(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();
