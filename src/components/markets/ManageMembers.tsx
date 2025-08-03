import { useEffect, useState, useMemo } from "react";
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
import { Loader2, Calendar, User } from "lucide-react";
import { MEMBERSHIP_REQUESTS_QUERY } from "../../graphql/queries";
import { useAccount } from "wagmi";
import { useBulkUserProfiles } from "../../hooks/useBulkUserProfiles";
import { UserProfileCell } from "../ui/UserProfileCell";
import { Checkbox } from "../ui/checkbox";

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
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(
    new Set()
  );
  const [isBatchAccepting, setIsBatchAccepting] = useState(false);

  const { address } = useAccount();
  const {
    marketData,
    acceptMember,
    acceptMultipleMembers,
    rejectMember,
    getMemberStatus,
    isAccepting,
    isRejecting,
  } = useKuriCore(marketAddress as `0x${string}`);

  // Extract addresses for bulk profile fetching - memoized to prevent infinite loops
  const userAddresses = useMemo(
    () => memberRequests.map((request) => request.user),
    [memberRequests.map((req) => req.user).join(",")]
  );
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
      marketAddress: marketAddress,
    },
    fetchPolicy: "cache-and-network",
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
      // Refresh the specific user's state without creating new array reference
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
      // Refresh the specific user's state without creating new array reference
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

  // Batch accept selected members
  const handleBatchAccept = async () => {
    const selectedAddresses = Array.from(selectedRequests) as `0x${string}`[];
    if (selectedAddresses.length === 0) return;

    try {
      setIsBatchAccepting(true);
      setError(null);
      await acceptMultipleMembers(selectedAddresses);
      await refetch();

      // Refresh states for all selected users
      const updatedRequests = await Promise.all(
        memberRequests.map(async (req) => {
          if (selectedRequests.has(req.user)) {
            const state = await getMemberStatus(req.user as `0x${string}`);
            return { ...req, state: state ?? 4 };
          }
          return req;
        })
      );

      setMemberRequests(updatedRequests);
      setSelectedRequests(new Set());
      onMemberActionComplete?.();
    } catch (err) {
      console.error("Error accepting members:", err);
      setError("Failed to accept selected members");
    } finally {
      setIsBatchAccepting(false);
    }
  };

  // Toggle individual selection
  const toggleSelection = (userId: string) => {
    setSelectedRequests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Toggle all selections
  const toggleSelectAll = () => {
    const pendingRequests = memberRequests.filter((req) => req.state === 4);
    if (
      selectedRequests.size === pendingRequests.length &&
      pendingRequests.length > 0
    ) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(pendingRequests.map((req) => req.user)));
    }
  };

  // Get pending requests for batch operations
  const pendingRequests = memberRequests.filter((req) => req.state === 4);
  const hasSelectedRequests = selectedRequests.size > 0;
  const allPendingSelected =
    pendingRequests.length > 0 &&
    selectedRequests.size === pendingRequests.length;

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
      <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs sm:text-sm text-muted-foreground">
            Members: {totalActiveParticipantsCount}/{totalParticipantsCount}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground">
            {progress.toFixed(0)}% Full
          </span>
        </div>
        <div className="w-full h-2 sm:h-2.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-[hsl(var(--forest))] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  // Mobile card component for each member request
  const MemberRequestCard = ({ request }: { request: MembershipRequest }) => (
    <div className="bg-white border border-[hsl(var(--border))] rounded-xl p-4 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {request.state === 4 && (
            <Checkbox
              checked={selectedRequests.has(request.user)}
              onCheckedChange={() => toggleSelection(request.user)}
              className="mt-1 data-[state=checked]:bg-[hsl(var(--forest))] data-[state=checked]:border-[hsl(var(--forest))]"
            />
          )}
          <div className="flex-1 min-w-0">
            <UserProfileCell
              profile={getProfile(request.user)}
              address={request.user}
              isLoading={isProfileLoading(request.user)}
              className="mb-2"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {new Date(
                  Number(request.timestamp) * 1000
                ).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          {getMembershipStatusBadge(request.state)}
        </div>
      </div>
      {request.state === 4 && !selectedRequests.has(request.user) && (
        <div className="flex gap-2 pt-2 border-t border-[hsl(var(--border))]">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAccept(request.user as `0x${string}`)}
            disabled={
              isAccepting ||
              isRejecting ||
              processingUser === request.user ||
              isBatchAccepting
            }
            className="flex-1"
          >
            {processingUser === request.user && isAccepting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Accepting...
              </>
            ) : (
              "Accept"
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleReject(request.user as `0x${string}`)}
            disabled={
              isAccepting ||
              isRejecting ||
              processingUser === request.user ||
              isBatchAccepting
            }
            className="flex-1"
          >
            {processingUser === request.user && isRejecting ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Rejecting...
              </>
            ) : (
              "Reject"
            )}
          </Button>
        </div>
      )}
    </div>
  );

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
    <div className="space-y-4 p-3 sm:p-4 md:p-6">
      {renderStatus()}

      {/* Batch Actions Bar */}
      {pendingRequests.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={allPendingSelected}
                onCheckedChange={toggleSelectAll}
                className="data-[state=checked]:bg-[hsl(var(--forest))] data-[state=checked]:border-[hsl(var(--forest))]"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedRequests.size > 0
                  ? `${selectedRequests.size} selected`
                  : `Select all ${pendingRequests.length} pending requests`}
              </span>
            </div>
            {hasSelectedRequests && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBatchAccept}
                  disabled={isBatchAccepting || isAccepting || isRejecting}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  {isBatchAccepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    `Accept ${selectedRequests.size}`
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRequests(new Set())}
                  disabled={isBatchAccepting || isAccepting || isRejecting}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Layout - Cards */}
      <div className="block md:hidden space-y-3">
        {memberRequests.map((request) => (
          <MemberRequestCard key={request.id} request={request} />
        ))}
      </div>

      {/* Desktop Layout - Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">
                {pendingRequests.length > 0 && (
                  <Checkbox
                    checked={allPendingSelected}
                    onCheckedChange={toggleSelectAll}
                    className="data-[state=checked]:bg-[hsl(var(--forest))] data-[state=checked]:border-[hsl(var(--forest))]"
                  />
                )}
              </TableHead>
              <TableHead className="w-[30%]">User</TableHead>
              <TableHead className="w-[20%]">Requested</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[25%] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {memberRequests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="py-3">
                  {request.state === 4 ? (
                    <Checkbox
                      checked={selectedRequests.has(request.user)}
                      onCheckedChange={() => toggleSelection(request.user)}
                      className="data-[state=checked]:bg-[hsl(var(--forest))] data-[state=checked]:border-[hsl(var(--forest))]"
                    />
                  ) : (
                    <div className="w-4 h-4" /> // Placeholder for alignment
                  )}
                </TableCell>
                <TableCell className="py-3">
                  <UserProfileCell
                    profile={getProfile(request.user)}
                    address={request.user}
                    isLoading={isProfileLoading(request.user)}
                  />
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {new Date(
                      Number(request.timestamp) * 1000
                    ).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  {getMembershipStatusBadge(request.state)}
                </TableCell>
                <TableCell className="text-right py-3">
                  {request.state === 4 &&
                    !selectedRequests.has(request.user) && (
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
                            processingUser === request.user ||
                            isBatchAccepting
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
                            processingUser === request.user ||
                            isBatchAccepting
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
      </div>

      {memberRequests.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <User className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-sm sm:text-base">No membership requests found</p>
        </div>
      )}
    </div>
  );
};
