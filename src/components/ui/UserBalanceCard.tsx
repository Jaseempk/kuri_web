import { useModal } from "@getpara/react-sdk";
import { formatUnits } from "viem";
import { useUserUSDCBalance } from "../../hooks/useUSDCBalances";
import { useOptimizedAuth } from "../../hooks/useOptimizedAuth";
import { Plus, RefreshCw } from "lucide-react";

export const UserBalanceCard = () => {
  const { openModal } = useModal();
  const { smartAddress: userAddress, account } = useOptimizedAuth();

  const {
    balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance,
  } = useUserUSDCBalance(userAddress || undefined);

  // Don't render if user is not connected
  if (!account.isConnected || !userAddress) {
    return null;
  }

  const handleDeposit = () => {
    // Open Para's account modal for deposit functionality
    openModal({ step: "ACCOUNT_MAIN" });
  };

  const formatBalance = (balance: bigint) => {
    return Number(formatUnits(balance, 6)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="bg-[#f9f4ef] rounded-2xl p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Mobile Layout */}
      <div className="sm:hidden">
        {/* Top row: Title and Button */}
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm text-gray-500">Your USDC Balance</p>
          <button
            onClick={handleDeposit}
            className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition duration-300 flex items-center text-sm"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add USDC
          </button>
        </div>

        {/* Balance - Close to label */}
        <div className="mb-1">
          <p className="text-4xl font-bold text-gray-800">
            {isLoadingBalance ? (
              <span className="animate-pulse">Loading...</span>
            ) : balanceError ? (
              <span className="text-red-600 text-xl">Error</span>
            ) : (
              `$${formatBalance(balance)}`
            )}
          </p>
        </div>

        {/* Wallet address */}
        <div className="mb-4">
          <span className="text-xs text-gray-500">
            Wallet: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
          </span>
        </div>

        {/* Refresh button - separate group */}
        {!isLoadingBalance && !balanceError && (
          <div>
            <button
              onClick={refetchBalance}
              className="text-xs text-red-500 hover:text-red-700 flex items-center transition-colors"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </button>
          </div>
        )}
      </div>

      {/* Desktop Layout - Keep existing */}
      <div className="hidden sm:flex sm:flex-row justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Your USDC Balance</p>
          <p className="text-4xl font-bold text-gray-800 mt-1">
            {isLoadingBalance ? (
              <span className="animate-pulse">Loading...</span>
            ) : balanceError ? (
              <span className="text-red-600 text-xl">Error</span>
            ) : (
              `$${formatBalance(balance)}`
            )}
          </p>
          <div className="flex items-center mt-2 space-x-2">
            <span className="text-xs text-gray-500">
              Wallet: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </span>
            {!isLoadingBalance && !balanceError && (
              <button
                onClick={refetchBalance}
                className="text-xs text-red-500 hover:text-red-700 flex items-center transition-colors"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleDeposit}
          className="bg-red-500 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-red-600 transition duration-300 flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add USDC
        </button>
      </div>
    </div>
  );
};
