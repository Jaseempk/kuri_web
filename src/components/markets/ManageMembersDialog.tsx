import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ManageMembers } from "./ManageMembers";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
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
  const { requestMembership, isRequesting, marketData } = useKuriCore(
    market.address as `0x${string}`
  );
  const { address } = useAccount();
  const [refreshKey, setRefreshKey] = useState(0);

  const isCreator = address?.toLowerCase() === market.creator.toLowerCase();

  useEffect(() => {
    if (open && isCreator) {
      setRefreshKey((prev) => prev + 1);
    }
  }, [open, isCreator]);

  const handleRequestMembership = async () => {
    try {
      await requestMembership();
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
          <Button className="w-full">
            {isCreator ? "Manage Members" : "Request To Join"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreator ? "Manage Members" : "Join Circle"}
          </DialogTitle>
          <DialogDescription>
            {isCreator
              ? "Review and manage membership requests for your circle."
              : "Request to join this Kuri circle and participate in the savings pool."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {isCreator ? (
            <>
              {isReadyToInitialize && (
                <div className="mb-4 p-3 bg-[hsl(var(--forest))]/10 rounded-lg">
                  <p className="text-[hsl(var(--forest))] text-sm">
                    Circle is ready to initialize! You can close this dialog and
                    click the "Initialize Kuri" button.
                  </p>
                </div>
              )}
              <ManageMembers
                key={refreshKey}
                marketAddress={market.address}
                onMemberActionComplete={handleMemberActionComplete}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-center text-muted-foreground">
                By requesting to join, you'll be able to participate in this
                Kuri circle once approved.
              </p>
              <Button
                onClick={handleRequestMembership}
                disabled={isRequesting || !address}
                className="w-48"
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Requesting...
                  </>
                ) : (
                  "Request Membership"
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
