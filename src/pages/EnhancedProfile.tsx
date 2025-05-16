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
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The requested profile could not be found.
        </p>
      </div>
    );
  }
  console.log("Profile Data:", profile);

  const isOwnProfile =
    address?.toLowerCase() === identifier?.toLowerCase() ||
    profile.username === identifier;

  return (
    <div className="min-h-screen bg-background">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="gradient-blur absolute -top-40 -right-40 w-[500px] h-[500px] opacity-30" />
        <div className="gradient-blur absolute -bottom-40 -left-40 w-[500px] h-[500px] opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white/5 backdrop-blur-md rounded-2xl p-8 mb-12 border border-white/10"
        >
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Image */}
            <div className="relative group">
              <div className="h-32 w-32 rounded-2xl overflow-hidden border-2 border-gold/20 hover-lift">
                <img
                  src={profile.profile_image_url || "/default-avatar.png"}
                  alt={profile.display_name ?? "User Profile"}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gradient mb-2">
                {profile.display_name}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">
                @{profile.username}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-muted-foreground">Reputation</p>
                  <p className="text-2xl font-bold text-gradient">
                    {profile.reputation_score || 0}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-muted-foreground">Total Circles</p>
                  <p className="text-2xl font-bold text-gradient">
                    {activity?.memberships?.length || 0}
                  </p>
                </div>
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="text-2xl font-bold text-gradient">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Only show tabs for own profile */}
        {isOwnProfile && (
          <Tabs defaultValue="my-circles" className="w-full">
            <TabsList className="mb-8 bg-white/5 backdrop-blur-sm border border-white/10 p-1 rounded-xl">
              <TabsTrigger
                value="my-circles"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-lg transition-all"
              >
                My Circles
              </TabsTrigger>
              <TabsTrigger
                value="memberships"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-lg transition-all"
              >
                Circle Memberships
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-lg transition-all"
              >
                Pending Requests
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="data-[state=active]:bg-gold/20 data-[state=active]:text-gold rounded-lg transition-all"
              >
                Activity
              </TabsTrigger>
            </TabsList>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TabsContent value="my-circles">
                {marketsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white/5 animate-pulse backdrop-blur-sm rounded-xl p-6 border border-white/10 h-[400px]"
                      />
                    ))}
                  </div>
                ) : markets?.filter(
                    (market) =>
                      market.creator.toLowerCase() === address?.toLowerCase()
                  ).length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-xl font-semibold mb-2">
                      No Circles Created Yet
                    </h3>
                    <p className="text-muted-foreground">
                      Start by creating your first circle in the Markets page.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {markets
                      ?.filter(
                        (market) =>
                          market.creator.toLowerCase() ===
                          address?.toLowerCase()
                      )
                      .map((market, index) => (
                        <MarketCard
                          key={market.address}
                          market={market}
                          index={index}
                        />
                      ))}
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
