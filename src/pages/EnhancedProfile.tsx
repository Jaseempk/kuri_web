import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useUserProfile } from "../hooks/useUserProfile";
import { useUserActivity } from "../hooks/useUserActivity";
import { LoadingSkeleton } from "../components/ui/loading-states";
import { useAccount } from "wagmi";
import { useKuriMarkets } from "../hooks/useKuriMarkets";
import { MarketCard } from "../components/markets/MarketCard";
import { Memberships } from "../components/profile/Memberships";
import { PendingRequests } from "../components/profile/PendingRequests";
import { ActivityFeed } from "../components/profile/ActivityFeed";
import { motion } from "framer-motion";

export default function EnhancedProfile() {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { address } = useAccount();
  const { profile, loading } = useUserProfile();
  const { activity } = useUserActivity(identifier || "");
  const { markets, loading: marketsLoading } = useKuriMarkets();

  useEffect(() => {
    if (!identifier) {
      navigate("/me", { replace: true });
      return;
    }
    window.scrollTo(0, 0);
  }, [identifier, navigate]);

  if (loading) return <LoadingSkeleton />;

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
      {/* Decorative elements with improved responsive positioning */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="gradient-blur absolute -top-20 sm:-top-30 md:-top-40 
          -right-20 sm:-right-30 md:-right-40 
          w-[200px] sm:w-[300px] md:w-[500px] 
          h-[200px] sm:h-[300px] md:h-[500px] opacity-30"
        />
        <div
          className="gradient-blur absolute -bottom-20 sm:-bottom-30 md:-bottom-40 
          -left-20 sm:-left-30 md:-left-40 
          w-[200px] sm:w-[300px] md:w-[500px] 
          h-[200px] sm:h-[300px] md:h-[500px] opacity-30"
        />
      </div>

      <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white/5 backdrop-blur-md rounded-2xl 
            p-3 xs:p-4 md:p-6 lg:p-8 mb-4 sm:mb-6 md:mb-8 lg:mb-12 
            border border-white/10"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 md:gap-8">
            {/* Profile Image */}
            <div className="relative group">
              <div
                className="h-20 w-20 xs:h-24 xs:w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 
                rounded-2xl overflow-hidden border-2 border-gold/20 hover-lift 
                transition-transform duration-300 ease-in-out"
              >
                <img
                  src={profile.profile_image_url || "/default-avatar.png"}
                  alt={profile.display_name ?? "User Profile"}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-1 sm:mb-2">
                {profile.display_name}
              </h1>
              <p className="text-sm xs:text-base sm:text-lg text-muted-foreground mb-2 sm:mb-4">
                @{profile.username}
              </p>

              {/* Stats Grid */}
              <div
                className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 
                gap-2 xs:gap-3 sm:gap-4 md:gap-6 mt-3 sm:mt-4 md:mt-6"
              >
                <div
                  className="bg-white/5 backdrop-blur-sm rounded-xl 
                  p-2 xs:p-3 sm:p-4 border border-white/10 
                  transform transition-transform duration-300 hover:scale-105"
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Reputation
                  </p>
                  <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gradient">
                    {profile.reputation_score || 0}
                  </p>
                </div>
                <div
                  className="bg-white/5 backdrop-blur-sm rounded-xl 
                  p-2 xs:p-3 sm:p-4 border border-white/10 
                  transform transition-transform duration-300 hover:scale-105"
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Total Circles
                  </p>
                  <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gradient">
                    {activity?.memberships?.length || 0}
                  </p>
                </div>
                <div
                  className="bg-white/5 backdrop-blur-sm rounded-xl 
                  p-2 xs:p-3 sm:p-4 border border-white/10 
                  transform transition-transform duration-300 hover:scale-105
                  col-span-2 sm:col-span-1"
                >
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Member Since
                  </p>
                  <p className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-gradient">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs section with improved mobile handling */}
        {isOwnProfile && (
          <Tabs defaultValue="my-circles" className="w-full">
            <TabsList
              className="mb-4 sm:mb-6 md:mb-8 bg-white/5 backdrop-blur-sm 
              border border-white/10 p-1 rounded-xl w-full 
              overflow-x-auto flex-nowrap whitespace-nowrap 
              scrollbar-thin scrollbar-thumb-gold/20 scrollbar-track-transparent"
            >
              <TabsTrigger
                value="my-circles"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold 
                  rounded-lg transition-all text-xs xs:text-sm md:text-base 
                  px-2 py-1 xs:px-3 xs:py-2 sm:px-4 flex-shrink-0"
              >
                My Circles
              </TabsTrigger>
              <TabsTrigger
                value="memberships"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold 
                  rounded-lg transition-all text-xs xs:text-sm md:text-base 
                  px-2 py-1 xs:px-3 xs:py-2 sm:px-4 flex-shrink-0"
              >
                Circle Memberships
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold 
                  rounded-lg transition-all text-xs xs:text-sm md:text-base 
                  px-2 py-1 xs:px-3 xs:py-2 sm:px-4 flex-shrink-0"
              >
                Pending Requests
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold 
                  rounded-lg transition-all text-xs xs:text-sm md:text-base 
                  px-2 py-1 xs:px-3 xs:py-2 sm:px-4 flex-shrink-0"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              <TabsContent value="my-circles">
                {marketsLoading ? (
                  <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 md:gap-6">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white/5 animate-pulse backdrop-blur-sm rounded-xl 
                          p-3 xs:p-4 md:p-6 border border-white/10 
                          h-[250px] xs:h-[300px] md:h-[400px]"
                      />
                    ))}
                  </div>
                ) : markets?.filter(
                    (market) =>
                      market.creator.toLowerCase() === address?.toLowerCase()
                  ).length === 0 ? (
                  <div className="text-center py-6 sm:py-8 md:py-12">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">
                      No Circles Created Yet
                    </h3>
                    <p className="text-sm md:text-base text-muted-foreground">
                      Start by creating your first circle in the Markets page.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Active Circles Section */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        Active Circles
                      </h3>
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 md:gap-6">
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

                            // Show markets that are either:
                            // 1. Not in launch state (active or completed)
                            // 2. In launch state but launch period hasn't ended
                            // 3. In launch state, launch period ended, but has all participants
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
                      <h3 className="text-lg font-semibold mb-4">
                        Failed Launches
                      </h3>
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3 xs:gap-4 md:gap-6">
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

                            // Show markets that meet all three conditions:
                            // 1. In launch state
                            // 2. Launch period has ended
                            // 3. Doesn't have all participants
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
            </motion.div>
          </Tabs>
        )}
      </div>
    </div>
  );
}
