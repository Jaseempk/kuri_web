import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { getAccount } from "@wagmi/core";
import { config } from "../../config/wagmi";
import { isUserRejection } from "../../utils/errors";
import { ManageMembersDialog } from "./ManageMembersDialog";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { Clock, Loader2 } from "lucide-react";
import { IntervalType } from "../../graphql/types";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useProfileRequired } from "../../hooks/useProfileRequired";
import { ShareButton } from "../ui/ShareButton";
import { useShare } from "../../hooks/useShare";
import { cn } from "../../lib/utils";
import { ShareModal } from "../modals/ShareModal";

interface MarketCardProps {
  market: KuriMarket;
  index: number;
  onJoinClick?: (market: KuriMarket) => void;
  onMarketClick?: (market: KuriMarket) => void;
  className?: string;
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
      return "weekly";
    case INTERVAL_TYPE.MONTHLY:
      return "monthly";
    default:
      return "interval";
  }
};

// Define MarketMetadata type and getMetadata function here
export interface MarketMetadata {
  id: number;
  market_address: string;
  created_at: string;
  short_description: string;
  long_description: string;
  image_url: string;
}

// Dummy getMetadata function (replace with actual implementation if needed)
export const getMetadata = async (
  marketAddress: string
): Promise<MarketMetadata | null> => {
  const { data, error } = await supabase
    .from("kuri_web")
    .select("*")
    .ilike("market_address", marketAddress)
    .single();

  if (error || !data) return null;
  return data as MarketMetadata;
};

// Hardcoded fallback data for markets without Supabase metadata
const HARDCODED_MARKET_METADATA: Record<string, MarketMetadata> = {
  // Example:
  // "0x123...": {
  //   id: 0,
  //   created_at: "",
  //   market_address: "0x123...",
  //   short_description: "A community savings circle powered by Kuri protocol.",
  //   long_description: "This is a hardcoded long story for the market.",
  //   image_url: "/images/default-market.jpg",
  // },
};

