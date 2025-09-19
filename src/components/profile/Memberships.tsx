import { useState, useEffect } from "react";
import { useKuriMarkets } from "../../hooks/useKuriMarkets";
import { useAuthContext } from "../../contexts/AuthContext";
import { readContract } from "@wagmi/core";
import { config } from "../../config/wagmi";
import { KuriCoreABI } from "../../contracts/abis/KuriCoreV1";
import { getDefaultChainId } from "../../config/contracts";
import { MarketProvider } from "../../contexts/MarketContext";
import { MarketCard } from "../markets/MarketCard";

export function Memberships() {
  const { smartAddress: address } = useAuthContext();
  const { markets, loading } = useKuriMarkets();

  const [memberMarkets, setMemberMarkets] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Use environment-configured chain (mainnet/testnet)
  const chainId = getDefaultChainId();

  useEffect(() => {
    async function fetchMembershipStatus() {
      if (!markets || !address) {
        setLoadingStatus(false);
        return;
      }

      setMemberMarkets([]);
      setLoadingStatus(true);

      // Filter for only ACTIVE markets (state === 2) before checking membership
      const activeMarkets = markets.filter((market) => market.state === 2);

      const membershipPromises = activeMarkets.map(async (market) => {
        try {
          // Call the contract directly instead of using useKuriCore
          const userData = await readContract(config, {
            address: market.address as `0x${string}`,
            abi: KuriCoreABI,
            functionName: "userToData",
            args: [address as `0x${string}`],
            chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
          });

          const memberStatus = (userData as any)[0];
          return memberStatus === 1 ? market : null; // 1 = ACCEPTED
        } catch (error) {
          console.error(
            "Error fetching member status for market:",
            market.address,
            error
          );
          return null;
        }
      });

      const membershipResults = await Promise.all(membershipPromises);
      setMemberMarkets(membershipResults.filter(Boolean));
      setLoadingStatus(false);
    }

    fetchMembershipStatus();
  }, [markets, address]);

  if (loading || loadingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (memberMarkets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 flex-1">
        <span className="material-icons text-6xl text-gray-300 mb-4">
          group
        </span>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          No Circle Memberships
        </h2>
        <p className="text-muted-foreground max-w-xs">
          Join a circle to see your memberships here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {memberMarkets.map((market, index) => (
        <MarketProvider key={market.address} marketAddress={market.address}>
          <MarketCard
            market={market}
            index={index}
          />
        </MarketProvider>
      ))}
    </div>
  );
}
