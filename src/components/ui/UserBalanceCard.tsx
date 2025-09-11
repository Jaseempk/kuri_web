import { useState, useEffect } from "react";
import { formatUnits } from "viem";
import { useUserUSDCBalance } from "../../hooks/useUSDCBalances";
import { useAuthContext } from "../../contexts/AuthContext";
import { Plus, RefreshCw } from "lucide-react";
import { USDCDepositModal } from "../modals/USDCDepositModal";

export const UserBalanceCard = () => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [dotCount, setDotCount] = useState(1);
  const { smartAddress: userAddress, account } = useAuthContext();

  const {
    balance,
    isLoading: isLoadingBalance,
    error: balanceError,
    refetch: refetchBalance,
  } = useUserUSDCBalance(
    userAddress && userAddress.startsWith("0x")
      ? (userAddress as `0x${string}`)
      : undefined
  );

  // Don't render if user is not connected
  if (!account.isConnected || !userAddress) {
    return null;
  }

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  // Incremental dot animation for loading state
  useEffect(() => {
    if (!isLoadingBalance) {
      setDotCount(1); // Reset when not loading
      return;
    }

    const interval = setInterval(() => {
      setDotCount(prev => prev >= 3 ? 1 : prev + 1);
    }, 600); // Change dots every 600ms

    return () => clearInterval(interval);
  }, [isLoadingBalance]);

  const formatBalance = (balance: bigint) => {
    return Number(formatUnits(balance, 6)).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Loading animation component
  const LoadingDots = () => (
    <div className="flex items-center gap-1">
      <span className="text-gray-600">$</span>
      <div className="flex gap-1 min-w-[24px]">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index < dotCount 
                ? 'bg-gray-600 scale-100' 
                : 'bg-gray-300 scale-75'
            }`}
          />
        ))}
      </div>
    </div>
  );

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
          <div className="text-4xl font-bold text-gray-800">
            {isLoadingBalance ? (
              <LoadingDots />
            ) : balanceError ? (
              <span className="text-red-600 text-xl">Error</span>
            ) : (
              `$${formatBalance(balance)}`
            )}
          </div>
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
          <div className="text-4xl font-bold text-gray-800 mt-1">
            {isLoadingBalance ? (
              <LoadingDots />
            ) : balanceError ? (
              <span className="text-red-600 text-xl">Error</span>
            ) : (
              `$${formatBalance(balance)}`
            )}
          </div>
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

      {/* Custom USDC Deposit Modal */}
      <USDCDepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        smartWalletAddress={userAddress}
      />
    </div>
  );
};
