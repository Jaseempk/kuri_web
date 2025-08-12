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
        className="flex items-center justify-center gap-1 sm:gap-2 min-h-[40px] text-xs sm:text-sm"
        onClick={() => handleShare("TWITTER")}
        disabled={isSharing}
      >
        <Twitter className="h-4 w-4 flex-shrink-0" />
        <span className="hidden xs:inline sm:hidden">X</span>
        <span className="hidden sm:inline">Twitter</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center justify-center gap-1 sm:gap-2 min-h-[40px] text-xs sm:text-sm"
        onClick={() => handleShare("TELEGRAM")}
        disabled={isSharing}
      >
        <Send className="h-4 w-4 flex-shrink-0" />
        <span className="hidden xs:inline sm:hidden">TG</span>
        <span className="hidden sm:inline">Telegram</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center justify-center gap-1 sm:gap-2 min-h-[40px] text-xs sm:text-sm"
        onClick={() => handleShare("WHATSAPP")}
        disabled={isSharing}
      >
        <Share2 className="h-4 w-4 flex-shrink-0" />
        <span className="hidden xs:inline sm:hidden">WA</span>
        <span className="hidden sm:inline">WhatsApp</span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="flex items-center justify-center gap-1 sm:gap-2 min-h-[40px] text-xs sm:text-sm"
        onClick={() => handleShare("EMAIL")}
        disabled={isSharing}
      >
        <Mail className="h-4 w-4 flex-shrink-0" />
        <span className="hidden xs:inline sm:hidden">Mail</span>
        <span className="hidden sm:inline">Email</span>
      </Button>
    </div>
  );
};
