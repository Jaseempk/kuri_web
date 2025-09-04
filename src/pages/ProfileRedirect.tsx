import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext";
import { LoadingSkeleton } from "../components/ui/loading-states";

export default function ProfileRedirect() {
  const navigate = useNavigate();
  const { profile, smartAddress: address, isLoading } = useAuthContext();

  useEffect(() => {
    if (!isLoading && (profile?.username || address)) {
      // Prefer Farcaster username if available, fallback to wallet address
      const identifier = profile?.username || address;
      navigate(`/u/${identifier}`, { replace: true });
    }
  }, [isLoading, profile, address, navigate]);

  return <LoadingSkeleton />;
}
