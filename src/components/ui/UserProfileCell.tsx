import { useState } from "react";
import { KuriUserProfile } from "../../types/user";
import { UserAvatar } from "./UserAvatar";
import { ProfileCard } from "./ProfileCard";
import { cn } from "../../lib/utils";

interface UserProfileCellProps {
  profile: KuriUserProfile | null;
  address: string;
  isLoading?: boolean;
  className?: string;
}

export function UserProfileCell({
  profile,
  address,
  isLoading = false,
  className,
}: UserProfileCellProps) {
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const displayName = profile?.display_name || profile?.username;

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-6 h-6 rounded-full bg-muted animate-pulse" />
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsProfileCardOpen(true)}
        className={cn(
          "flex items-center gap-2 text-left hover:bg-muted/50 rounded-md p-1 -m-1 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--gold))] focus:ring-offset-1",
          className
        )}
      >
        <UserAvatar profile={profile} address={address} size="sm" />
        <div className="flex flex-col min-w-0">
          {displayName ? (
            <>
              <span className="font-medium text-sm truncate">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {formatAddress(address)}
              </span>
            </>
          ) : (
            <span className="font-mono text-sm">{formatAddress(address)}</span>
          )}
        </div>
      </button>

      <ProfileCard
        profile={profile}
        address={address}
        isOpen={isProfileCardOpen}
        onClose={() => setIsProfileCardOpen(false)}
      />
    </>
  );
}
