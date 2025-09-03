import { useState } from "react";
import { motion } from "framer-motion";
import { formatUnits } from "viem";
import { KuriUserProfile } from "../../types/user";
import { useUserUSDCBalance } from "../../hooks/useUSDCBalances";
import { useOptimizedAuth } from "../../hooks/useOptimizedAuth";
import { USDCDepositModal } from "../modals/USDCDepositModal";

interface ProfileHeaderSectionProps {
  profile: KuriUserProfile;
  totalCircles?: number;
}

export function ProfileHeaderSection({ profile, totalCircles = 0 }: ProfileHeaderSectionProps) {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const { smartAddress } = useOptimizedAuth();
  const { balance, isLoading: isLoadingBalance, error: balanceError } = useUserUSDCBalance(smartAddress || undefined);


  const formatDateMobile = (date: Date) => {
    const formatted = new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
    // Convert to lowercase month and 2-digit year (e.g., "jan 25")
    const [month, year] = formatted.split(' ');
    return `${month.toLowerCase()} ${year.slice(-2)}`;
  };

  const formatUSDCDisplay = (amount: bigint): string => {
    const formatted = formatUnits(amount, 6);
    const num = parseFloat(formatted);
    
    if (num % 1 === 0) {
      return num.toFixed(2);
    }
    
    const decimalPlaces = formatted.split('.')[1]?.length || 0;
    return num.toFixed(Math.max(2, Math.min(decimalPlaces, 6)));
  };

  const handleDeposit = () => {
    setShowDepositModal(true);
  };

  const handleWithdraw = () => {
    console.log("Withdraw button clicked");
  };

  const statsMobile = [
    {
      value: profile.reputation_score || 0,
      label: "Reputation"
    },
    {
      value: totalCircles,
      label: "Total Circles"
    },
    {
      value: formatDateMobile(profile.created_at),
      label: "Member Since"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-6 mx-4 mt-6 shadow-lg md:p-8 lg:p-12 md:mt-8 relative overflow-hidden"
    >
      <div className="flex flex-col items-center gap-4 relative z-10 md:flex-row md:items-center md:gap-6 lg:gap-8">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md flex-shrink-0 md:w-28 md:h-28 lg:w-32 lg:h-32">
            <img
              src={profile.profile_image_url || "/default-avatar.png"}
              alt={profile.display_name ?? "User Profile"}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Online indicator for mobile/tablet */}
          <span className="absolute bottom-1 right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white md:hidden"></span>
        </div>
        
        {/* Profile Info */}
        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-gray-800 mb-1 md:text-3xl lg:text-4xl md:text-foreground">
            {profile.display_name}
          </h1>
          <p className="text-gray-500 md:text-base lg:text-lg md:text-muted-foreground">
            @{profile.username}
          </p>
        </div>
      </div>
      
      {/* Mobile/Tablet Stats (integrated into profile card) */}
      <div className="mt-8 grid grid-cols-3 gap-2 text-center border-t pt-6 md:hidden">
        {statsMobile.map((stat) => (
          <div key={stat.label}>
            <p className="text-xl font-bold text-gray-800 break-words">
              {stat.value}
            </p>
            <p className="text-xs text-gray-500">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* USDC Balance Section (Desktop) */}
      {smartAddress && (
        <div className="hidden md:block mt-6 border-t pt-6">
          <div className="flex items-center justify-between">
            {/* Balance Display */}
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="material-icons text-primary">account_balance_wallet</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">USDC Balance</p>
                {isLoadingBalance ? (
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-24"></div>
                  </div>
                ) : balanceError ? (
                  <p className="text-lg font-bold text-red-600">Error</p>
                ) : (
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {formatUSDCDisplay(balance)} <span className="text-base font-medium text-muted-foreground">USDC</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleDeposit}
                className="bg-primary/90 text-primary-foreground font-semibold py-3 px-6 rounded-full shadow-md hover:bg-primary transition duration-300 flex items-center"
              >
                <span className="material-icons mr-2 text-base">south_west</span>
                Deposit
              </button>
              <button 
                onClick={handleWithdraw}
                className="bg-muted text-foreground font-semibold py-3 px-6 rounded-full hover:bg-muted/80 transition duration-300 flex items-center"
              >
                <span className="material-icons mr-2 text-base">north_east</span>
                Withdraw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom USDC Deposit Modal */}
      {smartAddress && (
        <USDCDepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          smartWalletAddress={smartAddress}
        />
      )}
    </motion.div>
  );
}