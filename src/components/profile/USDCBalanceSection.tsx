import { useState } from "react";
import { useUserUSDCBalance } from "../../hooks/useUSDCBalances";
import { useAuthContext } from "../../contexts/AuthContext";
import { USDCDepositModal } from "../modals/USDCDepositModal";
import { USDCWithdrawModal } from "../modals/USDCWithdrawModal";
import { CurrencyDisplay } from "../ui/CurrencyDisplay";
import { CurrencyToggle, CurrencyRateDisplay } from "../ui/CurrencyToggle";

export function USDCBalanceSection() {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const { smartAddress: address } = useAuthContext();
  const { balance, isLoading, error, refetch } = useUserUSDCBalance(
    address && address.startsWith("0x") ? (address as `0x${string}`) : undefined
  );

  // We'll use CurrencyDisplay component instead of custom formatting

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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800">USDC Balance</h2>
        <CurrencyToggle compact showRefresh />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 mr-3 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="material-icons text-white">
              account_balance_wallet
            </span>
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
                  <CurrencyDisplay amount={balance} decimals={2} />
                </p>
                <CurrencyRateDisplay className="text-sm text-gray-500 mt-1" />
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
