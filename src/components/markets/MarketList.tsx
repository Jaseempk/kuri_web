import { useEffect, useRef, useState } from "react";
import { Market, MarketStatus } from "../../graphql/types";
import { useMarkets } from "../../hooks/useMarkets";
import { MarketCard } from "./MarketCard";
import { Button } from "../ui/button";

const STATUS_OPTIONS = [
  { label: "All", value: undefined },
  { label: "Created", value: MarketStatus.CREATED },
  { label: "Active", value: MarketStatus.ACTIVE },
  { label: "Paused", value: MarketStatus.PAUSED },
];

export const MarketList = () => {
  const {
    markets,
    loading,
    error,
    loadMore,
    hasMore,
    filterByStatus,
    currentStatus,
  } = useMarkets();

  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isIntersecting && hasMore && !loading) {
      loadMore();
    }
  }, [isIntersecting, hasMore, loading, loadMore]);

  const handleJoinClick = (market: Market) => {
    // TODO: Implement join market functionality in Phase 4
    console.log("Join market:", market.address);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading markets: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Status Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.label}
            variant={currentStatus === option.value ? "default" : "outline"}
            onClick={() => filterByStatus(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Market Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {markets.map((market) => (
          <MarketCard
            key={market.id}
            market={market}
            onJoinClick={handleJoinClick}
          />
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      )}

      {/* Infinite Scroll Observer */}
      {hasMore && <div ref={observerTarget} className="h-4" />}

      {/* Empty State */}
      {!loading && markets.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No markets found</p>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No markets found</p>
        </div>
      )}
    </div>
  );
};
