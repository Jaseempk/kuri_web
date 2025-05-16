import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAccount } from "wagmi";
import { LoadingSkeleton } from "../components/ui/loading-states";

export default function ProfileRedirect() {
  const navigate = useNavigate();
  const { profile, loading } = useUserProfile();
  const { address } = useAccount();

  useEffect(() => {
    if (!loading && (profile?.username || address)) {
      // Prefer Farcaster username if available, fallback to wallet address
      const identifier = profile?.username || address;
      navigate(`/u/${identifier}`, { replace: true });
    }
  }, [loading, profile, address, navigate]);

  return <LoadingSkeleton />;
}
