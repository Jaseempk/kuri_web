import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ManageMembers } from "./ManageMembers";
import { useKuriCore } from "../../hooks/contracts/useKuriCore";
import { useAccount } from "wagmi";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ManageMembersDialogProps {
  marketAddress: string;
  marketName: string;
  isCreator: boolean;
}

export const ManageMembersDialog = ({
  marketAddress,
  marketName,
  isCreator,
}: ManageMembersDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { requestMembership, isRequesting } = useKuriCore(
    marketAddress as `0x${string}`
  );
  const { address } = useAccount();

  const handleRequestMembership = async () => {
    try {
      await requestMembership();
      setIsOpen(false);
    } catch (error) {
      console.error("Error requesting membership:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-[#D35C2A] text-white hover:bg-[#B84D23]">
          {isCreator ? "Manage Members" : "Request To Join"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isCreator
              ? `Manage Members - ${marketName}`
              : `Join ${marketName}`}
          </DialogTitle>
          <DialogDescription>
            {isCreator
              ? "Review and manage membership requests for your market."
              : "Request to join this Kuri circle and participate in the savings pool."}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {isCreator ? (
            <ManageMembers marketAddress={marketAddress} />
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
