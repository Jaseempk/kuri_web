import * as React from "react";
import { X } from "lucide-react";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
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
      <DialogContent className="max-w-[90vw] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold pr-8">
            Share {market.name || "Kuri Circle"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share this Kuri savings circle with others through social media, messaging apps, or by copying the link. You can add a custom message and use the QR code for easy mobile sharing.
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 sm:right-4 sm:top-4 h-8 w-8 sm:h-10 sm:w-10"
            onClick={onClose}
            aria-label="Close share modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-3 sm:py-4">
          {/* Custom Message Section */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium">Custom Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to your share..."
              value={customMessage}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setCustomMessage(e.target.value)
              }
              className="min-h-[60px] sm:min-h-[80px] text-sm resize-none"
            />
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share Link</Label>
            <div className="flex gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 text-xs sm:text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button onClick={handleCopyLink} variant="outline" className="px-3 sm:px-4 text-xs sm:text-sm">
                Copy
              </Button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="space-y-2 flex flex-col items-center">
            <Label className="text-sm font-medium">QR Code</Label>
            <QRCode value={shareUrl} size={96} className="sm:w-32 sm:h-32" />
            <span className="text-xs mt-1 sm:mt-2 text-muted-foreground text-center">
              Scan to share on mobile
            </span>
          </div>

          {/* Social Media Share Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Share to Social Media</Label>
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
