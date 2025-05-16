import { useAccount } from "wagmi";
import { useKuriMarkets } from "../../hooks/useKuriMarkets";
import { ManageMembersDialog } from "../markets/ManageMembersDialog";
import { motion } from "framer-motion";
import { Badge } from "../ui/badge";
import { formatEther } from "viem";

export function MyCircles() {
  const { address } = useAccount();
  const { markets, loading } = useKuriMarkets();

  const myMarkets = markets?.filter(
    (market) => market.creator.toLowerCase() === address?.toLowerCase()
  );

  if (loading) {
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

  if (!myMarkets?.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Circles Created Yet</h3>
        <p className="text-muted-foreground">
          Start by creating your first circle in the Markets page.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {myMarkets.map((market, index) => (
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
                Circle #{market.address.slice(0, 6)}...
                {market.address.slice(-4)}
              </p>
            </div>
            <Badge
              variant="outline"
              className="bg-gold/10 text-gold border-gold/20"
            >
              Creator
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">
                Contribution Amount
              </p>
              <p className="text-lg font-semibold">
                {market.kuriAmount
                  ? formatEther(BigInt(market.kuriAmount))
                  : "0"}{" "}
                ETH
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Members</p>
              <p className="text-lg font-semibold">
                {market.activeParticipants}/{market.totalParticipants}
              </p>
            </div>
          </div>

          <ManageMembersDialog market={market} />
        </motion.div>
      ))}
    </div>
  );
}
