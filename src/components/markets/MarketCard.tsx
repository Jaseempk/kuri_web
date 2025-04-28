import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { getAccount } from "@wagmi/core";
import { config } from "../../providers/Web3Provider";
import { isUserRejection } from "../../utils/errors";
import { ManageMembersDialog } from "./ManageMembersDialog";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { Clock } from "lucide-react";
import { IntervalType } from "../../graphql/types";

interface MarketCardProps {
  market: KuriMarket;
  onJoinClick?: (market: KuriMarket) => void;
}

const INTERVAL_TYPE = {
  WEEKLY: 0 as IntervalType,
  MONTHLY: 1 as IntervalType,
} as const;

const getIntervalTypeText = (intervalType: number): string => {
  switch (intervalType) {
    case INTERVAL_TYPE.WEEKLY:
      return "Weekly";
    case INTERVAL_TYPE.MONTHLY:
      return "Monthly";
    default:
      return "Interval";
  }
};

export const MarketCard = ({ market }: MarketCardProps) => {
  const [membershipStatus, setMembershipStatus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  const account = getAccount(config);
  const { requestMembership, getMemberStatus, isRequesting } = useKuriCore(
    market.address as `0x${string}`
  );

  // Default values until implemented in Market type
  const defaultDescription =
    "A community savings circle powered by Kuri protocol.";

  // Calculate launch end time (3 days from creation)
  const launchEndTime = useMemo(() => {
    const creationTime = Number(market.createdAt) * 1000; // Convert to milliseconds
    return creationTime + 3 * 24 * 60 * 60 * 1000; // Add 3 days
  }, [market.createdAt]);

  // Update countdown timer
  useEffect(() => {
    if (market.state !== 0) return; // Only run for INLAUNCH state

    const updateTimer = () => {
      const now = Date.now();
      const end = launchEndTime;
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Launch period ended");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer(); // Initial update

    return () => clearInterval(timer);
  }, [market.state, launchEndTime]);

  // Fetch membership status on mount and when account changes
  useEffect(() => {
    const fetchMemberStatus = async () => {
      if (!account.address) return;
      try {
        const status = await getMemberStatus(account.address);
        setMembershipStatus(status ?? 0); // Ensure we always set a number, defaulting to 0 (NONE) if null
      } catch (err) {
        console.error("Error fetching member status:", err);
        setMembershipStatus(0); // Set to NONE state on error
      }
    };

    fetchMemberStatus();
  }, [account.address, getMemberStatus]);

  const handleJoinRequest = async () => {
    if (!account.address) {
      setError("Please connect your wallet first");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await requestMembership();
      // After requesting membership, user's state will still be NONE until accepted
      setMembershipStatus(0); // NONE state
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(
          err instanceof Error ? err.message : "Failed to request membership"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (state: number) => {
    switch (state) {
      case 0: // INLAUNCH
        return "bg-[hsl(var(--gold))]";
      case 2: // ACTIVE
        return "bg-[hsl(var(--forest))]";
      case 1: // LAUNCHFAILED
        return "bg-[hsl(var(--ochre))]";
      case 3: // COMPLETED
        return "bg-[hsl(var(--sand))]";
      default:
        return "bg-[hsl(var(--sand))]";
    }
  };

  const getStatusText = (state: number) => {
    switch (state) {
      case 0:
        return "IN LAUNCH";
      case 1:
        return "LAUNCH FAILED";
      case 2:
        return "ACTIVE";
      case 3:
        return "COMPLETED";
      default:
        return "UNKNOWN";
    }
  };

  const getMembershipStatusDisplay = () => {
    // Using the contract's UserState enum values
    switch (membershipStatus) {
      case 0: // NONE
        return null;
      case 1: // ACCEPTED
        return <Badge variant="success">Member</Badge>;
      case 2: // REJECTED
        return <Badge variant="destructive">Rejected</Badge>;
      case 3: // FLAGGED
        return <Badge variant="destructive">Flagged</Badge>;
      default:
        return null;
    }
  };

  const isCreator =
    account.address?.toLowerCase() === market.creator.toLowerCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {`Kuri`}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getMembershipStatusDisplay()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm line-clamp-2">{defaultDescription}</p>
        </div>
        {market.state === 0 && timeLeft && (
          <div className="bg-amber-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-amber-700">
              <Clock className="h-4 w-4" />
              <p className="text-sm font-medium">Launch Period</p>
            </div>
            <p className="text-sm font-mono mt-1">{timeLeft}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {getIntervalTypeText(market.intervalType)} Deposit
            </p>
            <p className="font-medium">
              {(Number(market.kuriAmount) / 1_000_000).toFixed(2)} USD
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Participants</p>
            <p className="font-medium">
              {market.activeParticipants}/{market.totalParticipants}
            </p>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
      <CardFooter>
        {!isCreator &&
          membershipStatus === 0 && ( // NONE state
            <Button
              variant="default"
              className="w-full hover:bg-white hover:text-[hsl(var(--terracotta))] border border-[hsl(var(--terracotta))]"
              onClick={handleJoinRequest}
              disabled={isRequesting || isLoading}
            >
              {isRequesting ? "Requesting..." : "Request to Join"}
            </Button>
          )}
        {isCreator && (
          <ManageMembersDialog
            marketAddress={market.address}
            marketName={`Kuri`}
            isCreator={isCreator}
          />
        )}
      </CardFooter>
    </Card>
  );
};
