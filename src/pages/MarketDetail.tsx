import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useKuriCore, KuriState } from "../hooks/contracts/useKuriCore";
import { KuriState as GraphQLKuriState } from "../graphql/types";
import { useKuriMarketDetail } from "../hooks/useKuriMarketDetail";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MarketSEO } from "../components/seo/MarketSEO";
import { ShareButton } from "../components/ui/ShareButton";
import { ShareModal } from "../components/modals/ShareModal";
import { ManageMembersDialog } from "../components/markets/ManageMembersDialog";
import { DepositForm } from "../components/markets/DepositForm";
import { ClaimInterface } from "../components/markets/ClaimInterface";
import { useAccount } from "wagmi";
import { getAccount } from "@wagmi/core";
import { config } from "../config/wagmi";
import { formatUnits } from "viem";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Clock,
  Users,
  DollarSign,
  Calendar,
  Trophy,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Zap,
  Star,
  Activity,
  BarChart3,
  PieChart,
  Timer,
  ArrowRight,
  UserCheck,
  Coins,
  Award,
  CalendarDays,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useProfileRequired } from "../hooks/useProfileRequired";
import { useUserProfileByAddress } from "../hooks/useUserProfile";
import { isUserRejection } from "../utils/errors";
import { DualCountdown } from "../components/ui/DotMatrixCountdown";
import { trackEvent, trackError } from "../utils/analytics";

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
  const { data, error } = await supabase
    .from("kuri_web")
    .select("*")
    .ilike("market_address", marketAddress)
    .single();

  if (error || !data) return null;
  return data as MarketMetadata;
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

const getStatusColor = (state: KuriState) => {
  switch (state) {
    case KuriState.INLAUNCH:
      return "bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-lg";
    case KuriState.LAUNCHFAILED:
      return "bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-lg";
    case KuriState.ACTIVE:
      return "bg-gradient-to-r from-[hsl(var(--forest))] to-[hsl(var(--forest))] text-white border-0 shadow-lg";
    case KuriState.COMPLETED:
      return "bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 shadow-lg";
    default:
      return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0 shadow-lg";
  }
};

