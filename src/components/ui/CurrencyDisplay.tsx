/**
 * Currency Display Component
 * Displays amounts in USD or INR based on user preference
 */

import React from "react";
import { useCurrency } from "../../contexts/CurrencyContext";
import {
  usdcToNumber,
  formatUsdAmount,
  formatUsdcAsInr,
  formatBothCurrencies,
} from "../../utils/currencyUtils";

interface CurrencyDisplayProps {
  /** USDC amount in bigint (6 decimals) or regular number */
  amount: bigint | number;
  /** Show both USD and INR */
  showBoth?: boolean;
  /** Override user preference */
  forceCurrency?: "USD" | "INR";
  /** Number of decimal places */
  decimals?: number;
  /** Additional CSS classes */
  className?: string;
  /** Show "USDC" suffix for clarity */
  showUsdcSuffix?: boolean;
  /** Compact notation for large numbers */
  compact?: boolean;
}

export const CurrencyDisplay = React.memo<CurrencyDisplayProps>(
  ({
    amount,
    showBoth = false,
    forceCurrency,
    decimals = 2,
    className = "",
    showUsdcSuffix = false,
    compact = false,
  }) => {
    const { displayCurrency, exchangeRate, isIndianUser } = useCurrency();

    // Determine which currency to display
    const effectiveCurrency =
      forceCurrency || (isIndianUser ? displayCurrency : "USD");

    // Convert bigint to number if needed
    const numAmount =
      typeof amount === "bigint" ? usdcToNumber(amount) : amount;

    // Get exchange rate or use fallback
    const rate = exchangeRate?.usdcToInr || 85;

    // Format based on display mode
    const formatCurrency = () => {
      if (showBoth) {
        // Show both currencies
        if (typeof amount === "bigint") {
          return formatBothCurrencies(amount, rate, effectiveCurrency);
        } else {
          const usdFormatted = formatUsdAmount(numAmount, decimals);
          const inrAmount = numAmount * rate;
          const inrFormatted = `₹${inrAmount.toLocaleString("en-IN", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}`;

          if (effectiveCurrency === "USD") {
            return `${usdFormatted} (≈${inrFormatted})`;
          } else {
            return `${inrFormatted} (≈${usdFormatted})`;
          }
        }
      } else {
        // Show single currency
        if (effectiveCurrency === "USD") {
          const formatted = formatUsdAmount(numAmount, decimals);
          return showUsdcSuffix ? `${formatted} USDC` : formatted;
        } else {
          if (typeof amount === "bigint") {
            return formatUsdcAsInr(amount, rate, decimals);
          } else {
            const inrAmount = numAmount * rate;
            return `₹${inrAmount.toLocaleString("en-IN", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            })}`;
          }
        }
      }
    };

    return <span className={className}>{formatCurrency()}</span>;
  }
);

/**
 * Currency Display with Label
 * Shows currency with a descriptive label
 */
interface CurrencyDisplayWithLabelProps extends CurrencyDisplayProps {
  label: string;
  labelClassName?: string;
}

export const CurrencyDisplayWithLabel: React.FC<
  CurrencyDisplayWithLabelProps
> = ({ label, labelClassName = "", ...currencyProps }) => {
  return (
    <div className="flex flex-col gap-1">
      <span className={labelClassName}>{label}</span>
      <CurrencyDisplay {...currencyProps} />
    </div>
  );
};
