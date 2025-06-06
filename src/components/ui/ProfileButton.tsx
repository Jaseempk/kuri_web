import { Link, useLocation } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserProfile } from "../../hooks/useUserProfile";
import { User } from "lucide-react";
import { Button } from "./button";

export function ProfileButton() {
  const location = useLocation();
  const { address } = useAccount();
  const { profile } = useUserProfile();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Check if current path is a profile path
  const isProfilePath =
    location.pathname.startsWith("/u/") || location.pathname === "/me";

  return (
    <Link to="/me">
      <Button
        variant="outline"
        className={`flex items-center gap-2 hover:bg-[hsl(var(--gold))/10] ${
          isProfilePath
            ? "bg-[hsl(var(--gold))/10] text-[hsl(var(--gold))] border-[hsl(var(--gold))]"
            : "text-muted-foreground"
        }`}
      >
        {profile?.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt="Profile"
            className="w-6 h-6 rounded-full border border-[hsl(var(--gold))/20]"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="text-sm font-medium hidden md:inline">
          {profile?.display_name || "My Profile"}
        </span>
        {address && (
          <span className="text-sm text-muted-foreground hidden md:inline">
            ({formatAddress(address)})
          </span>
        )}
      </Button>
    </Link>
  );
}
