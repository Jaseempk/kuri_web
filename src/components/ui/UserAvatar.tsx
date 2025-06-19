import { User } from "lucide-react";
import { KuriUserProfile } from "../../types/user";
import { cn } from "../../lib/utils";

interface UserAvatarProps {
  profile: KuriUserProfile | null;
  address: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

const iconSizeClasses = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-5 h-5",
};

export function UserAvatar({
  profile,
  address,
  size = "md",
  className,
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const iconSizeClass = iconSizeClasses[size];

  if (profile?.profile_image_url) {
    return (
      <img
        src={profile.profile_image_url}
        alt={profile.display_name || profile.username || "Profile"}
        className={cn(
          sizeClass,
          "rounded-full border border-[hsl(var(--gold))/20] object-cover",
          className
        )}
        onError={(e) => {
          // Fallback to User icon if image fails to load
          e.currentTarget.style.display = "none";
        }}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        "rounded-full bg-muted flex items-center justify-center border border-[hsl(var(--gold))/20]",
        className
      )}
    >
      <User className={cn(iconSizeClass, "text-muted-foreground")} />
    </div>
  );
}
