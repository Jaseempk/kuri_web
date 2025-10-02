import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { KuriUserProfile } from "../../types/user";
import { UserAvatar } from "./UserAvatar";
import { Copy, ExternalLink, TrendingUp } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { toast } from "sonner";

interface ProfileCardProps {
  profile: KuriUserProfile | null;
  address: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileCard({
  profile,
  address,
  isOpen,
  onClose,
}: ProfileCardProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-8)}`;
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const displayName =
    profile?.display_name || profile?.username || formatAddress(address);

  const handleViewInsights = () => {
    // Navigate to user insights page
    window.open(`/insights/${address}`, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3">
            <UserAvatar profile={profile} address={address} size="lg" />
            <div className="flex flex-col items-start min-w-0 flex-1">
              <span className="text-base sm:text-lg font-semibold truncate max-w-full">{displayName}</span>
              {profile?.username && profile?.display_name && (
                <span className="text-xs sm:text-sm text-muted-foreground truncate max-w-full">
                  @{profile.username}
                </span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4">
          {/* Address Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Wallet Address
            </label>
            <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
              <code className="text-xs sm:text-sm font-mono flex-1 min-w-0 block">
                <span className="hidden sm:inline">{address}</span>
                <span className="sm:hidden">{formatAddress(address)}</span>
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyAddress}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Reputation Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Reputation Score
            </label>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-[hsl(var(--gold))]/10 to-[hsl(var(--gold))]/5 rounded-lg border border-[hsl(var(--gold))]/20">
              <TrendingUp className="h-4 w-4 text-[hsl(var(--gold))]" />
              <span className="font-semibold text-[hsl(var(--gold))]">
                {profile?.reputation_score ?? 0}
              </span>
              <span className="text-sm text-muted-foreground">points</span>
            </div>
          </div>

          {/* Insights Link */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs sm:text-sm !whitespace-normal min-h-[36px]"
              onClick={handleViewInsights}
            >
              <TrendingUp className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
              View Circle Insights
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
