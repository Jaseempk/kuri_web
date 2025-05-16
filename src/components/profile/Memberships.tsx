import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useKuriMarkets } from "../../hooks/useKuriMarkets";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { formatEther } from "viem";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";

export function Memberships() {
  const { address } = useAccount();
  const { markets, loading } = useKuriMarkets();
  const { getMemberStatus } = useKuriCore();

  const [memberMarkets, setMemberMarkets] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    async function fetchMembershipStatus() {
      if (!markets || !address) return;

      const membershipPromises = markets.map(async (market) => {
        try {
          const status = await getMemberStatus(market.address as `0x${string}`);
          return status === 1 ? market : null; // 1 = ACCEPTED
        } catch (error) {
          console.error("Error fetching member status:", error);
          return null;
        }
      });

      const membershipResults = await Promise.all(membershipPromises);
      setMemberMarkets(membershipResults.filter(Boolean));
      setLoadingStatus(false);
    }

    fetchMembershipStatus();
  }, [markets, address, getMemberStatus]);

  if (loading || loadingStatus) {
    return (
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 md:gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 animate-pulse backdrop-blur-sm rounded-xl 
              p-3 xs:p-4 md:p-6 border border-white/10 
              h-[180px] xs:h-[200px] md:h-[250px]"
          >
            <div className="h-4 xs:h-5 md:h-6 w-3/4 bg-white/10 rounded mb-2 xs:mb-3 md:mb-4" />
            <div className="h-3 xs:h-3.5 md:h-4 w-1/2 bg-white/10 rounded mb-2" />
            <div className="h-3 xs:h-3.5 md:h-4 w-1/3 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (memberMarkets.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 md:py-12">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
          No Circle Memberships
        </h3>
        <p className="text-sm md:text-base text-muted-foreground">
          Join a circle to see your memberships here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 md:gap-6">
      {memberMarkets.map((market, index) => (
        <motion.div
          key={market.address}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="group bg-white/5 backdrop-blur-sm rounded-xl 
            p-3 xs:p-4 md:p-6 border border-white/10 
            hover:border-gold/20 transition-all hover-lift"
        >
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-2 xs:mb-3 md:mb-4">
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm xs:text-base md:text-lg font-semibold 
                  mb-1 md:mb-2 line-clamp-1"
                >
                  {market.name}
                </h3>
                <p
                  className="text-xs md:text-sm text-muted-foreground 
                  line-clamp-1 break-all"
                >
                  Created by {market.creator}
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-xs md:text-sm ml-2 flex-shrink-0"
              >
                Member
              </Badge>
            </div>

            <div className="mt-auto grid grid-cols-2 gap-2 md:gap-3">
              <div className="bg-white/5 rounded-lg p-2 xs:p-3">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  Deposit
                </p>
                <p className="text-xs xs:text-sm md:text-base font-medium">
                  {formatEther(market.depositAmount)} ETH
                </p>
              </div>
              <div className="bg-white/5 rounded-lg p-2 xs:p-3">
                <p className="text-xs md:text-sm text-muted-foreground mb-1">
                  Members
                </p>
                <p className="text-xs xs:text-sm md:text-base font-medium">
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
