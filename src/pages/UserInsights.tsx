import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  TrendingUp,
  Users,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { UserAvatar } from "../components/ui/UserAvatar";
import { useBulkUserProfiles } from "../hooks/useBulkUserProfiles";
import { useNavigate } from "react-router-dom";

export default function UserInsights() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();

  // Fetch user profile
  const { getProfile, isLoading } = useBulkUserProfiles(
    address ? [address] : []
  );
  const profile = address ? getProfile(address) : null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayName =
    profile?.display_name ||
    profile?.username ||
    (address ? formatAddress(address) : "Unknown User");

  const mockStats = {
    totalCircles: 5,
    completedCircles: 3,
    totalContributed: 2400,
    totalReceived: 1800,
    averageCircleSize: 8,
    successRate: 95,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(var(--sand))] via-background to-[hsl(var(--sand))]/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </motion.div>

        {/* User Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <Card className="border-[hsl(var(--gold))]/20 bg-gradient-to-r from-background to-[hsl(var(--sand))]/10">
            <CardContent className="p-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <UserAvatar
                    profile={profile}
                    address={address || ""}
                    size="lg"
                    className="w-20 h-20"
                  />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-[hsl(var(--gold))] rounded-full flex items-center justify-center">
                    <Award className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{displayName}</h1>
                    {profile && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-[hsl(var(--gold))]/10 rounded-full border border-[hsl(var(--gold))]/20">
                        <TrendingUp className="h-4 w-4 text-[hsl(var(--gold))]" />
                        <span className="text-sm font-semibold text-[hsl(var(--gold))]">
                          {profile.reputation_score ?? 0} pts
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-muted-foreground font-mono text-sm">
                    {address}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {mockStats.totalCircles} circles joined
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Member since 2024
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <motion.div variants={itemVariants}>
            <Card className="border-[hsl(var(--gold))]/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Total Circles
                    </p>
                    <p className="text-2xl font-bold">
                      {mockStats.totalCircles}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--gold))]/10 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-[hsl(var(--gold))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-[hsl(var(--forest))]/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">
                      {mockStats.completedCircles}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--forest))]/10 rounded-full flex items-center justify-center">
                    <Award className="h-6 w-6 text-[hsl(var(--forest))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-[hsl(var(--terracotta))]/20 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Contributed</p>
                    <p className="text-2xl font-bold">
                      ${mockStats.totalContributed.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[hsl(var(--terracotta))]/10 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-[hsl(var(--terracotta))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Success Rate
                    </p>
                    <p className="text-2xl font-bold">
                      {mockStats.successRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center py-16"
        >
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="w-32 h-32 bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(var(--terracotta))] rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg"
            >
              <Activity className="h-16 w-16 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="text-4xl font-bold mb-4 bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--terracotta))] bg-clip-text text-transparent"
            >
              Detailed Insights Coming Soon
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-lg text-muted-foreground mb-8 leading-relaxed"
            >
              We're building comprehensive analytics to help you track your
              circle participation, contribution patterns, and community impact.
              Get ready for detailed charts, performance metrics, and insights
              that will help you make better financial decisions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
            >
              <div className="p-6 bg-background/50 backdrop-blur-sm border border-[hsl(var(--gold))]/20 rounded-lg">
                <PieChart className="h-8 w-8 text-[hsl(var(--gold))] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Circle Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Track your participation across different circles and time
                  periods
                </p>
              </div>

              <div className="p-6 bg-background/50 backdrop-blur-sm border border-[hsl(var(--forest))]/20 rounded-lg">
                <BarChart3 className="h-8 w-8 text-[hsl(var(--forest))] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Financial Insights</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze your contribution patterns and savings growth over
                  time
                </p>
              </div>

              <div className="p-6 bg-background/50 backdrop-blur-sm border border-[hsl(var(--terracotta))]/20 rounded-lg">
                <TrendingUp className="h-8 w-8 text-[hsl(var(--terracotta))] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Community Impact</h3>
                <p className="text-sm text-muted-foreground">
                  See how your participation helps others achieve their
                  financial goals
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 }}
              className="mt-12"
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-[hsl(var(--gold))] to-[hsl(var(--terracotta))] hover:from-[hsl(var(--gold))]/90 hover:to-[hsl(var(--terracotta))]/90 text-white border-none shadow-lg"
                onClick={() => navigate("/markets")}
              >
                Explore Circles
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
