import { readContract } from "@wagmi/core";
import { KuriCoreABI } from "../contracts/abis/KuriCore";
import { config } from "../config/wagmi";
import { getDefaultChainId } from "../config/contracts";

export interface UserMarketData {
  address: string;
  membershipStatus: number;
  userPaymentStatus: boolean | null;
  isCreator: boolean;
  error?: string;
}

export interface BatchUserDataResult {
  data: Record<string, UserMarketData>;
  errors: string[];
}

/**
 * Check if user is a member of a market before checking payment status
 */
export const checkMembershipStatus = async (
  marketAddress: string,
  userAddress: string
): Promise<number> => {
  const chainId = getDefaultChainId(); // Use environment-configured chain
  
  try {
    const userData = await readContract(config, {
      address: marketAddress as `0x${string}`,
      abi: KuriCoreABI,
      functionName: "userToData",
      args: [userAddress as `0x${string}`],
      chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
    });

    return userData[0] as number;
  } catch (err) {
    // Handle user rejection errors silently
    if (err instanceof Error && err.message.includes("User rejected")) {
      console.warn(`User rejected membership check for ${marketAddress}:`, err);
    } else {
      console.error(`Error checking membership for ${marketAddress}:`, err);
    }
    return 0; // Default to NONE
  }
};

/**
 * Check payment status only if user is an accepted member
 */
export const checkPaymentStatusForMember = async (
  marketAddress: string,
  userAddress: string,
  membershipStatus: number,
  marketState: number
): Promise<boolean | null> => {
  // Only check payment status for ACTIVE markets and ACCEPTED members
  if (marketState !== 1 || membershipStatus !== 1) {
    return null;
  }

  const chainId = getDefaultChainId(); // Use environment-configured chain

  try {
    // Get current interval index
    const intervalCounter = (await readContract(config, {
      address: marketAddress as `0x${string}`,
      abi: KuriCoreABI,
      functionName: "passedIntervalsCounter",
      chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
    })) as number;

    // Validate interval index
    if (intervalCounter < 0 || intervalCounter > 1000) {
      console.warn(
        `Invalid interval counter for market ${marketAddress}: ${intervalCounter}`
      );
      return null;
    }

    // Check if user has paid for this interval
    const hasPaid = (await readContract(config, {
      address: marketAddress as `0x${string}`,
      abi: KuriCoreABI,
      functionName: "hasPaid",
      args: [userAddress as `0x${string}`, BigInt(intervalCounter)],
      chainId: chainId as 84532 | 8453, // Ensure we read from the correct network
    })) as boolean;

    return hasPaid;
  } catch (err) {
    // Handle user rejection errors silently
    if (err instanceof Error && err.message.includes("User rejected")) {
      console.warn(`User rejected payment status check for ${marketAddress}:`, err);
    } else {
      console.error(`Error checking payment status for ${marketAddress}:`, err);
    }
    return null;
  }
};

/**
 * Batch fetch user data for multiple markets
 */
export const batchUserMarketData = async (
  marketAddresses: string[],
  userAddress: string,
  marketStates: number[],
  marketCreators?: string[],
  includePaymentStatus: boolean = true
): Promise<BatchUserDataResult> => {
  if (!userAddress || marketAddresses.length === 0) {
    return { data: {}, errors: [] };
  }

  const results: UserMarketData[] = [];
  const errors: string[] = [];

  // Process markets in parallel
  const promises = marketAddresses.map(async (address, index) => {
    try {
      const marketState = marketStates[index] || 0;
      const marketCreator = marketCreators?.[index];

      // Determine if user is creator
      const isCreator = marketCreator
        ? marketCreator.toLowerCase() === userAddress.toLowerCase()
        : false;

      // First check membership status
      const membershipStatus = await checkMembershipStatus(
        address,
        userAddress
      );

      // Then check payment status if needed and requested
      const userPaymentStatus = includePaymentStatus 
        ? await checkPaymentStatusForMember(
            address,
            userAddress,
            membershipStatus,
            marketState
          )
        : null;

      return {
        address,
        membershipStatus,
        userPaymentStatus,
        isCreator,
      };
    } catch (err) {
      // Handle user rejection errors more gracefully
      if (err instanceof Error && err.message.includes("User rejected")) {
        console.warn(`User rejected data fetch for market ${address}:`, err);
        // Don't add user rejection to errors array as it's expected behavior
      } else {
        const errorMsg = `Failed to fetch user data for market ${address}`;
        console.error(errorMsg, err);
        errors.push(errorMsg);
      }

      // Return default data for failed markets
      return {
        address,
        membershipStatus: 0,
        userPaymentStatus: null,
        isCreator: false,
        error: err instanceof Error && err.message.includes("User rejected") ? undefined : `Failed to fetch user data for market ${address}`,
      };
    }
  });

  const resolvedResults = await Promise.all(promises);

  // Convert to record format
  const data: Record<string, UserMarketData> = {};
  resolvedResults.forEach((result) => {
    data[result.address] = result;
  });

  return { data, errors };
};

/**
 * Filter markets where user data is relevant (creator or member)
 */
export const filterRelevantMarkets = (
  markets: Array<{ address: string; creator: string; state: number }>,
  userAddress: string
): Array<{ address: string; creator: string; state: number }> => {
  if (!userAddress) return [];

  return markets.filter((market) => {
    const isCreator =
      market.creator.toLowerCase() === userAddress.toLowerCase();
    const isActiveMarket = market.state === 1; // ACTIVE markets might have user as member
    const isLaunchMarket = market.state === 0; // INLAUNCH markets might have user as applicant

    // Include if user is creator or if market is in a state where user might be involved
    return isCreator || isActiveMarket || isLaunchMarket;
  });
};

/**
 * Batch contract calls with error handling and retry logic
 */
export const executeBatchContractCalls = async <T>(
  calls: Array<() => Promise<T>>,
  maxRetries: number = 2
): Promise<Array<T | null>> => {
  const executeWithRetry = async (
    call: () => Promise<T>,
    retries: number
  ): Promise<T | null> => {
    try {
      return await call();
    } catch (err) {
      if (retries > 0) {
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return executeWithRetry(call, retries - 1);
      }
      console.error("Contract call failed after retries:", err);
      return null;
    }
  };

  return Promise.all(calls.map((call) => executeWithRetry(call, maxRetries)));
};
