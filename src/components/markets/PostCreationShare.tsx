import { useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";
import { useShare } from "../../hooks/useShare";
import { useClipboard } from "../../hooks/useClipboard";
import { KuriMarket } from "../../types/market";

interface PostCreationShareProps {
  market: KuriMarket;
  onClose: () => void;
  onViewMarket: () => void;
}

export const PostCreationShare = ({
  market,
  onClose,
  onViewMarket,
}: PostCreationShareProps) => {
  const [customMessage, setCustomMessage] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const { share } = useShare();
  const { copyToClipboard } = useClipboard();

  const shareUrl = `${window.location.origin}/markets/${market.address}`;

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      await share({
        title: market.name,
        text: customMessage || `Join my Kuri circle: ${market.name}`,
        url: shareUrl,
      });
      toast.success("Shared successfully!");
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        toast.error("Failed to share");
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full sm:max-w-md mx-4 backdrop-blur-xl bg-[#F5F5DC]/90 border border-[#B8860B]/20 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="space-y-4 sm:space-y-6"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-center space-y-2"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-[#C84E31]">
              Circle Created Successfully!
            </h2>
            <p className="text-[#B8860B]">
              Share your circle with your community
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center"
          >
            <div className="relative p-3 sm:p-4 rounded-2xl bg-[#F5F5DC] border border-[#B8860B]/30 shadow-lg">
              <QRCodeSVG
                value={shareUrl}
                size={160}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl"
                bgColor="transparent"
              />
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#C84E31]/5 to-[#B8860B]/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 pr-16 rounded-xl bg-[#F5F5DC] border border-[#B8860B]/30 focus:outline-none focus:ring-2 focus:ring-[#C84E31] focus:border-transparent text-sm truncate min-w-0"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopyLink}
                className="absolute right-2 p-1.5 rounded-lg bg-[#C84E31]/10 hover:bg-[#C84E31]/20 text-[#C84E31] transition-colors flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="relative">
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a custom message (optional)"
                className="w-full px-4 py-2 rounded-xl bg-[#F5F5DC] border border-[#B8860B]/30 focus:outline-none focus:ring-2 focus:ring-[#C84E31] focus:border-transparent resize-none"
                rows={2}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 bg-[#C84E31] hover:bg-[#C84E31]/90 text-white hover:text-white rounded-xl py-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <AnimatePresence mode="wait">
                {isSharing ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sharing...
                  </motion.div>
                ) : (
                  <motion.div
                    key="share"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share Circle
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            <Button
              onClick={onViewMarket}
              variant="outline"
              className="flex-1 border-2 border-[#B8860B] text-[#B8860B] hover:bg-[#B8860B]/10 rounded-xl py-2 font-semibold transition-all duration-300"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Circle
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
