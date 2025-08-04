import { Loader2, Users, User } from "lucide-react";
import { useCircleMembers } from "../../hooks/useCircleMembers";
import { UserProfileCell } from "../ui/UserProfileCell";

interface CircleMembersDisplayProps {
  marketAddress: string;
}

export const CircleMembersDisplay = ({ marketAddress }: CircleMembersDisplayProps) => {
  // Use shared hook with creator inclusion and active filtering
  const {
    members: activeMembers,
    marketData,
    getProfile,
    isProfileLoading,
    isLoading,
    error,
  } = useCircleMembers(marketAddress, {
    includeCreator: true,
    filterActiveOnly: true,
  });

  // Render progress bar
  const renderProgressBar = () => {
    if (!marketData) return null;

    const { totalParticipantsCount, totalActiveParticipantsCount } = marketData;
    const progress =
      (totalActiveParticipantsCount / totalParticipantsCount) * 100;

    return (
      <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm font-medium text-[hsl(var(--foreground))]">
            Circle Progress
          </span>
          <span className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] font-mono">
            {totalActiveParticipantsCount}/{totalParticipantsCount}
          </span>
        </div>
        <div className="w-full h-1.5 sm:h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--forest))] transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
          <h3 className="text-2xl font-bold text-[hsl(var(--terracotta))]">
            Circle Members
          </h3>
        </div>
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
          <h3 className="text-2xl font-bold text-[hsl(var(--terracotta))]">
            Circle Members
          </h3>
        </div>
        <div className="text-red-500 p-4 rounded-lg bg-red-50">
          Error: {error?.message || error || "Unknown error"}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[hsl(var(--muted-foreground))]" />
        <h3 className="text-xl sm:text-2xl font-bold text-[hsl(var(--terracotta))]">
          Circle Members
        </h3>
      </div>

      {renderProgressBar()}

      {activeMembers.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--sand))] flex items-center justify-center">
            <User className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          </div>
          <h4 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
            No Active Members Yet
          </h4>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto">
            Members will appear here once they've been accepted into the circle.
          </p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto pr-2 -mr-2 scrollbar-thin scrollbar-thumb-[hsl(var(--muted))] scrollbar-track-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-3">
            {activeMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white/50 backdrop-blur-sm border border-[hsl(var(--border))]/50 rounded-xl p-3 sm:p-4 hover:bg-white/70 hover:border-[hsl(var(--border))] hover:shadow-sm transition-all duration-200 cursor-pointer group"
              >
                <UserProfileCell
                  profile={getProfile(member.user)}
                  address={member.user}
                  isLoading={isProfileLoading(member.user)}
                  className="group-hover:scale-[1.02] transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};