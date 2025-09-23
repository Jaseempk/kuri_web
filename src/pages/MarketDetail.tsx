import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { KuriState } from "../hooks/contracts/useKuriCore";
import { KuriState as GraphQLKuriState } from "../graphql/types";
import { MarketProvider, useMarketContext } from "../contexts/MarketContext";
// 🔥 REMOVED: Complex timer context - using simple MarketCard approach instead
// import {
//   MarketTimerProvider,
//   useMarketTimerContext,
// } from "../contexts/MarketTimerContext";
import { Button } from "../components/ui/button";
import { MarketSEO } from "../components/seo/MarketSEO";
import { ShareModal } from "../components/modals/ShareModal";
import { ManageMembersDialog } from "../components/markets/ManageMembersDialog";
import { DepositForm } from "../components/markets/DepositForm";
import { ClaimInterface } from "../components/markets/ClaimInterface";
import { useAuthContext } from "../contexts/AuthContext";
import { formatUnits } from "viem";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Trophy,
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useProfileRequired } from "../hooks/useProfileRequired";
import { useUserProfileByAddress } from "../hooks/useUserProfile";
import { isUserRejection } from "../utils/errors";
import { trackEvent, trackError } from "../utils/analytics";
import { CircleMembersDisplay } from "../components/markets/CircleMembersDisplay";
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

// Extracted Stats Container Component
interface StatsContainerProps {
  marketData: {
    totalActiveParticipantsCount: number;
    totalParticipantsCount: number;
    kuriAmount: bigint;
  } | null;
}

const StatsContainer: React.FC<StatsContainerProps> = ({ marketData }) => {
  if (!marketData) return null;

  // console.log("maarketData:", marketData);
  // console.log("🔄 StatsContainer render - data changed:", {
  //   activeParticipants: marketData.totalActiveParticipantsCount,
  //   totalParticipants: marketData.totalParticipantsCount,
  //   kuriAmount: marketData.kuriAmount.toString(),
  // });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="bg-white/20 backdrop-blur-sm rounded-2xl p-4"
    >
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="flex items-center justify-center text-lg">
            <span className="material-icons mr-1.5 text-xl">groups</span>
          </div>
          <p className="font-bold text-2xl">
            {marketData.totalActiveParticipantsCount}/
            {marketData.totalParticipantsCount}
          </p>
          <p className="text-xs opacity-80">Members</p>
        </div>
        <div>
          <div className="flex items-center justify-center text-lg">
            <span className="material-icons mr-1.5 text-xl">paid</span>
          </div>
          <p className="font-bold text-2xl">
            $
            {(
              Number(marketData.kuriAmount) /
              1_000_000 /
              marketData.totalParticipantsCount
            ).toFixed(1)}
          </p>
          <p className="text-xs opacity-80">Contribution</p>
        </div>
        <div>
          <div className="flex items-center justify-center text-lg">
            <span className="material-icons mr-1.5 text-xl">savings</span>
          </div>
          <p className="font-bold text-2xl">
            ${(Number(marketData.kuriAmount) / 1_000_000).toFixed(0)}
          </p>
          <p className="text-xs opacity-80">Pool</p>
        </div>
      </div>
    </motion.div>
  );
};

// Extracted Tab Content Component
interface TabContentProps {
  activeTab: string;
  metadata: MarketMetadata | null | undefined;
  marketData: {
    startTime: bigint;
    intervalType: number;
    state: KuriState;
    nexRaffleTime: bigint;
    nextIntervalDepositTime: bigint;
    creator: string;
  } | null;
  creatorProfile: any;
  creatorProfileLoading: boolean;
  currentWinner: {
    intervalIndex: number;
    winner: string;
    timestamp: string;
  } | null;
  winnerProfile: any;
  winnerProfileLoading: boolean;
  address: string;
  membershipStatus: number;
  shouldShowClaimCard: boolean;
  shouldShowWinnerDisplay: boolean;
  isCurrentUserWinner: boolean;
  handleClaimSuccess: () => void;
  renderActionButton: () => React.ReactNode;
}

// 🔥 ISOLATED TIMER COMPONENTS: Timer state isolated to prevent parent re-renders

