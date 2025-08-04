import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { MEMBERSHIP_REQUESTS_QUERY, MARKET_DEPLOYMENT_QUERY } from "../graphql/queries";
import { MarketDeploymentQueryResult, MarketDeploymentQueryVariables } from "../graphql/types";
import { useKuriCore } from "./contracts/useKuriCore";
import { useBulkUserProfiles } from "./useBulkUserProfiles";

export interface MembershipRequest {
  id: string;
  user: string;
  timestamp: string;
  state: number;
}

export interface UseCircleMembersOptions {
  includeCreator?: boolean;
  filterActiveOnly?: boolean;
}

export const useCircleMembers = (
  marketAddress: string,
  options: UseCircleMembersOptions = {}
) => {
  const { includeCreator = false, filterActiveOnly = true } = options;
  
  const [memberRequests, setMemberRequests] = useState<MembershipRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { marketData, getMemberStatus, acceptMember, acceptMultipleMembers, rejectMember, isAccepting, isRejecting } = useKuriCore(marketAddress as `0x${string}`);

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

  // Query market deployment data to get wannabeMember flag (only if includeCreator is true)
  const {
    data: deploymentData,
    loading: deploymentLoading,
    error: deploymentError,
  } = useQuery<MarketDeploymentQueryResult, MarketDeploymentQueryVariables>(
    MARKET_DEPLOYMENT_QUERY,
    {
      variables: {
        marketAddress: marketAddress,
      },
      fetchPolicy: "cache-and-network",
      skip: !includeCreator, // Skip this query if we don't need creator data
    }
  );

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

  // Process members based on options
  const processedMembers = useMemo(() => {
    let filteredMembers = memberRequests;
    
    // Filter for active members only if requested
    if (filterActiveOnly) {
      filteredMembers = memberRequests.filter((request) => request.state === 1);
    }
    
    // Handle wannabeMember creators if includeCreator is true
    if (includeCreator) {
      const deploymentInfo = deploymentData?.kuriMarketDeployeds?.[0];
      const shouldIncludeCreator = deploymentInfo?.wannabeMember && marketData?.creator;
      
      if (shouldIncludeCreator) {
        // Check if creator is already in the members list
        const creatorAlreadyExists = filteredMembers.some(
          (member) => member.user.toLowerCase() === marketData.creator.toLowerCase()
        );
        
        // Add creator as a member if not already present
        if (!creatorAlreadyExists) {
          const creatorAsMember: MembershipRequest = {
            id: `creator-${marketData.creator}`,
            user: marketData.creator,
            timestamp: deploymentInfo.timestamp,
            state: 1, // ACCEPTED
          };
          filteredMembers = [creatorAsMember, ...filteredMembers];
        }
      }
    }
    
    return filteredMembers;
  }, [memberRequests, deploymentData, marketData?.creator, includeCreator, filterActiveOnly]);

  // Extract addresses for bulk profile fetching - memoized to prevent infinite loops
  const userAddresses = useMemo(
    () => processedMembers.map((request) => request.user),
    [processedMembers.map((req) => req.user).join(",")]
  );
  
  const { getProfile, isLoading: isProfileLoading } =
    useBulkUserProfiles(userAddresses);

  // Categorize members by status for management UI
  const membersByStatus = useMemo(() => {
    return {
      active: processedMembers.filter((req) => req.state === 1),
      pending: processedMembers.filter((req) => req.state === 4),
      rejected: processedMembers.filter((req) => req.state === 2),
      flagged: processedMembers.filter((req) => req.state === 3),
    };
  }, [processedMembers]);

  const isLoadingAll = queryLoading || (includeCreator ? deploymentLoading : false) || isLoading;
  const hasError = queryError || (includeCreator ? deploymentError : null) || error;

  // Helper function to refresh member status
  const refreshMemberStatus = async (userAddress: string) => {
    try {
      const status = await getMemberStatus(userAddress as `0x${string}`);
      setMemberRequests((prev) =>
        prev.map((req) =>
          req.user === userAddress ? { ...req, state: status ?? 4 } : req
        )
      );
      return status;
    } catch (err) {
      console.error("Error refreshing member status:", err);
      return null;
    }
  };

  return {
    // Data
    members: processedMembers,
    membersByStatus,
    marketData,
    
    // Profile utilities
    getProfile,
    isProfileLoading,
    
    // Loading states
    isLoading: isLoadingAll,
    error: hasError,
    
    // Actions (for management components)
    getMemberStatus,
    acceptMember,
    acceptMultipleMembers,
    rejectMember,
    isAccepting,
    isRejecting,
    refreshMemberStatus,
    refetch,
    
    // Raw data (for backward compatibility)
    memberRequests,
    deploymentData,
  };
};