const getStatusText = (state: KuriState) => {
  switch (state) {
    case KuriState.INLAUNCH:
      return "🚀 Launch Phase";
    case KuriState.LAUNCHFAILED:
      return "❌ Launch Failed";
    case KuriState.ACTIVE:
      return "✨ Active Circle";
    case KuriState.COMPLETED:
      return "🎉 Completed";
    default:
      return "❓ Unknown";
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
  const { address: userAddress } = useAccount();
  const account = getAccount(config);

  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "members"
  >("overview");
  const [membershipStatus, setMembershipStatus] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [raffleTimeLeft, setRaffleTimeLeft] = useState<string>("");
  const [depositTimeLeft, setDepositTimeLeft] = useState<string>("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const { requireProfile } = useProfileRequired({
    strict: false,
    action: "join_circle",
  });

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
    requestMembership,
    initializeKuri,
    getMemberStatus,
    fetchMarketData,
    checkPaymentStatusIfMember, // 🔥 NEW: Explicit payment status check
  } = useKuriCore(address as `0x${string}`);

  // Fetch creator's profile
  const { profile: creatorProfile, loading: creatorProfileLoading } =
    useUserProfileByAddress(marketData?.creator || null);

  // Fetch metadata
  const { data: metadata } = useQuery({
    queryKey: ["market-metadata", address],
    queryFn: () => getMetadata(address || ""),
    enabled: !!address,
  });

  // Fetch market detail with winners data
  const { marketDetail } = useKuriMarketDetail(address || "");

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
  const { profile: winnerProfile, loading: winnerProfileLoading } =
    useUserProfileByAddress(currentWinner?.winner || null);

  // Fetch membership status
  useEffect(() => {
    const fetchMemberStatus = async () => {
      if (!account.address || !address) return;
      try {
        const status = await getMemberStatus(account.address);
        setMembershipStatus(status ?? 0);
      } catch (err) {
        console.error("Error fetching member status:", err);
        setMembershipStatus(0);
      }
    };

    fetchMemberStatus();
  }, [account.address, getMemberStatus, address]);

  // 🔥 NEW: Explicitly check payment status when needed (lazy loading)
  useEffect(() => {
    const checkPaymentStatus = async () => {
      if (!account.address || !marketData) return;

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
  }, [account.address, marketData?.state, checkPaymentStatusIfMember]);

  // Calculate launch end time and countdown
  const launchEndTime = useMemo(() => {
    if (!marketData) return 0;
    return Number(marketData.launchPeriod) * 1000;
  }, [marketData]);

  useEffect(() => {
    if (!marketData) return;

    let timer: NodeJS.Timeout;

    const updateTimers = () => {
      const now = Date.now();

      // Handle INLAUNCH countdown (existing logic)
      if (marketData.state === KuriState.INLAUNCH) {
        const end = launchEndTime;
        const diff = end - now;

        if (diff <= 0) {
          setTimeLeft("Launch period ended");
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);

          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }

      // Handle ACTIVE market countdowns (new logic)
      if (marketData.state === KuriState.ACTIVE) {
        // Raffle countdown
        const raffleEnd = Number(marketData.nexRaffleTime) * 1000;
        const raffleDiff = raffleEnd - now;

        if (raffleDiff <= 0) {
          setRaffleTimeLeft("Raffle due now");
        } else {
          const days = Math.floor(raffleDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (raffleDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (raffleDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((raffleDiff % (1000 * 60)) / 1000);

          if (days > 0) {
            setRaffleTimeLeft(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setRaffleTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          } else {
            setRaffleTimeLeft(`${minutes}m ${seconds}s`);
          }
        }

        // Deposit countdown
        const depositEnd = Number(marketData.nextIntervalDepositTime) * 1000;
        const depositDiff = depositEnd - now;

        if (depositDiff <= 0) {
          setDepositTimeLeft("Payment due now");
        } else {
          const days = Math.floor(depositDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (depositDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (depositDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((depositDiff % (1000 * 60)) / 1000);

          if (days > 0) {
            setDepositTimeLeft(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setDepositTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
          } else {
            setDepositTimeLeft(`${minutes}m ${seconds}s`);
          }
        }
      }
    };

    // Run timer for both INLAUNCH and ACTIVE states
    if (
      marketData.state === KuriState.INLAUNCH ||
      marketData.state === KuriState.ACTIVE
    ) {
      timer = setInterval(updateTimers, 1000);
      updateTimers(); // Initial update
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [marketData, launchEndTime]);

  // Check if user is creator
  const isCreator = useMemo(() => {
    return (
      marketData &&
      account.address &&
      marketData.creator.toLowerCase() === account.address.toLowerCase()
    );
  }, [marketData, account.address]);

  // Check if market can be initialized
  const canInitialize = useMemo(() => {
    return (
      marketData &&
      marketData.state === KuriState.INLAUNCH &&
      marketData.totalActiveParticipantsCount ===
        marketData.totalParticipantsCount
    );
  }, [marketData]);

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
    if (!account.address) {
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
      await requestMembership();
      toast.success("Membership request sent!");

      // Track successful market join
      if (marketData) {
        trackEvent("market_joined", {
          market_address: address || "",
          interval_type: marketData.intervalType === 0 ? "weekly" : "monthly",
          participants: marketData.totalParticipantsCount,
        });
      }

      // Refresh membership status
      const status = await getMemberStatus(account.address);
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
    if (!account.address) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsInitializing(true);
    try {
      await initializeKuri();
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
    if (!account.address) return;

    try {
      // Refresh membership status
      const status = await getMemberStatus(account.address);
      setMembershipStatus(status ?? 0);
      // Refresh market data to get updated participant counts
      await fetchMarketData();
    } catch (err) {
      console.error("Error refreshing member status:", err);
    }
  };

  // Get membership status display
  const getMembershipStatusDisplay = () => {
    switch (membershipStatus) {
      case 0: // NONE
        return null;
      case 1: // ACCEPTED - Now handled by tick icon in image
        return null;
      case 2: // REJECTED
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full shadow-lg border-2 border-white/20"
          >
            <XCircle className="w-4 h-4" />
            <span className="font-semibold">Rejected</span>
          </motion.div>
        );
      case 3: // FLAGGED
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full shadow-lg border-2 border-white/20"
          >
            <AlertCircle className="w-4 h-4" />
            <span className="font-semibold">Flagged</span>
          </motion.div>
        );
      case 4: // APPLIED
        return (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--ochre))] text-white rounded-full shadow-lg border-2 border-white/20"
          >
            <Clock className="w-4 h-4" />
            <span className="font-semibold">Applied</span>
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Render action button
  const renderActionButton = () => {
    // Don't show action buttons when wallet is not connected
    if (!account.address) {
      return (
        <motion.div>
          <Button
            disabled
            className="w-full bg-gradient-to-r from-gray-300 to-gray-400 text-black border-0 py-4 text-lg font-semibold rounded-2xl shadow-lg cursor-not-allowed opacity-70"
          >
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 0h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Connect Wallet to Join
          </Button>
        </motion.div>
      );
    }

    if (isCreator) {
      if (canInitialize) {
        return (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleInitialize}
              disabled={isInitializing}
              className="w-full bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] hover:from-[hsl(var(--terracotta))] hover:to-[hsl(var(--terracotta))] text-white border-0 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isInitializing ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Zap className="h-5 w-5 mr-2" />
              )}
              {isInitializing
                ? "Initializing Circle..."
                : "Initialize Kuri Circle"}
            </Button>
          </motion.div>
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
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button className="w-full bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] hover:from-[hsl(var(--terracotta))] hover:to-[hsl(var(--terracotta))] text-white border-0 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Users className="h-5 w-5 mr-2" />
              Manage Members ({marketData?.totalActiveParticipantsCount || 0}/
              {marketData?.totalParticipantsCount || 0})
            </Button>
          </motion.div>
        </ManageMembersDialog>
      );
    }

    // For non-creators
    switch (membershipStatus) {
      case 0: // NONE
        return (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleJoinRequest}
              disabled={isRequesting || isMarketFull}
              className={`w-full py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group border-0 ${
                isMarketFull
                  ? "bg-gradient-to-r from-gray-400 to-gray-500 text-white cursor-not-allowed"
                  : "bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] hover:from-[hsl(var(--terracotta))] hover:to-[hsl(var(--terracotta))] text-white"
              }`}
              title={isMarketFull ? "This circle is already full" : undefined}
            >
              {!isMarketFull && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              )}
              {isRequesting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : isMarketFull ? (
                <XCircle className="h-5 w-5 mr-2" />
              ) : (
                <CheckCircle className="h-5 w-5 mr-2" />
              )}
              {isRequesting
                ? "Sending Request..."
                : isMarketFull
                ? "Circle Full"
                : "Request to Join Circle"}
            </Button>
          </motion.div>
        );

      case 1: // ACCEPTED
        return (
          <motion.div whileHover={{ scale: 1.02 }}>
            <Button
              disabled
              className="w-full bg-gradient-to-r from-[hsl(var(--forest))] to-[hsl(var(--forest))] text-white border-0 py-4 text-lg font-semibold rounded-2xl shadow-lg cursor-not-allowed opacity-90"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Active Member
            </Button>
          </motion.div>
        );

      case 2: // REJECTED
        return (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleJoinRequest}
              disabled={isRequesting || isMarketFull}
              className="w-full bg-gradient-to-r from-[hsl(var(--ochre))] to-[hsl(var(--gold))] hover:from-[hsl(var(--ochre))] hover:to-[hsl(var(--ochre))] text-white border-0 py-4 text-lg font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              {isRequesting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-5 w-5 mr-2" />
              )}
              {isRequesting ? "Sending Request..." : "Request Again"}
            </Button>
          </motion.div>
        );

      case 3: // FLAGGED
        return (
          <motion.div whileHover={{ scale: 1.02 }}>
            <Button
              disabled
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white border-0 py-4 text-lg font-semibold rounded-2xl shadow-lg cursor-not-allowed opacity-90"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              Account Flagged
            </Button>
          </motion.div>
        );

      case 4: // APPLIED
        return (
          <motion.div whileHover={{ scale: 1.02 }}>
            <Button
              disabled
              className="w-full bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--ochre))] text-white border-0 py-4 text-lg font-semibold rounded-2xl shadow-lg cursor-not-allowed opacity-90"
            >
              <Clock className="h-5 w-5 mr-2" />
              Application Pending
            </Button>
          </motion.div>
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

      <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--sand))] via-[hsl(var(--ivory))] to-[hsl(var(--sand))]">
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
            {/* Row 1: Circle Image + About This Circle */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8">
              {/* Column 1: Circle Image with Hero Elements */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-1 bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col"
              >
                {/* Circle Image */}
                <div className="relative flex-1 min-h-[280px]">
                  <motion.img
                    src={imageUrl}
                    alt={metadata?.short_description || "Kuri Circle"}
                    className="w-full h-full object-cover"
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Active Member Tick - Top Left */}
                  {membershipStatus === 1 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center shadow-lg border border-white/30 hover:bg-white/30 transition-all duration-300"
                    >
                      <CheckCircle className="w-5 h-5 text-white drop-shadow-lg" />
                    </motion.div>
                  )}

                  {/* Share Button */}
                  <motion.div
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <ShareButton
                      market={{
                        address: address || "",
                        creator: marketData.creator,
                        totalParticipants: marketData.totalParticipantsCount,
                        activeParticipants:
                          marketData.totalActiveParticipantsCount,
                        kuriAmount: marketData.kuriAmount.toString(),
                        intervalType: marketData.intervalType,
                        state: convertToGraphQLKuriState(marketData.state),
                        nextDepositTime:
                          marketData.nextIntervalDepositTime.toString(),
                        nextRaffleTime: marketData.nexRaffleTime.toString(),
                        createdAt: "0",
                        name: metadata?.short_description || "Kuri Circle",
                        nextDraw: marketData.nexRaffleTime.toString(),
                        launchPeriod: marketData.launchPeriod.toString(),
                        startTime: marketData.startTime.toString(),
                        endTime: marketData.endTime.toString(),
                      }}
                      isLoading={showShareModal}
                      onClick={handleShareClick}
                      className="bg-white/90 backdrop-blur-sm hover:bg-white text-gray-700 hover:text-terracotta shadow-lg border border-white/20"
                    />
                  </motion.div>

                  {/* Title and Quick Stats */}
                  <div className="absolute inset-0 flex items-end">
                    <div className="p-4 sm:p-6 w-full">
                      <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="text-xl sm:text-2xl md:text-3xl font-sans font-semibold text-white mb-3 sm:mb-4 tracking-tight leading-tight"
                        style={{
                          textShadow:
                            "2px 4px 8px rgba(0,0,0,0.7), 0 0 20px rgba(0,0,0,0.3)",
                        }}
                      >
                        {metadata?.short_description || "Kuri Circle"}
                      </motion.h1>

                      {/* Quick Stats Bar */}
                      <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.8 }}
                        className="space-y-2 text-white/90"
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-[hsl(var(--gold))] flex-shrink-0" />
                          <span className="font-medium text-sm">
                            {marketData.totalActiveParticipantsCount}/
                            {marketData.totalParticipantsCount} Members
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-[hsl(var(--gold))] flex-shrink-0" />
                          <span className="font-medium text-sm">
                            $
                            {(
                              Number(marketData.kuriAmount) / 1_000_000
                            ).toFixed(2)}{" "}
                            Contribution
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-[hsl(var(--gold))] flex-shrink-0" />
                          <span className="font-medium text-sm">
                            $
                            {(
                              (Number(marketData.kuriAmount) / 1_000_000) *
                              marketData.totalParticipantsCount
                            ).toFixed(2)}{" "}
                            Pool
                          </span>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Column 2: About This Circle */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden"
              >
                {/* Enhanced Tabs */}
                <div className="border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--sand))] to-white">
                  <nav className="flex">
                    {[
                      { id: "overview", label: "Overview", icon: null },
                      { id: "activity", label: "Activity", icon: Activity },
                      { id: "members", label: "Members", icon: Users },
                    ].map(({ id, label, icon: Icon }) => (
                      <motion.button
                        key={id}
                        onClick={() => setActiveTab(id as any)}
                        className={`flex-1 px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-6 text-xs sm:text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 relative ${
                          activeTab === id
                            ? "text-[hsl(var(--terracotta))] bg-white shadow-lg"
                            : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--terracotta))] hover:bg-white/50"
                        }`}
                        whileHover={{ y: -2 }}
                        whileTap={{ y: 0 }}
                      >
                        {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
                        <span className="hidden sm:inline">{label}</span>
                        <span className="sm:hidden">{label.slice(0, 3)}</span>
                      </motion.button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6 md:p-8">
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
                        <div>
                          <h3 className="text-2xl font-bold text-[hsl(var(--terracotta))] mb-4">
                            About This Circle
                          </h3>
                          <p className="text-[hsl(var(--foreground))] leading-relaxed text-lg">
                            {metadata?.long_description ||
                              metadata?.short_description ||
                              "This is a community savings circle powered by the Kuri protocol. Members contribute regularly and take turns receiving the full pot, creating a supportive financial ecosystem without interest or fees."}
                          </p>
                        </div>

                        {/* Winner Card - Show when there's a current winner */}
                        {currentWinner && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4 }}
                            className="max-w-md"
                          >
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              className="p-6 bg-gradient-to-br from-[hsl(var(--gold))] via-yellow-50 to-amber-50 rounded-2xl border-2 border-[hsl(var(--gold))] hover:shadow-lg transition-all duration-300 relative overflow-hidden"
                            >
                              {/* Crown decoration */}
                              <div className="absolute top-4 right-4">
                                <Crown className="w-8 h-8 text-[hsl(var(--gold))] opacity-20" />
                              </div>

                              <h4 className="font-bold text-[hsl(var(--terracotta))] mb-3 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-[hsl(var(--gold))]" />
                                Round #{currentWinner.intervalIndex} Winner
                              </h4>

                              {winnerProfileLoading ? (
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 bg-[hsl(var(--muted))] rounded-full animate-pulse" />
                                  <div className="flex-1">
                                    <div className="h-5 bg-[hsl(var(--muted))] rounded animate-pulse mb-2" />
                                    <div className="h-4 bg-[hsl(var(--muted))] rounded animate-pulse w-2/3" />
                                  </div>
                                </div>
                              ) : winnerProfile ? (
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--gold))] to-yellow-400 flex items-center justify-center border-2 border-white shadow-lg">
                                    {winnerProfile.profile_image_url ? (
                                      <img
                                        src={winnerProfile.profile_image_url}
                                        alt={
                                          winnerProfile.display_name ||
                                          winnerProfile.username ||
                                          "Winner"
                                        }
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Trophy className="w-8 h-8 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-[hsl(var(--foreground))] text-lg">
                                      🎉{" "}
                                      {winnerProfile.display_name ||
                                        winnerProfile.username ||
                                        "Anonymous Winner"}
                                    </p>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] font-mono break-all">
                                      {currentWinner.winner.slice(0, 6)}...
                                      {currentWinner.winner.slice(-4)}
                                    </p>
                                    <p className="text-xs text-[hsl(var(--terracotta))] mt-1 font-medium">
                                      Congratulations on winning this round! 🏆
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--gold))] to-yellow-400 flex items-center justify-center border-2 border-white shadow-lg">
                                    <Trophy className="w-8 h-8 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-[hsl(var(--foreground))] text-lg">
                                      🎉 Anonymous Winner
                                    </p>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))] font-mono break-all">
                                      {currentWinner.winner.slice(0, 6)}...
                                      {currentWinner.winner.slice(-4)}
                                    </p>
                                    <p className="text-xs text-[hsl(var(--terracotta))] mt-1 font-medium">
                                      Congratulations on winning this round! 🏆
                                    </p>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          </motion.div>
                        )}

                        <div className="max-w-md">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-6 bg-gradient-to-br from-[hsl(var(--sand))] to-white rounded-2xl border border-[hsl(var(--border))] hover:shadow-lg transition-all duration-300"
                          >
                            <h4 className="font-bold text-[hsl(var(--terracotta))] mb-3 flex items-center gap-2">
                              <Users className="w-5 h-5" />
                              Creator
                            </h4>
                            {creatorProfileLoading ? (
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-[hsl(var(--muted))] rounded-full animate-pulse" />
                                <div className="flex-1">
                                  <div className="h-4 bg-[hsl(var(--muted))] rounded animate-pulse mb-2" />
                                  <div className="h-3 bg-[hsl(var(--muted))] rounded animate-pulse w-2/3" />
                                </div>
                              </div>
                            ) : creatorProfile ? (
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--gold))] flex items-center justify-center">
                                  {creatorProfile.profile_image_url ? (
                                    <img
                                      src={creatorProfile.profile_image_url}
                                      alt={
                                        creatorProfile.display_name ||
                                        creatorProfile.username ||
                                        "Creator"
                                      }
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Users className="w-6 h-6 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-[hsl(var(--foreground))]">
                                    {creatorProfile.display_name ||
                                      creatorProfile.username ||
                                      "Anonymous Creator"}
                                  </p>
                                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono break-all">
                                    {marketData.creator.slice(0, 6)}...
                                    {marketData.creator.slice(-4)}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--gold))] flex items-center justify-center">
                                  <Users className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-[hsl(var(--foreground))]">
                                    Anonymous Creator
                                  </p>
                                  <p className="text-xs text-[hsl(var(--muted-foreground))] font-mono break-all">
                                    {marketData.creator.slice(0, 6)}...
                                    {marketData.creator.slice(-4)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </div>

                        {marketData.state === KuriState.ACTIVE && (
                          <DualCountdown
                            raffleTimestamp={
                              Number(marketData.nexRaffleTime) * 1000
                            }
                            depositTimestamp={
                              Number(marketData.nextIntervalDepositTime) * 1000
                            }
                            raffleDate={new Date(
                              Number(marketData.nexRaffleTime) * 1000
                            ).toLocaleString()}
                            depositDate={new Date(
                              Number(marketData.nextIntervalDepositTime) * 1000
                            ).toLocaleString()}
                          />
                        )}
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
                        <h3 className="text-2xl font-bold text-[hsl(var(--terracotta))] flex items-center gap-3">
                          <Activity className="w-6 h-6 text-gray-500" />
                          Recent Activity
                        </h3>
                        <div className="text-center py-16">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[hsl(var(--sand))] to-[hsl(var(--muted))] flex items-center justify-center"
                          >
                            <Calendar className="w-12 h-12 text-[hsl(var(--muted-foreground))]" />
                          </motion.div>
                          <h4 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                            Activity Tracking Coming Soon
                          </h4>
                          <p className="text-[hsl(var(--muted-foreground))] max-w-md mx-auto">
                            Deposits, raffles, and member activities will be
                            displayed here with real-time updates and beautiful
                            visualizations.
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
                        <h3 className="text-2xl font-bold text-[hsl(var(--terracotta))] flex items-center gap-3">
                          <Users className="w-6 h-6 text-gray-500" />
                          Circle Members
                        </h3>
                        <div className="text-center py-16">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[hsl(var(--sand))] to-[hsl(var(--muted))] flex items-center justify-center"
                          >
                            <Users className="w-12 h-12 text-[hsl(var(--muted-foreground))]" />
                          </motion.div>
                          <h4 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                            Member Directory Coming Soon
                          </h4>
                          <p className="text-[hsl(var(--muted-foreground))] mb-4 max-w-md mx-auto">
                            View member profiles, contribution history, and
                            community standings.
                          </p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--sand))] rounded-full border">
                            <div className="w-2 h-2 bg-[hsl(var(--forest))] rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                              {marketData.totalActiveParticipantsCount} of{" "}
                              {marketData.totalParticipantsCount} spots filled
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Row 2: Enhanced Circle Stats with Member Actions */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--terracotta))]">
                  Circle Stats
                </h3>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-300 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 sm:p-6 bg-gradient-to-br from-[hsl(var(--sand))] to-white rounded-xl sm:rounded-2xl border border-[hsl(var(--border))] hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 rounded-full bg-orange-300 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                    Members
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-[hsl(var(--terracotta))]">
                    {marketData.totalActiveParticipantsCount}
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      /{marketData.totalParticipantsCount}
                    </span>
                  </p>
                  {/* Progress Bar */}
                  <div className="mt-2 w-full bg-[hsl(var(--muted))] rounded-full h-1.5">
                    <motion.div
                      className="bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--gold))] h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          (marketData.totalActiveParticipantsCount /
                            marketData.totalParticipantsCount) *
                          100
                        }%`,
                      }}
                      transition={{
                        delay: 1,
                        duration: 1.5,
                        ease: "easeOut",
                      }}
                    />
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 sm:p-6 bg-gradient-to-br from-[hsl(var(--sand))] to-white rounded-xl sm:rounded-2xl border border-[hsl(var(--border))] hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 rounded-full bg-orange-300 flex items-center justify-center">
                    <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                    Contribution
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-[hsl(var(--terracotta))]">
                    ${(Number(marketData.kuriAmount) / 1_000_000).toFixed(2)}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 sm:p-6 bg-gradient-to-br from-[hsl(var(--sand))] to-white rounded-xl sm:rounded-2xl border border-[hsl(var(--border))] hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] flex items-center justify-center">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                    Win Amount
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-[hsl(var(--forest))]">
                    $
                    {(
                      (Number(marketData.kuriAmount) / 1_000_000) *
                      marketData.totalParticipantsCount
                    ).toFixed(2)}
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="text-center p-4 sm:p-6 bg-gradient-to-br from-[hsl(var(--sand))] to-white rounded-xl sm:rounded-2xl border border-[hsl(var(--border))] hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 rounded-full bg-orange-300 flex items-center justify-center">
                    <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">
                    Frequency
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[hsl(var(--terracotta))] capitalize">
                    {getIntervalTypeText(marketData.intervalType)}
                  </p>
                </motion.div>
              </div>

              {/* Launch Countdown */}
              {marketData.state === KuriState.INLAUNCH && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden mb-8"
                >
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <motion.div
                      className="absolute -top-10 -right-10 w-32 h-32 rounded-full border-4 border-white"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                    <motion.div
                      className="absolute -bottom-10 -left-10 w-24 h-24 rounded-full border-2 border-white"
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <Timer className="w-6 h-6" />
                      <h3 className="text-xl font-bold">Launch Countdown</h3>
                    </div>
                    <div className="text-center">
                      <motion.p
                        key={timeLeft}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-3xl font-mono font-bold mb-2"
                      >
                        {timeLeft}
                      </motion.p>
                      <p className="text-white/80">
                        Time remaining to join this circle
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Member Actions - Only for Active Members in Active State */}
              {membershipStatus === 1 &&
                marketData.state === KuriState.ACTIVE && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="mt-8"
                  >
                    {/* Section Header with Subtle Divider */}
                    <div className="relative mb-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[hsl(var(--border))]/30"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <div className="bg-white px-6 py-3 rounded-full border border-[hsl(var(--border))]/50 shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] flex items-center justify-center">
                              <Activity className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-center">
                              <h4 className="text-lg font-bold text-[hsl(var(--terracotta))] mb-1">
                                Member Actions
                              </h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                      {/* Deposit Card */}
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.2 }}
                        className="group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--terracotta))]/10 to-[hsl(var(--ochre))]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-[hsl(var(--border))]/30 hover:shadow-xl transition-all duration-300">
                          <DepositForm
                            marketData={marketData}
                            kuriAddress={address as `0x${string}`}
                          />
                        </div>
                      </motion.div>

                      {/* Claim Card */}
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1.4 }}
                        className="group relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--forest))]/10 to-[hsl(var(--gold))]/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                        <div className="relative bg-white/90 backdrop-blur-xl rounded-2xl p-4 sm:p-6 shadow-lg border border-[hsl(var(--border))]/30 hover:shadow-xl transition-all duration-300">
                          <ClaimInterface
                            marketData={marketData}
                            kuriAddress={address as `0x${string}`}
                          />
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

              {/* Circle Action Button - Center aligned at bottom of Circle Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 }}
                className="mt-8 pt-6 border-t border-[hsl(var(--border))]/20"
              >
                <div className="flex justify-center">
                  <div className="w-full max-w-sm">{renderActionButton()}</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        market={{
          address: address || "",
          creator: marketData.creator,
          totalParticipants: marketData.totalParticipantsCount,
          activeParticipants: marketData.totalActiveParticipantsCount,
          kuriAmount: marketData.kuriAmount.toString(),
          intervalType: marketData.intervalType,
          state: Number(marketData.state),
          nextDepositTime: marketData.nextIntervalDepositTime.toString(),
          nextRaffleTime: marketData.nexRaffleTime.toString(),
          createdAt: "0",
          name: metadata?.short_description || "Kuri Circle",
          nextDraw: marketData.nexRaffleTime.toString(),
          launchPeriod: marketData.launchPeriod.toString(),
          startTime: marketData.startTime.toString(),
          endTime: marketData.endTime.toString(),
        }}
      />
    </>
  );
}
