import { useState, useCallback } from "react";
import {
  readContract,
  writeContract,
  simulateContract,
  getAccount,
} from "@wagmi/core";
import { KuriCoreABI } from "../../contracts/abis/KuriCore";
import { handleContractError } from "../../utils/errors";
import { config } from "../../config/wagmi";
import { useTransactionStatus } from "../useTransactionStatus";

export enum MembershipStatus {
  NONE = 0,
  PENDING = 1,
  ACCEPTED = 2,
  REJECTED = 3,
}

export const useKuriCore = (kuriAddress?: `0x${string}`) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const account = getAccount(config);
  const { handleTransaction } = useTransactionStatus();

  // Request membership
  const requestMembership = useCallback(async () => {
    if (!kuriAddress || !account.address) throw new Error("Invalid parameters");
    setIsRequesting(true);

    try {
      const { request } = await simulateContract(config, {
        address: kuriAddress,
        abi: KuriCoreABI,
        functionName: "requestMembership",
      });

      const tx = await writeContract(config, request);

      await handleTransaction(tx, {
        loadingMessage: "Requesting membership...",
        successMessage: "Membership requested successfully!",
        errorMessage: "Failed to request membership",
      });

      return tx;
    } catch (error) {
      throw handleContractError(error);
    } finally {
      setIsRequesting(false);
    }
  }, [kuriAddress, account.address, handleTransaction]);

  // Accept member (creator only)
  const acceptMember = useCallback(
    async (memberAddress: `0x${string}`) => {
      if (!kuriAddress || !account.address)
        throw new Error("Invalid parameters");
      setIsAccepting(true);

      try {
        const { request } = await simulateContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "acceptMember",
          args: [memberAddress],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: "Accepting member...",
          successMessage: "Member accepted successfully!",
          errorMessage: "Failed to accept member",
        });

        return tx;
      } catch (error) {
        throw handleContractError(error);
      } finally {
        setIsAccepting(false);
      }
    },
    [kuriAddress, account.address, handleTransaction]
  );

  // Reject member (creator only)
  const rejectMember = useCallback(
    async (memberAddress: `0x${string}`) => {
      if (!kuriAddress || !account.address)
        throw new Error("Invalid parameters");
      setIsRejecting(true);

      try {
        const { request } = await simulateContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "rejectMember",
          args: [memberAddress],
        });

        const tx = await writeContract(config, request);

        await handleTransaction(tx, {
          loadingMessage: "Rejecting member...",
          successMessage: "Member rejected successfully!",
          errorMessage: "Failed to reject member",
        });

        return tx;
      } catch (error) {
        throw handleContractError(error);
      } finally {
        setIsRejecting(false);
      }
    },
    [kuriAddress, account.address, handleTransaction]
  );

  // Get member status
  const getMemberStatus = useCallback(
    async (memberAddress: `0x${string}`) => {
      if (!kuriAddress) return MembershipStatus.NONE;

      try {
        const status = await readContract(config, {
          address: kuriAddress,
          abi: KuriCoreABI,
          functionName: "getMemberStatus",
          args: [memberAddress],
        });

        return status;
      } catch (error) {
        console.error("Error fetching member status:", error);
        return MembershipStatus.NONE;
      }
    },
    [kuriAddress]
  );

  return {
    // Actions
    requestMembership,
    acceptMember,
    rejectMember,
    getMemberStatus,

    // Loading states
    isRequesting,
    isAccepting,
    isRejecting,
  };
};
