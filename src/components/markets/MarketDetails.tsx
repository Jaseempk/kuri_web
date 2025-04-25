import { useEffect, useState } from "react";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { Button } from "../ui/button";
import { useAccount } from "wagmi";
import { KuriState } from "../../types/market";

interface MarketDetailsProps {
  marketAddress: `0x${string}`;
}

export const MarketDetails = ({ marketAddress }: MarketDetailsProps) => {
  const { address } = useAccount();
  const {
    marketData,
    isLoading,
    error,
    requestMembership,
    initializeKuri,
    deposit,
    claimKuriAmount,
  } = useKuriCore(marketAddress);

  const [isRequesting, setIsRequesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  if (isLoading) {
    return <div>Loading market details...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!marketData) {
    return <div>Market not found</div>;
  }

  const handleRequestMembership = async () => {
    if (!address) return;
    setIsRequesting(true);
    try {
      await requestMembership();
    } catch (err) {
      console.error("Error requesting membership:", err);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleInitialize = async () => {
    if (!address) return;
    setIsInitializing(true);
    try {
      await initializeKuri();
    } catch (err) {
      console.error("Error initializing market:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleDeposit = async () => {
    if (!address) return;
    setIsDepositing(true);
    try {
      await deposit();
    } catch (err) {
      console.error("Error making deposit:", err);
    } finally {
      setIsDepositing(false);
    }
  };

  const handleClaim = async (intervalIndex: number) => {
    if (!address) return;
    setIsClaiming(true);
    try {
      await claimKuriAmount(intervalIndex);
    } catch (err) {
      console.error("Error claiming amount:", err);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Market Details</h2>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-sm text-gray-600">Status</label>
            <p className="font-medium">{KuriState[marketData.state]}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Creator</label>
            <p className="font-medium">{marketData.creator}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Total Amount</label>
            <p className="font-medium">
              {marketData.kuriAmount.toString()} USDC
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-600">Participants</label>
            <p className="font-medium">
              {marketData.totalActiveParticipantsCount} /{" "}
              {marketData.totalParticipantsCount}
            </p>
          </div>
        </div>

        {/* Action buttons based on state */}
        <div className="space-y-4">
          {marketData.state === KuriState.INLAUNCH && (
            <Button
              onClick={handleRequestMembership}
              disabled={isRequesting}
              className="w-full"
            >
              {isRequesting ? "Requesting..." : "Request Membership"}
            </Button>
          )}

          {marketData.state === KuriState.INLAUNCH &&
            address === marketData.creator &&
            marketData.totalActiveParticipantsCount ===
              marketData.totalParticipantsCount && (
              <Button
                onClick={handleInitialize}
                disabled={isInitializing}
                className="w-full"
              >
                {isInitializing ? "Initializing..." : "Initialize Market"}
              </Button>
            )}

          {marketData.state === KuriState.ACTIVE && (
            <>
              <Button
                onClick={handleDeposit}
                disabled={isDepositing}
                className="w-full"
              >
                {isDepositing ? "Depositing..." : "Make Deposit"}
              </Button>

              {/* Only show claim button if user has won */}
              {/* TODO: Add check for winner status */}
              <Button
                onClick={() => handleClaim(0)} // TODO: Add proper interval index
                disabled={isClaiming}
                className="w-full"
              >
                {isClaiming ? "Claiming..." : "Claim Amount"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
