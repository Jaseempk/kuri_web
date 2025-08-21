import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAccount } from "@getpara/react-sdk";
import { LoadingSkeleton } from "../components/ui/loading-states";

export default function ProfileRedirect() {
  const navigate = useNavigate();
  const { profile, isLoading } = useUserProfile();
  const account = useAccount();
  const address = account.embedded.wallets?.[0]?.address;

  useEffect(() => {
    if (!isLoading && (profile?.username || address)) {
      // Prefer Farcaster username if available, fallback to wallet address
      const identifier = profile?.username || address;
      navigate(`/u/${identifier}`, { replace: true });
    }
  }, [isLoading, profile, address, navigate]);

  return <LoadingSkeleton />;
}
