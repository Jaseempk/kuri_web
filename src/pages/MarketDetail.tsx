import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKuriCore, KuriState } from "../hooks/contracts/useKuriCore";
import { KuriState as GraphQLKuriState } from "../graphql/types";
import { useKuriMarketDetail } from "../hooks/useKuriMarketDetail";
import { Button } from "../components/ui/button";
import { MarketSEO } from "../components/seo/MarketSEO";
import { ShareModal } from "../components/modals/ShareModal";
import { ManageMembersDialog } from "../components/markets/ManageMembersDialog";
import { DepositForm } from "../components/markets/DepositForm";
import { ClaimInterface } from "../components/markets/ClaimInterface";
import { useAccount } from "@getpara/react-sdk";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Calendar,
  Trophy,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useProfileRequired } from "../hooks/useProfileRequired";
import { useUserProfileByAddress } from "../hooks/useUserProfile";
import { isUserRejection } from "../utils/errors";
import { SequentialCountdown } from "../components/ui/SequentialCountdown";
import { trackEvent, trackError } from "../utils/analytics";
import { CircleMembersDisplay } from "../components/markets/CircleMembersDisplay";
import { useMarketTimers } from "../hooks/useMarketTimers";
import { apiClient } from "../lib/apiClient";

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

interface MarketMetadata {
  id: number;
  market_address: string;
  created_at: string;
  short_description: string;
  long_description: string;
  image_url: string;
}

const getMetadata = async (
  marketAddress: string
): Promise<MarketMetadata | null> => {
  try {
    return await apiClient.getMarketMetadata(marketAddress);
  } catch (error) {
    console.error("Error fetching market metadata:", error);
    return null;
  }
};

const getIntervalTypeText = (intervalType: number): string => {
  switch (intervalType) {
    case 0:
      return "weekly";
    case 1:
      return "monthly";
    default:
      return "interval";
  }
};

// Get status badge for current market state
const getStatusBadge = (state: KuriState) => {
  switch (state) {
    case KuriState.INLAUNCH:
      return { text: "Launching", className: "bg-blue-100 text-blue-800" };
    case KuriState.LAUNCHFAILED:
      return { text: "Launch Failed", className: "bg-red-100 text-red-800" };
    case KuriState.ACTIVE:
      return { text: "Active", className: "bg-green-100 text-green-800" };
    case KuriState.COMPLETED:
      return { text: "Completed", className: "bg-gray-100 text-gray-800" };
    default:
      return { text: "Unknown", className: "bg-gray-100 text-gray-800" };
  }
};

// Convert useKuriCore KuriState to GraphQL KuriState for components that expect it
const convertToGraphQLKuriState = (state: KuriState): GraphQLKuriState => {
  switch (state) {
    case KuriState.INLAUNCH:
      return GraphQLKuriState.UNINITIALIZED;
    case KuriState.LAUNCHFAILED:
      return GraphQLKuriState.FAILED;
    case KuriState.ACTIVE:
      return GraphQLKuriState.ACTIVE;
    case KuriState.COMPLETED:
      return GraphQLKuriState.COMPLETED;
    default:
      return GraphQLKuriState.UNINITIALIZED;
  }
};

