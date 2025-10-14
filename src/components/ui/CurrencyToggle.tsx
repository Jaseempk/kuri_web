/**
 * Currency Toggle Component
 * Allows users to switch between USD and INR display
 */

import React from 'react';
import { useCurrency } from '../../contexts/CurrencyContext';
import { RefreshCw } from 'lucide-react';

interface CurrencyToggleProps {
  /** Show refresh button */
  showRefresh?: boolean;
  /** Compact mode (smaller size) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export const CurrencyToggle: React.FC<CurrencyToggleProps> = ({
  showRefresh = false,
  compact = false,
  className = '',
}) => {
  const {
    displayCurrency,
    toggleCurrency,
    refreshRate,
    isConnected,
    isRateStale,
    rateAge,
    exchangeRate,
  } = useCurrency();

  const sizeClasses = compact
    ? 'text-xs py-1 px-2'
    : 'text-sm py-1.5 px-3';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Currency Toggle Buttons */}
      <div className="inline-flex rounded-lg bg-gray-100 p-0.5">
        <button
          onClick={toggleCurrency}
          className={`${sizeClasses} rounded-md font-medium transition-all ${
            displayCurrency === 'USD'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          USD
        </button>
        <button
          onClick={toggleCurrency}
          className={`${sizeClasses} rounded-md font-medium transition-all ${
            displayCurrency === 'INR'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          INR
        </button>
      </div>

      {/* Refresh Button */}
      {showRefresh && (
        <button
          onClick={refreshRate}
          title={`Last updated ${rateAge}s ago`}
          className={`${
            compact ? 'p-1' : 'p-1.5'
          } rounded-md hover:bg-gray-100 transition-colors`}
        >
          <RefreshCw
            className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} ${
              !isConnected || isRateStale ? 'text-amber-500' : 'text-gray-600'
            }`}
          />
        </button>
      )}

      {/* Connection Status Indicator (optional) */}
      {!compact && (isRateStale || !isConnected) && (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>{isConnected ? 'Rate stale' : 'Offline'}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Currency Rate Display
 * Shows the current exchange rate
 */
export const CurrencyRateDisplay: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { exchangeRate, isRateStale, rateAge } = useCurrency();

  if (!exchangeRate) {
    return null;
  }

  const rate = exchangeRate.usdcToInr;
  const sourceLabel = exchangeRate.source === 'fallback' ? '(estimated)' : '';

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <span>
        1 USDC ≈ ₹{rate.toFixed(2)} {sourceLabel}
      </span>
      {isRateStale && <span className="text-amber-600 ml-2">(Updated {rateAge}s ago)</span>}
    </div>
  );
};
