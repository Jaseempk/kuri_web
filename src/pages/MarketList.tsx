import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useOptimizedMarkets } from "../hooks/useOptimizedMarkets";
import { useAuthContext } from "../contexts/AuthContext";
import { IntervalType } from "../graphql/types";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { LoadingSkeleton } from "../components/ui/loading-states";
import { CreateMarketForm } from "../components/markets/CreateMarketForm";
import { OptimizedMarketCard } from "../components/markets/OptimizedMarketCard";
import { MarketProvider } from "../contexts/MarketContext";
import { OptimizedKuriMarket } from "../hooks/useOptimizedMarkets";
import {
  Search,
  SlidersHorizontal,
  Check,
  ChevronDown,
  TrendingUp,
  Plus,
} from "lucide-react";
import { formatUnits } from "viem";
import { apiClient } from "../lib/apiClient";
import { MarketMetadata } from "../components/markets/MarketCard";
import { useProfileRequired } from "../hooks/useProfileRequired";
import { usePostCreationShareReplacement } from "../components/modals/PostCreationModalProvider";
import { useUSDCBalances } from "../hooks/useUSDCBalances";
// import { UserBalanceCard } from "../components/ui/UserBalanceCard"; // Commented out for potential reuse

const INTERVAL_TYPE = {
  WEEKLY: 0 as IntervalType,
  MONTHLY: 1 as IntervalType,
} as const;

// Market categories with tab values
const marketSections = [
  {
    title: "Launching Circles",
    description: "Recently created circles pending activation",
    filter: (market: OptimizedKuriMarket) => market.state === 0, // KuriState.INLAUNCH
    value: "created",
  },
  {
    title: "Active Circles",
    description: "Currently active circles accepting deposits",
    filter: (market: OptimizedKuriMarket) => market.state === 1, // KuriState.ACTIVE
    value: "active",
  },
];

