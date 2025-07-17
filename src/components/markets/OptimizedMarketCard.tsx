import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { getAccount } from "@wagmi/core";
import { useAccount } from "wagmi";
import { config } from "../../config/wagmi";
import { isUserRejection } from "../../utils/errors";
import { ManageMembersDialog } from "./ManageMembersDialog";
import { OptimizedKuriMarket } from "../../hooks/useOptimizedMarkets";
import {
  Clock,
  Loader2,
  Share2,
  Users,
  Target,
  ExternalLink,
  Calendar,
} from "lucide-react";
import { IntervalType } from "../../graphql/types";
import { toast } from "sonner";
import { formatEther } from "viem";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { MarketParticipation } from "../../types/market";
import { supabase } from "../../lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { cn } from "../../lib/utils";
import { ShareModal } from "../modals/ShareModal";
import { useQuery } from "@tanstack/react-query";
import { useProfileRequired } from "../../hooks/useProfileRequired";
import { ShareButton } from "../ui/ShareButton";
import { useShare } from "../../hooks/useShare";
import { shouldUseKuriCore } from "../../utils/marketUtils";

interface OptimizedMarketCardProps {
  market: OptimizedKuriMarket;
  index: number;
  onJoinClick?: (market: OptimizedKuriMarket) => void;
  onMarketClick?: (market: OptimizedKuriMarket) => void;
  className?: string;
}

interface MarketMetadata {
  id: number;
  created_at: string;
  market_address: string;
  short_description: string;
  long_description: string;
  image_url: string;
}

// Circle image fallbacks
const CIRCLE_IMAGES = [
  "/images/circle1.jpg",
  "/images/circle2.jpg",
  "/images/circle3.jpg",
  "/images/circle4.jpg",
  "/images/circle5.jpg",
];

const getIntervalTypeText = (intervalType: number): string => {
  return intervalType === 0 ? "weekly" : "monthly";
};

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

export const OptimizedMarketCard: React.FC<OptimizedMarketCardProps> = ({
  market,
  index,
  onJoinClick,
  onMarketClick,
  className,
}) => {
  const navigate = useNavigate();
  const { address } = useAccount();

  // Get user data from the optimized market object instead of individual hook calls
  const userMarketData = market.userMarketData;
  const membershipStatus = userMarketData?.membershipStatus ?? 0;
  const userPaymentStatus = userMarketData?.userPaymentStatus ?? null;
  const isCreator = userMarketData?.isCreator ?? false;

  // Only use KuriCore for interactive actions (not for data fetching)
  const shouldUseCore = shouldUseKuriCore(market, address);
  const {
    requestMembership,
    initializeKuri,
    isRequesting,
    fetchMarketData,
    // Don't fetch marketData here - use the optimized data from props
  } = useKuriCore(
    shouldUseCore ? (market.address as `0x${string}`) : undefined
  );

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const account = getAccount(config);

  const { data: metadata } = useQuery({
    queryKey: ["market-metadata", market.address],
    queryFn: () => getMetadata(market.address),
  });

  // Use metadata for image URL with fallback
  const imageUrl =
    metadata?.image_url || CIRCLE_IMAGES[index % CIRCLE_IMAGES.length];

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
    e.stopPropagation();
    if (!account.address) return;

    setIsLoading(true);
    try {
      await initializeKuri();
      toast.success("Kuri cycle initialized successfully!");
      // Refresh market data after initialization
      await fetchMarketData();
    } catch (err) {
      console.error("Failed to initialize Kuri:", err);
      const errorMessage = isUserRejection(err)
        ? "Transaction was cancelled"
        : "Failed to initialize Kuri cycle";
      setError(errorMessage);
      toast.error(errorMessage);
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

    if (isMarketFull) {
      setError("This circle is already full");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await requestMembership();
      toast.success("Membership requested successfully!");
      // Note: In the optimized version, the parent component should handle
      // refreshing the user data after membership request
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

  // Handle member action completion (refresh data)
  const handleMemberActionComplete = async () => {
    if (!account.address) return;

    try {
      // In the optimized version, this should trigger a refetch from the parent
      // For now, we'll just refresh the market data
      await fetchMarketData();
    } catch (err) {
      console.error("Error refreshing member status:", err);
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if dialog is open, clicking on a button, or if the click is from the share button
    if (
      isDialogOpen ||
      showShareModal ||
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
    setShowShareModal(true);
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
          onMemberActionComplete={handleMemberActionComplete}
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
            disabled={isLoading || isMarketFull}
            className="w-full hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200"
            title={isMarketFull ? "This circle is already full" : undefined}
          >
            {isLoading ? (
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
            disabled={isLoading || isMarketFull}
            className="w-full hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent transition-all duration-200"
          >
            {isLoading ? (
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
                isLoading={showShareModal}
                onClick={handleShareClick}
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
                  {market.state === 0
                    ? timeLeft
                    : new Date(
                        Number(market.nextDraw) * 1000
                      ).toLocaleDateString() || "--"}
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
      {showShareModal && (
        <ShareModal
          market={market}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};
