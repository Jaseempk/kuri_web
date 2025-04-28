import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useKuriFactory } from "../hooks/contracts/useKuriFactory";
import { MarketStatus, IntervalType } from "../graphql/types";
import { formatEther } from "viem";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Plus } from "lucide-react";
import { LoadingSkeleton } from "../components/ui/loading-states";
import { CreateMarketForm } from "../components/markets/CreateMarketForm";
import { MarketCard } from "../components/markets/MarketCard";
import { KuriMarket } from "../hooks/useKuriMarkets";

const INTERVAL_TYPE = {
  WEEKLY: 0 as IntervalType,
  MONTHLY: 1 as IntervalType,
} as const;

const intervalTypeToString = (intervalType: IntervalType): string => {
  switch (intervalType) {
    case INTERVAL_TYPE.WEEKLY:
      return "Weekly";
    case INTERVAL_TYPE.MONTHLY:
      return "Monthly";
    default:
      return "Unknown";
  }
};

const statusToString = (status: MarketStatus): string => {
  switch (status) {
    case MarketStatus.CREATED:
      return "Created";
    case MarketStatus.ACTIVE:
      return "Active";
    case MarketStatus.PAUSED:
      return "Paused";
    default:
      return "Unknown";
  }
};

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

export default function MarketList() {
  const { getAllMarkets, isCreating, isLoading, error } = useKuriFactory();
  const [markets, setMarkets] = useState<KuriMarket[]>([]);
  const [inLaunchMarkets, setInLaunchMarkets] = useState<KuriMarket[]>([]);
  const [activeMarkets, setActiveMarkets] = useState<KuriMarket[]>([]);
  const [completedMarkets, setCompletedMarkets] = useState<KuriMarket[]>([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const fetchedMarkets = await getAllMarkets();
        setMarkets(fetchedMarkets);
      } catch (err) {
        console.error("Error fetching markets:", err);
      }
    };

    fetchMarkets();
  }, [getAllMarkets]);

  useEffect(() => {
    if (markets) {
      const inLaunch = markets.filter((market) => market.state === 0); // INLAUNCH
      const active = markets.filter((market) => market.state === 2); // ACTIVE
      const completed = markets.filter((market) => market.state === 3); // COMPLETED
      setInLaunchMarkets(inLaunch);
      setActiveMarkets(active);
      setCompletedMarkets(completed);
    }
  }, [markets]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div>Error loading markets: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4">Welcome to Kuri</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Join a trusted community of savers and achieve your financial goals
          together
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="px-6 py-2 text-sm bg-[#8B6F47] text-white hover:bg-[#725A3A] rounded-full">
              Start a Circle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Circle</DialogTitle>
            </DialogHeader>
            <CreateMarketForm />
          </DialogContent>
        </Dialog>
      </section>

      {/* CTA Section */}
      <section className="bg-[#FEF6F0]/50 p-12 rounded-2xl mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-semibold text-[#8B6F47] mb-8">
            Ready to Start Your Financial Journey?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto mb-8">
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/50">
              <div className="w-12 h-12 rounded-full bg-[#8B6F47]/10 flex items-center justify-center">
                <img src="/target.svg" alt="Target" className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-[#8B6F47]">
                Set financial goals
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/50">
              <div className="w-12 h-12 rounded-full bg-[#8B6F47]/10 flex items-center justify-center">
                <img src="/handshake.svg" alt="Handshake" className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-[#8B6F47]">
                Build trust & community
              </span>
            </div>
            <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/50">
              <div className="w-12 h-12 rounded-full bg-[#8B6F47]/10 flex items-center justify-center">
                <img src="/lock.svg" alt="Lock" className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-[#8B6F47]">
                Secure your savings
              </span>
            </div>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="px-8 py-3 text-base bg-[#8B6F47] text-white hover:bg-[#725A3A] rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
                Start Your Journey Now
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Circle</DialogTitle>
              </DialogHeader>
              <CreateMarketForm />
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* In Launch Markets */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-[#8B6F47]">
            Launching Circles
          </h2>
          <p className="text-muted-foreground mt-2">
            Circles that are getting ready to start their journey
          </p>
        </div>
        {inLaunchMarkets.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-xl">
            <p className="text-muted-foreground">No circles in launch phase</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {inLaunchMarkets.map((market, index) => (
              <MarketCard key={market.address} market={market} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Active Markets */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-[#8B6F47]">
            Active Circles
          </h2>
          <p className="text-muted-foreground mt-2">
            Currently active circles accepting deposits
          </p>
        </div>
        {activeMarkets.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-xl">
            <p className="text-muted-foreground">No active circles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {activeMarkets.map((market, index) => (
              <MarketCard key={market.address} market={market} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Markets */}
      <section className="mb-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-semibold text-[#8B6F47]">
            Completed Circles
          </h2>
          <p className="text-muted-foreground mt-2">
            Circles that have completed their saving journey
          </p>
        </div>
        {completedMarkets.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-xl">
            <p className="text-muted-foreground">No completed circles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {completedMarkets.map((market, index) => (
              <MarketCard key={market.address} market={market} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
