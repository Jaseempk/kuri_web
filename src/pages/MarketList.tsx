import { useState } from "react";
import { motion } from "framer-motion";
import { useKuriMarkets } from "../hooks/useKuriMarkets";
import { KuriState, IntervalType } from "../graphql/types";
import { formatEther } from "viem";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Search, Filter, Plus, TrendingUp, Users, Clock } from "lucide-react";
import { LoadingSkeleton } from "../components/ui/loading-states";

const intervalTypeToString = (type: IntervalType): string => {
  switch (type) {
    case IntervalType.DAILY:
      return "Daily";
    case IntervalType.WEEKLY:
      return "Weekly";
    case IntervalType.BIWEEKLY:
      return "Bi-weekly";
    case IntervalType.MONTHLY:
      return "Monthly";
    default:
      return "Unknown";
  }
};

const stateToString = (state: KuriState): string => {
  switch (state) {
    case KuriState.UNINITIALIZED:
      return "Uninitialized";
    case KuriState.INITIALIZED:
      return "Initialized";
    case KuriState.ACTIVE:
      return "Active";
    case KuriState.COMPLETED:
      return "Completed";
    case KuriState.FAILED:
      return "Failed";
    default:
      return "Unknown";
  }
};

const marketCategories = [
  {
    title: "Popular Markets",
    description: "Join the most active saving circles",
    icon: TrendingUp,
    filter: (market: any) => market.state === KuriState.ACTIVE,
  },
  {
    title: "New Markets",
    description: "Be among the first to join",
    icon: Plus,
    filter: (market: any) => market.state === KuriState.INITIALIZED,
  },
  {
    title: "High Capacity",
    description: "Markets with larger participant pools",
    icon: Users,
    filter: (market: any) => market.totalParticipants > 10,
  },
];

export default function MarketList() {
  const { markets, loading, error } = useKuriMarkets();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <p>Error loading markets: {error.message}</p>
      </div>
    );

  const filteredMarkets = markets?.filter((market) => {
    if (searchQuery) {
      return market.creator.toLowerCase().includes(searchQuery.toLowerCase());
    }
    if (selectedCategory) {
      const category = marketCategories.find(
        (c) => c.title === selectedCategory
      );
      return category?.filter(market);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Discover Active Saving Circles
            </h1>
            <p className="text-lg md:text-xl mb-8 text-blue-100">
              Join trusted communities, save together, and achieve your
              financial goals
            </p>
            <Button
              onClick={() => setCreateModalOpen(true)}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create New Market
            </Button>
          </motion.div>
        </div>

        {/* Search and Filter Bar */}
        <div className="container mx-auto px-4 mt-12">
          <div className="bg-white rounded-lg shadow-lg p-4 flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search markets..."
                className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button variant="outline" className="gap-2">
                <Clock className="w-4 h-4" />
                {intervalTypeToString(IntervalType.MONTHLY)}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Market Categories */}
      <section className="py-12 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {marketCategories.map((category) => (
            <Card
              key={category.title}
              className={`p-6 cursor-pointer transition-all ${
                selectedCategory === category.title
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "hover:shadow-md"
              }`}
              onClick={() =>
                setSelectedCategory(
                  selectedCategory === category.title ? null : category.title
                )
              }
            >
              <category.icon className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
              <p className="text-gray-600">{category.description}</p>
            </Card>
          ))}
        </div>

        {/* Market Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(6)
              .fill(0)
              .map((_, i) => (
                <LoadingSkeleton key={i} className="h-[300px] rounded-lg" />
              ))
          ) : filteredMarkets?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">
                No markets found matching your criteria
              </p>
            </div>
          ) : (
            filteredMarkets?.map((market) => (
              <motion.div
                key={market.address}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-semibold mb-2">
                          {intervalTypeToString(market.intervalType)} Kuri
                        </h2>
                        <p className="text-sm text-gray-600">
                          Created by: {market.creator}
                        </p>
                      </div>
                      <Badge
                        variant={
                          market.state === KuriState.ACTIVE
                            ? "success"
                            : market.state === KuriState.FAILED
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {stateToString(market.state)}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium">
                          {formatEther(BigInt(market.kuriAmount))} ETH
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Participants</span>
                        <span className="font-medium">
                          {market.activeParticipants}/{market.totalParticipants}
                        </span>
                      </div>
                      <div className="relative pt-4">
                        <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-100">
                          <div
                            style={{
                              width: `${
                                (market.activeParticipants /
                                  market.totalParticipants) *
                                100
                              }%`,
                            }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() =>
                        (window.location.href = `/markets/${market.address}`)
                      }
                      className="w-full mt-6"
                      variant="outline"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* Create Market Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Market</DialogTitle>
          </DialogHeader>
          {/* Create Market form will go here */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
