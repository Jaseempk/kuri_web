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
  <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E8DED1]">
    <h3 className="text-sm text-muted-foreground mb-2">{title}</h3>
    <div className="flex items-end gap-2">
      <p className="text-2xl font-bold">{value}</p>
      <span
        className={`text-sm ${
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
    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
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
  const [previousStats, setPreviousStats] = useState({
    tvl: BigInt(0),
    activeCircles: 0,
    totalParticipants: 0,
  });

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const fetchedMarkets = await getAllMarkets();
        setMarkets(fetchedMarkets);

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

  const filteredMarkets = markets.filter((market) => {
    if (searchQuery) {
      return market.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Calculate current statistics
  const totalValueLocked = markets.reduce(
    (acc, market) => acc + BigInt(market.kuriAmount),
    BigInt(0)
  );

  const activeCircles = markets.filter((m) => m.state === 2).length;

  const totalParticipants = markets.reduce(
    (acc, market) => acc + market.totalParticipants,
    0
  );

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

  return (
    <div className="min-h-screen bg-background">
      {/* Stats Banner */}
      <div className="bg-[#F9F5F1] border-b border-[#E8DED1]">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="text-left mb-4 md:mb-0">
            <h1 className="text-3xl font-bold text-[#8B6F47]">
              Explore Circles
            </h1>
            <p className="text-muted-foreground mt-2">
              Join trusted savings circles and achieve your goals together
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-[#8B6F47] text-white hover:bg-[#725A3A] rounded-full px-6">
                Start a Circle
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] mx-4 sm:mx-auto">
              <CreateMarketForm />
            </DialogContent>
          </Dialog>
        </div>

        {/* New Filter Bar - Sticky */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-[#E8DED1] py-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                size={18}
              />
              <input
                type="search"
                placeholder="Search circles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full border border-[#E8DED1] focus:outline-none focus:ring-2 focus:ring-[#8B6F47]"
              />
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              <FilterButton
                active={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              >
                All ({markets.length})
              </FilterButton>
              <FilterButton
                active={activeFilter === "weekly"}
                onClick={() => setActiveFilter("weekly")}
              >
                Weekly (
                {
                  markets.filter((m) => m.intervalType === INTERVAL_TYPE.WEEKLY)
                    .length
                }
                )
              </FilterButton>
              <FilterButton
                active={activeFilter === "monthly"}
                onClick={() => setActiveFilter("monthly")}
              >
                Monthly (
                {
                  markets.filter(
                    (m) => m.intervalType === INTERVAL_TYPE.MONTHLY
                  ).length
                }
                )
              </FilterButton>
            </div>
            <button className="ml-auto p-2 rounded-full hover:bg-[#F9F5F1] transition-colors">
              <SlidersHorizontal size={20} className="text-[#8B6F47]" />
            </button>
          </div>
        </div>

        {/* Market Sections */}
        {marketSections.map(({ title, description, filter }) => {
          const sectionMarkets = filteredMarkets.filter(filter);
          if (sectionMarkets.length === 0) return null;

          return (
            <section key={title} className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-[#8B6F47]">
                    {title} ({sectionMarkets.length})
                  </h2>
                  <p className="text-muted-foreground mt-1">{description}</p>
                </div>
                {sectionMarkets.length > 3 && (
                  <Button
                    variant="outline"
                    className="text-[#8B6F47] border-[#E8DED1]"
                  >
                    View All
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
