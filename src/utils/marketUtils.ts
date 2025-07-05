import { KuriMarket } from "../hooks/useKuriMarkets";

export const shouldCheckPaymentStatus = (
  marketState: number,
  nextIntervalDepositTime: bigint | string,
  userAddress?: string
): boolean => {
  // Only for ACTIVE markets
  if (marketState !== 2) return false;

  // Only if user is connected
  if (!userAddress) return false;

  // Only if we're past the next deposit time
  const currentTime = Math.floor(Date.now() / 1000);
  const nextDepositTime = Number(nextIntervalDepositTime);

  return currentTime >= nextDepositTime;
};

export const shouldUseKuriCore = (
  market: KuriMarket,
  userAddress?: string
): boolean => {
  const isActive = market.state === 2;
  const isCreator = userAddress?.toLowerCase() === market.creator.toLowerCase();

  // Creator needs it for initialization, active markets need it for interactions
  return isActive || isCreator;
};
