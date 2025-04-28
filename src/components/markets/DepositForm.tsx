import { useState } from "react";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { formatEther } from "viem";
import { KuriState } from "../../types/market";
import {
  LoadingSkeleton,
  TransactionLoading,
  ErrorMessage,
} from "../ui/loading-states";
import { handleContractError } from "../../utils/errors";
import { KURI_CONTRACT_ADDRESS } from "../../config/contracts";

export const DepositForm = () => {
  const { marketData, isLoading, error, deposit } = useKuriCore(
    KURI_CONTRACT_ADDRESS
  );
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  const handleDeposit = async () => {
    if (!marketData) return;

    try {
      setIsDepositing(true);
      setDepositError(null);
      await deposit();
    } catch (err) {
      const error = handleContractError(err);
      setDepositError(error.message);
    } finally {
      setIsDepositing(false);
    }
  };

  if (isLoading || !marketData) {
    return (
      <Card className="p-6">
        <LoadingSkeleton />
      </Card>
    );
  }

  const isDepositAllowed = marketData.state === KuriState.ACTIVE;
  const nextDepositTime = new Date(
    Number(marketData.nextIntervalDepositTime) * 1000
  );
  const isDepositDue = nextDepositTime <= new Date();

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Make Deposit</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500">Required Deposit Amount</p>
          <p className="text-lg font-medium">
            {formatEther(marketData.kuriAmount)} ETH
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">Next Deposit Due</p>
          <p className="text-lg font-medium">
            {nextDepositTime.toLocaleString()}
          </p>
        </div>

        {depositError && <ErrorMessage message={depositError} />}

        {isDepositing ? (
          <TransactionLoading message="Processing deposit..." />
        ) : (
          <Button
            onClick={handleDeposit}
            disabled={
              !isDepositAllowed || !isDepositDue || isDepositing || isLoading
            }
            className="w-full"
          >
            Make Deposit
          </Button>
        )}

        {!isDepositAllowed && (
          <p className="text-sm text-yellow-600">
            Deposits are only allowed when the market is active
          </p>
        )}

        {!isDepositDue && isDepositAllowed && (
          <p className="text-sm text-blue-600">
            Next deposit will be due at {nextDepositTime.toLocaleString()}
          </p>
        )}
      </div>
    </Card>
  );
};
