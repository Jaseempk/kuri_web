import * as React from "react";
import { Share2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { ShareModal } from "../modals/ShareModal";

interface ShareButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  className?: string;
  market: KuriMarket;
}

export const ShareButton = React.forwardRef<
  HTMLButtonElement,
  ShareButtonProps
>(({ isLoading, className, market, ...props }, ref) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-full hover:bg-terracotta/10 hover:text-terracotta",
          isLoading && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={handleClick}
        disabled={isLoading}
        {...props}
      >
        <Share2 className="h-4 w-4" />
        <span className="sr-only">Share</span>
      </Button>

      <ShareModal
        market={market}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
});

ShareButton.displayName = "ShareButton";
