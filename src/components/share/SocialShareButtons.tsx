import * as React from "react";
import { Twitter, Send, Mail, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { useShare } from "../../hooks/useShare";
import { cn } from "../../lib/utils";

interface SocialShareButtonsProps {
  market: KuriMarket;
  customMessage?: string;
  onShareComplete?: () => void;
  className?: string;
}

export const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({
  market,
  customMessage,
  onShareComplete,
  className,
}) => {
  const { shareToPlatform, isSharing } = useShare();

  const handleShare = async (
    platform: "TWITTER" | "TELEGRAM" | "WHATSAPP" | "EMAIL"
  ) => {
    try {
      const result = await shareToPlatform(market, platform, { customMessage });
      if (result.success) {
        onShareComplete?.();
      }
    } catch (error) {
      console.error(`Error sharing to ${platform}:`, error);
    }
  };

  return (
    <div className={cn("grid grid-cols-2 gap-2 sm:grid-cols-4", className)}>
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => handleShare("TWITTER")}
        disabled={isSharing}
      >
        <Twitter className="h-4 w-4" />
        <span className="hidden sm:inline">Twitter</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => handleShare("TELEGRAM")}
        disabled={isSharing}
      >
        <Send className="h-4 w-4" />
        <span className="hidden sm:inline">Telegram</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => handleShare("WHATSAPP")}
        disabled={isSharing}
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => handleShare("EMAIL")}
        disabled={isSharing}
      >
        <Mail className="h-4 w-4" />
        <span className="hidden sm:inline">Email</span>
      </Button>
    </div>
  );
};
