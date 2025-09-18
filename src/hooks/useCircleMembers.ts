import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  MEMBERSHIP_REQUESTS_QUERY,
  MARKET_DEPLOYMENT_QUERY,
} from "../graphql/queries";
import {
  MarketDeploymentQueryResult,
  MarketDeploymentQueryVariables,
} from "../graphql/types";
import { useKuriCore, KuriState } from "./contracts/useKuriCore";
import { useBulkUserProfiles } from "./useBulkUserProfiles";
import { useMarketContext } from "../contexts/MarketContext";

export interface PaymentStatus {
  isPaid: boolean;
  isPaymentDue: boolean;
  intervalIndex: number;
}

export interface MembershipRequest {
  id: string;
  user: string;
  timestamp: string;
  state: number;
  paymentStatus?: PaymentStatus; // NEW: Payment status for current interval
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

  const {
    marketData,
    getMemberStatus,
    acceptMemberSponsored,
    acceptMultipleMembersSponsored,
    rejectMemberSponsored,
    isAccepting,
    isRejecting,
  } = useKuriCore(marketAddress as `0x${string}`);
  
  // Use MarketContext to get the same current interval calculation as other components
  const { currentInterval: contextCurrentInterval, userDeposits: workingDeposits } = useMarketContext();

  // Get payment data from MarketContext (broken - returns null)
  const { marketDetail } = useMarketContext();

  // Use the same current interval as other components (from MarketContext)
  const getCurrentInterval = contextCurrentInterval || 0;

  // Create stable deposit signature to prevent unnecessary recalculations
  const depositsSignature = useMemo(() => {
    if (!workingDeposits?.length) return '';
    return workingDeposits
      .map(d => `${d.user.toLowerCase()}-${d.intervalIndex}`)
      .sort()
      .join('|');
  }, [workingDeposits]);

  // Helper function to check if payment period is active
  const isPaymentPeriodActive = useMemo(() => {
    if (!marketData || marketData.state !== KuriState.ACTIVE) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    const nextDepositTime = Number(marketData.nextIntervalDepositTime);

    return currentTime >= nextDepositTime && getCurrentInterval > 0;
  }, [marketData, getCurrentInterval]);

  // Calculate payment status for all members
  const memberPaymentStatus = useMemo(() => {
    // Use working deposits instead of broken marketDetail.deposits
    if (!workingDeposits || !isPaymentPeriodActive || getCurrentInterval <= 0) {
      return new Map<string, boolean>();
    }

    const paymentMap = new Map<string, boolean>();

    // Check each deposit to see if it's for the current interval
    workingDeposits.forEach((deposit) => {
      const depositInterval = parseInt(deposit.intervalIndex);
      if (depositInterval === getCurrentInterval) {
        paymentMap.set(deposit.user.toLowerCase(), true);
      }
    });

    return paymentMap;
  }, [depositsSignature, getCurrentInterval, isPaymentPeriodActive]);

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

  // Fetch member states from contract with address resolution
  useEffect(() => {
    const fetchMemberStates = async () => {
      if (!data?.membershipRequesteds) return;

      try {
        const requestsWithState = await Promise.all(
          data.membershipRequesteds.map(
            async (request: Omit<MembershipRequest, "state">) => {
              try {
                // Use the original address for both display and contract calls
                const state = await getMemberStatus(
                  request.user as `0x${string}`
                );

                return {
                  ...request,
                  state: state ?? 4,
                };
              } catch (err) {
                console.error(`Error fetching state for ${request.user}:`, err);
                return { ...request, state: 4 };
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
      const shouldIncludeCreator =
        deploymentInfo?.wannabeMember && marketData?.creator;

      if (shouldIncludeCreator) {
        // Check if creator is already in the members list
        const creatorAlreadyExists = filteredMembers.some(
          (member) =>
            member.user.toLowerCase() === marketData.creator.toLowerCase()
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

    // Enhance members with payment status
    return filteredMembers.map((member) => {
      // Only add payment status if payment period is active
      if (!isPaymentPeriodActive || getCurrentInterval <= 0) {
        return member;
      }

      const userKey = member.user.toLowerCase();
      const isPaid = memberPaymentStatus.get(userKey) || false;

      return {
        ...member,
        paymentStatus: {
          isPaid,
          isPaymentDue: true,
          intervalIndex: getCurrentInterval,
        },
      };
    });
  }, [
    memberRequests.length,
    memberRequests.map(m => `${m.id}-${m.state}`).join('|'),
    deploymentData?.kuriMarketDeployeds?.[0]?.wannabeMember,
    marketData?.creator,
    includeCreator,
    filterActiveOnly,
    isPaymentPeriodActive,
    getCurrentInterval,
    depositsSignature, // Use stable signature instead of memberPaymentStatus
  ]);

  // Extract addresses for bulk profile fetching - memoized to prevent infinite loops
  const userAddresses = useMemo(
    () => processedMembers.map((request) => request.user),
    [processedMembers.length, processedMembers.map(m => m.id || m.user).join('|')]
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

  const isLoadingAll =
    queryLoading || (includeCreator ? deploymentLoading : false) || isLoading;
  const hasError =
    queryError || (includeCreator ? deploymentError : null) || error;

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
    acceptMember: acceptMemberSponsored,
    acceptMultipleMembers: acceptMultipleMembersSponsored,
    rejectMember: rejectMemberSponsored,
    isAccepting,
    isRejecting,
    refreshMemberStatus,
    refetch,

    // Raw data (for backward compatibility)
    memberRequests,
    deploymentData,
  };
};
