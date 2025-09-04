import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ManageMembers } from "./ManageMembers";
import { useMarketContext } from "../../contexts/MarketContext";
import { useAuthContext } from "../../contexts/AuthContext";
import { useState, useContext } from "react";
import { Loader2 } from "lucide-react";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { Button } from "../ui/button";

interface ManageMembersDialogProps {
  market: KuriMarket;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onMemberActionComplete?: () => void;
}

export const ManageMembersDialog = ({
  market,
  children,
  open,
  onOpenChange,
  onMemberActionComplete,
}: ManageMembersDialogProps) => {
  // Conditionally use MarketContext - only when available (within MarketProvider)
  let marketContext = null;
  let requestMembershipSponsored = null;
  let isLoadingCore = false;
  let marketData = null;
  
  try {
    marketContext = useMarketContext();
    requestMembershipSponsored = marketContext.requestMembershipSponsored;
    isLoadingCore = marketContext.isLoadingCore;
    marketData = marketContext.marketData;
  } catch (error) {
    // Context not available - component is being used outside MarketProvider
    // Use fallback behavior for market list contexts
  }
  
  const isRequesting = isLoadingCore;
  const { smartAddress: address } = useAuthContext();
  const [refreshKey, setRefreshKey] = useState(0);

  const isCreator = address?.toLowerCase() === market.creator.toLowerCase();

  const handleRequestMembership = async () => {
    if (!requestMembershipSponsored) {
      console.warn("requestMembershipSponsored not available - component used outside MarketProvider");
      return;
    }
    
    try {
      await requestMembershipSponsored();
      onMemberActionComplete?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error("Error requesting membership:", error);
    }
  };

  const isReadyToInitialize =
    marketData &&
    marketData.totalActiveParticipantsCount ===
      marketData.totalParticipantsCount;

  const handleMemberActionComplete = () => {
    setRefreshKey((prev) => prev + 1);
    onMemberActionComplete?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button className="w-full py-2 sm:py-3 md:py-4 text-sm sm:text-base font-medium">
            {isCreator ? "Manage Members" : "Request To Join"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] overflow-y-auto mx-auto">
        <DialogHeader className="px-2 sm:px-4 md:px-6">
          <DialogTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-center sm:text-left">
            {isCreator ? "Manage Members" : "Join Circle"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm md:text-base text-center sm:text-left mt-2">
            {isCreator
              ? "Review and manage membership requests for your circle."
              : "Request to join this Kuri circle and participate in the savings pool."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-3 sm:mt-4 md:mt-6 px-2 sm:px-4 md:px-6">
          {isCreator ? (
            <>
              {isReadyToInitialize && (
                <div className="mb-3 sm:mb-4 md:mb-6 p-3 sm:p-4 md:p-6 bg-[hsl(var(--forest))]/10 rounded-xl sm:rounded-2xl border border-[hsl(var(--forest))]/20">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[hsl(var(--forest))] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[hsl(var(--forest))] text-sm sm:text-base font-medium">
                        Circle Ready to Initialize!
                      </p>
                      <p className="text-[hsl(var(--forest))]/80 text-xs sm:text-sm mt-1">
                        You can close this dialog and click the "Initialize
                        Kuri" button to start the circle.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white rounded-xl sm:rounded-2xl border border-[hsl(var(--border))]">
                <ManageMembers
                  key={refreshKey}
                  marketAddress={market.address}
                  onMemberActionComplete={handleMemberActionComplete}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 sm:gap-6 md:gap-8 py-6 sm:py-8 md:py-12">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] flex items-center justify-center">
                <svg
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>

              <div className="text-center max-w-md">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-[hsl(var(--terracotta))] mb-2 sm:mb-3">
                  Join This Circle
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-[hsl(var(--muted-foreground))] leading-relaxed">
                  By requesting to join, you'll be able to participate in this
                  Kuri circle once approved by the creator. You'll contribute
                  regularly and have a chance to win the pool.
                </p>
              </div>
              <Button
                onClick={handleRequestMembership}
                disabled={isRequesting || !address || !requestMembershipSponsored}
                className="w-full max-w-xs sm:max-w-sm py-3 sm:py-4 md:py-6 text-sm sm:text-base md:text-lg font-semibold rounded-xl sm:rounded-2xl bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--ochre))] hover:from-[hsl(var(--ochre))] hover:to-[hsl(var(--terracotta))] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {isRequesting ? (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                    <span>Requesting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      />
                    </svg>
                    <span>Request Membership</span>
                  </div>
                )}
              </Button>
              {!address && (
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] text-center">
                  Please connect your wallet to request membership
                </p>
              )}
              {!requestMembershipSponsored && (
                <p className="text-xs sm:text-sm text-[hsl(var(--muted-foreground))] text-center">
                  Please visit the market detail page to request membership
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
