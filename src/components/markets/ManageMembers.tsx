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

interface MembershipRequest {
  id: string;
  user: string;
  timestamp: string;
  state: number;
}

interface ManageMembersProps {
  marketAddress: string;
}

export const ManageMembers = ({ marketAddress }: ManageMembersProps) => {
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
  console.log("aaddreaa:", address);
  console.log("marketData:", marketData);
  console.log("marketAddress:", marketAddress);

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
                return { ...request, state: state ?? 0 };
              } catch (err) {
                console.error(`Error fetching state for ${request.user}:`, err);
                return { ...request, state: 0 }; // Default to NONE state on error
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
          req.user === address ? { ...req, state: state ?? 0 } : req
        )
      );
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
          req.user === address ? { ...req, state: state ?? 0 } : req
        )
      );
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
        return <Badge variant="secondary">Pending</Badge>;
      case 1: // ACCEPTED
        return <Badge variant="success">Accepted</Badge>;
      case 2: // REJECTED
        return <Badge variant="destructive">Rejected</Badge>;
      case 3: // FLAGGED
        return <Badge variant="destructive">Flagged</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Address</TableHead>
            <TableHead>Requested</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberRequests.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-mono">
                {request.user.slice(0, 6)}...{request.user.slice(-4)}
              </TableCell>
              <TableCell>
                {new Date(
                  Number(request.timestamp) * 1000
                ).toLocaleDateString()}
              </TableCell>
              <TableCell>{getMembershipStatusBadge(request.state)}</TableCell>
              <TableCell className="text-right">
                {request.state === 0 && (
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
