import { useState } from "react";
import { useUserUSDCBalance } from "../../hooks/useUSDCBalances";
import { useOptimizedAuth } from "../../hooks/useOptimizedAuth";
import { formatUnits } from "viem";
import { USDCDepositModal } from "../modals/USDCDepositModal";
import { USDCWithdrawModal } from "../modals/USDCWithdrawModal";

export function USDCBalanceSection() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { smartAddress: address } = useOptimizedAuth();
  const { balance, isLoading, error, refetch } = useUserUSDCBalance(address || undefined);

  // Format USDC balance with at least 2 decimal places
  const formatUSDCDisplay = (amount: bigint): string => {
    const formatted = formatUnits(amount, 6);
    const num = parseFloat(formatted);
    
    // If it's a whole number, show .00
    if (num % 1 === 0) {
      return num.toFixed(2);
    }
    
    // If it has decimals, show at least 2 decimal places
    const decimalPlaces = formatted.split('.')[1]?.length || 0;
    return num.toFixed(Math.max(2, Math.min(decimalPlaces, 6)));
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const handleWithdraw = () => {
    setShowWithdrawModal(true);
  };

  const handleWithdrawSuccess = () => {
    refetch();
  };

  if (!address) {
    return null;
  }

  return (
    <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 mx-4 md:hidden">
      <h2 className="text-lg font-bold text-gray-800 mb-4">USDC Balance</h2>
      
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 mr-3 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="material-icons text-white">account_balance_wallet</span>
          </div>
          <div>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ) : error ? (
              <div>
                <p className="text-2xl font-bold text-gray-800">--</p>
                <p className="text-sm text-red-500">Error loading balance</p>
              </div>
            ) : (
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {formatUSDCDisplay(balance)} <span className="text-base font-medium text-gray-500">USDC</span>
                </p>
                <p className="text-sm text-gray-500">≈ ${formatUSDCDisplay(balance)}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={handleDeposit}
          className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-full shadow-md hover:bg-opacity-90 transition duration-300 flex items-center justify-center"
        >
          Deposit
        </button>
        <button 
          onClick={handleWithdraw}
          className="w-full bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-full hover:bg-gray-300 transition duration-300 flex items-center justify-center"
        >
          Withdraw
        </button>
      </div>

      {/* Custom USDC Deposit Modal */}
      {address && (
        <USDCDepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          smartWalletAddress={address}
        />
      )}

      {/* USDC Withdraw Modal */}
      {address && balance !== undefined && (
        <USDCWithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          userBalance={balance}
          onWithdrawSuccess={handleWithdrawSuccess}
        />
      )}
    </div>
  );
}