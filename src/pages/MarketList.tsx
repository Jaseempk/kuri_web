import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card } from "../components/ui/card";
import { useKuriFactory } from "../hooks/contracts/useKuriFactory";
import { MarketStatus, IntervalType } from "../graphql/types";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";
import { LoadingSkeleton } from "../components/ui/loading-states";
import { CreateMarketForm } from "../components/markets/CreateMarketForm";
import { MarketCard } from "../components/markets/MarketCard";
import { KuriMarket } from "../hooks/useKuriMarkets";
import { Search, SlidersHorizontal } from "lucide-react";
import { formatEther } from "viem";
import { supabase } from "../lib/supabase";
import { MarketMetadata } from "../components/markets/MarketCard";
import { useProfileRequired } from "../hooks/useProfileRequired";
import { useNavigate } from "react-router-dom";
import { PostCreationShare } from "../components/markets/PostCreationShare";

const INTERVAL_TYPE = {
  WEEKLY: 0 as IntervalType,
  MONTHLY: 1 as IntervalType,
} as const;

// Market categories with emojis matching the mockup
const marketSections = [
  {
    title: "Active Markets",
    description: "Currently active markets accepting deposits",
    filter: (market: KuriMarket) => market.state === 2, // KuriState.ACTIVE
  },
  {
    title: "Created Markets",
    description: "Recently created markets pending activation",
    filter: (market: KuriMarket) => market.state === 0, // KuriState.INLAUNCH
  },
  {
    title: "Paused Markets",
    description: "Markets that are temporarily paused",
    filter: (market: KuriMarket) => market.state === 1, // KuriState.LAUNCHFAILED
  },
];

const StatsCard = ({
  title,
  value,
  change,
}: {
  title: string;
  value: string;
  change: string;
}) => (
  <div className="bg-white rounded-xl p-4 xs:p-5 sm:p-6 shadow-sm border border-[#E8DED1]">
    <h3 className="text-xs xs:text-sm text-muted-foreground mb-1.5 xs:mb-2">
      {title}
    </h3>
    <div className="flex items-end gap-1.5 xs:gap-2">
      <p className="text-xl xs:text-2xl font-bold">{value}</p>
      <span
        className={`text-xs xs:text-sm ${
          Number(change) > 0
            ? "text-green-600"
            : Number(change) < 0
            ? "text-red-600"
            : "text-muted-foreground"
        }`}
      >
        {change}%
      </span>
    </div>
  </div>
);

