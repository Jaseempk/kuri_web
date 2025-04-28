import { useEffect, useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { getAccount } from "@wagmi/core";
import { config } from "../../providers/Web3Provider";
import { isUserRejection } from "../../utils/errors";
import { ManageMembersDialog } from "./ManageMembersDialog";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { Clock, Loader2 } from "lucide-react";
import { IntervalType } from "../../graphql/types";
import { toast } from "sonner";

interface MarketCardProps {
  market: KuriMarket;
  index: number;
  onJoinClick?: (market: KuriMarket) => void;
}

const INTERVAL_TYPE = {
  WEEKLY: 0 as IntervalType,
  MONTHLY: 1 as IntervalType,
} as const;

// Available circle images
const CIRCLE_IMAGES = [
  "/images/communityvibe.jpg",
  "/images/fairdistribution.jpg",
  "/images/financialempowerment.jpg",
  "/images/homerenovators.jpg",
  "/images/joinyourcircle.jpg",
  "/images/makecontributions.jpg",
  "/images/recievepayout.jpg",
  "/images/trust.jpg",
  "/images/zeroInterest.jpg",
];

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

export const MarketCard = ({ market, index }: MarketCardProps) => {
  const [membershipStatus, setMembershipStatus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");

  const account = getAccount(config);
  const {
    requestMembership,
    getMemberStatus,
    isRequesting,
    initializeKuri,
    marketData,
  } = useKuriCore(market.address as `0x${string}`);

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
        setMembershipStatus(status ?? 0);
      } catch (err) {
        console.error("Error fetching member status:", err);
        setMembershipStatus(0);
      }
    };

    fetchMemberStatus();
  }, [account.address, getMemberStatus]);

  // Check if market is ready to initialize
  const canInitialize = useMemo(() => {
    return (
      market.state === 0 && // INLAUNCH state
      market.activeParticipants === market.totalParticipants
    );
  }, [market.state, market.activeParticipants, market.totalParticipants]);

  // Check if market is full
  const isMarketFull = useMemo(() => {
    return market.activeParticipants >= market.totalParticipants;
  }, [market.activeParticipants, market.totalParticipants]);

  // Handle Kuri initialization
  const handleInitialize = async () => {
    if (!account.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      await initializeKuri();
      toast.success("Kuri cycle initialized successfully!");
    } catch (err) {
      if (!isUserRejection(err)) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to initialize Kuri";
        toast.error(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update the join request handler to check if market is full
  const handleJoinRequest = async () => {
    if (!account.address) {
      setError("Please connect your wallet first");
      return;
    }

    if (isMarketFull) {
      setError("This circle is already full");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await requestMembership();
      setMembershipStatus(0); // NONE state
      toast.success("Membership requested successfully!");
    } catch (err) {
      if (!isUserRejection(err)) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to request membership";
        setError(errorMsg);
        toast.error(errorMsg);
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

  // Get circle image based on index
  const imageUrl = CIRCLE_IMAGES[index % CIRCLE_IMAGES.length];

  // Render action button based on user role and market state
  const renderActionButton = () => {
    if (isCreator) {
      if (canInitialize) {
        return (
          <Button
            onClick={handleInitialize}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Initialize Kuri"
            )}
          </Button>
        );
      }
      return (
        <ManageMembersDialog market={market}>
          <Button className="w-full">
            Manage Members ({market.activeParticipants}/
            {market.totalParticipants})
          </Button>
        </ManageMembersDialog>
      );
    }

    // For non-creators
    if (membershipStatus === 0) {
      return (
        <Button
          onClick={handleJoinRequest}
          disabled={isLoading || isMarketFull || isRequesting}
          className="w-full"
          title={isMarketFull ? "This circle is already full" : undefined}
        >
          {isLoading || isRequesting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isMarketFull ? (
            "Circle Full"
          ) : (
            "Request to Join"
          )}
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="bg-background rounded-2xl overflow-hidden hover-lift shadow-lg">
      {/* Image Section with Status and Title */}
      <div className="relative h-48">
        <img
          src={imageUrl}
          alt={market.name || "Kuri Circle"}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = CIRCLE_IMAGES[0]; // Fallback to first image
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Title and Membership Status */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <h3 className="text-xl font-sans font-semibold text-white">
            {market.name || "Kuri"}
          </h3>
          <div className="flex items-center gap-2">
            {getMembershipStatusDisplay()}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Description */}
        <div>
          <p
            className="text-sm text-muted-foreground line-clamp-2"
            title={defaultDescription}
          >
            {defaultDescription}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Members</p>
            <p className="font-medium">
              {market.activeParticipants}/{market.totalParticipants}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">
              {getIntervalTypeText(market.intervalType)} Contribution
            </p>
            <p className="font-medium">
              {(Number(market.kuriAmount) / 1_000_000).toFixed(2)} USD
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">
              {market.state === 0 ? "Launch Ends In" : "Next Draw"}
            </p>
            <p className="font-medium font-mono">
              {market.state === 0 ? timeLeft : market.nextDraw || "--"}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4">{renderActionButton()}</div>
      </div>
    </div>
  );
};
