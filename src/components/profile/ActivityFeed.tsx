import { useKuriMarkets } from "../../hooks/useKuriMarkets";
import { motion } from "framer-motion";
import { formatEther } from "viem";
import { useUserActivity } from "../../hooks/useUserActivity";
import { useSmartWallet } from "../../hooks/useSmartWallet";
import { ArrowUpIcon, ArrowDownIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { apiClient } from "../../lib/apiClient";

interface MarketMetadata {
  id: number;
  market_address: string;
  short_description: string;
  created_at: string;
}

type Activity = {
  type: "deposit" | "claim" | "join";
  marketId: string;
  timestamp: string;
  amount?: bigint;
};

export function ActivityFeed() {
  const { smartAddress: address } = useSmartWallet();
  const { activity, loading } = useUserActivity(address || "");
  const { markets } = useKuriMarkets();
  const [marketMetadata, setMarketMetadata] = useState<
    Record<string, MarketMetadata>
  >({});

  // Fetch metadata for markets that appear in activities
  useEffect(() => {
    const fetchMetadata = async () => {
      if (!activity) return;

      // Get unique market addresses from activities
      const marketAddresses = new Set([
        ...(activity.deposits?.map((d) => d.marketId.toLowerCase()) || []),
        ...(activity.claims?.map((c) => c.marketId.toLowerCase()) || []),
        ...(activity.memberships?.map((m) => m.marketId.toLowerCase()) || []),
      ]);

      console.log("Market addresses to fetch:", Array.from(marketAddresses));

      // Fetch metadata for all market addresses in one efficient batch call
      const metadataArray = await apiClient.getBulkMarketMetadata(Array.from(marketAddresses));
      console.log("Fetched metadata for", metadataArray.length, "markets");

      const metadataMap: Record<string, MarketMetadata> = {};
      metadataArray.forEach((metadata) => {
        const address = metadata.market_address.toLowerCase();
        metadataMap[address] = metadata;
        console.log("Stored metadata for:", address, metadata);
      });

      setMarketMetadata(metadataMap);
    };

    fetchMetadata();
  }, [activity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const allActivities: Activity[] = [
    ...(activity?.deposits?.map((deposit) => ({
      type: "deposit" as const,
      marketId: deposit.marketId,
      timestamp: deposit.timestamp,
      amount: BigInt(deposit.amount),
    })) || []),
    ...(activity?.claims?.map((claim) => ({
      type: "claim" as const,
      marketId: claim.marketId,
      timestamp: claim.timestamp,
      amount: BigInt(claim.amount),
    })) || []),
    ...(activity?.memberships?.map((membership) => ({
      type: "join" as const,
      marketId: membership.marketId,
      timestamp: membership.timestamp,
    })) || []),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (allActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 flex-1">
        <span className="material-icons text-6xl text-gray-300 mb-4">
          timeline
        </span>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Activity Yet
        </h2>
        <p className="text-muted-foreground max-w-xs">
          Your circle activity will appear here.
        </p>
      </div>
    );
  }

  const getMarketName = (marketId: string) => {
    // Ensure we're using lowercase for comparison
    const normalizedMarketId = marketId.toLowerCase();
    const metadata = marketMetadata[normalizedMarketId];

    console.log("Looking up metadata for:", normalizedMarketId, metadata);

    if (metadata?.short_description) {
      return metadata.short_description;
    }

    const market = markets?.find(
      (m) => m.address.toLowerCase() === normalizedMarketId
    );
    return market?.name || "Unknown Circle";
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      // Handle both ISO string and Unix timestamp formats
      const date = timestamp.includes("T")
        ? new Date(timestamp)
        : new Date(parseInt(timestamp) * 1000);

      if (isNaN(date.getTime())) {
        console.error("Invalid timestamp:", timestamp);
        return "Date unavailable";
      }

      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Date unavailable";
    }
  };

  const formatAmount = (amount: bigint) => {
    return `${formatEther(amount)} ETH`;
  };

  return (
    <div className="space-y-4">
      {allActivities.map((item, index) => (
        <motion.div
          key={`${item.type}-${item.marketId}-${item.timestamp}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            {item.type === "deposit" ? (
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <ArrowUpIcon className="h-5 w-5 text-green-500" />
              </div>
            ) : item.type === "claim" ? (
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <ArrowDownIcon className="h-5 w-5 text-blue-500" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <UserPlusIcon className="h-5 w-5 text-purple-500" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 gap-2">
                <h3 className="text-base font-medium line-clamp-1 flex-1 text-foreground">
                  {item.type === "deposit"
                    ? "Deposited to"
                    : item.type === "claim"
                    ? "Claimed from"
                    : "Joined"}{" "}
                  {getMarketName(item.marketId)}
                </h3>
                <span className="text-sm text-muted-foreground flex-shrink-0">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
              {item.amount !== undefined && item.amount > 0n && (
                <p className="text-sm text-muted-foreground truncate">
                  Amount: {formatAmount(item.amount)}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
