import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { Badge } from "../ui/badge";
import { Loader2 } from "lucide-react";
import { MEMBERSHIP_REQUESTS_QUERY } from "../../graphql/queries";
import { useAccount } from "wagmi";
import { useBulkUserProfiles } from "../../hooks/useBulkUserProfiles";
import { UserProfileCell } from "../ui/UserProfileCell";

interface MembershipRequest {
  id: string;
  user: string;
  timestamp: string;
  state: number;
}

interface ManageMembersProps {
  marketAddress: string;
  onMemberActionComplete?: () => void;
}

export const ManageMembers = ({
  marketAddress,
  onMemberActionComplete,
}: ManageMembersProps) => {
  const [memberRequests, setMemberRequests] = useState<MembershipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUser, setProcessingUser] = useState<string | null>(null);

  const { address } = useAccount();
  const {
    marketData,
    acceptMember,
    rejectMember,
    getMemberStatus,
    isAccepting,
    isRejecting,
  } = useKuriCore(marketAddress as `0x${string}`);

  // Extract addresses for bulk profile fetching
  const userAddresses = memberRequests.map((request) => request.user);
  const { getProfile, isLoading: isProfileLoading } =
    useBulkUserProfiles(userAddresses);

  // Verify creator access
  useEffect(() => {
    if (marketData && address && marketData.creator !== address) {
      setError("Only the creator can manage members");
      setIsLoading(false);
    }
  }, [marketData, address]);

  // Query membership requests from subgraph
  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery(MEMBERSHIP_REQUESTS_QUERY, {
    variables: {
      marketAddress: marketAddress.toLowerCase(),
    },
    fetchPolicy: "network-only",
  });
  console.log("marketAddress:", marketAddress);
  console.log("daata:", data);

  // Fetch member states from contract
  useEffect(() => {
    const fetchMemberStates = async () => {
      if (!data?.membershipRequesteds) return;

      try {
        const requestsWithState = await Promise.all(
          data.membershipRequesteds.map(
            async (request: Omit<MembershipRequest, "state">) => {
              try {
                const state = await getMemberStatus(
                  request.user as `0x${string}`
                );
                return { ...request, state: state ?? 4 }; // Default to APPLIED state
              } catch (err) {
                console.error(`Error fetching state for ${request.user}:`, err);
                return { ...request, state: 4 }; // Default to APPLIED state on error
              }
            }
          )
        );
        setMemberRequests(requestsWithState);
      } catch (err) {
        console.error("Error fetching member states:", err);
        setError("Failed to fetch member states");
      } finally {
        setIsLoading(false);
      }
    };

    if (data) {
      fetchMemberStates();
    }
  }, [data, getMemberStatus]);

  const handleAccept = async (address: `0x${string}`) => {
    try {
      setProcessingUser(address);
      setError(null);
      await acceptMember(address);
      await refetch();
      // Refresh the specific user's state
      const state = await getMemberStatus(address);
      setMemberRequests((prev) =>
        prev.map((req) =>
          req.user === address ? { ...req, state: state ?? 4 } : req
        )
      );
      onMemberActionComplete?.();
    } catch (err) {
      console.error("Error accepting member:", err);
      setError("Failed to accept member");
    } finally {
      setProcessingUser(null);
    }
  };

  const handleReject = async (address: `0x${string}`) => {
    try {
      setProcessingUser(address);
      setError(null);
      await rejectMember(address);
      await refetch();
      // Refresh the specific user's state
      const state = await getMemberStatus(address);
      setMemberRequests((prev) =>
        prev.map((req) =>
          req.user === address ? { ...req, state: state ?? 4 } : req
        )
      );
      onMemberActionComplete?.();
    } catch (err) {
      console.error("Error rejecting member:", err);
      setError("Failed to reject member");
    } finally {
      setProcessingUser(null);
    }
  };

  const getMembershipStatusBadge = (state: number) => {
    switch (state) {
      case 0: // NONE
        return <Badge variant="secondary">None</Badge>;
      case 1: // ACCEPTED
        return <Badge variant="success">Accepted</Badge>;
      case 2: // REJECTED
        return <Badge variant="destructive">Rejected</Badge>;
      case 3: // FLAGGED
        return <Badge variant="destructive">Flagged</Badge>;
      case 4: // APPLIED
        return <Badge variant="warning">Applied</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Add status section at the top
  const renderStatus = () => {
    if (!marketData) return null;

    const { totalParticipantsCount, totalActiveParticipantsCount } = marketData;
    const progress =
      (totalActiveParticipantsCount / totalParticipantsCount) * 100;

    return (
      <div className="mb-6 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">
            Members: {totalActiveParticipantsCount}/{totalParticipantsCount}
          </span>
          <span className="text-sm text-muted-foreground">
            {progress.toFixed(0)}% Full
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--forest))]"
            style={{ width: `${progress}%` }}
          />
        </div>
        {totalActiveParticipantsCount === totalParticipantsCount && (
          <div className="text-sm text-[hsl(var(--forest))] bg-[hsl(var(--forest))]/10 p-2 rounded">
            Circle is ready to initialize! You can close this dialog and click
            the "Initialize Kuri" button.
          </div>
        )}
      </div>
    );
  };

  if (queryLoading || isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (queryError || error) {
    return (
      <div className="text-red-500 p-4 rounded-lg bg-red-50">
        Error: {queryError?.message || error || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {renderStatus()}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>
                <UserProfileCell
                  profile={getProfile(request.user)}
                  address={request.user}
                  isLoading={isProfileLoading(request.user)}
                />
              </TableCell>
              <TableCell>
                {new Date(
                  Number(request.timestamp) * 1000
                ).toLocaleDateString()}
              </TableCell>
              <TableCell>{getMembershipStatusBadge(request.state)}</TableCell>
              <TableCell className="text-right">
                {request.state === 4 && (
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleAccept(request.user as `0x${string}`)
                      }
                      disabled={
                        isAccepting ||
                        isRejecting ||
                        processingUser === request.user
                      }
                    >
                      {processingUser === request.user && isAccepting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Accepting...
                        </>
                      ) : (
                        "Accept"
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleReject(request.user as `0x${string}`)
                      }
                      disabled={
                        isAccepting ||
                        isRejecting ||
                        processingUser === request.user
                      }
                    >
                      {processingUser === request.user && isRejecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        "Reject"
                      )}
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {memberRequests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No membership requests found
        </div>
      )}
    </div>
  );
};
