import { useAccount } from "wagmi";
import { useKuriMarkets } from "../../hooks/useKuriMarkets";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { formatEther } from "viem";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { useState, useEffect } from "react";

export function PendingRequests() {
  const { address } = useAccount();
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
          return status === 4 ? market : null; // 4 = APPLIED/PENDING
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 animate-pulse backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="h-6 w-3/4 bg-white/10 rounded mb-4" />
            <div className="h-4 w-1/2 bg-white/10 rounded mb-2" />
            <div className="h-4 w-1/3 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!pendingMarkets.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
        <p className="text-muted-foreground">
          Your membership requests will appear here once you apply to join
          circles.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pendingMarkets.map((market, index) => (
        <motion.div
          key={market.address}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-gold/20 transition-all hover-lift"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-1">{market.name}</h3>
              <p className="text-sm text-muted-foreground">
                Created by {market.creator.slice(0, 6)}...
                {market.creator.slice(-4)}
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-gold/10 text-gold border-gold/20"
            >
              Pending
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Deposit Amount</p>
              <p className="text-lg font-semibold">
                {formatEther(BigInt(market.depositAmount))} ETH
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Members</p>
              <p className="text-lg font-semibold">{market.memberCount || 0}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