// Market search component
const MarketSearch = ({
  value,
  onChange,
  placeholder = "Search markets...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-10 pr-4 py-2 xs:py-2.5 border border-[#E8DED1] rounded-full focus:ring-2 focus:ring-[hsl(var(--terracotta))] focus:border-transparent transition-all duration-200"
    />
  </div>
);

// Interval type dropdown component
const IntervalTypeFilter = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: "all", label: "All Intervals", count: 0 },
    { value: "weekly", label: "Weekly", count: 0 },
    { value: "monthly", label: "Monthly", count: 0 },
  ];

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 xs:gap-2 px-2 xs:px-3 py-2 xs:py-2.5 bg-white text-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] hover:text-white border border-[hsl(var(--terracotta))] rounded-full transition-all duration-200 min-w-0 whitespace-nowrap"
      >
        <SlidersHorizontal className="h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0" />
        <span className="text-xs xs:text-sm font-medium truncate hidden xs:inline">
          {selectedOption?.label}
        </span>
        <span className="text-xs font-medium truncate xs:hidden">Filter</span>
        <ChevronDown
          className={`h-3 w-3 xs:h-4 xs:w-4 flex-shrink-0 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 xs:left-auto xs:right-0 mt-1 w-36 xs:w-full bg-white border border-[hsl(var(--terracotta))] rounded-2xl shadow-lg z-10 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 xs:px-4 py-2 xs:py-2 text-left transition-colors text-sm xs:text-sm ${
                value === option.value
                  ? "bg-[hsl(var(--terracotta))] text-white"
                  : "hover:bg-[hsl(var(--terracotta))]/10"
              }`}
            >
              <span className="block xs:inline">{option.label}</span>
              <span className="hidden xs:inline">
                {value === option.value && (
                  <Check className="h-4 w-4 text-white ml-2 inline" />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function MarketList() {
  // Use optimized auth for stable wallet connection status
  const { account: paraAccount } = useAuthContext();
  const isWalletConnected = useMemo(
    () =>
      Boolean(
        paraAccount.isConnected && paraAccount.embedded?.wallets?.[0]?.address
      ),
    [paraAccount.isConnected, paraAccount.embedded?.wallets?.[0]?.address]
  );

  // Replace useKuriMarkets with useOptimizedMarkets
  const {
    markets,
    loading: isLoading,
    error,
    userDataLoading,
    userDataError,
    refetch,
    refetchUserData,
  } = useOptimizedMarkets({
    includeUserData: isWalletConnected, // Only fetch user data when wallet is connected
    includePaymentStatus: false, // Skip expensive payment status calls for Markets List
  });

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [userSelectedTab, setUserSelectedTab] = useState<string | null>(null);
  const [marketMetadata, setMarketMetadata] = useState<
    Record<string, MarketMetadata | null>
  >({});
  const [previousStats, setPreviousStats] = useState({
    tvl: BigInt(0),
    activeCircles: 0,
    totalParticipants: 0,
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { onSuccess } = usePostCreationShareReplacement();
  const [isInitialized, setIsInitialized] = useState(false);

  const { requireProfile } = useProfileRequired({
    strict: false, // Don't enforce on page load - AuthGuard handles this
    action: "market_action",
  });

  // Compute the default tab based on available markets
  const defaultTab = useMemo(() => {
    if (!markets.length) return "created";

    const createdMarkets = markets.filter((m) => m.state === 0);
    const activeMarkets = markets.filter((m) => m.state === 1);

    if (createdMarkets.length > 0) return "created";
    if (activeMarkets.length > 0) return "active";
    return "created"; // Default to created if no markets found
  }, [markets]);

  // Use user selection if available, otherwise use computed default
  const activeTab = userSelectedTab || defaultTab;

  // Get market addresses for USDC balance fetching
  const marketAddresses = useMemo(
    () => markets.map((market) => market.address as `0x${string}`),
    [markets]
  );
  const marketStates = useMemo(
    () => markets.map((market) => market.state),
    [markets]
  );

  // Fetch USDC balances for all markets (only when we have markets)
  const {
    totalTVL,
    isLoading: isLoadingBalances,
    error: balancesError,
  } = useUSDCBalances(markets.length > 0 ? marketAddresses : [], marketStates);

  useEffect(() => {
    const initializeMarketsData = async () => {
      if (!markets.length) {
        console.log("No markets available, skipping initialization");
        setIsInitialized(false);
        return;
      }

      // Skip if already initialized and data hasn't changed significantly
      if (
        isInitialized &&
        markets.length > 0 &&
        marketMetadata &&
        Object.keys(marketMetadata).length > 0
      ) {
        return;
      }

      try {
        // Fetch metadata only for current market addresses (much more efficient than fetching all)
        const marketAddresses = markets.map((m) => m.address);
        const metadataArray = await apiClient.getBulkMarketMetadata(
          marketAddresses
        );

        // Create a lookup map by market address
        const metadataMap: Record<string, MarketMetadata> = {};
        metadataArray.forEach((item: any) => {
          // Store with lowercase address for case-insensitive lookup
          const address = item.market_address.toLowerCase();
          metadataMap[address] = item as MarketMetadata;
        });
        setMarketMetadata(metadataMap);

        // Store current stats for comparison (including USDC balances if available)
        const currentStats = {
          tvl: totalTVL > 0 ? totalTVL : BigInt(0),
          activeCircles: markets.filter((m) => m.state === 1).length,
          totalParticipants: markets.reduce(
            (acc, market) => acc + market.activeParticipants,
            0
          ),
        };

        // Calculate differences for next render
        setPreviousStats(currentStats);
        setIsInitialized(true); // Mark initialization as complete
      } catch (err) {
        console.error("Error initializing markets data:", err);
      }
    };

    initializeMarketsData();
  }, [markets]);

  // Show loading state for both market data and user data
  if (isLoading || isLoadingBalances || userDataLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div>Error loading markets: {error.message}</div>;
  }

  if (userDataError) {
    console.warn("User data error:", userDataError);
    // Don't block the UI for user data errors, just log them
  }

  if (balancesError) {
    return <div>Error loading USDC balances: {balancesError.message}</div>;
  }

  // First apply interval type filter if selected
  const intervalFilteredMarkets = markets.filter((market) => {
    // Check if this is a market that should be hidden
    const currentTimestamp = Math.floor(Date.now() / 1000); // Current time in seconds
    const launchPeriodEnded = Number(market.launchPeriod) < currentTimestamp;
    const isInLaunchState = market.state === 0; // KuriState.INLAUNCH
    const participantsMismatch =
      market.activeParticipants !== market.totalParticipants;

    // Hide markets that meet all three conditions
    if (launchPeriodEnded && isInLaunchState && participantsMismatch) {
      return false;
    }

    // Then apply the interval type filter
    if (activeFilter === "weekly") {
      return market.intervalType === INTERVAL_TYPE.WEEKLY;
    } else if (activeFilter === "monthly") {
      return market.intervalType === INTERVAL_TYPE.MONTHLY;
    }
    return true; // Show all if no interval filter
  });

  // Then apply search filter on top of the interval filtered markets
  const filteredMarkets = intervalFilteredMarkets.filter((market) => {
    if (searchQuery) {
      // Get metadata for this market (case-insensitive)
      const metadata = marketMetadata[market.address.toLowerCase()];

      // Search in metadata short_description if available
      if (metadata?.short_description) {
        return metadata.short_description
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }

      // Fallback to address search if no metadata
      return market.address.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return true; // Show all if no search query
  });

  // Calculate current statistics for displayed markets based on the active filter
  const marketsForStats =
    activeFilter === "all" ? markets : intervalFilteredMarkets;

  // Use actual USDC balances for TVL - this represents real locked value
  const totalValueLocked = totalTVL;

  const activeCircles = marketsForStats.filter((m) => m.state === 1).length;

  const totalParticipants = marketsForStats.reduce(
    (acc, market) => acc + market.activeParticipants,
    0
  );

  // Helper function to count markets by interval type (unused but kept for future use)
  // const countMarketsByIntervalType = (intervalType: number) => {
  //   return markets.filter((market) => market.intervalType === intervalType)
  //     .length;
  // };

  // Calculate changes (comparing with previous stats)
  const tvlChange = previousStats.tvl
    ? (
        ((Number(totalValueLocked) - Number(previousStats.tvl)) /
          Number(previousStats.tvl)) *
        100
      ).toFixed(1)
    : "0";

  const circlesChange = previousStats.activeCircles
    ? (
        ((activeCircles - previousStats.activeCircles) /
          previousStats.activeCircles) *
        100
      ).toFixed(1)
    : "0";

  const participantsChange = previousStats.totalParticipants
    ? (
        ((totalParticipants - previousStats.totalParticipants) /
          previousStats.totalParticipants) *
        100
      ).toFixed(1)
    : "0";

  const handleCreateMarket = () => {
    return requireProfile(); // This will handle the navigation if needed
  };

  const handleMarketCreated = (market: any) => {
    // The new system handles everything automatically
    onSuccess(market);

    // Close the create form (since CreateMarketForm no longer closes itself)
    setShowCreateForm(false);

    // Refresh market data (keep existing refetch logic)
    refetch();
  };

  // Handle user actions that require data refresh
  const handleUserAction = () => {
    refetchUserData();
    refetch();
  };

  return (
    <>
      <div className="min-h-screen bg-[#fdfaf7]">
        {/* Main Grid Container */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column - Welcome + Explore Circles */}
            <div className="lg:col-span-2 space-y-12">
              {/* Welcome Section with Glassmorphic Design */}
              <div className="bg-white/40 backdrop-blur-[10px] p-8 rounded-3xl shadow-lg border border-white/20">
                <div className="flex flex-col md:flex-row md:items-center gap-8">
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      <span className="md:hidden">Welcome to Kuri</span>
                      <span className="hidden md:inline">
                        Welcome to Kuri Circles
                      </span>
                    </h1>
                    <p className="text-gray-600 mb-8 text-lg">
                      <span className="md:hidden">
                        Create or join trusted savings circles. Watch our demo
                        to get started!
                      </span>
                      <span className="hidden md:inline">
                        Learn how to create or join trusted savings circles and
                        achieve your financial goals together. Watch our quick
                        demo to get started!
                      </span>
                    </p>
                    <Dialog
                      open={showCreateForm}
                      onOpenChange={setShowCreateForm}
                    >
                      <DialogTrigger asChild>
                        <Button
                          onClick={(e) => {
                            if (!handleCreateMarket()) {
                              e.preventDefault();
                            }
                          }}
                          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-[hsl(var(--terracotta))] hover:bg-white hover:text-[hsl(var(--terracotta))] hover:border-[hsl(var(--terracotta))] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-300 transform hover:scale-105 shadow-lg"
                        >
                          <Plus className="mr-2 h-5 w-5" />
                          Start a New Circle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-[480px] p-0 gap-0">
                        <DialogTitle className="sr-only">
                          Create New Circle
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                          Create a new savings circle by setting up the basic
                          details, participation options, and circle
                          information.
                        </DialogDescription>
                        <CreateMarketForm
                          onSuccess={handleMarketCreated}
                          onClose={() => setShowCreateForm(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="md:w-2/5">
                    <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-white/50">
                      <iframe
                        src="https://www.youtube-nocookie.com/embed/8jTHBmKQ03g?privacy-enhanced-mode=1&rel=0&modestbranding=1"
                        className="w-full h-full"
                        title="How Kuri Works - Tutorial Video"
                        style={{ border: "none" }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Explore Circles Section */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Explore Circles
                  </h2>
                  <p className="text-gray-600 mt-2 text-base">
                    Join trusted savings circles and achieve your goals
                    together.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Market Statistics Sidebar (Desktop Only) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="bg-[#fdfaf7] p-6 rounded-3xl shadow-lg border border-white/20 sticky top-28">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Market Statistics
                </h3>

                <div className="space-y-4">
                  {/* Individual stat cards with glassmorphic design */}
                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-500">
                        Total Value Locked
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        $
                        {Number(
                          formatUnits(totalValueLocked, 6)
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-500 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />+{tvlChange}%
                      </p>
                      <p className="text-xs text-gray-400">vs last period</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-500">Active Circles</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {activeCircles}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-500 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />+{circlesChange}%
                      </p>
                      <p className="text-xs text-gray-400">vs last period</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white/50 rounded-xl">
                    <div>
                      <p className="text-sm text-gray-500">
                        Total Participants
                      </p>
                      <p className="text-2xl font-bold text-gray-800">
                        {totalParticipants}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-500 flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />+
                        {participantsChange}%
                      </p>
                      <p className="text-xs text-gray-400">vs last period</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Search/Filter Bar - Sticky Full Width */}
        <div className="sticky top-0 z-20 bg-[#fdfaf7]/95 backdrop-blur-sm border-b border-[#E8DED1]/50 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <MarketSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by market name or address..."
                />
              </div>
              <div className="flex-shrink-0">
                <IntervalTypeFilter
                  value={activeFilter}
                  onChange={setActiveFilter}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Markets Content - Full Width Below Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          {/* Markets Content */}
          <div className="w-full">
            <div className="mb-6 xs:mb-8 bg-white/80 backdrop-blur-sm border border-[#E8DED1]/50 p-1.5 rounded-xl w-fit mr-auto overflow-x-auto flex-nowrap whitespace-nowrap scrollbar-thin scrollbar-thumb-[#E8DED1] scrollbar-track-transparent gap-1 shadow-sm flex">
              {marketSections.map(({ title, value, filter }) => {
                const sectionMarkets = filteredMarkets.filter(filter);
                const isActive = activeTab === value;
                return (
                  <button
                    key={value}
                    onClick={() => {
                      // Only update if different to prevent unnecessary re-renders
                      if (activeTab !== value) {
                        setUserSelectedTab(value);
                      }
                    }}
                    className={`${
                      isActive
                        ? "bg-[hsl(var(--terracotta))] text-white shadow-md"
                        : "text-gray-700 hover:bg-[hsl(var(--terracotta))]/10 hover:shadow-sm bg-transparent"
                    } rounded-lg transition-all duration-300 text-xs xs:text-sm px-3 py-2 xs:px-4 xs:py-2.5 flex-shrink-0 border-0 font-medium relative group`}
                  >
                    <span className="relative z-10 flex items-center gap-1.5">
                      {title}
                      <span
                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 py-0.5 text-xs font-bold rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {sectionMarkets.length}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {marketSections.map(({ title, filter, value }) => {
              const sectionMarkets = filteredMarkets.filter(filter);
              const isActive = activeTab === value;

              return (
                <div key={value} className={isActive ? "block" : "hidden"}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Markets Grid */}
                    {sectionMarkets.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-muted-foreground text-lg mb-2">
                          No {title.toLowerCase()} found
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {value === "created" &&
                            "No markets are currently in launch"}
                          {value === "active" &&
                            "No markets are currently active"}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
                        {sectionMarkets.map((market, index) => (
                          <MarketProvider
                            key={market.address}
                            marketAddress={market.address}
                          >
                            <OptimizedMarketCard
                              market={market}
                              index={index}
                              onJoinClick={handleUserAction}
                            />
                          </MarketProvider>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* New modal renders automatically through PostCreationModalProvider */}
    </>
  );
}
