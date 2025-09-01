import { useState, useEffect } from "react";
import { useKuriMarkets } from "../../hooks/useKuriMarkets";
import { useOptimizedAuth } from "../../hooks/useOptimizedAuth";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { formatEther } from "viem";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";

export function PendingRequests() {
  const { smartAddress: address } = useOptimizedAuth();
  const { markets, loading } = useKuriMarkets();
  const { getMemberStatus } = useKuriCore();

  const [pendingMarkets, setPendingMarkets] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    async function fetchPendingStatus() {
      if (!markets || !address) return;

      const pendingPromises = markets.map(async (market) => {
        try {
          const status = await getMemberStatus(market.address as `0x${string}`);
          return status === 0 ? market : null; // 0 = PENDING
        } catch (error) {
          console.error("Error fetching member status:", error);
          return null;
        }
      });

      const pendingResults = await Promise.all(pendingPromises);
      setPendingMarkets(pendingResults.filter(Boolean));
      setLoadingStatus(false);
    }

    fetchPendingStatus();
  }, [markets, address, getMemberStatus]);

  if (loading || loadingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (pendingMarkets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 flex-1">
        <span className="material-icons text-6xl text-gray-300 mb-4">
          hourglass_top
        </span>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Pending Requests
        </h2>
        <p className="text-muted-foreground max-w-xs">
          You don't have any pending circle membership requests.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pendingMarkets.map((market, index) => (
        <motion.div
          key={market.address}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-2 line-clamp-1 text-foreground">
                  {market.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  Created by {market.creator}
                </p>
              </div>
              <Badge variant="outline" className="text-xs md:text-sm">
                Pending
              </Badge>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">
                  Deposit
                </p>
                <p className="text-base font-medium text-foreground">
                  {formatEther(market.depositAmount)} ETH
                </p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">
                  Members
                </p>
                <p className="text-base font-medium text-foreground">
                  {market.totalMembers}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
