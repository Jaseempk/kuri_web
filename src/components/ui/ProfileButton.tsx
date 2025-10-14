import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import { Plus, User } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useUserUSDCBalance } from "../../hooks/useUSDCBalances";
import { formatUnits } from "viem";
import { USDCDepositModal } from "../modals/USDCDepositModal";
import { CurrencyDisplay } from "./CurrencyDisplay";

const formatAddress = (address: string) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// We'll use CurrencyDisplay component instead of custom formatting

export function ProfileButton() {
  const location = useLocation();
  const { profile, smartAddress: address, account } = useAuthContext();
  const email = account?.user?.email;
  const [showDepositModal, setShowDepositModal] = useState(false);

  const isProfilePath =
    location.pathname.startsWith("/u/") || location.pathname === "/me";

  // Get USDC balance
  const {
    balance,
    isLoading: isLoadingBalance,
    error: balanceError,
  } = useUserUSDCBalance(
    address && address.startsWith("0x") ? (address as `0x${string}`) : undefined
  );

  const handleDepositClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDepositModal(true);
  };

  // OPTION: Return original ProfileButton (for easy revert)
  // Uncomment the lines below and comment out the split button section to revert
  /*
  return (
    <Link to="/me">
      <Button
        variant="outline"
        className={`flex items-center gap-2 hover:bg-[hsl(var(--gold))/10] ${
          isProfilePath
            ? "bg-[hsl(var(--gold))/10] text-[hsl(var(--gold))] border-[hsl(var(--gold))]"
            : "text-muted-foreground"
        }`}
      >
        {profile?.profile_image_url ? (
          <img
            src={profile.profile_image_url}
            alt="Profile"
            className="w-6 h-6 rounded-full border border-[hsl(var(--gold))/20]"
          />
        ) : (
          <User className="w-5 h-5" />
        )}
        <span className="text-sm font-medium hidden md:inline">
          {profile?.display_name || email || "My Profile"}
        </span>
        {address && (
          <span className="text-sm text-muted-foreground hidden md:inline">
            ({formatAddress(address)})
          </span>
        )}
      </Button>
    </Link>
  );
  */

  // Split Button Pattern Implementation
  return (
    <>
      <div className="flex items-center">
        {/* Main Profile Button */}
        <Link to="/me">
          <Button
            variant="outline"
            className={`flex items-center gap-2 hover:bg-[hsl(var(--gold))/10] rounded-r-none border-r-0 ${
              isProfilePath
                ? "bg-[hsl(var(--gold))/10] text-[hsl(var(--gold))] border-[hsl(var(--gold))]"
                : "text-muted-foreground"
            }`}
          >
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt="Profile"
                className="w-6 h-6 rounded-full border border-[hsl(var(--gold))/20]"
              />
            ) : (
              <User className="w-5 h-5" />
            )}
            <span className="text-sm font-medium hidden md:inline">
              {profile?.display_name || email || "My Profile"}
            </span>
          </Button>
        </Link>

        {/* Balance + Action Section */}
        <div className="flex items-center bg-[#f9f4ef] border border-l-0 border-[hsl(var(--gold))] rounded-r-lg overflow-hidden">
          {/* Balance Display */}
          <div className="px-2 py-[9px] text-sm font-medium text-gray-700">
            {isLoadingBalance ? (
              "..."
            ) : balanceError ? (
              "Error"
            ) : (
              <CurrencyDisplay amount={balance} decimals={2} compact />
            )}
          </div>
          
          {/* Add USDC Button */}
          <button
            onClick={handleDepositClick}
            className="px-2 py-[9px] border-l border-[#E8DED1] hover:bg-[#f0e5d6] transition-colors text-red-500 hover:text-red-600"
            title="Add USDC"
          >
            <Plus className="h-5 w-5 stroke-[3] font-bold" />
          </button>
        </div>
      </div>

      {/* USDC Deposit Modal */}
      {address && (
        <USDCDepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          smartWalletAddress={address}
        />
      )}
    </>
  );
}