const FilterButton = ({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 xs:px-4 py-1.5 xs:py-2 rounded-full text-xs xs:text-sm font-medium transition-colors border whitespace-nowrap ${
      active
        ? "bg-[#8B6F47] text-white border-[#8B6F47] hover:bg-[#725A3A]"
        : "border-[#E8DED1] hover:bg-[#F9F5F1]"
    }`}
  >
    {children}
  </button>
);

export default function MarketList() {
  const { getAllMarkets, isCreating, isLoading, error } = useKuriFactory();
  const [markets, setMarkets] = useState<KuriMarket[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
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
  const navigate = useNavigate();
  const { requireProfile } = useProfileRequired({
    strict: false, // Don't enforce on page load
    action: "market_action",
  });

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const fetchedMarkets = await getAllMarkets();
        setMarkets(fetchedMarkets);

        // Fetch metadata for all markets from Supabase
        const { data } = await supabase.from("kuri_web").select("*");

        // Create a lookup map by market address
        if (data) {
          const metadataMap: Record<string, MarketMetadata> = {};
          data.forEach((item: any) => {
            // Store with lowercase address for case-insensitive lookup
            const address = item.market_address.toLowerCase();
            metadataMap[address] = item as MarketMetadata;
          });
          setMarketMetadata(metadataMap);
        }

        // Store current stats for comparison
        const currentStats = {
          tvl: fetchedMarkets.reduce(
            (acc, market) => acc + BigInt(market.kuriAmount),
            BigInt(0)
          ),
          activeCircles: fetchedMarkets.filter((m) => m.state === 2).length,
          totalParticipants: fetchedMarkets.reduce(
            (acc, market) => acc + market.totalParticipants,
            0
          ),
        };

        // Calculate differences for next render
        setPreviousStats(currentStats);
      } catch (err) {
        console.error("Error fetching markets:", err);
      }
    };

    fetchMarkets();
  }, [getAllMarkets]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div>Error loading markets: {error.message}</div>;
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

  const totalValueLocked = marketsForStats.reduce(
    (acc, market) => acc + BigInt(market.kuriAmount),
    BigInt(0)
  );

  const activeCircles = marketsForStats.filter((m) => m.state === 2).length;

  const totalParticipants = marketsForStats.reduce(
    (acc, market) => acc + market.totalParticipants,
    0
  );

  // Helper function to count markets by interval type
  const countMarketsByIntervalType = (intervalType: number) => {
    return markets.filter((market) => market.intervalType === intervalType)
      .length;
  };

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
    // Set the created market first
    setCreatedMarket(market);
    // Then update both modal states in the same render cycle
    setShowCreateForm(false);
    // Use requestAnimationFrame to ensure the share modal opens in the next frame
    requestAnimationFrame(() => {
      setShowShareModal(true);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Stats Banner */}
      <div className="bg-[#F9F5F1] border-b border-[#E8DED1]">
        <div className="container mx-auto px-3 xs:px-4 py-4 xs:py-5 sm:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
            <StatsCard
              title="Total Value Locked"
              value={`$${Number(
                formatEther(totalValueLocked)
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
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-4 mb-6 xs:mb-8">
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
                className="w-full xs:w-auto bg-[#8B6F47] text-white hover:bg-transparent hover:text-[#8B6F47] hover:border-[#8B6F47] border border-transparent rounded-full px-4 xs:px-6 transition-all duration-200"
              >
                Start a Circle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-auto">
              <CreateMarketForm
                onSuccess={handleMarketCreated}
                onClose={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {showShareModal && createdMarket && (
          <PostCreationShare
            market={createdMarket}
            onClose={() => setShowShareModal(false)}
            onViewMarket={() => {
              setShowShareModal(false);
              navigate(`/markets/${createdMarket.address}`);
            }}
          />
        )}

        {/* Filter Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-[#E8DED1] py-3 xs:py-4 mb-6 xs:mb-8">
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4">
            <div className="flex-1 min-w-0 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="search"
                placeholder="Search circles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[#E8DED1] focus:outline-none focus:ring-2 focus:ring-[#8B6F47] text-sm"
              />
            </div>
            <div
              className="flex gap-2 xs:gap-3 overflow-x-auto pb-2 xs:pb-0 
              scrollbar-thin scrollbar-thumb-[#E8DED1] scrollbar-track-transparent"
            >
              <FilterButton
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              >
                All ({intervalFilteredMarkets.length})
              </FilterButton>
              <FilterButton
                active={activeFilter === "weekly"}
                onClick={() => setActiveFilter("weekly")}
              >
                Weekly (
                {
                  intervalFilteredMarkets.filter(
                    (m) => m.intervalType === INTERVAL_TYPE.WEEKLY
                  ).length
                }
                )
              </FilterButton>
              <FilterButton
                active={activeFilter === "monthly"}
                onClick={() => setActiveFilter("monthly")}
              >
                Monthly (
                {
                  intervalFilteredMarkets.filter(
                    (m) => m.intervalType === INTERVAL_TYPE.MONTHLY
                  ).length
                }
                )
              </FilterButton>
            </div>
            <button className="hidden xs:flex p-2 rounded-full hover:bg-[#F9F5F1] transition-colors">
              <SlidersHorizontal size={20} className="text-[#8B6F47]" />
            </button>
          </div>
        </div>

        {/* Market Sections */}
        {marketSections.map(({ title, description, filter }) => {
          const sectionMarkets = filteredMarkets.filter(filter);
          if (sectionMarkets.length === 0) return null;

          return (
            <section key={title} className="mb-8 xs:mb-12">
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-0 mb-4 xs:mb-6">
                <div>
                  <h2 className="text-xl xs:text-2xl font-semibold text-[#8B6F47]">
                    {title} ({sectionMarkets.length})
                  </h2>
                  <p className="text-sm xs:text-base text-muted-foreground mt-0.5 xs:mt-1">
                    {description}
                  </p>
                </div>
                {sectionMarkets.length > 3 && (
                  <Button
                    variant="outline"
                    className="hidden xs:inline-flex text-[#8B6F47] border-[#E8DED1]"
                  >
                    View All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 sm:gap-6">
                {sectionMarkets.map((market, index) => (
                  <MarketCard
                    key={market.address}
                    market={market}
                    index={index}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