export const MarketCard: React.FC<MarketCardProps> = ({
  market,
  index,
  onJoinClick,
  onMarketClick,
  className,
}) => {
  const navigate = useNavigate();
  const [membershipStatus, setMembershipStatus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const { requireProfile } = useProfileRequired({
    strict: false,
    action: "join_circle",
  });

  const { quickShare } = useShare();

  const account = getAccount(config);
  const {
    requestMembership,
    getMemberStatus,
    isRequesting,
    initializeKuri,
    marketData,
  } = useKuriCore(market.address as `0x${string}`);

  const { data: metadata } = useQuery({
    queryKey: ["market-metadata", market.address],
    queryFn: () => getMetadata(market.address),
  });

  // Use metadata for image URL with fallback
  const imageUrl =
    metadata?.image_url || CIRCLE_IMAGES[index % CIRCLE_IMAGES.length];

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
  const handleInitialize = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up to parent

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
  const handleJoinRequest = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop event from bubbling up to parent

    if (!account.address) {
      setError("Please connect your wallet first");
      return;
    }

    // Add profile check before proceeding
    if (!requireProfile()) {
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
      case 4: // APPLIED
        return <Badge variant="warning">Applied</Badge>;
      default:
        return null;
    }
  };

  const isCreator =
    account.address?.toLowerCase() === market.creator.toLowerCase();

  // Fallback to hardcoded data if no Supabase metadata
  const fallbackMetadata: MarketMetadata = {
    id: 0,
    created_at: "",
    market_address: market.address,
    short_description:
      market.name || "A community savings circle powered by Kuri protocol.",
    long_description:
      "This is a community savings circle powered by Kuri protocol. Join to save and win!",
    image_url: "/images/default-market.jpg",
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if dialog is open, clicking on a button, or if the click is from the share button
    if (
      isDialogOpen ||
      isShareModalOpen ||
      e.target instanceof HTMLButtonElement ||
      (e.target as HTMLElement).closest('[data-share-button="true"]') ||
      (e.target as HTMLElement).closest("button")
    ) {
      return;
    }

    // Navigate to market detail page
    navigate(`/markets/${market.address}`);
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSharing(true);
    try {
      // Share functionality is now handled by the ShareModal
    } catch (error) {
      console.error("Error sharing market:", error);
    } finally {
      setIsSharing(false);
    }
  };

  // Render action button based on user role and market state
  const renderActionButton = () => {
    if (isCreator) {
      if (canInitialize) {
        return (
          <Button
            onClick={handleInitialize}
            disabled={isLoading}
            className="w-full hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200"
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
        <ManageMembersDialog
          market={market}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        >
          <Button className="w-full hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200">
            Manage Members ({market.activeParticipants}/
            {market.totalParticipants})
          </Button>
        </ManageMembersDialog>
      );
    }

    // For non-creators, handle different user states
    switch (membershipStatus) {
      case 0: // NONE
        return (
          <Button
            onClick={handleJoinRequest}
            disabled={isLoading || isMarketFull || isRequesting}
            className="w-full hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200"
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

      case 1: // ACCEPTED
        return (
          <Button
            disabled
            className="w-full bg-[#F9F5F1] text-[#8B6F47] border-[#E8DED1] cursor-not-allowed"
          >
            Member
          </Button>
        );

      case 2: // REJECTED
        return (
          <Button
            onClick={handleJoinRequest}
            disabled={isLoading || isMarketFull || isRequesting}
            className="w-full hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200"
          >
            {isLoading || isRequesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Request Again"
            )}
          </Button>
        );

      case 3: // FLAGGED
        return (
          <Button
            disabled
            className="w-full bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2] cursor-not-allowed"
          >
            Flagged
          </Button>
        );

      case 4: // APPLIED
        return (
          <Button
            disabled
            className="w-full bg-[#F9F5F1] text-[#8B6F47] font-medium border-[#E8DED1] cursor-not-allowed hover:bg-[#F9F5F1]"
          >
            Applied
          </Button>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer",
          className
        )}
        onClick={handleCardClick}
      >
        <div onClick={handleCardClick}>
          <div className="relative h-36 xs:h-40 sm:h-48">
            <img
              src={imageUrl}
              alt={market.name || "Kuri Circle"}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = CIRCLE_IMAGES[0];
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

            <div
              className="absolute right-2 top-2 z-10"
              data-share-button="true"
            >
              <ShareButton
                market={market}
                isLoading={isSharing}
                onClick={() => {
                  setIsShareModalOpen(true);
                }}
              />
            </div>

            <div className="absolute bottom-3 xs:bottom-4 left-3 xs:left-4 right-3 xs:right-4 flex justify-between items-end">
              <h3 className="text-lg xs:text-xl font-sans font-semibold text-white line-clamp-2">
                {metadata?.short_description || "Kuri"}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getMembershipStatusDisplay()}
              </div>
            </div>
          </div>

          <div className="p-4 xs:p-5 sm:p-6 space-y-3 xs:space-y-4">
            <div className="grid grid-cols-2 gap-3 xs:gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Members</p>
                <p className="text-sm xs:text-base font-medium">
                  {market.activeParticipants}/{market.totalParticipants}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Contribution
                </p>
                <p className="text-sm xs:text-base font-medium">
                  ${(Number(market.kuriAmount) / 1_000_000).toFixed(2)}{" "}
                  {getIntervalTypeText(market.intervalType)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Win Amount</p>
                <p className="text-sm xs:text-base font-medium text-[hsl(var(--forest))]">
                  $
                  {(
                    (Number(market.kuriAmount) / 1_000_000) *
                    market.totalParticipants
                  ).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  {market.state === 0 ? "Launch Ends In" : "Next Draw"}
                </p>
                <p className="text-sm xs:text-base font-medium font-mono flex items-center gap-1.5">
                  {market.state === 0 && (
                    <Clock className="h-3 w-3 xs:h-4 xs:w-4" />
                  )}
                  {market.state === 0 ? timeLeft : market.nextDraw || "--"}
                </p>
              </div>
            </div>

            {error && (
              <div className="text-xs xs:text-sm text-red-500 bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="pt-1 xs:pt-2">{renderActionButton()}</div>
          </div>
        </div>
      </div>
      {isShareModalOpen && (
        <ShareModal
          market={market}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </>
  );
};
