import { useAccount } from "wagmi";
import { useKuriMarkets } from "../../hooks/useKuriMarkets";
import { motion } from "framer-motion";
import { formatEther } from "viem";
import { useUserActivity } from "../../hooks/useUserActivity";
import { ArrowUpIcon, ArrowDownIcon, UserPlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

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
  const { address } = useAccount();
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

      // Fetch metadata for each market using ilike for case-insensitive matching
      const promises = Array.from(marketAddresses).map((address) =>
        supabase
          .from("kuri_web")
          .select("*")
          .ilike("market_address", address)
          .single()
      );
      console.log("Promises to fetch metadata:", promises);

      const results = await Promise.all(promises);

      const metadataMap: Record<string, MarketMetadata> = {};
      results.forEach((result, index) => {
        if (!result.error && result.data) {
          const address = Array.from(marketAddresses)[index];
          metadataMap[address] = result.data;
          console.log("Stored metadata for:", address, result.data);
        }
      });

      setMarketMetadata(metadataMap);
    };

    fetchMetadata();
  }, [activity]);

  if (loading) {
    return (
      <div className="space-y-2 xs:space-y-3 md:space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 animate-pulse backdrop-blur-sm rounded-xl 
              p-3 xs:p-4 md:p-6 border border-white/10 
              h-[70px] xs:h-[80px] md:h-[100px]"
          >
            <div className="flex items-center gap-2 xs:gap-3 md:gap-4">
              <div
                className="h-8 w-8 xs:h-9 xs:w-9 md:h-10 md:w-10 
                rounded-full bg-white/10 flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="h-3 xs:h-4 md:h-5 w-1/3 bg-white/10 rounded mb-2" />
                <div className="h-2 xs:h-3 md:h-4 w-1/2 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ))}
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
      <div className="text-center py-6 sm:py-8 md:py-12">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
          No Activity Yet
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
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
    <div className="space-y-2 xs:space-y-3 md:space-y-4">
      {allActivities.map((item, index) => (
        <motion.div
          key={`${item.type}-${item.marketId}-${item.timestamp}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="group bg-white/5 backdrop-blur-sm rounded-xl 
            p-3 xs:p-4 md:p-6 border border-white/10 
            hover:border-gold/20 transition-all hover-lift"
        >
          <div className="flex items-center gap-2 xs:gap-3 md:gap-4">
            {item.type === "deposit" ? (
              <div
                className="h-8 w-8 xs:h-9 xs:w-9 md:h-10 md:w-10 
                rounded-full bg-green-500/10 flex items-center justify-center 
                flex-shrink-0"
              >
                <ArrowUpIcon className="h-3 w-3 xs:h-4 xs:w-4 md:h-5 md:w-5 text-green-500" />
              </div>
            ) : item.type === "claim" ? (
              <div
                className="h-8 w-8 xs:h-9 xs:w-9 md:h-10 md:w-10 
                rounded-full bg-blue-500/10 flex items-center justify-center 
                flex-shrink-0"
              >
                <ArrowDownIcon className="h-3 w-3 xs:h-4 xs:w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
            ) : (
              <div
                className="h-8 w-8 xs:h-9 xs:w-9 md:h-10 md:w-10 
                rounded-full bg-purple-500/10 flex items-center justify-center 
                flex-shrink-0"
              >
                <UserPlusIcon className="h-3 w-3 xs:h-4 xs:w-4 md:h-5 md:w-5 text-purple-500" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1 md:mb-2 gap-2">
                <h3 className="text-xs xs:text-sm md:text-base font-medium line-clamp-1 flex-1">
                  {item.type === "deposit"
                    ? "Deposited to"
                    : item.type === "claim"
                    ? "Claimed from"
                    : "Joined"}{" "}
                  {getMarketName(item.marketId)}
                </h3>
                <span className="text-xs md:text-sm text-muted-foreground flex-shrink-0">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>
              {item.amount !== undefined && item.amount > 0n && (
                <p className="text-xs md:text-sm text-muted-foreground truncate">
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
