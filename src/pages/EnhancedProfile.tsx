import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import {
  Tabs,
  TabsContent,
} from "../components/ui/tabs";
import { useUserActivity } from "../hooks/useUserActivity";
import { LoadingSkeleton } from "../components/ui/loading-states";
import { useAuthContext } from "../contexts/AuthContext";
import { useKuriMarkets } from "../hooks/useKuriMarkets";
import { MarketCard } from "../components/markets/MarketCard";
import { MarketProvider } from "../contexts/MarketContext";
import { Memberships } from "../components/profile/Memberships";
import { PendingRequests } from "../components/profile/PendingRequests";
import { ActivityFeed } from "../components/profile/ActivityFeed";
import { NotificationSettings } from "../components/notifications/NotificationSettings";
import { ProfileHeaderSection } from "../components/profile/ProfileHeaderSection";
import { StatsSection } from "../components/profile/StatsSection";
import { SidebarTabsList } from "../components/profile/SidebarTabsList";
import { ContentPanel, EmptyState } from "../components/profile/ContentPanel";
import { USDCBalanceSection } from "../components/profile/USDCBalanceSection";

// Market sections for My Circles tab (reusing MarketList logic)
const myCirclesSections = [
  {
    title: "Launching Circles",
    description: "Recently created circles pending activation",
    filter: (market: any) => {
      // Only show circles that are in launch state AND still within launch period
      if (market.state !== 0) return false; // Must be in INLAUNCH state
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const launchPeriodEnded = Number(market.launchPeriod) < currentTimestamp;
      
      return !launchPeriodEnded; // Only show if launch period hasn't ended
    },
    value: "launching",
  },
  {
    title: "Active Circles",
    description: "Currently active circles accepting deposits", 
    filter: (market: any) => market.state === 2, // KuriState.ACTIVE
    value: "active",
  },
];

export default function EnhancedProfile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { smartAddress: address, profile, isLoading, account } = useAuthContext();
  const { activity } = useUserActivity(identifier || "");
  const { markets, loading: marketsLoading } = useKuriMarkets();
  
  // Tab state for My Circles (reusing MarketList pattern)
  const [userSelectedMyCirclesTab, setUserSelectedMyCirclesTab] = useState<string | null>(null);

  // Filter user's markets (reusing MarketList filtering logic)
  const userMarkets = useMemo(() => {
    return markets?.filter((market) => 
      market.creator.toLowerCase() === address?.toLowerCase()
    ) || [];
  }, [markets, address]);

  // Compute default tab for My Circles based on available markets (reusing MarketList logic)
  const defaultMyCirclesTab = useMemo(() => {
    if (!userMarkets.length) return "launching";

    const launchingMarkets = userMarkets.filter((m) => m.state === 0);
    const activeMarkets = userMarkets.filter((m) => m.state === 2);

    if (launchingMarkets.length > 0) return "launching";
    if (activeMarkets.length > 0) return "active";
    return "launching";
  }, [userMarkets]);

  // Use user selection if available, otherwise use computed default
  const activeMyCirclesTab = userSelectedMyCirclesTab || defaultMyCirclesTab;

  useEffect(() => {
    if (!identifier) {
      navigate("/me", { replace: true });
      return;
    }
    window.scrollTo(0, 0);
  }, [identifier, navigate]);

  if (isLoading) return <LoadingSkeleton />;

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">
          Profile Not Found
        </h2>
        <p className="text-muted-foreground mb-6 text-center">
          The requested profile could not be found.
        </p>
      </div>
    );
  }

  const isOwnProfile =
    address?.toLowerCase() === identifier?.toLowerCase() ||
    profile.username === identifier;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <ProfileHeaderSection 
          profile={profile} 
          totalCircles={activity?.memberships?.length || 0}
        />
        
        {/* Stats Section (Desktop only) */}
        <StatsSection 
          profile={profile} 
          totalCircles={activity?.memberships?.length || 0}
        />

        {/* USDC Balance Section (Mobile/Tablet only) */}
        <USDCBalanceSection />

        {/* Content Section */}
        {isOwnProfile && (
          <div className="mt-6 md:mt-8 md:px-4">
            <Tabs defaultValue="my-circles" className="flex flex-col lg:flex-row gap-6 md:gap-8">
              {/* Sidebar Navigation */}
              <SidebarTabsList />
              
              {/* Content Panel */}
              <ContentPanel>
                <TabsContent value="my-circles">
                  {marketsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : userMarkets.length === 0 ? (
                    <EmptyState
                      icon="group_work"
                      title="No Circles Created Yet"
                      description="Start by creating your first circle in the Markets page."
                      actionLabel="Create a Circle"
                      onAction={() => navigate("/markets")}
                    />
                  ) : (
                    <div className="space-y-6">
                      {/* Tab Navigation (reusing MarketList tab system with mobile responsiveness) */}
                      <div className="-mx-2 px-2 mb-6 flex justify-center">
                        <div className="bg-white/80 backdrop-blur-sm border border-[#E8DED1]/50 p-1 md:p-1.5 rounded-xl w-fit shadow-sm flex gap-0.5 md:gap-1">
                          {myCirclesSections.map(({ title, value, filter }) => {
                            const sectionMarkets = userMarkets.filter(filter);
                            const isActive = activeMyCirclesTab === value;
                            return (
                              <button
                                key={value}
                                onClick={() => {
                                  if (activeMyCirclesTab !== value) {
                                    setUserSelectedMyCirclesTab(value);
                                  }
                                }}
                                className={`${
                                  isActive
                                    ? "bg-[hsl(var(--primary))] text-white shadow-md"
                                    : "text-gray-700 hover:bg-[hsl(var(--primary))]/10 hover:shadow-sm bg-transparent"
                                } rounded-lg transition-all duration-300 text-xs px-2 py-1.5 md:text-sm md:px-4 md:py-2.5 flex-shrink-0 border-0 font-medium relative group`}
                              >
                                <span className="relative z-10 flex items-center gap-1 md:gap-1.5">
                                  {title}
                                  <span
                                    className={`hidden md:inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 py-0.5 text-xs font-bold rounded-full transition-all duration-300 ${
                                      isActive
                                        ? "bg-white/20 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {sectionMarkets.length}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Tab Content (reusing MarketList content structure) */}
                      {myCirclesSections.map(({ title, filter, value }) => {
                        const sectionMarkets = userMarkets.filter(filter);
                        const isActive = activeMyCirclesTab === value;

                        return (
                          <div key={value} className={isActive ? "block" : "hidden"}>
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {sectionMarkets.length === 0 ? (
                                <div className="text-center py-12">
                                  <div className="text-muted-foreground text-lg mb-2">
                                    No {title.toLowerCase()} found
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {value === "launching" &&
                                      "No circles are currently in launch"}
                                    {value === "active" &&
                                      "No circles are currently active"}
                                  </p>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {sectionMarkets.map((market, index) => (
                                    <MarketProvider key={market.address} marketAddress={market.address}>
                                      <MarketCard
                                        market={market}
                                        index={index}
                                      />
                                    </MarketProvider>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="memberships">
                  <Memberships />
                </TabsContent>

                <TabsContent value="pending">
                  <PendingRequests />
                </TabsContent>

                <TabsContent value="activity">
                  <ActivityFeed />
                </TabsContent>

                <TabsContent value="notifications">
                  <NotificationSettings />
                </TabsContent>
              </ContentPanel>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}
