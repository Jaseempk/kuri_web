import { useState } from "react";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { KuriState } from "../../types/market";
import {
  LoadingSkeleton,
  TransactionLoading,
  ErrorMessage,
} from "../ui/loading-states";
import { handleContractError } from "../../utils/errors";
import { KURI_CONTRACT_ADDRESS } from "../../config/contracts";

export const ClaimInterface = () => {
  const { marketData, isLoading, error, claimKuriAmount } = useKuriCore(
    KURI_CONTRACT_ADDRESS
  );
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const handleClaim = async (intervalIndex: number) => {
    if (!marketData) return;

    try {
      setIsClaiming(true);
      setClaimError(null);
      await claimKuriAmount(intervalIndex);
    } catch (err) {
      const error = handleContractError(err);
      setClaimError(error.message);
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoading || !marketData) {
    return (
      <Card className="p-6">
        <LoadingSkeleton lines={3} />
      </Card>
    );
  }

  const isClaimingAllowed =
    marketData.state === KuriState.ACTIVE ||
    marketData.state === KuriState.COMPLETED;

  // For MVP, we'll just allow claiming for the current interval
  const currentInterval = Math.floor(
    (Date.now() / 1000 - Number(marketData.startTime)) /
      Number(marketData.intervalDuration)
  );

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Claim Winnings</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Current Interval</p>
          <p className="text-lg font-medium">{currentInterval}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Market Status</p>
          <p className="text-lg font-medium">{KuriState[marketData.state]}</p>
        </div>

        {claimError && <ErrorMessage message={claimError} />}

        {isClaiming ? (
          <TransactionLoading message="Processing claim..." />
        ) : (
          <Button
            onClick={() => handleClaim(currentInterval)}
            disabled={!isClaimingAllowed || isClaiming || isLoading}
            className="w-full"
          >
            Claim for Current Interval
          </Button>
        )}

        {!isClaimingAllowed && (
          <p className="text-sm text-yellow-600">
            Claiming is only allowed when the market is active or completed
          </p>
        )}
      </div>
    </Card>
  );
};