// Component that provides timer values for parsing (like "2d 5h 30m 15s")
// ✨ FIXED: Added shouldShowWinner param to prevent timer interference
const useTimerValue = (
  marketData: any,
  type: "timeLeft" | "raffleTimeLeft" | "depositTimeLeft",
  shouldShowWinner: boolean = false
) => {
  const [timerValue, setTimerValue] = useState<string>("");

  useEffect(() => {
    if (!marketData) return;

    // 🚀 FIX: Don't run timers when winner is being displayed to prevent flickering
    if (
      shouldShowWinner &&
      (type === "raffleTimeLeft" || type === "depositTimeLeft")
    ) {
      console.log(`⏸️ Timer paused for ${type} - winner being displayed`);
      setTimerValue("Winner display active");
      return;
    }

    const updateTimer = () => {
      const now = Date.now();

      if (type === "timeLeft" && marketData.state === 0) {
        // INLAUNCH countdown
        const end = Number((marketData as any).endTime) * 1000;
        const diff = end - now;

        if (diff <= 0) {
          setTimerValue("Launch period ended");
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const newValue = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        setTimerValue(newValue);
      } else if (type === "raffleTimeLeft" && marketData.state === 2) {
        // ACTIVE raffle countdown
        const raffleEnd = Number(marketData.nexRaffleTime) * 1000;
        const raffleDiff = raffleEnd - now;

        if (raffleDiff <= 0) {
          setTimerValue("Raffle due now");
        } else {
          const days = Math.floor(raffleDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (raffleDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (raffleDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((raffleDiff % (1000 * 60)) / 1000);
          const newValue = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          setTimerValue(newValue);
        }
      } else if (type === "depositTimeLeft" && marketData.state === 2) {
        // ACTIVE deposit countdown
        const depositStart = Number(marketData.nextIntervalDepositTime) * 1000;
        const depositEnd = depositStart + 3 * 24 * 60 * 60 * 1000;
        const depositDiff = depositEnd - now;

        if (depositDiff <= 0) {
          setTimerValue("Payment due now");
        } else {
          const days = Math.floor(depositDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (depositDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (depositDiff % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((depositDiff % (1000 * 60)) / 1000);
          const newValue = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          setTimerValue(newValue);
        }
      }
    };

    const timer = setInterval(updateTimer, 1000);
    updateTimer(); // Initial update

    return () => {
      clearInterval(timer);
    };
  }, [
    marketData?.state,
    (marketData as any)?.endTime,
    marketData?.nexRaffleTime,
    marketData?.nextIntervalDepositTime,
    type,
    shouldShowWinner,
  ]);

  return timerValue;
};

// Isolated components for timer display sections
const TimerSection = memo<{
  marketData: any;
  section: "days" | "hours" | "minutes" | "seconds";
  type: "timeLeft" | "raffleTimeLeft" | "depositTimeLeft";
  shouldShowWinner?: boolean;
}>(({ marketData, section, type, shouldShowWinner = false }) => {
  const timerValue = useTimerValue(marketData, type, shouldShowWinner);

  if (section === "days") {
    return (
      <>
        {timerValue.includes("d")
          ? timerValue.split("d")[0].padStart(2, "0")
          : "00"}
      </>
    );
  } else if (section === "hours") {
    return (
      <>
        {timerValue.includes("h")
          ? timerValue.split("h")[0].split(" ").pop()?.padStart(2, "0") || "00"
          : "00"}
      </>
    );
  } else if (section === "minutes") {
    return (
      <>
        {timerValue.includes("m")
          ? timerValue.split("m")[0].split(" ").pop()?.padStart(2, "0") || "00"
          : "00"}
      </>
    );
  } else if (section === "seconds") {
    return (
      <>
        {timerValue.includes("s")
          ? timerValue.split("s")[0].split(" ").pop()?.padStart(2, "0") || "00"
          : "00"}
      </>
    );
  }
  return <></>;
});

// Component for displaying adaptive timer in desktop format
const AdaptiveTimerDisplay = memo<{
  marketData: any;
  shouldShowWinner?: boolean;
}>(({ marketData, shouldShowWinner = false }) => {
  const raffleTimeLeft = useTimerValue(
    marketData,
    "raffleTimeLeft",
    shouldShowWinner
  );
  const depositTimeLeft = useTimerValue(
    marketData,
    "depositTimeLeft",
    shouldShowWinner
  );

  const activeTimer = (() => {
    const now = Date.now();
    const depositStart = Number(marketData.nextIntervalDepositTime) * 1000;
    const depositEnd = depositStart + 3 * 24 * 60 * 60 * 1000; // +3 days

    // Show deposit timer if we're in the 3-day deposit period
    return now >= depositStart && now <= depositEnd
      ? depositTimeLeft
      : raffleTimeLeft;
  })();

  return (
    <>
      <div className="text-center">
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("d")
            ? activeTimer.split("d")[0].padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Days</span>
      </div>
      <span className="text-4xl font-bold text-orange-500">:</span>
      <div className="text-center">
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("h")
            ? activeTimer.split("h")[0].split(" ").pop()?.padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Hours</span>
      </div>
      <span className="text-4xl font-bold text-orange-500">:</span>
      <div className="text-center">
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("m")
            ? activeTimer.split("m")[0].split(" ").pop()?.padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Minutes</span>
      </div>
      <span className="text-4xl font-bold text-orange-500">:</span>
      <div className="text-center">
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("s")
            ? activeTimer.split("s")[0].split(" ").pop()?.padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Seconds</span>
      </div>
    </>
  );
});

// Component for displaying adaptive timer in mobile format
const AdaptiveTimerMobileDisplay = memo<{
  marketData: any;
  shouldShowWinner?: boolean;
}>(({ marketData, shouldShowWinner = false }) => {
  const raffleTimeLeft = useTimerValue(
    marketData,
    "raffleTimeLeft",
    shouldShowWinner
  );
  const depositTimeLeft = useTimerValue(
    marketData,
    "depositTimeLeft",
    shouldShowWinner
  );

  const activeTimer = (() => {
    const now = Date.now();
    const depositStart = Number(marketData.nextIntervalDepositTime) * 1000;
    const depositEnd = depositStart + 3 * 24 * 60 * 60 * 1000; // +3 days

    // Show deposit timer if we're in the 3-day deposit period
    return now >= depositStart && now <= depositEnd
      ? depositTimeLeft
      : raffleTimeLeft;
  })();

  return (
    <>
      <div>
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("d")
            ? activeTimer.split("d")[0].padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Days</span>
      </div>
      <span className="text-3xl font-bold text-orange-500">:</span>
      <div>
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("h")
            ? activeTimer.split("h")[0].split(" ").pop()?.padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Hours</span>
      </div>
      <span className="text-3xl font-bold text-orange-500">:</span>
      <div>
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("m")
            ? activeTimer.split("m")[0].split(" ").pop()?.padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Minutes</span>
      </div>
      <span className="text-3xl font-bold text-orange-500">:</span>
      <div>
        <span className="text-4xl font-bold text-orange-500">
          {activeTimer.includes("s")
            ? activeTimer.split("s")[0].split(" ").pop()?.padStart(2, "0")
            : "00"}
        </span>
        <span className="block text-xs text-gray-900">Seconds</span>
      </div>
    </>
  );
});

// Winner Display Component - Replaces countdown during 3-day winner window
interface WinnerDisplayProps {
  currentWinner: {
    intervalIndex: number;
    winner: string;
    timestamp: string;
  };
  winnerProfile: any;
  winnerProfileLoading: boolean;
  isCurrentUserWinner: boolean;
  marketData: any;
  address: string;
  shouldShowClaimCard: boolean;
  handleClaimSuccess: () => void;
  isMobile?: boolean;
}

const WinnerDisplay = memo<WinnerDisplayProps>(
  ({
    currentWinner,
    winnerProfile,
    winnerProfileLoading,
    isCurrentUserWinner,
    marketData,
    address,
    shouldShowClaimCard,
    handleClaimSuccess,
    isMobile = false,
  }) => {
    console.log("🎊 WINNER DISPLAY RENDER:", {
      currentWinner,
      isCurrentUserWinner,
      shouldShowClaimCard,
      isMobile,
    });

    if (isCurrentUserWinner && shouldShowClaimCard) {
      // Winner sees new dashboard-style banner
      const potentialWinnings = Number(marketData.kuriAmount) / 1_000_000;

      return (
        <div
          className={`w-full ${isMobile ? "max-w-full" : "max-w-md"} mx-auto`}
        >
          <div className="bg-white rounded-2xl border border-[hsl(var(--forest))]/20 overflow-hidden">
            {/* Progress indicator */}
            <div className="h-1 bg-[#E67A50]/10">
              <div className="h-full w-full bg-[#E67A50]"></div>
            </div>

            <div className={`${isMobile ? "p-4 space-y-4" : "p-6 space-y-6"}`}>
              {/* Congratulations section */}
              <div className="text-center py-2">
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                  Congratulations!
                </h3>
                <p className="text-[hsl(var(--muted-foreground))] text-sm">
                  You won the Kuri raffle for Round{" "}
                  {currentWinner.intervalIndex}
                </p>
              </div>

              {/* Status row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-[hsl(var(--forest))] rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                    Round {currentWinner.intervalIndex} Complete
                  </span>
                </div>
                <div className="text-xs font-mono text-[hsl(var(--muted-foreground))] bg-[hsl(var(--forest))]/5 px-2 py-1 rounded">
                  STATUS: WINNER
                </div>
              </div>

              {/* Amount display */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    Claimable
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    Available now
                  </span>
                </div>
                <div
                  className={`${
                    isMobile ? "text-3xl" : "text-4xl"
                  } font-bold text-[hsl(var(--foreground))] tabular-nums`}
                >
                  ${potentialWinnings.toFixed(2)}
                </div>
              </div>

              {/* Action area */}
              <div className="pt-2">
                <button
                  onClick={handleClaimSuccess}
                  className="w-full bg-[#E67A50] hover:bg-[#E67A50]/80 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Claim Your Kuri
                </button>
                <p className="text-xs text-[hsl(var(--muted-foreground))] text-center mt-2">
                  Funds processed Instantly
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Non-winners see winner announcement
    return (
      <div className="text-center space-y-4">
        {/* Winner Announcement Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto"
        >
          <Trophy className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-yellow-700"
        >
          Round {currentWinner.intervalIndex} Winner
        </motion.h3>

        {/* Winner Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border border-yellow-200"
        >
          {winnerProfileLoading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 bg-gray-300 rounded-full animate-pulse" />
              <div className="text-center">
                <div className="h-4 bg-gray-300 rounded animate-pulse mb-2 w-24" />
                <div className="h-3 bg-gray-300 rounded animate-pulse w-16" />
              </div>
            </div>
          ) : winnerProfile ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
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
                  <Trophy className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="text-center">
                <p className="font-bold text-gray-800 text-lg">
                  {winnerProfile.display_name ||
                    winnerProfile.username ||
                    "Anonymous Winner"}
                </p>
                <p className="text-sm text-gray-500">
                  {currentWinner.winner.slice(0, 6)}...
                  {currentWinner.winner.slice(-4)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center mx-auto mb-2">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-gray-800 text-lg">
                Anonymous Winner
              </p>
              <p className="text-sm text-gray-500">
                {currentWinner.winner.slice(0, 6)}...
                {currentWinner.winner.slice(-4)}
              </p>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-gray-600"
        >
          🎊 The winner has 3 days to claim their prize
        </motion.p>
      </div>
    );
  }
);

const TabContent = memo<TabContentProps>(
  ({
    activeTab,
    metadata,
    marketData,
    creatorProfile,
    creatorProfileLoading,
    currentWinner,
    winnerProfile,
    winnerProfileLoading,
    address,
    membershipStatus,
    shouldShowClaimCard,
    shouldShowWinnerDisplay,
    isCurrentUserWinner,
    handleClaimSuccess,
    renderActionButton,
  }) => {
    const { currentInterval } = useMarketContext();

    if (!marketData) return null;

    return (
      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 lg:space-y-8"
          >
            {/* About Section */}
            <div>
              <h2 className="text-xl lg:text-2xl font-bold text-gray-900 lg:text-gray-800 mb-2 lg:mb-4">
                About This Circle
              </h2>
              <p className="text-gray-600 mb-6 lg:mb-8">
                {metadata?.long_description ||
                  metadata?.short_description ||
                  "This is a community savings circle powered by the Kuri protocol. Members contribute regularly and take turns receiving the full pot, creating a supportive financial ecosystem without interest or fees."}
              </p>
            </div>

            {/* Circle Stats + Creator Grid */}
            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0 mb-6 lg:mb-8">
              {/* Circle Stats */}
              <div className="bg-gray-50 lg:bg-orange-50 rounded-xl lg:rounded-2xl p-4 lg:p-6">
                <h3 className="text-lg font-semibold lg:font-bold text-gray-900 lg:text-gray-800 mb-4 lg:mb-3">
                  Circle Stats
                </h3>
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm lg:text-base text-gray-500 lg:text-gray-600">
                      Created On
                    </span>
                    <span className="text-sm lg:text-base font-medium lg:font-semibold text-gray-900 lg:text-gray-800">
                      {metadata?.created_at
                        ? new Date(metadata.created_at).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
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
                    <span className="text-sm lg:text-base text-gray-500 lg:text-gray-600">
                      Payout Frequency
                    </span>
                    <span className="text-sm lg:text-base font-medium lg:font-semibold text-gray-900 lg:text-gray-800 capitalize">
                      {getIntervalTypeText(marketData.intervalType)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm lg:text-base text-gray-500 lg:text-gray-600">
                      Next Raffle
                    </span>
                    <span className="text-sm lg:text-base font-medium lg:font-semibold text-gray-900 lg:text-gray-800">
                      {marketData.state === KuriState.ACTIVE
                        ? new Date(
                            Number(marketData.nexRaffleTime) * 1000
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "TBD"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm lg:text-base text-gray-500 lg:text-gray-600">
                      Circle Status
                    </span>
                    {(() => {
                      const badge = getStatusBadge(marketData.state);
                      return (
                        <span
                          className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-full ${badge.className}`}
                        >
                          {badge.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Creator Section */}
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
                    <img
                      src="/images/default-avatar.png"
                      alt="Creator"
                      className="w-16 h-16 rounded-full mr-4 object-cover"
                    />
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

            {/* Desktop Action Section - Only show on desktop */}
            <div className="hidden lg:block bg-orange-50 p-6 rounded-2xl">
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
                            <TimerSection
                              marketData={marketData}
                              section="days"
                              type="timeLeft"
                            />
                          </span>
                          <span className="block text-xs text-gray-900">
                            Days
                          </span>
                        </div>
                        <span className="text-4xl font-bold text-orange-500">
                          :
                        </span>
                        <div className="text-center">
                          <span className="text-4xl font-bold text-orange-500">
                            <TimerSection
                              marketData={marketData}
                              section="hours"
                              type="timeLeft"
                            />
                          </span>
                          <span className="block text-xs text-gray-900">
                            Hours
                          </span>
                        </div>
                        <span className="text-4xl font-bold text-orange-500">
                          :
                        </span>
                        <div className="text-center">
                          <span className="text-4xl font-bold text-orange-500">
                            <TimerSection
                              marketData={marketData}
                              section="minutes"
                              type="timeLeft"
                            />
                          </span>
                          <span className="block text-xs text-gray-900">
                            Minutes
                          </span>
                        </div>
                        <span className="text-4xl font-bold text-orange-500">
                          :
                        </span>
                        <div className="text-center">
                          <span className="text-4xl font-bold text-orange-500">
                            <TimerSection
                              marketData={marketData}
                              section="seconds"
                              type="timeLeft"
                            />
                          </span>
                          <span className="block text-xs text-gray-900">
                            Seconds
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {marketData.state === KuriState.ACTIVE && (
                    <>
                      {shouldShowWinnerDisplay && currentWinner ? (
                        // Show winner display instead of countdown
                        <WinnerDisplay
                          currentWinner={currentWinner}
                          winnerProfile={winnerProfile}
                          winnerProfileLoading={winnerProfileLoading}
                          isCurrentUserWinner={isCurrentUserWinner}
                          marketData={marketData}
                          address={address || ""}
                          shouldShowClaimCard={shouldShowClaimCard}
                          handleClaimSuccess={handleClaimSuccess}
                          isMobile={false}
                        />
                      ) : (
                        // Show normal countdown
                        <>
                          <h3 className="text-xl font-bold text-gray-800 mb-2">
                            {Date.now() <
                            Number(marketData.nextIntervalDepositTime) * 1000
                              ? currentInterval === 0
                                ? "First Deposit Starts In"
                                : "Next Deposit Starts In"
                              : currentInterval === 1
                              ? "First Raffle In"
                              : "Next Raffle In"}
                          </h3>
                          <div className="flex items-end gap-x-3">
                            <AdaptiveTimerDisplay
                              marketData={marketData}
                              shouldShowWinner={shouldShowWinnerDisplay}
                            />
                          </div>
                        </>
                      )}
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
                </div>

                {/* Action Button - Desktop Only */}
                {/* Only show if not in winner display mode for current user */}
                {!(
                  shouldShowWinnerDisplay &&
                  isCurrentUserWinner &&
                  shouldShowClaimCard
                ) && (
                  <div className="hidden lg:block flex-shrink-0">
                    {membershipStatus === 1 &&
                    marketData.state === KuriState.ACTIVE ? (
                      <div className="w-full">{renderActionButton()}</div>
                    ) : (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {renderActionButton()}
                      </motion.div>
                    )}
                  </div>
                )}
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
            className="space-y-4 lg:space-y-6"
          >
            <div className="text-center py-8 lg:py-12">
              <Activity className="h-12 w-12 lg:h-16 lg:w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg lg:text-xl font-semibold text-gray-500 lg:text-gray-600 mb-2">
                Activity Coming Soon
              </h3>
              <p className="text-sm lg:text-base text-gray-400 lg:text-gray-500">
                Track deposits, payouts, and member activity in this section.
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
            className="space-y-4 lg:space-y-6"
          >
            <CircleMembersDisplay marketAddress={address} />
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if important props change (not timer-related props)
    const shouldSkipRender =
      prevProps.activeTab === nextProps.activeTab &&
      prevProps.membershipStatus === nextProps.membershipStatus &&
      prevProps.address === nextProps.address &&
      prevProps.creatorProfileLoading === nextProps.creatorProfileLoading &&
      prevProps.creatorProfile?.id === nextProps.creatorProfile?.id &&
      prevProps.winnerProfileLoading === nextProps.winnerProfileLoading &&
      prevProps.winnerProfile?.id === nextProps.winnerProfile?.id;

    return shouldSkipRender;
  }
);

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

function MarketDetailInner() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const { smartAddress: userAddress } = useAuthContext();

  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "members"
  >("overview");
  const [membershipStatus, setMembershipStatus] = useState<number>(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasUserClaimed, setHasUserClaimed] = useState<boolean | null>(null);

  // 🚀 NEW: Persistent winner state to prevent flickering during GraphQL polling
  const [persistentWinner, setPersistentWinner] = useState<{
    intervalIndex: number;
    winner: string;
    timestamp: string;
  } | null>(null);

  const { requireProfile } = useProfileRequired({
    strict: false,
    action: "join_circle",
  });

  // Scroll to top when navigating to a different market
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [address]);

  // Get stable data and actions from MarketContext
  const {
    marketData,
    isLoadingCore,
    errorCore,
    marketDetail,
    // New dedicated winner data
    winners,
    currentWinner: currentWinnerFromContext,
    winnersLoading,
    winnersError,
    refetchWinners,
    // Other actions
    getMemberStatus,
    requestMembershipSponsored,
    initializeKuriSponsored,
    fetchMarketData,
    checkPaymentStatusIfMember,
    checkHasClaimed,
    currentInterval,
  } = useMarketContext();

  console.log("🎭 MARKET DETAIL COMPONENT CONTEXT DATA:", {
    address,
    hasMarketData: !!marketData,
    hasMarketDetail: !!marketDetail,
    originalWinnersFromDetail: marketDetail?.winners?.length || 0,
    newWinnersFromContext: winners?.length || 0,
    currentWinnerFromContext: currentWinnerFromContext,
    currentWinnerInterval: currentWinnerFromContext?.intervalIndex,
    winnersLoading,
    hasWinnersError: !!winnersError,
    marketDataState: marketData?.state,
    marketDataNextRaffle: marketData?.nexRaffleTime?.toString(),
    marketDataIntervalDuration: marketData?.intervalDuration?.toString(),
  });

  // 🔥 TIMER MOVED: Timer logic moved to isolated components to prevent parent re-renders

  // Add render cause tracking
  const renderCount = useRef(0);
  const previousProps = useRef<any>({});

  useEffect(() => {
    renderCount.current++;
    const currentProps = {
      userAddress,
      marketDataExists: !!marketData,
      isLoadingCore,
      address,
    };

    if (renderCount.current > 1) {
      const changedProps: any = {};
      Object.keys(currentProps).forEach((key) => {
        if (previousProps.current[key] !== (currentProps as any)[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: (currentProps as any)[key],
          };
        }
      });
    }

    previousProps.current = currentProps;
  });

  // console.log("🔍 RENDER CAUSE:", {
  //   userAddress,
  //   marketDataExists: !!marketData,
  //   timeLeft,
  //   isLoadingCore,
  // });

  // Stabilize creator address to prevent unnecessary profile refetches
  const creatorAddress = useMemo(
    () => marketData?.creator || null,
    [marketData?.creator]
  );

  // Fetch creator's profile
  const { profile: creatorProfile, isLoading: creatorProfileLoading } =
    useUserProfileByAddress(creatorAddress);

  // Fetch metadata
  const { data: metadata } = useQuery({
    queryKey: ["market-metadata", address],
    queryFn: () => getMetadata(address || ""),
    enabled: !!address,
  });

  // Map context loading states to component expectations
  const isLoading = isLoadingCore;
  const error = errorCore;

  // Use winner data with persistent state to prevent GraphQL polling flickering
  const currentWinner = useMemo(() => {
    console.log("🏆 PERSISTENT WINNER DISPLAY LOGIC:", {
      marketAddress: address,
      currentWinnerFromContext: currentWinnerFromContext?.intervalIndex,
      persistentWinner: persistentWinner?.intervalIndex,
      winnersCount: winners?.length || 0,
      marketState: marketData?.state,
      hasMarketData: !!marketData,
      winnersLoading,
      hasWinnersError: !!winnersError,
    });

    // 🚀 PERSISTENCE LOGIC: Once we have a winner, keep showing it even during GraphQL polling
    if (currentWinnerFromContext) {
      // Update persistent winner when we get new winner data
      const newWinner = {
        intervalIndex: currentWinnerFromContext.intervalIndex,
        winner: currentWinnerFromContext.winner,
        timestamp: currentWinnerFromContext.timestamp,
      };

      // Only update if it's actually new (different interval or address)
      if (
        !persistentWinner ||
        persistentWinner.intervalIndex !== newWinner.intervalIndex ||
        persistentWinner.winner !== newWinner.winner
      ) {
        console.log("🔄 Updating persistent winner:", newWinner);
        setPersistentWinner(newWinner);
      }

      return newWinner;
    }

    // 🛡️ FALLBACK TO PERSISTENT STATE: If GraphQL polling temporarily clears data, use persistent state
    if (persistentWinner && !winnersLoading) {
      console.log("🛡️ Using persistent winner during data refresh");
      return persistentWinner;
    }

    // Check for loading or error states
    if (winnersLoading) {
      console.log("⏳ Winners still loading...");
      // Keep showing persistent winner during loading
      if (persistentWinner) {
        console.log("🛡️ Showing persistent winner during loading");
        return persistentWinner;
      }
      return null;
    }

    if (winnersError) {
      console.log("❌ Winners error:", winnersError.message);
      // Keep showing persistent winner even on error
      if (persistentWinner) {
        console.log("🛡️ Showing persistent winner despite error");
        return persistentWinner;
      }
      return null;
    }

    // No winner available
    console.log("❌ No winner data available");
    return null;
  }, [
    currentWinnerFromContext,
    persistentWinner,
    winners?.length,
    marketData?.state,
    address,
    winnersLoading,
    winnersError,
  ]);

  // Stabilize winner address to prevent unnecessary profile refetches
  const winnerAddress = useMemo(
    () => currentWinner?.winner || null,
    [currentWinner?.winner]
  );

  // Fetch winner's profile
  const { profile: winnerProfile, isLoading: winnerProfileLoading } =
    useUserProfileByAddress(winnerAddress);

  // Check if current user is the winner
  const isCurrentUserWinner = useMemo(() => {
    const result = !!(
      currentWinner &&
      userAddress &&
      currentWinner.winner.toLowerCase() === userAddress.toLowerCase()
    );

    console.log("🏆 IS CURRENT USER WINNER CHECK:", {
      hasCurrentWinner: !!currentWinner,
      currentWinnerAddress: currentWinner?.winner,
      hasUserAddress: !!userAddress,
      userAddress,
      addressMatch:
        currentWinner && userAddress
          ? currentWinner.winner.toLowerCase() === userAddress.toLowerCase()
          : false,
      result,
    });

    return result;
  }, [currentWinner, userAddress]);

  // Determine if we should show winner display instead of countdown
  const shouldShowWinnerDisplay = useMemo(() => {
    console.log("🔍 SIMPLIFIED WINNER DISPLAY CONDITIONS:", {
      hasCurrentWinner: !!currentWinner,
      hasMarketData: !!marketData,
      marketState: marketData?.state,
    });

    if (!currentWinner) {
      console.log("❌ No current winner for display");
      return false;
    }

    // SIMPLIFIED: If we have a winner, show the winner display
    // The currentWinner logic already handles timing and market state checks
    console.log("✅ Showing winner display - winner exists");
    return true;
  }, [currentWinner]);

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

  // Check if market can be initialized - Circle must be full
  const canInitialize = useMemo(() => {
    if (!marketData || marketData.state !== KuriState.INLAUNCH) return false;

    const isFull =
      marketData.totalActiveParticipantsCount ===
      marketData.totalParticipantsCount;

    return isFull; // Initialize only when circle is full
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
    if (isFull && launchPeriodEnded)
      return "Circle is full - launch period completed";
    return "Waiting for more members to fill the circle";
  }, [marketData]);

  // Determine if claim card should be visible
  const shouldShowClaimCard = useMemo(() => {
    console.log("🎯 CLAIM CARD VISIBILITY CHECK:", {
      hasCurrentWinner: !!currentWinner,
      currentWinnerAddress: currentWinner?.winner,
      userAddress,
      hasUserAddress: !!userAddress,
      marketData: !!marketData,
      marketState: marketData?.state,
      kuriStateActive: KuriState.ACTIVE,
      nexRaffleTime: marketData?.nexRaffleTime,
      hasUserClaimed,
      hasUserClaimedType: typeof hasUserClaimed,
    });

    if (!currentWinner || !userAddress) {
      console.log("❌ No winner or user address for claim card");
      return false;
    }

    // Check if the current user is the winner
    const isWinner =
      currentWinner.winner.toLowerCase() === userAddress.toLowerCase();
    console.log("🔍 ADDRESS MATCHING:", {
      winnerAddress: currentWinner.winner,
      winnerAddressLower: currentWinner.winner.toLowerCase(),
      userAddress: userAddress,
      userAddressLower: userAddress.toLowerCase(),
      isWinner,
    });

    if (!isWinner) {
      console.log("❌ User is not the winner for claim card");
      return false;
    }

    // SIMPLIFIED: If user is winner, show claim card regardless of complex timing
    // The winner display logic already handles timing constraints
    console.log("✅ User is winner - checking claim status");

    // Only show if user hasn't claimed yet
    // 🚀 FIXED: Handle null case and show claim card for winners who haven't claimed
    const shouldShow = hasUserClaimed !== true; // Show if false OR null (not claimed)
    console.log("🎯 CLAIM STATUS CHECK:", {
      hasUserClaimed,
      shouldShow,
      condition: "hasUserClaimed !== true",
      explanation:
        "Shows claim card if not explicitly claimed (handles null case)",
    });

    return shouldShow;
  }, [currentWinner, userAddress, hasUserClaimed]);

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
          className="w-full bg-gray-400 text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md cursor-not-allowed opacity-70 flex items-center justify-center"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
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
          <span className="hidden sm:inline">Connect Wallet to Join</span>
          <span className="sm:hidden">Connect Wallet</span>
        </button>
      );
    }

    if (isCreator) {
      // During launch phase, show initialization button
      if (canInitialize) {
        return (
          <button
            onClick={handleInitialize}
            disabled={isInitializing || !canInitialize}
            className="w-full bg-[#E67A50] text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md hover:bg-orange-600 transition-colors duration-300 flex items-center justify-center disabled:opacity-70"
          >
            {isInitializing ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-1.5 sm:mr-2" />
            ) : (
              <span className="material-icons text-lg sm:text-xl mr-1.5 sm:mr-2">
                add_circle_outline
              </span>
            )}
            {isInitializing ? (
              <>
                <span className="hidden sm:inline">Initializing Circle...</span>
                <span className="sm:hidden">Initializing...</span>
              </>
            ) : initializationReason.includes("full") ? (
              <>
                <span className="hidden sm:inline">Start Circle Now</span>
                <span className="sm:hidden">Start Now</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Initialize Circle</span>
                <span className="sm:hidden">Initialize</span>
              </>
            )}
          </button>
        );
      }

      // After initialization, check if creator is also a member
      if (marketData?.state === KuriState.ACTIVE) {
        if (membershipStatus === 1) {
          // Creator is also a member - show same interface as other members
          return (
            <div
              className={`grid grid-cols-1 ${
                shouldShowClaimCard ? "lg:grid-cols-2" : "lg:grid-cols-1"
              } gap-4 lg:gap-6 w-full`}
            >
              {/* Deposit Card */}
              <DepositForm
                marketData={marketData}
                kuriAddress={address as `0x${string}`}
              />

              {/* Claim Card - Only show to winners who haven't claimed */}
              {shouldShowClaimCard ? (
                <ClaimInterface
                  marketData={marketData}
                  kuriAddress={address as `0x${string}`}
                  onClaimSuccess={handleClaimSuccess}
                />
              ) : (
                <div style={{ display: "none" }}>
                  {/* Debug: Claim card hidden - shouldShowClaimCard: {shouldShowClaimCard.toString()} */}
                </div>
              )}
            </div>
          );
        } else {
          // Creator is not a member - show non-clickable status
          return (
            <button
              disabled
              className="w-full bg-blue-600 text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Circle is Active</span>
              <span className="sm:hidden">Active</span>
            </button>
          );
        }
      }

      // For other states (COMPLETED, LAUNCHFAILED), show manage members
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
          <button className="w-full bg-orange-600 text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md hover:bg-orange-700 transition-colors duration-300 flex items-center justify-center">
            <span className="material-icons text-lg sm:text-xl mr-1.5 sm:mr-2">
              people_outline
            </span>
            <span className="hidden sm:inline">
              Manage Members ({marketData?.totalActiveParticipantsCount || 0}/
              {marketData?.totalParticipantsCount || 0})
            </span>
            <span className="sm:hidden">
              Members ({marketData?.totalActiveParticipantsCount || 0}/
              {marketData?.totalParticipantsCount || 0})
            </span>
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
            className={`w-full font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md transition-colors duration-300 flex items-center justify-center ${
              isMarketFull
                ? "bg-gray-400 text-white cursor-not-allowed opacity-70"
                : "bg-[#E67A50] text-white hover:bg-orange-600"
            }`}
            title={isMarketFull ? "This circle is already full" : undefined}
          >
            {isRequesting ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-1.5 sm:mr-2" />
            ) : isMarketFull ? (
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            ) : (
              <span className="material-icons text-lg sm:text-xl mr-1.5 sm:mr-2">
                add_circle_outline
              </span>
            )}
            {isRequesting ? (
              <>
                <span className="hidden sm:inline">Sending Request...</span>
                <span className="sm:hidden">Sending...</span>
              </>
            ) : isMarketFull ? (
              <>
                <span className="hidden sm:inline">Circle Full</span>
                <span className="sm:hidden">Full</span>
              </>
            ) : (
              <>
                <span className="hidden sm:inline">Request to Join</span>
                <span className="sm:hidden">Join</span>
              </>
            )}
          </button>
        );

      case 1: // ACCEPTED
        if (marketData?.state === KuriState.ACTIVE) {
          return (
            <div
              className={`grid grid-cols-1 ${
                shouldShowClaimCard ? "lg:grid-cols-2" : "lg:grid-cols-1"
              } gap-4 lg:gap-6 w-full`}
            >
              {/* Deposit Card */}
              <DepositForm
                marketData={marketData}
                kuriAddress={address as `0x${string}`}
              />

              {/* Claim Card - Only show to winners who haven't claimed */}
              {shouldShowClaimCard ? (
                <ClaimInterface
                  marketData={marketData}
                  kuriAddress={address as `0x${string}`}
                  onClaimSuccess={handleClaimSuccess}
                />
              ) : (
                <div style={{ display: "none" }}>
                  {/* Debug: Claim card hidden - shouldShowClaimCard: {shouldShowClaimCard.toString()} */}
                </div>
              )}
            </div>
          );
        }
        return (
          <button
            disabled
            className="w-full bg-green-600 text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
          >
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Active Member</span>
            <span className="sm:hidden">Member</span>
          </button>
        );

      case 2: // REJECTED
        return (
          <button
            disabled
            className="w-full bg-red-500 text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
          >
            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Application Rejected</span>
            <span className="sm:hidden">Rejected</span>
          </button>
        );

      case 3: // FLAGGED
        return (
          <button
            disabled
            className="w-full bg-red-500 text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
          >
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Account Flagged</span>
            <span className="sm:hidden">Flagged</span>
          </button>
        );

      case 4: // APPLIED
        return (
          <button
            disabled
            className="w-full bg-yellow-500 text-white font-semibold sm:font-bold py-2 sm:py-3 px-4 sm:px-8 rounded-lg sm:rounded-xl lg:rounded-full text-sm sm:text-base lg:text-lg shadow-md cursor-not-allowed opacity-90 flex items-center justify-center"
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            <span className="hidden sm:inline">Application Pending</span>
            <span className="sm:hidden">Pending</span>
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
                    className="bg-white/90 backdrop-blur-md text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20"
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

                  <StatsContainer marketData={marketData} />
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
                      className="bg-white/90 backdrop-blur-md text-gray-800 p-2 rounded-full shadow-lg hover:bg-white hover:shadow-xl hover:scale-105 transition-all duration-300 border border-white/20"
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

                    <StatsContainer marketData={marketData} />
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

                  {/* Tab Content - Desktop Only */}
                  <div className="p-8 hidden lg:block">
                    <TabContent
                      activeTab={activeTab}
                      metadata={metadata}
                      marketData={marketData}
                      creatorProfile={creatorProfile}
                      creatorProfileLoading={creatorProfileLoading}
                      currentWinner={currentWinner}
                      winnerProfile={winnerProfile}
                      winnerProfileLoading={winnerProfileLoading}
                      address={address || ""}
                      membershipStatus={membershipStatus}
                      shouldShowClaimCard={shouldShowClaimCard}
                      shouldShowWinnerDisplay={shouldShowWinnerDisplay}
                      isCurrentUserWinner={isCurrentUserWinner}
                      handleClaimSuccess={handleClaimSuccess}
                      renderActionButton={renderActionButton}
                    />
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
                  <nav className="flex space-x-4 xs:space-x-6 -mb-px overflow-x-auto scrollbar-hide">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`py-4 px-1 flex-shrink-0 inline-flex items-center text-sm font-medium transition-all duration-300 border-b-2 ${
                        activeTab === "overview"
                          ? "text-[#E67A50] border-[#E67A50]"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="material-icons mr-2 text-xl">
                        visibility
                      </span>
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab("activity")}
                      className={`py-4 px-1 flex-shrink-0 inline-flex items-center text-sm font-medium transition-all duration-300 border-b-2 ${
                        activeTab === "activity"
                          ? "text-[#E67A50] border-[#E67A50]"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="material-icons mr-2 text-xl">
                        timeline
                      </span>
                      Activity
                    </button>
                    <button
                      onClick={() => setActiveTab("members")}
                      className={`py-4 px-1 flex-shrink-0 inline-flex items-center text-sm font-medium transition-all duration-300 border-b-2 ${
                        activeTab === "members"
                          ? "text-[#E67A50] border-[#E67A50]"
                          : "text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      <span className="material-icons mr-2 text-xl">
                        groups
                      </span>
                      Members
                    </button>
                  </nav>
                </div>

                {/* Mobile Tab Content - Mobile Only */}
                <div className="p-6 lg:hidden">
                  <TabContent
                    activeTab={activeTab}
                    metadata={metadata}
                    marketData={marketData}
                    creatorProfile={creatorProfile}
                    creatorProfileLoading={creatorProfileLoading}
                    currentWinner={currentWinner}
                    winnerProfile={winnerProfile}
                    winnerProfileLoading={winnerProfileLoading}
                    address={address || ""}
                    membershipStatus={membershipStatus}
                    shouldShowClaimCard={shouldShowClaimCard}
                    shouldShowWinnerDisplay={shouldShowWinnerDisplay}
                    isCurrentUserWinner={isCurrentUserWinner}
                    handleClaimSuccess={handleClaimSuccess}
                    renderActionButton={renderActionButton}
                  />
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
                        <span className="text-4xl font-bold text-orange-500">
                          <TimerSection
                            marketData={marketData}
                            section="days"
                            type="timeLeft"
                          />
                        </span>
                        <span className="block text-xs text-gray-900">
                          Days
                        </span>
                      </div>
                      <span className="text-3xl font-bold text-orange-500">
                        :
                      </span>
                      <div>
                        <span className="text-4xl font-bold text-orange-500">
                          <TimerSection
                            marketData={marketData}
                            section="hours"
                            type="timeLeft"
                          />
                        </span>
                        <span className="block text-xs text-gray-900">
                          Hours
                        </span>
                      </div>
                      <span className="text-3xl font-bold text-orange-500">
                        :
                      </span>
                      <div>
                        <span className="text-4xl font-bold text-orange-500">
                          <TimerSection
                            marketData={marketData}
                            section="minutes"
                            type="timeLeft"
                          />
                        </span>
                        <span className="block text-xs text-gray-900">
                          Minutes
                        </span>
                      </div>
                      <span className="text-3xl font-bold text-orange-500">
                        :
                      </span>
                      <div>
                        <span className="text-4xl font-bold text-orange-500">
                          <TimerSection
                            marketData={marketData}
                            section="seconds"
                            type="timeLeft"
                          />
                        </span>
                        <span className="block text-xs text-gray-900">
                          Seconds
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {marketData.state === KuriState.ACTIVE && (
                  <>
                    {shouldShowWinnerDisplay && currentWinner ? (
                      // Show winner display instead of countdown
                      <div className="mb-6">
                        <WinnerDisplay
                          currentWinner={currentWinner}
                          winnerProfile={winnerProfile}
                          winnerProfileLoading={winnerProfileLoading}
                          isCurrentUserWinner={isCurrentUserWinner}
                          marketData={marketData}
                          address={address || ""}
                          shouldShowClaimCard={shouldShowClaimCard}
                          handleClaimSuccess={handleClaimSuccess}
                          isMobile={true}
                        />
                      </div>
                    ) : (
                      // Show normal countdown
                      <>
                        <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
                          {Date.now() <
                          Number(marketData.nextIntervalDepositTime) * 1000
                            ? currentInterval === 0
                              ? "First Deposit Starts In"
                              : "Next Deposit Starts In"
                            : currentInterval === 1
                            ? "First Raffle In"
                            : "Next Raffle In"}
                        </h3>
                        <div className="flex justify-center items-baseline space-x-2 text-gray-900 mb-6">
                          <AdaptiveTimerMobileDisplay
                            marketData={marketData}
                            shouldShowWinner={shouldShowWinnerDisplay}
                          />
                        </div>
                      </>
                    )}
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

                {/* Mobile Action Button - Only show if not in winner display mode for current user */}
                {!(
                  shouldShowWinnerDisplay &&
                  isCurrentUserWinner &&
                  shouldShowClaimCard
                ) && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex justify-center"
                  >
                    {renderActionButton()}
                  </motion.div>
                )}
              </motion.div>
            </div>
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

function MarketDetailWithTimer() {
  // 🔥 REMOVED: No longer need MarketTimerProvider wrapper - using simple timer logic
  return <MarketDetailInner />;
}

export default function MarketDetail() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();

  // Validate address immediately - redirect if invalid
  useEffect(() => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      navigate("/markets", { replace: true });
    }
  }, [address, navigate]);

  // Don't render anything until we have a valid address
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return (
      <div className="min-h-screen bg-[#F9F5F1] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B6F47] mx-auto mb-4" />
          <p className="text-[#8B6F47] font-medium">Validating market...</p>
        </div>
      </div>
    );
  }

  return (
    <MarketProvider marketAddress={address}>
      <MarketDetailWithTimer />
    </MarketProvider>
  );
}
