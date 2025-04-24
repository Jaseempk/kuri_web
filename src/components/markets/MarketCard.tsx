import { useEffect, useState } from "react";
import { Market } from "../../graphql/types";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";

import {
  useKuriCore,
  MembershipStatus,
} from "../../hooks/contracts/useKuriCore";
import { getAccount } from "@wagmi/core";
import { config } from "../../config/wagmi";
import { isUserRejection } from "../../utils/errors";
import { ManageMembersDialog } from "./ManageMembersDialog";

interface MarketCardProps {
  market: Market;
  onJoinClick?: (market: Market) => void;
}

export const MarketCard = ({ market }: MarketCardProps) => {
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus>(
    MembershipStatus.NONE
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const account = getAccount(config);
  const { requestMembership, getMemberStatus, isRequesting } = useKuriCore(
    market.address as `0x${string}`
  );

  // Default values until implemented in Market type
  const defaultDescription =
    "A community savings circle powered by Kuri protocol.";
  const defaultEntryFee = "0.1"; // 0.1 ETH default entry fee

  // Fetch membership status on mount and when account changes
  useEffect(() => {
    const fetchMemberStatus = async () => {
      if (!account.address) return;
      try {
        const status = await getMemberStatus(account.address);
        setMembershipStatus(status);
      } catch (err) {
        console.error("Error fetching member status:", err);
      }
    };

    fetchMemberStatus();
  }, [account.address, getMemberStatus]);

  const handleJoinRequest = async () => {
    if (!account.address) {
      setError("Please connect your wallet first");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await requestMembership();
      setMembershipStatus(MembershipStatus.PENDING);
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(
          err instanceof Error ? err.message : "Failed to request membership"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "bg-[hsl(var(--gold))]";
      case "ACTIVE":
        return "bg-[hsl(var(--forest))]";
      case "PAUSED":
        return "bg-[hsl(var(--ochre))]";
      default:
        return "bg-[hsl(var(--sand))]";
    }
  };

  const getMembershipStatusDisplay = () => {
    switch (membershipStatus) {
      case MembershipStatus.PENDING:
        return <Badge variant="warning">Pending Approval</Badge>;
      case MembershipStatus.ACCEPTED:
        return <Badge variant="success">Member</Badge>;
      case MembershipStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return null;
    }
  };

  const isCreator =
    account.address?.toLowerCase() === market.creator.toLowerCase();

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold truncate">
            {market.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getMembershipStatusDisplay()}
            <Badge className={getStatusColor(market.status)}>
              {market.status}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">Description</p>
          <p className="text-sm line-clamp-2">{defaultDescription}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Entry Fee</p>
            <p className="font-medium">{defaultEntryFee} ETH</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Participants</p>
            <p className="font-medium">{market.memberCount}</p>
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
      <CardFooter>
        {!isCreator && membershipStatus === MembershipStatus.NONE && (
          <Button
            variant="default"
            className="w-full"
            onClick={handleJoinRequest}
            disabled={isRequesting || isLoading}
          >
            {isRequesting ? "Requesting..." : "Join Market"}
          </Button>
        )}
        {isCreator && (
          <ManageMembersDialog
            marketAddress={market.address}
            marketName={market.name}
          />
        )}
      </CardFooter>
    </Card>
  );
};
