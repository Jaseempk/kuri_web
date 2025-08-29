import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
} from "../components/ui/tabs";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUserActivity } from "../hooks/useUserActivity";
import { LoadingSkeleton } from "../components/ui/loading-states";
import { useAccount } from "@getpara/react-sdk";
import { useSmartWallet } from "../hooks/useSmartWallet";
import { useKuriMarkets } from "../hooks/useKuriMarkets";
import { MarketCard } from "../components/markets/MarketCard";
import { Memberships } from "../components/profile/Memberships";
import { PendingRequests } from "../components/profile/PendingRequests";
import { ActivityFeed } from "../components/profile/ActivityFeed";
import { NotificationSettings } from "../components/notifications/NotificationSettings";
import { ProfileHeaderSection } from "../components/profile/ProfileHeaderSection";
import { StatsSection } from "../components/profile/StatsSection";
import { SidebarTabsList } from "../components/profile/SidebarTabsList";
import { ContentPanel, EmptyState } from "../components/profile/ContentPanel";
import { USDCBalanceSection } from "../components/profile/USDCBalanceSection";

export default function EnhancedProfile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const account = useAccount();
  const { smartAddress: address } = useSmartWallet();
  const { profile, isLoading } = useUserProfile();
  const { activity } = useUserActivity(identifier || "");
  const { markets, loading: marketsLoading } = useKuriMarkets();

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
                  ) : markets?.filter(
                      (market) =>
                        market.creator.toLowerCase() === address?.toLowerCase()
                    ).length === 0 ? (
                    <EmptyState
                      icon="group_work"
                      title="No Circles Created Yet"
                      description="Start by creating your first circle in the Markets page."
                      actionLabel="Create a Circle"
                      onAction={() => navigate("/markets")}
                    />
                  ) : (
                    <div className="space-y-8">
                      {/* Active Circles Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground">
                          Active Circles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {markets
                            ?.filter((market) => {
                              const currentTimestamp = Math.floor(
                                Date.now() / 1000
                              );
                              const launchPeriodEnded =
                                Number(market.launchPeriod) < currentTimestamp;
                              const isInLaunchState = market.state === 0;
                              const participantsMismatch =
                                market.activeParticipants !==
                                market.totalParticipants;

                              return (
                                market.creator.toLowerCase() ===
                                  address?.toLowerCase() &&
                                (!isInLaunchState ||
                                  !launchPeriodEnded ||
                                  !participantsMismatch)
                              );
                            })
                            .map((market, index) => (
                              <MarketCard
                                key={market.address}
                                market={market}
                                index={index}
                              />
                            ))}
                        </div>
                      </div>

                      {/* Failed Launches Section */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4 text-foreground">
                          Failed Launches
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {markets
                            ?.filter((market) => {
                              const currentTimestamp = Math.floor(
                                Date.now() / 1000
                              );
                              const launchPeriodEnded =
                                Number(market.launchPeriod) < currentTimestamp;
                              const isInLaunchState = market.state === 0;
                              const participantsMismatch =
                                market.activeParticipants !==
                                market.totalParticipants;

                              return (
                                market.creator.toLowerCase() ===
                                  address?.toLowerCase() &&
                                isInLaunchState &&
                                launchPeriodEnded &&
                                participantsMismatch
                              );
                            })
                            .map((market, index) => (
                              <MarketCard
                                key={market.address}
                                market={market}
                                index={index}
                              />
                            ))}
                        </div>
                      </div>
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
