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

interface ManageMembersDialogProps {
  marketAddress: string;
  marketName: string;
}

export const ManageMembersDialog = ({
  marketAddress,
  marketName,
}: ManageMembersDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Manage Members
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Members - {marketName}</DialogTitle>
          <DialogDescription>
            Review and manage membership requests for your market.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <ManageMembers marketAddress={marketAddress} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
