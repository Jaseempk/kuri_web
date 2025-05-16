import { useAccount } from "wagmi";
import { useUserActivity } from "../../hooks/useUserActivity";
import { motion } from "framer-motion";
import { formatEther } from "viem";
import { ArrowUpIcon, ArrowDownIcon, UserPlusIcon } from "lucide-react";

type Activity = {
  type: "deposit" | "claim" | "membership";
  marketId: string;
  timestamp: string;
  amount?: string;
};

export function ActivityFeed() {
  const { address } = useAccount();
  const { activity, loading } = useUserActivity(address || "");

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 animate-pulse backdrop-blur-sm rounded-xl p-6 border border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-white/10" />
              <div>
                <div className="h-4 w-48 bg-white/10 rounded mb-2" />
                <div className="h-3 w-32 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const allActivities: Activity[] = [
    ...activity.deposits.map((deposit) => ({
      type: "deposit" as const,
      marketId: deposit.marketId,
      amount: deposit.amount,
      timestamp: deposit.timestamp,
    })),
    ...activity.claims.map((claim) => ({
      type: "claim" as const,
      marketId: claim.marketId,
      amount: claim.amount,
      timestamp: claim.timestamp,
    })),
    ...activity.memberships.map((membership) => ({
      type: "membership" as const,
      marketId: membership.marketId,
      timestamp: membership.timestamp,
    })),
  ].sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  if (!allActivities.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
        <p className="text-muted-foreground">
          Your circle activity will appear here once you start participating.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {allActivities.map((item, index) => (
        <motion.div
          key={`${item.type}-${item.marketId}-${item.timestamp}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-gold/20 transition-all hover-lift"
        >
          <div className="flex items-center gap-4">
            {item.type === "deposit" ? (
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <ArrowUpIcon className="text-green-500" />
              </div>
            ) : item.type === "claim" ? (
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ArrowDownIcon className="text-blue-500" />
              </div>
            ) : (
              <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center">
                <UserPlusIcon className="text-gold" />
              </div>
            )}

            <div>
              <h4 className="font-medium">
                {item.type === "deposit"
                  ? "Deposited to Circle"
                  : item.type === "claim"
                  ? "Claimed from Circle"
                  : "Joined Circle"}
              </h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Circle {item.marketId.slice(0, 6)}...{item.marketId.slice(-4)}
                </span>
                {(item.type === "deposit" || item.type === "claim") &&
                  item.amount && (
                    <>
                      <span>•</span>
                      <span>{formatEther(BigInt(item.amount))} ETH</span>
                    </>
                  )}
                <span>•</span>
                <span>
                  {new Date(Number(item.timestamp) * 1000).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
