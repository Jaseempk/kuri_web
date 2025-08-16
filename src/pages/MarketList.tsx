import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/card";
import { useOptimizedMarkets } from "../hooks/useOptimizedMarkets";
import { IntervalType } from "../graphql/types";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { LoadingSkeleton } from "../components/ui/loading-states";
import { CreateMarketForm } from "../components/markets/CreateMarketForm";
import { OptimizedMarketCard } from "../components/markets/OptimizedMarketCard";
import { OptimizedKuriMarket } from "../hooks/useOptimizedMarkets";
import { Search, SlidersHorizontal, Check, ChevronDown } from "lucide-react";
import { formatUnits } from "viem";
import { apiClient } from "../lib/apiClient";
import { MarketMetadata } from "../components/markets/MarketCard";
import { useProfileRequired } from "../hooks/useProfileRequired";
import { useNavigate } from "react-router-dom";
import { PostCreationShare } from "../components/markets/PostCreationShare";
import { useUSDCBalances } from "../hooks/useUSDCBalances";
import { getAccount } from "@wagmi/core";
import { config } from "../config/wagmi";

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
    filter: (market: OptimizedKuriMarket) => market.state === 2, // KuriState.ACTIVE
    value: "active",
  },
];

// Stats card component
const StatsCard = ({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) => (
  <Card className="p-4 xs:p-5 sm:p-6 bg-white border-[#E8DED1] hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-xl xs:text-2xl font-bold text-[#8B6F47]">{value}</p>
      </div>
      <div className="text-right">
        <p
          className={`text-sm font-medium ${
            parseFloat(change) >= 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          {parseFloat(change) >= 0 ? "+" : ""}
          {change}%
        </p>
        <p className="text-xs text-muted-foreground">vs last period</p>
      </div>
    </div>
  </Card>
);

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
        <span className="text-xs xs:text-sm font-medium truncate hidden xs:inline">{selectedOption?.label}</span>
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
  // Check wallet connection status
  const account = getAccount(config);
  const isWalletConnected = Boolean(account.isConnected && account.address);

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [createdMarket, setCreatedMarket] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const navigate = useNavigate();
  const { requireProfile } = useProfileRequired({
    strict: false, // Don't enforce on page load
    action: "market_action",
  });

  // Compute the default tab based on available markets
  const defaultTab = useMemo(() => {
    if (!markets.length) return "created";

    const createdMarkets = markets.filter((m) => m.state === 0);
    const activeMarkets = markets.filter((m) => m.state === 2);

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
        const marketAddresses = markets.map(m => m.address);
        const metadataArray = await apiClient.getBulkMarketMetadata(marketAddresses);

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
          activeCircles: markets.filter((m) => m.state === 2).length,
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

  const activeCircles = marketsForStats.filter((m) => m.state === 2).length;

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
    // Set the created market and close the create form
    setCreatedMarket(market);
    setShowCreateForm(false);

    // Show share modal
    setShowShareModal(true);

    // Refresh will happen when share modal closes
  };

  // Handle user actions that require data refresh
  const handleUserAction = () => {
    refetchUserData();
    refetch();
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Stats Banner */}
        <div className="bg-[#F9F5F1] border-b border-[#E8DED1]">
          <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-5 sm:py-6">
            {/* Mobile: Horizontal scroll, Desktop: Grid */}
            <div className="sm:hidden">
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
                <div className="min-w-[280px] snap-start">
                  <StatsCard
                    title="Total Participants"
                    value={totalParticipants.toString()}
                    change={participantsChange}
                  />
                </div>
                <div className="min-w-[280px] snap-start">
                  <StatsCard
                    title="Active Circles"
                    value={activeCircles.toString()}
                    change={circlesChange}
                  />
                </div>
                <div className="min-w-[280px] snap-start">
                  <StatsCard
                    title="Total Value Locked"
                    value={`$${Number(
                      formatUnits(totalValueLocked, 6)
                    ).toLocaleString()}`}
                    change={tvlChange}
                  />
                </div>
              </div>
            </div>
            
            {/* Desktop: Grid layout */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
              <StatsCard
                title="Total Value Locked"
                value={`$${Number(
                  formatUnits(totalValueLocked, 6)
                ).toLocaleString()}`}
                change={tvlChange}
              />
              <StatsCard
                title="Active Circles"
                value={activeCircles.toString()}
                change={circlesChange}
              />
              <StatsCard
                title="Total Participants"
                value={totalParticipants.toString()}
                change={participantsChange}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-3 xs:px-4 py-6 xs:py-8">
          {/* Enhanced Header Section */}
          <div className="mb-6 xs:mb-8">
            {/* Mobile: Button first, then title */}
            <div className="xs:hidden space-y-4">
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button
                    onClick={(e) => {
                      if (!handleCreateMarket()) {
                        e.preventDefault();
                      }
                    }}
                    className="w-full bg-[hsl(var(--terracotta))] text-white hover:bg-white hover:text-[hsl(var(--terracotta))] hover:border-[hsl(var(--terracotta))] border border-[hsl(var(--terracotta))] rounded-full px-4 transition-all duration-200"
                  >
                    Start a Circle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-[480px] p-0 gap-0">
                  <DialogTitle className="sr-only">Create New Circle</DialogTitle>
                  <DialogDescription className="sr-only">
                    Create a new savings circle by setting up the basic details, participation options, and circle information.
                  </DialogDescription>
                  <CreateMarketForm
                    onSuccess={handleMarketCreated}
                    onClose={() => setShowCreateForm(false)}
                  />
                </DialogContent>
              </Dialog>
              
              <div className="text-center">
                <h1 className="text-2xl font-bold text-[#8B6F47]">
                  Explore Circles
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Join trusted savings circles and achieve your goals together
                </p>
              </div>
            </div>
            
            {/* Desktop: Original layout */}
            <div className="hidden xs:flex xs:flex-row justify-between items-start xs:items-center gap-4">
              <div className="text-left">
                <h1 className="text-2xl xs:text-3xl font-bold text-[#8B6F47]">
                  Explore Circles
                </h1>
                <p className="text-sm xs:text-base text-muted-foreground mt-1 xs:mt-2">
                  Join trusted savings circles and achieve your goals together
                </p>
              </div>
              <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
                <DialogTrigger asChild>
                  <Button
                    onClick={(e) => {
                      if (!handleCreateMarket()) {
                        e.preventDefault();
                      }
                    }}
                    className="w-auto bg-[hsl(var(--terracotta))] text-white hover:bg-white hover:text-[hsl(var(--terracotta))] hover:border-[hsl(var(--terracotta))] border border-[hsl(var(--terracotta))] rounded-full px-6 transition-all duration-200"
                  >
                    Start a Circle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] sm:max-w-[480px] p-0 gap-0">
                  <DialogTitle className="sr-only">Create New Circle</DialogTitle>
                  <DialogDescription className="sr-only">
                    Create a new savings circle by setting up the basic details, participation options, and circle information.
                  </DialogDescription>
                  <CreateMarketForm
                    onSuccess={handleMarketCreated}
                    onClose={() => setShowCreateForm(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filter Bar - Sticky */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-[#E8DED1]/50 -mx-3 xs:-mx-4 px-3 xs:px-4 py-3 xs:py-4 mb-6 xs:mb-8 z-10 rounded-2xl">
            {/* Mobile: Horizontal layout with different proportions */}
            <div className="flex xs:hidden gap-3 items-center">
              <div className="flex-1">
                <MarketSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search circles..."
                />
              </div>
              <div className="flex-shrink-0">
                <IntervalTypeFilter
                  value={activeFilter}
                  onChange={setActiveFilter}
                />
              </div>
            </div>
            
            {/* Desktop: Original layout */}
            <div className="hidden xs:flex xs:flex-row gap-4 items-center">
              <div className="flex-1">
                <MarketSearch
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search by market name or address..."
                />
              </div>
              <div className="flex items-center gap-3">
                <IntervalTypeFilter
                  value={activeFilter}
                  onChange={setActiveFilter}
                />
              </div>
            </div>
          </div>

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
                    {/* Section Header */}
                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 mb-4 xs:mb-6">
                      {sectionMarkets.length > 6 && (
                        <Button
                          variant="outline"
                          className="hidden xs:inline-flex text-[#8B6F47] border-[#E8DED1] hover:bg-[#F9F5F1]"
                        >
                          View All
                        </Button>
                      )}
                    </div>

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
                          <OptimizedMarketCard
                            key={market.address}
                            market={market}
                            index={index}
                            onJoinClick={handleUserAction}
                          />
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

      {/* Modal rendered outside the main container */}
      {showShareModal && createdMarket && (
        <PostCreationShare
          market={createdMarket}
          onClose={() => {
            setShowShareModal(false);
            setCreatedMarket(null);
            refetch(); // Refresh market data after modal closes
          }}
          onViewMarket={() => {
            setShowShareModal(false);
            setCreatedMarket(null);
            refetch(); // Refresh market data before navigation
            navigate(`/markets/${createdMarket.address}`);
          }}
        />
      )}
    </>
  );
}
