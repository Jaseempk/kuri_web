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

const INTERVAL_TYPE = {
  WEEKLY: 0 as IntervalType,
  MONTHLY: 1 as IntervalType,
} as const;

interface Market {
  id: string;
  name: string;
  symbol: string;
  creator: string;
  address: string;
  isComplete: boolean;
  kuriAmount: string;
  participantCount: number;
  intervalType: IntervalType;
  totalContributions: string;
  nextContributionDue: number;
  currentRound: number;
  maxParticipants: number;
  totalSupply: string;
  memberCount: number;
  status: MarketStatus;
  createdAt: string;
  updatedAt: string;
}

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
    filter: (market: Market) => market.status === MarketStatus.ACTIVE,
  },
  {
    title: "Created Markets",
    description: "Recently created markets pending activation",
    filter: (market: Market) => market.status === MarketStatus.CREATED,
  },
  {
    title: "Paused Markets",
    description: "Markets that are temporarily paused",
    filter: (market: Market) => market.status === MarketStatus.PAUSED,
  },
];

export default function MarketList() {
  const { getAllMarkets, isCreating } = useKuriFactory();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([]);
  const [completedMarkets, setCompletedMarkets] = useState<Market[]>([]);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setIsLoading(true);
        const fetchedMarkets = await getAllMarkets();
        setMarkets(fetchedMarkets as Market[]);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarkets();
  }, [getAllMarkets]);

  useEffect(() => {
    if (markets) {
      const active = markets.filter((market: Market) => !market.isComplete);
      const completed = markets.filter((market: Market) => market.isComplete);
      setActiveMarkets(active);
      setCompletedMarkets(completed);
    }
  }, [markets]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <div>Error loading markets</div>;
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
      <section className="bg-[#FEF6F0]/50 p-6 rounded-xl mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-[1fr,auto] gap-6 items-center">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-[#8B6F47]">
                Ready to Start Your Financial Journey?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <img src="/target.svg" alt="Target" className="w-5 h-5" />
                  <span className="text-sm">Set financial goals</span>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src="/handshake.svg"
                    alt="Handshake"
                    className="w-5 h-5"
                  />
                  <span className="text-sm">Build trust & community</span>
                </div>
                <div className="flex items-center gap-2">
                  <img src="/lock.svg" alt="Lock" className="w-5 h-5" />
                  <span className="text-sm">Secure your savings</span>
                </div>
              </div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="px-6 py-2 text-sm bg-[#8B6F47] text-white hover:bg-[#725A3A] rounded-full">
                  Create a Circle
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
        </div>
      </section>

      {/* Active Markets */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Active Circles</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                New Circle
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
        {activeMarkets.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-muted-foreground">No active circles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeMarkets.map((market) => (
              <MarketCard key={market.address} market={market} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Markets */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Completed Circles</h2>
        {completedMarkets.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg">
            <p className="text-muted-foreground">No completed circles found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedMarkets.map((market) => (
              <MarketCard key={market.address} market={market} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
