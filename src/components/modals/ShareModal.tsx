import * as React from "react";
import { X } from "lucide-react";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { useShare } from "../../hooks/useShare";
import { SocialShareButtons } from "../share/SocialShareButtons";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

interface ShareModalProps {
  market: KuriMarket;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  market,
  isOpen,
  onClose,
}) => {
  const [customMessage, setCustomMessage] = React.useState("");
  const { copyShareLink } = useShare();
  const shareUrl = `${window.location.origin}/market/${market.address}`;

  const handleCopyLink = async () => {
    const result = await copyShareLink(market, { customMessage });
    if (result.success) {
      toast.success("Link copied to clipboard!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Share {market.name || "Kuri Circle"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Custom Message Section */}
          <div className="space-y-2">
            <Label htmlFor="message">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your share..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button onClick={handleCopyLink} variant="outline">
                Copy
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-2 flex flex-col items-center">
            <Label>QR Code</Label>
            <QRCode value={shareUrl} size={128} />
            <span className="text-xs mt-2 text-muted-foreground">
              Scan to share on mobile
            </span>
          </div>

          {/* Social Media Share Section */}
          <div className="space-y-2">
            <Label>Share to Social Media</Label>
            <SocialShareButtons
              market={market}
              customMessage={customMessage}
              onShareComplete={onClose}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