export default function MarketDetail() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const paraAccount = useAccount();
  const userAddress = paraAccount.embedded.wallets?.[0]?.address;

  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "members"
  >("overview");
  const [membershipStatus, setMembershipStatus] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasUserClaimed, setHasUserClaimed] = useState<boolean | null>(null);

  const { requireProfile } = useProfileRequired({
    strict: false,
    action: "join_circle",
  });

  // Scroll to top when navigating to a different market
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [address]);

  // Validate address
  useEffect(() => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      navigate("/markets");
      return;
    }
  }, [address, navigate]);

  const {
    marketData,
    isLoading,
    error,
    requestMembershipSponsored,
    initializeKuriSponsored,
    getMemberStatus,
    fetchMarketData,
    checkPaymentStatusIfMember,
    checkHasClaimed,
  } = useKuriCore(address as `0x${string}`);

  // Fetch creator's profile
  const { profile: creatorProfile, isLoading: creatorProfileLoading } =
    useUserProfileByAddress(marketData?.creator || null);

  // Fetch metadata
  const { data: metadata } = useQuery({
    queryKey: ["market-metadata", address],
    queryFn: () => getMetadata(address || ""),
    enabled: !!address,
  });

  // Fetch market detail with winners data
  const { marketDetail } = useKuriMarketDetail(address || "");

  // Use custom timer hook
  const { timeLeft } = useMarketTimers(marketData);

  // Determine current winner logic
  const currentWinner = useMemo(() => {
    if (!marketDetail?.winners || marketDetail.winners.length === 0)
      return null;
    if (marketData?.state !== KuriState.ACTIVE) return null;

    // Get the most recent winner (highest intervalIndex)
    const latestWinner = marketDetail.winners.reduce((latest, current) =>
      current.intervalIndex > latest.intervalIndex ? current : latest
    );

    // Check if we should show the winner (between raffle selection and next raffle)
    const nextRaffleTime = Number(marketData?.nexRaffleTime || 0) * 1000;
    const now = Date.now();

    // Show winner if there's time until next raffle
    if (now < nextRaffleTime) {
      return latestWinner;
    }

    return null;
  }, [marketDetail?.winners, marketData?.state, marketData?.nexRaffleTime]);

  // Fetch winner's profile
  const { profile: winnerProfile, isLoading: winnerProfileLoading } =
    useUserProfileByAddress(currentWinner?.winner || null);

  // Fetch membership status
  useEffect(() => {
    const fetchMemberStatus = async () => {
      if (!userAddress || !address) return;
      try {
        const status = await getMemberStatus(userAddress as `0x${string}`);
        setMembershipStatus(status ?? 0);
      } catch (err) {
        console.error("Error fetching member status:", err);
        setMembershipStatus(0);
      }
    };

    fetchMemberStatus();
  }, [userAddress, getMemberStatus, address]);

  // 🔥 NEW: Explicitly check payment status when needed (lazy loading)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!userAddress || !marketData) return;

      // Only check for ACTIVE markets
      if (marketData.state === 2) {
        try {
          await checkPaymentStatusIfMember();
        } catch (err) {
          console.error("Error checking payment status:", err);
        }
      }
    };

    checkPaymentStatus();
  }, [userAddress, marketData?.state, checkPaymentStatusIfMember]);

  // Check claim status when user is a winner
  useEffect(() => {
    const checkUserClaimStatus = async () => {
      if (!userAddress || !currentWinner || !address) {
        setHasUserClaimed(null);
        return;
      }

      // Only check if the current user is the winner
      const isWinner =
        currentWinner.winner.toLowerCase() === userAddress.toLowerCase();
      if (!isWinner) {
        setHasUserClaimed(null);
        return;
      }

      try {
        const claimed = await checkHasClaimed(userAddress as `0x${string}`);
        setHasUserClaimed(claimed);
      } catch (err) {
        console.error("Error checking claim status:", err);
        setHasUserClaimed(null);
      }
    };

    checkUserClaimStatus();
  }, [userAddress, currentWinner, checkHasClaimed, address]);

  // Callback to refresh claim status after successful claim
  const handleClaimSuccess = useCallback(async () => {
    if (!userAddress) return;

    try {
      const claimed = await checkHasClaimed(userAddress as `0x${string}`);
      setHasUserClaimed(claimed);
    } catch (err) {
      console.error("Error refreshing claim status:", err);
    }
  }, [userAddress, checkHasClaimed]);

  // Check if user is creator
  const isCreator = useMemo(() => {
    return (
      marketData &&
      userAddress &&
      marketData.creator.toLowerCase() === userAddress.toLowerCase()
    );
  }, [marketData, userAddress]);

  // Check if market can be initialized - V1 Flexible Initialization
  const canInitialize = useMemo(() => {
    if (!marketData || marketData.state !== KuriState.INLAUNCH) return false;

    const isFull =
      marketData.totalActiveParticipantsCount ===
      marketData.totalParticipantsCount;
    const launchPeriodEnded =
      Date.now() > Number(marketData.launchPeriod) * 1000;

    return isFull || launchPeriodEnded; // V1: Initialize when full OR launch period ended
  }, [marketData]);

  // Get initialization reason for user messaging
  const initializationReason = useMemo(() => {
    if (!marketData || marketData.state !== KuriState.INLAUNCH) return "";

    const isFull =
      marketData.totalActiveParticipantsCount ===
      marketData.totalParticipantsCount;
    const launchPeriodEnded =
      Date.now() > Number(marketData.launchPeriod) * 1000;

    if (isFull && !launchPeriodEnded) return "Circle is full - ready to start!";
    if (launchPeriodEnded) return "Launch period completed";
    return "Waiting for more members or launch period end";
  }, [marketData]);

  // Determine if claim card should be visible
  const shouldShowClaimCard = useMemo(() => {
    if (!currentWinner || !userAddress) return false;

    // Check if the current user is the winner
    const isWinner =
      currentWinner.winner.toLowerCase() === userAddress.toLowerCase();
    if (!isWinner) return false;

    // Check if market is active and raffle time has passed
    if (marketData?.state !== KuriState.ACTIVE) return false;
    const nextRaffleTime = new Date(Number(marketData?.nexRaffleTime) * 1000);
    const now = new Date();
    const isRaffleDue = nextRaffleTime <= now;
    if (!isRaffleDue) return false;

    // Only show if user hasn't claimed yet
    return hasUserClaimed === false;
  }, [
    currentWinner,
    userAddress,
    marketData?.state,
    marketData?.nexRaffleTime,
    hasUserClaimed,
  ]);

  // Check if market is full
  const isMarketFull = useMemo(() => {
    if (!marketData) return false;
    return (
      marketData.totalActiveParticipantsCount >=
      marketData.totalParticipantsCount
    );
  }, [marketData]);

  // Handle join request
  const handleJoinRequest = async () => {
    if (!userAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    const hasProfile = requireProfile();
    if (!hasProfile) {
      return;
    }

    if (isMarketFull) {
      toast.error("This circle is already full");
      return;
    }

    setIsRequesting(true);
    try {
      // 🚀 USE SPONSORED VERSION FOR TESTING
      await requestMembershipSponsored();
      toast.success("Membership request sent! (Gas was sponsored 🎉)");

      // Track successful market join
      if (marketData) {
        trackEvent("market_joined", {
          market_address: address || "",
          interval_type: marketData.intervalType === 0 ? "weekly" : "monthly",
          participants: marketData.totalParticipantsCount,
        });
      }

      // Refresh membership status
      const status = await getMemberStatus(userAddress as `0x${string}`);
      setMembershipStatus(status ?? 0);
    } catch (err) {
      // Track join failure
      trackError(
        "market_join_failed",
        "MarketDetail",
        err instanceof Error ? err.message : "Unknown error"
      );

      if (!isUserRejection(err)) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to request membership";
        toast.error(errorMsg);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  // Handle initialization
  const handleInitialize = async () => {
    if (!userAddress) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsInitializing(true);
    try {
      await initializeKuriSponsored();
      toast.success("Kuri cycle initialized successfully!");

      // Track successful market initialization
      if (marketData) {
        trackEvent("market_initialized", {
          market_address: address || "",
          participants: marketData.totalParticipantsCount,
          amount: formatUnits(marketData.kuriAmount, 6),
        });
      }
    } catch (err) {
      // Track initialization failure
      trackError(
        "market_initialization_failed",
        "MarketDetail",
        err instanceof Error ? err.message : "Unknown error"
      );

      if (!isUserRejection(err)) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to initialize Kuri";
        toast.error(errorMsg);
      }
    } finally {
      setIsInitializing(false);
    }
  };

  // Handle member action completion (refresh data)
  const handleMemberActionComplete = async () => {
    if (!userAddress) return;

    try {
      // Refresh membership status
      const status = await getMemberStatus(userAddress as `0x${string}`);
      setMembershipStatus(status ?? 0);
      // Refresh market data to get updated participant counts
      await fetchMarketData();
    } catch (err) {
      console.error("Error refreshing member status:", err);
    }
  };

  // Render action button - Updated for new mockup design
  const renderActionButton = () => {
    // Don't show action buttons when wallet is not connected
    if (!userAddress) {
      return (
        <button
          disabled
          className="w-full bg-gray-400 text-white font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md cursor-not-allowed opacity-70 flex items-center justify-center"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Connect Wallet to Join
        </button>
      );
    }

    if (isCreator) {
      if (canInitialize) {
        return (
          <button
            onClick={handleInitialize}
            disabled={isInitializing || !canInitialize}
            className="w-full bg-[#E67A50] text-white font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md hover:bg-orange-600 transition-colors duration-300 flex items-center justify-center disabled:opacity-70"
          >
            {isInitializing ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <span className="material-icons mr-2">add_circle_outline</span>
            )}
            {isInitializing
              ? "Initializing Circle..."
              : initializationReason.includes("full")
              ? "Start Circle Now"
              : "Initialize Circle"}
          </button>
        );
      }
      return (
        <ManageMembersDialog
          market={{
            address: address || "",
            creator: marketData?.creator || "",
            totalParticipants: marketData?.totalParticipantsCount || 0,
            activeParticipants: marketData?.totalActiveParticipantsCount || 0,
            kuriAmount: marketData?.kuriAmount.toString() || "0",
            intervalType: marketData?.intervalType || 0,
            state: marketData
              ? convertToGraphQLKuriState(marketData.state)
              : GraphQLKuriState.UNINITIALIZED,
            nextDepositTime:
              marketData?.nextIntervalDepositTime.toString() || "0",
            nextRaffleTime: marketData?.nexRaffleTime.toString() || "0",
            createdAt: "0",
            name: metadata?.short_description || "Kuri Circle",
            nextDraw: marketData?.nexRaffleTime.toString() || "0",
            launchPeriod: marketData?.launchPeriod.toString() || "0",
            startTime: marketData?.startTime.toString() || "0",
            endTime: marketData?.endTime.toString() || "0",
          }}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onMemberActionComplete={handleMemberActionComplete}
        >
          <button className="w-full bg-[#E67A50] text-white font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md hover:bg-orange-600 transition-colors duration-300 flex items-center justify-center">
            <span className="material-icons mr-2">people_outline</span>
            Manage Members ({marketData?.totalActiveParticipantsCount || 0}/
            {marketData?.totalParticipantsCount || 0})
          </button>
        </ManageMembersDialog>
      );
    }

    // For non-creators
    switch (membershipStatus) {
      case 0: // NONE
        return (
          <button
            onClick={handleJoinRequest}
            disabled={isRequesting || isMarketFull}
            className={`w-full font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md transition-colors duration-300 flex items-center justify-center ${
              isMarketFull
                ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                : "bg-[#E67A50] text-white hover:bg-orange-600"
            }`}
            title={isMarketFull ? "This circle is already full" : undefined}
          >
            {isRequesting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : isMarketFull ? (
              <XCircle className="w-5 h-5 mr-2" />
            ) : (
              <span className="material-icons mr-2">add_circle_outline</span>
            )}
            {isRequesting
              ? "Sending Request..."
              : isMarketFull
              ? "Circle Full"
              : "Request to Join"}
          </button>
        );

      case 1: // ACCEPTED
        return (
          <button
            disabled
            className="w-full bg-green-600 text-white font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Active Member
          </button>
        );

      case 2: // REJECTED
        return (
          <button
            onClick={handleJoinRequest}
            disabled={isRequesting || isMarketFull}
            className="w-full bg-[#E67A50] text-white font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md hover:bg-orange-600 transition-colors duration-300 flex items-center justify-center"
          >
            {isRequesting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-5 h-5 mr-2" />
            )}
            {isRequesting ? "Sending Request..." : "Request Again"}
          </button>
        );

      case 3: // FLAGGED
        return (
          <button
            disabled
            className="w-full bg-red-500 text-white font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            Account Flagged
          </button>
        );

      case 4: // APPLIED
        return (
          <button
            disabled
            className="w-full bg-yellow-500 text-white font-bold py-3 px-8 rounded-xl lg:rounded-full text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
          >
            <Clock className="w-5 h-5 mr-2" />
            Application Pending
          </button>
        );

      default:
        return null;
    }
  };

  const handleShareClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShareModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F5F1] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#8B6F47] mx-auto mb-4" />
          <p className="text-[#8B6F47] font-medium">
            Loading market details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !marketData) {
    return (
      <>
        <MarketSEO
          market={{
            address: address || "",
            creator: "",
            totalParticipants: 0,
            activeParticipants: 0,
            kuriAmount: "0",
            intervalType: 0,
            state: 0,
          }}
          metadata={{
            id: 0,
            market_address: address || "",
            created_at: "",
            short_description: error
              ? "Error Loading Market"
              : "Market Not Found",
            long_description: error
              ? "There was an error loading the market details. Please try again."
              : "The requested market could not be found or does not exist.",
            image_url: "",
          }}
        />
        <div className="min-h-screen bg-[#F9F5F1] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-[#E8DED1]">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {error ? "Error Loading Market" : "Market Not Found"}
              </h2>
              <p className="text-gray-600 mb-6">
                {error
                  ? "There was an error loading the market details. Please try again."
                  : "The requested market could not be found or does not exist."}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={() => navigate("/markets")}
                  className="flex-1 bg-[#8B6F47] hover:bg-[#725A3A] text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Markets
                </Button>
                {error && (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1 border-[#8B6F47] text-[#8B6F47] hover:bg-[#F9F5F1]"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const imageUrl = metadata?.image_url || CIRCLE_IMAGES[0];

  return (
    <>
      <MarketSEO
        market={{
          address: address || "",
          creator: marketData.creator,
          totalParticipants: marketData.totalParticipantsCount,
          activeParticipants: marketData.totalActiveParticipantsCount,
          kuriAmount: marketData.kuriAmount.toString(),
          intervalType: marketData.intervalType,
          state: Number(marketData.state),
        }}
        metadata={metadata}
      />

      <div className="min-h-screen bg-[hsl(var(--ivory))]">
        {/* Floating Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))/0.1] to-[hsl(var(--gold))/0.1] blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-[hsl(var(--ochre))/0.1] to-[hsl(var(--terracotta))/0.1] blur-3xl"
            animate={{
              x: [0, -20, 0],
              y: [0, 30, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Navigation Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-30 bg-white/80 backdrop-blur-xl border-b border-[hsl(var(--border))]"
        >
          <div className="container mx-auto px-3 xs:px-4 py-3 xs:py-4">
            <Button
              onClick={() => navigate("/markets")}
              variant="ghost"
              className="group text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--sand))] transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Markets
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="relative z-10 pt-4 sm:pt-6 md:pt-8">
          <div className="container mx-auto px-4">
            {/* Mobile Layout: Single Column */}
            <div className="lg:hidden">
              {/* Mobile Hero Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="relative rounded-2xl overflow-hidden shadow-lg mb-6 h-64 w-full"
              >
                <motion.img
                  src={imageUrl}
                  alt={metadata?.short_description || "Kuri Circle"}
                  className="w-full h-full object-cover"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/20" />

                {/* Share Button - Top Right */}
                <motion.div
                  className="absolute top-4 right-4 z-40"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={handleShareClick}
                    className="bg-black/50 backdrop-blur-sm text-white p-2 rounded-full hover:bg-black/60 transition-all duration-300"
                  >
                    <span className="material-icons">share</span>
                  </button>
                </motion.div>

                {/* Title and Mobile Stats Overlay */}
                <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                  <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-3xl font-bold mb-3"
                  >
                    {metadata?.short_description || "Kuri Circle"}
                  </motion.h1>

                  {/* Mobile Liquid Morphic Stats Card - Same as Desktop */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="bg-white/20 backdrop-blur-sm rounded-2xl p-4"
                  >
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="flex items-center justify-center text-lg">
                          <span className="material-icons mr-1.5 text-xl">
                            groups
                          </span>
                        </div>
                        <p className="font-bold text-2xl">
                          {marketData.totalActiveParticipantsCount}/
                          {marketData.totalParticipantsCount}
                        </p>
                        <p className="text-xs opacity-80">Members</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center text-lg">
                          <span className="material-icons mr-1.5 text-xl">
                            paid
                          </span>
                        </div>
                        <p className="font-bold text-2xl">
                          $
                          {(
                            Number(marketData.kuriAmount) / 1_000_000
                          ).toFixed(0)}
                        </p>
                        <p className="text-xs opacity-80">Contribution</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-center text-lg">
                          <span className="material-icons mr-1.5 text-xl">
                            savings
                          </span>
                        </div>
                        <p className="font-bold text-2xl">
                          $
                          {(
                            (Number(marketData.kuriAmount) / 1_000_000) *
                            marketData.totalParticipantsCount
                          ).toFixed(0)}
                        </p>
                        <p className="text-xs opacity-80">Pool</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Desktop Layout: 1/3 + 2/3 Grid */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
              {/* Left Section: Hero Image with Liquid Morphic Stats */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="relative rounded-3xl overflow-hidden shadow-lg aspect-square w-full"
                >
                  <motion.img
                    src={imageUrl}
                    alt={metadata?.short_description || "Kuri Circle"}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

                  {/* Share Button - Top Right */}
                  <motion.div
                    className="absolute top-4 right-4 z-40"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      onClick={handleShareClick}
                      className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-all duration-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
                        />
                      </svg>
                    </button>
                  </motion.div>

                  {/* Title and Liquid Morphic Stats Overlay */}
                  <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                    <motion.h1
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.8 }}
                      className="text-4xl font-bold mb-6"
                    >
                      {metadata?.short_description || "Kuri Circle"}
                    </motion.h1>

                    {/* Liquid Morphic Stats Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.8 }}
                      className="bg-white/20 backdrop-blur-sm rounded-2xl p-4"
                    >
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="flex items-center justify-center text-lg">
                            <span className="material-icons mr-1.5 text-xl">
                              groups
                            </span>
                          </div>
                          <p className="font-bold text-2xl">
                            {marketData.totalActiveParticipantsCount}/
                            {marketData.totalParticipantsCount}
                          </p>
                          <p className="text-xs opacity-80">Members</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center text-lg">
                            <span className="material-icons mr-1.5 text-xl">
                              paid
                            </span>
                          </div>
                          <p className="font-bold text-2xl">
                            $
                            {(
                              Number(marketData.kuriAmount) / 1_000_000
                            ).toFixed(0)}
                          </p>
                          <p className="text-xs opacity-80">Contribution</p>
                        </div>
                        <div>
                          <div className="flex items-center justify-center text-lg">
                            <span className="material-icons mr-1.5 text-xl">
                              savings
                            </span>
                          </div>
                          <p className="font-bold text-2xl">
                            $
                            {(
                              (Number(marketData.kuriAmount) / 1_000_000) *
                              marketData.totalParticipantsCount
                            ).toFixed(0)}
                          </p>
                          <p className="text-xs opacity-80">Pool</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </div>

              {/* Right Section: Content Card */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-3xl shadow-lg h-full"
                >
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`flex items-center py-4 px-6 transition-all duration-300 ${
                        activeTab === "overview"
                          ? "text-[#E67A50] border-b-2 border-[#E67A50] font-semibold"
                          : "text-[#7D7D7D] hover:text-[#E67A50]"
                      }`}
                    >
                      <span className="material-icons mr-2">visibility</span>
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className={`flex items-center py-4 px-6 transition-all duration-300 ${
                        activeTab === "activity"
                          ? "text-[#E67A50] border-b-2 border-[#E67A50] font-semibold"
                          : "text-[#7D7D7D] hover:text-[#E67A50]"
                      }`}
                    >
                      <span className="material-icons mr-2">timeline</span>
                      Activity
                    </button>
                    <button
                      onClick={() => setActiveTab("members")}
                      className={`flex items-center py-4 px-6 transition-all duration-300 ${
                        activeTab === "members"
                          ? "text-[#E67A50] border-b-2 border-[#E67A50] font-semibold"
                          : "text-[#7D7D7D] hover:text-[#E67A50]"
                      }`}
                    >
                      <span className="material-icons mr-2">
                        people_outline
                      </span>
                      Members
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="p-8">
                    <AnimatePresence mode="wait">
                      {activeTab === "overview" && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-8"
                        >
                          {/* About Section */}
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                              About This Circle
                            </h2>
                            <p className="text-gray-600 mb-8">
                              {metadata?.long_description ||
                                metadata?.short_description ||
                                "This is a community savings circle powered by the Kuri protocol. Members contribute regularly and take turns receiving the full pot, creating a supportive financial ecosystem without interest or fees."}
                            </p>
                          </div>

                          {/* Two Column Grid: Circle Stats + Creator */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Circle Stats */}
                            <div className="bg-orange-50 p-6 rounded-2xl">
                              <h3 className="font-bold text-lg text-gray-800 mb-3">
                                Circle Stats
                              </h3>
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    Created On
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {metadata?.created_at
                                      ? new Date(
                                          metadata.created_at
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })
                                      : new Date(
                                          Number(marketData.startTime) * 1000
                                        ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    Payout Frequency
                                  </span>
                                  <span className="font-semibold text-gray-800 capitalize">
                                    {getIntervalTypeText(
                                      marketData.intervalType
                                    )}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    Next Payout
                                  </span>
                                  <span className="font-semibold text-gray-800">
                                    {marketData.state === KuriState.ACTIVE
                                      ? new Date(
                                          Number(marketData.nexRaffleTime) *
                                            1000
                                        ).toLocaleDateString()
                                      : "TBD"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    Circle Status
                                  </span>
                                  {(() => {
                                    const badge = getStatusBadge(
                                      marketData.state
                                    );
                                    return (
                                      <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}
                                      >
                                        {badge.text}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

                            {/* Creator */}
                            <div className="bg-gray-100 p-6 rounded-2xl">
                              <h3 className="font-bold text-lg text-gray-800 mb-3">
                                Creator
                              </h3>
                              {creatorProfileLoading ? (
                                <div className="flex items-center">
                                  <div className="w-16 h-16 bg-gray-300 rounded-full animate-pulse mr-4" />
                                  <div className="flex-1">
                                    <div className="h-5 bg-gray-300 rounded animate-pulse mb-2" />
                                    <div className="h-4 bg-gray-300 rounded animate-pulse w-2/3" />
                                  </div>
                                </div>
                              ) : creatorProfile ? (
                                <div className="flex items-center">
                                  <img
                                    src={
                                      creatorProfile.profile_image_url ||
                                      "/images/default-avatar.png"
                                    }
                                    alt={
                                      creatorProfile.display_name ||
                                      creatorProfile.username ||
                                      "Creator"
                                    }
                                    className="w-16 h-16 rounded-full mr-4 object-cover"
                                  />
                                  <div>
                                    <p className="font-bold text-gray-900 text-lg">
                                      {creatorProfile.display_name ||
                                        creatorProfile.username ||
                                        "Anonymous Creator"}
                                    </p>
                                    <p className="text-gray-500 text-sm truncate">
                                      {marketData.creator.slice(0, 6)}...
                                      {marketData.creator.slice(-4)}
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E67A50] to-orange-400 flex items-center justify-center mr-4">
                                    <svg
                                      className="w-8 h-8 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4H4zM16 13v5h4v-5h-4zM8 13c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1v-4c0-.55.45-1 1-1z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 text-lg">
                                      Anonymous Creator
                                    </p>
                                    <p className="text-gray-500 text-sm truncate">
                                      {marketData.creator.slice(0, 6)}...
                                      {marketData.creator.slice(-4)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bottom Action Section */}
                          <div className="bg-orange-50 p-6 rounded-2xl">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                              {/* Countdown Section */}
                              <div className="flex-grow">
                                {marketData.state === KuriState.INLAUNCH && (
                                  <>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                      Launch Period Ends In
                                    </h3>
                                    <div className="flex items-end gap-x-3">
                                      <div className="text-center">
                                        <span className="text-4xl font-bold text-orange-500">
                                          {timeLeft.includes("d")
                                            ? timeLeft
                                                .split("d")[0]
                                                .padStart(2, "0")
                                            : "00"}
                                        </span>
                                        <span className="block text-xs text-gray-600">
                                          Days
                                        </span>
                                      </div>
                                      <span className="text-4xl font-bold text-orange-500">
                                        :
                                      </span>
                                      <div className="text-center">
                                        <span className="text-4xl font-bold text-orange-500">
                                          {timeLeft.includes("h")
                                            ? timeLeft
                                                .split("h")[0]
                                                .split(" ")
                                                .pop()
                                                ?.padStart(2, "0")
                                            : "00"}
                                        </span>
                                        <span className="block text-xs text-gray-600">
                                          Hours
                                        </span>
                                      </div>
                                      <span className="text-4xl font-bold text-orange-500">
                                        :
                                      </span>
                                      <div className="text-center">
                                        <span className="text-4xl font-bold text-orange-500">
                                          {timeLeft.includes("m")
                                            ? timeLeft
                                                .split("m")[0]
                                                .split(" ")
                                                .pop()
                                                ?.padStart(2, "0")
                                            : "00"}
                                        </span>
                                        <span className="block text-xs text-gray-600">
                                          Minutes
                                        </span>
                                      </div>
                                      <span className="text-4xl font-bold text-orange-500">
                                        :
                                      </span>
                                      <div className="text-center">
                                        <span className="text-4xl font-bold text-orange-500">
                                          {timeLeft.includes("s")
                                            ? timeLeft
                                                .split("s")[0]
                                                .split(" ")
                                                .pop()
                                                ?.padStart(2, "0")
                                            : "00"}
                                        </span>
                                        <span className="block text-xs text-gray-600">
                                          Seconds
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                )}

                                {marketData.state === KuriState.ACTIVE && (
                                  <>
                                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                                      {Date.now() <
                                      Number(
                                        marketData.nextIntervalDepositTime
                                      ) *
                                        1000
                                        ? "Next Deposit Due In"
                                        : "Next Raffle In"}
                                    </h3>
                                    <SequentialCountdown
                                      raffleTimestamp={
                                        Number(marketData.nexRaffleTime) * 1000
                                      }
                                      depositTimestamp={
                                        Number(
                                          marketData.nextIntervalDepositTime
                                        ) * 1000
                                      }
                                      raffleDate={new Date(
                                        Number(marketData.nexRaffleTime) * 1000
                                      ).toLocaleString()}
                                      depositDate={new Date(
                                        Number(
                                          marketData.nextIntervalDepositTime
                                        ) * 1000
                                      ).toLocaleString()}
                                    />
                                  </>
                                )}

                                {/* Current Winner Display for Active Markets */}
                                {currentWinner &&
                                  marketData.state === KuriState.ACTIVE && (
                                    <div className="mt-4 p-4 bg-gradient-to-br from-[hsl(var(--gold))]/20 to-amber-50 rounded-xl border border-[hsl(var(--gold))]/30">
                                      <h4 className="font-bold text-[#E67A50] mb-2 flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-[hsl(var(--gold))]" />
                                        Round #{currentWinner.intervalIndex}{" "}
                                        Winner
                                      </h4>
                                      {winnerProfileLoading ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse" />
                                          <div className="h-4 bg-gray-300 rounded animate-pulse flex-1" />
                                        </div>
                                      ) : winnerProfile ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--gold))] to-yellow-400 flex items-center justify-center">
                                            {winnerProfile.profile_image_url ? (
                                              <img
                                                src={
                                                  winnerProfile.profile_image_url
                                                }
                                                alt={
                                                  winnerProfile.display_name ||
                                                  winnerProfile.username ||
                                                  "Winner"
                                                }
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <Trophy className="w-4 h-4 text-white" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-800 text-sm">
                                              {winnerProfile.display_name ||
                                                winnerProfile.username ||
                                                "Anonymous Winner"}
                                            </p>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-800">
                                          Anonymous Winner
                                        </p>
                                      )}
                                    </div>
                                  )}

                                {marketData.state === KuriState.COMPLETED && (
                                  <div className="text-center">
                                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                                    <h3 className="text-xl font-bold text-green-900 mb-1">
                                      Circle Completed
                                    </h3>
                                    <p className="text-green-700">
                                      All members have received their payouts
                                    </p>
                                  </div>
                                )}

                                {marketData.state ===
                                  KuriState.LAUNCHFAILED && (
                                  <div className="text-center">
                                    <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                                    <h3 className="text-xl font-bold text-red-900 mb-1">
                                      Launch Failed
                                    </h3>
                                    <p className="text-red-700">
                                      This circle did not reach the minimum
                                      requirements
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Action Button */}
                              <div className="flex-shrink-0">
                                <motion.div
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                >
                                  {renderActionButton()}
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "activity" && (
                        <motion.div
                          key="activity"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <h3 className="text-lg font-bold text-[#E67A50] flex items-center gap-3">
                            <Activity className="w-5 h-5 text-gray-500" />
                            Recent Activity
                          </h3>
                          <div className="text-center py-8">
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center"
                            >
                              <Calendar className="w-8 h-8 text-orange-600" />
                            </motion.div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">
                              Activity Tracking Coming Soon
                            </h4>
                            <p className="text-gray-600 text-sm">
                              Deposits, raffles, and member activities will be
                              displayed here.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {activeTab === "members" && (
                        <motion.div
                          key="members"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-6"
                        >
                          <CircleMembersDisplay marketAddress={address || ""} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Mobile Content Card */}
            <div className="lg:hidden">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-lg"
              >
                {/* Mobile Tabs */}
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-6 -mb-px">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`py-4 px-1 inline-flex items-center text-sm font-medium transition-all duration-300 border-b-2 ${
                        activeTab === "overview"
                          ? "text-[#E67A50] border-[#E67A50]"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="material-icons mr-2 text-xl">visibility</span>
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className={`py-4 px-1 inline-flex items-center text-sm font-medium transition-all duration-300 border-b-2 ${
                        activeTab === "activity"
                          ? "text-[#E67A50] border-[#E67A50]"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="material-icons mr-2 text-xl">timeline</span>
                      Activity
                    </button>
                    <button
                      onClick={() => setActiveTab("members")}
                      className={`py-4 px-1 inline-flex items-center text-sm font-medium transition-all duration-300 border-b-2 ${
                        activeTab === "members"
                          ? "text-[#E67A50] border-[#E67A50]"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="material-icons mr-2 text-xl">groups</span>
                      Members
                    </button>
                  </nav>
                </div>

                {/* Mobile Tab Content */}
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === "overview" && (
                      <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        {/* About Section */}
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 mb-2">
                            About This Circle
                          </h2>
                          <p className="text-gray-600">
                            {metadata?.long_description ||
                              metadata?.short_description ||
                              "This is a community savings circle powered by the Kuri protocol. Members contribute regularly and take turns receiving the full pot, creating a supportive financial ecosystem without interest or fees."}
                          </p>
                        </div>

                        {/* Mobile Circle Stats */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Circle Stats
                          </h3>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Created On
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {metadata?.created_at
                                  ? new Date(
                                      metadata.created_at
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : new Date(
                                      Number(marketData.startTime) * 1000
                                    ).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Payout Frequency
                              </span>
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {getIntervalTypeText(
                                  marketData.intervalType
                                )}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Next Payout
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {marketData.state === KuriState.ACTIVE
                                  ? new Date(
                                      Number(marketData.nexRaffleTime) *
                                        1000
                                    ).toLocaleDateString()
                                  : "TBD"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">
                                Circle Status
                              </span>
                              {(() => {
                                const badge = getStatusBadge(
                                  marketData.state
                                );
                                return (
                                  <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.className}`}
                                  >
                                    {badge.text}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>

                        {/* Mobile Creator Section */}
                        <div className="bg-gray-50 rounded-xl p-4">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Creator
                          </h3>
                          {creatorProfileLoading ? (
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse mr-4" />
                              <div className="flex-1">
                                <div className="h-4 bg-gray-300 rounded animate-pulse mb-2" />
                                <div className="h-3 bg-gray-300 rounded animate-pulse w-2/3" />
                              </div>
                            </div>
                          ) : creatorProfile ? (
                            <div className="flex items-center">
                              <img
                                src={
                                  creatorProfile.profile_image_url ||
                                  "/images/default-avatar.png"
                                }
                                alt={
                                  creatorProfile.display_name ||
                                  creatorProfile.username ||
                                  "Creator"
                                }
                                className="w-12 h-12 rounded-full mr-4 object-cover"
                              />
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {creatorProfile.display_name ||
                                    creatorProfile.username ||
                                    "Anonymous Creator"}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {marketData.creator.slice(0, 6)}...
                                  {marketData.creator.slice(-4)}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E67A50] to-orange-400 flex items-center justify-center mr-4">
                                <svg
                                  className="w-6 h-6 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zM4 18v-4h3v4H4zM16 13v5h4v-5h-4zM8 13c.55 0 1 .45 1 1v4c0 .55-.45 1-1 1s-1-.45-1-1v-4c0-.55.45-1 1-1z" />
                                </svg>
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">
                                  Anonymous Creator
                                </div>
                                <div className="text-sm text-gray-500">
                                  {marketData.creator.slice(0, 6)}...
                                  {marketData.creator.slice(-4)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "activity" && (
                      <motion.div
                        key="activity"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <h3 className="text-lg font-bold text-[#E67A50] flex items-center gap-3">
                          <Activity className="w-5 h-5 text-gray-500" />
                          Recent Activity
                        </h3>
                        <div className="text-center py-8">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center"
                          >
                            <Calendar className="w-8 h-8 text-orange-600" />
                          </motion.div>
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">
                            Activity Tracking Coming Soon
                          </h4>
                          <p className="text-gray-600 text-sm">
                            Deposits, raffles, and member activities will be
                            displayed here.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "members" && (
                      <motion.div
                        key="members"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6"
                      >
                        <CircleMembersDisplay marketAddress={address || ""} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Mobile Countdown/Action Section */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-orange-100 rounded-2xl p-6 mt-6"
              >
                {marketData.state === KuriState.INLAUNCH && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                      Launch Period Ends In
                    </h3>
                    <div className="flex justify-center items-baseline space-x-2 text-gray-900 mb-6">
                      <div>
                        <span className="text-4xl font-bold">
                          {timeLeft.includes("d")
                            ? timeLeft
                                .split("d")[0]
                                .padStart(2, "0")
                            : "00"}
                        </span>
                        <span className="block text-xs text-gray-600">Days</span>
                      </div>
                      <span className="text-3xl font-bold text-orange-500">:</span>
                      <div>
                        <span className="text-4xl font-bold">
                          {timeLeft.includes("h")
                            ? timeLeft
                                .split("h")[0]
                                .split(" ")
                                .pop()
                                ?.padStart(2, "0")
                            : "00"}
                        </span>
                        <span className="block text-xs text-gray-600">Hours</span>
                      </div>
                      <span className="text-3xl font-bold text-orange-500">:</span>
                      <div>
                        <span className="text-4xl font-bold">
                          {timeLeft.includes("m")
                            ? timeLeft
                                .split("m")[0]
                                .split(" ")
                                .pop()
                                ?.padStart(2, "0")
                            : "00"}
                        </span>
                        <span className="block text-xs text-gray-600">Minutes</span>
                      </div>
                      <span className="text-3xl font-bold text-orange-500">:</span>
                      <div>
                        <span className="text-4xl font-bold">
                          {timeLeft.includes("s")
                            ? timeLeft
                                .split("s")[0]
                                .split(" ")
                                .pop()
                                ?.padStart(2, "0")
                            : "00"}
                        </span>
                        <span className="block text-xs text-gray-600">Seconds</span>
                      </div>
                    </div>
                  </>
                )}

                {marketData.state === KuriState.ACTIVE && (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                      {Date.now() <
                      Number(
                        marketData.nextIntervalDepositTime
                      ) *
                        1000
                        ? "Next Deposit Due In"
                        : "Next Raffle In"}
                    </h3>
                    <div className="flex justify-center mb-6">
                      <SequentialCountdown
                        raffleTimestamp={
                          Number(marketData.nexRaffleTime) * 1000
                        }
                        depositTimestamp={
                          Number(
                            marketData.nextIntervalDepositTime
                          ) * 1000
                        }
                        raffleDate={new Date(
                          Number(marketData.nexRaffleTime) * 1000
                        ).toLocaleString()}
                        depositDate={new Date(
                          Number(
                            marketData.nextIntervalDepositTime
                          ) * 1000
                        ).toLocaleString()}
                      />
                    </div>
                  </>
                )}

                {marketData.state === KuriState.COMPLETED && (
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-green-900 mb-1">
                      Circle Completed
                    </h3>
                    <p className="text-green-700">
                      All members have received their payouts
                    </p>
                  </div>
                )}

                {marketData.state === KuriState.LAUNCHFAILED && (
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                    <h3 className="text-xl font-bold text-red-900 mb-1">
                      Launch Failed
                    </h3>
                    <p className="text-red-700">
                      This circle did not reach the minimum requirements
                    </p>
                  </div>
                )}

                {/* Mobile Action Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex justify-center"
                >
                  {renderActionButton()}
                </motion.div>
              </motion.div>
            </div>

            {/* Member Actions for Active Members - Integrated into main layout */}
            {membershipStatus === 1 &&
              marketData.state === KuriState.ACTIVE && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 bg-white rounded-2xl lg:rounded-3xl shadow-lg p-6 lg:p-8"
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E67A50] to-orange-400 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-[#E67A50]">
                        Member Actions
                      </h3>
                    </div>
                  </div>

                  {/* Action Cards Grid */}
                  <div
                    className={`grid grid-cols-1 ${
                      shouldShowClaimCard ? "lg:grid-cols-2" : "lg:grid-cols-1"
                    } gap-4 lg:gap-6`}
                  >
                    {/* Deposit Card */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 }}
                      className="bg-orange-50 p-4 lg:p-6 rounded-2xl"
                    >
                      <DepositForm
                        marketData={marketData}
                        kuriAddress={address as `0x${string}`}
                      />
                    </motion.div>

                    {/* Claim Card - Only show to winners who haven't claimed */}
                    {shouldShowClaimCard && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 }}
                        className="bg-green-50 p-4 lg:p-6 rounded-2xl"
                      >
                        <ClaimInterface
                          marketData={marketData}
                          kuriAddress={address as `0x${string}`}
                          onClaimSuccess={handleClaimSuccess}
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
          </div>
        </div>
      </div>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        market={{
          address: address || "",
          creator: marketData?.creator || "",
          totalParticipants: marketData?.totalParticipantsCount || 0,
          activeParticipants: marketData?.totalActiveParticipantsCount || 0,
          kuriAmount: marketData?.kuriAmount.toString() || "0",
          intervalType: marketData?.intervalType || 0,
          state: Number(marketData?.state || 0),
          nextDepositTime:
            marketData?.nextIntervalDepositTime.toString() || "0",
          nextRaffleTime: marketData?.nexRaffleTime.toString() || "0",
          createdAt: "0",
          name: metadata?.short_description || "Kuri Circle",
          nextDraw: marketData?.nexRaffleTime.toString() || "0",
          launchPeriod: marketData?.launchPeriod.toString() || "0",
          startTime: marketData?.startTime.toString() || "0",
          endTime: marketData?.endTime.toString() || "0",
        }}
      />
    </>
  );
}
