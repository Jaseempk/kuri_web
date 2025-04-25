import { useEffect, useState } from "react";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useQuery } from "@apollo/client";
import { MARKET_MEMBERS_QUERY } from "../../graphql/queries";
import { MarketMember } from "../../graphql/types";
import { getAccount } from "@wagmi/core";
import { config } from "../../config/wagmi";
import { isUserRejection } from "../../utils/errors";

interface ManageMembersProps {
  marketAddress: string;
}

export const ManageMembers = ({ marketAddress }: ManageMembersProps) => {
  const [error, setError] = useState<string>("");
  const account = getAccount(config);
  const { acceptMember, rejectMember, isAccepting, isRejecting } = useKuriCore(
    marketAddress as `0x${string}`
  );

  const {
    data,
    loading,
    error: queryError,
    refetch,
  } = useQuery(MARKET_MEMBERS_QUERY, {
    variables: {
      market: marketAddress,
      first: 100,
      skip: 0,
    },
    fetchPolicy: "network-only",
  });

  const handleAcceptMember = async (memberAddress: string) => {
    try {
      await acceptMember(memberAddress as `0x${string}`);
      refetch();
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(
          err instanceof Error ? err.message : "Failed to accept member"
        );
      }
    }
  };

  const handleRejectMember = async (memberAddress: string) => {
    try {
      await rejectMember(memberAddress as `0x${string}`);
      refetch();
    } catch (err) {
      if (!isUserRejection(err)) {
        setError(
          err instanceof Error ? err.message : "Failed to reject member"
        );
      }
    }
  };

  if (loading) {
    return <div>Loading members...</div>;
  }

  if (queryError) {
    return <div>Error loading members: {queryError.message}</div>;
  }

  const pendingMembers = data?.marketMembers.filter(
    (member: MarketMember) => member.status === "PENDING"
  );

  const acceptedMembers = data?.marketMembers.filter(
    (member: MarketMember) => member.status === "ACCEPTED"
  );

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div>
        <h3 className="text-lg font-semibold mb-4">Pending Requests</h3>
        {pendingMembers?.length === 0 ? (
          <p className="text-muted-foreground">No pending requests</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingMembers?.map((member: MarketMember) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono">{member.address}</TableCell>
                  <TableCell>
                    <Badge variant="warning">Pending</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcceptMember(member.address)}
                        disabled={isAccepting}
                      >
                        {isAccepting ? "Accepting..." : "Accept"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRejectMember(member.address)}
                        disabled={isRejecting}
                      >
                        {isRejecting ? "Rejecting..." : "Reject"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Members</h3>
        {acceptedMembers?.length === 0 ? (
          <p className="text-muted-foreground">No members yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acceptedMembers?.map((member: MarketMember) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono">{member.address}</TableCell>
                  <TableCell>
                    <Badge variant="success">Member</Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
