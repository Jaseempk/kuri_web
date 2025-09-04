import { Copy, Check, ExternalLink, Info } from "lucide-react";
import { toast } from "sonner";
import { useClipboard } from "../../hooks/useClipboard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { getCurrentNetworkConfig, getContractAddress, getDefaultChainId } from "../../config/contracts";

interface USDCDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  smartWalletAddress: string;
}

const networkConfig = getCurrentNetworkConfig();
const USDC_CONTRACT_ADDRESS = getContractAddress(getDefaultChainId(), 'USDC');
const NETWORK_NAME = networkConfig.name;
const BLOCK_EXPLORER_URL = `${networkConfig.blockExplorer}/address/${USDC_CONTRACT_ADDRESS}`;

export const USDCDepositModal = ({
  isOpen,
  onClose,
  smartWalletAddress,
}: USDCDepositModalProps) => {
  const { copyToClipboard, isCopied } = useClipboard();

  const handleCopyAddress = async () => {
    try {
      await copyToClipboard(smartWalletAddress);
      toast.success("Wallet address copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy address");
    }
  };

  const handleCopyUSDCAddress = async () => {
    try {
      await copyToClipboard(USDC_CONTRACT_ADDRESS);
      toast.success("USDC contract address copied!");
    } catch (error) {
      toast.error("Failed to copy USDC address");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[400px] p-0 gap-0">
        <DialogHeader className="p-4 pb-3">
          <DialogTitle className="text-lg font-bold text-[#4E342E]">
            Add USDC
          </DialogTitle>
          <DialogDescription className="text-[#8D6E63] text-sm">
            Copy your wallet address to deposit USDC
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-4">

          {/* Wallet Address Section */}
          <div>
            <label className="block text-sm font-medium text-[#4E342E] mb-2">
              Your Wallet Address
            </label>
            <div className="bg-[#F9F6F1] border border-[#D1C4B0] rounded-lg p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-[#4E342E] break-all">
                    {smartWalletAddress}
                  </p>
                </div>
                <Button
                  onClick={handleCopyAddress}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 border-[#8D6E63] text-[#8D6E63] hover:bg-[#8D6E63] hover:text-white"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-amber-700">
                  <span className="font-medium">Only send USDC on {NETWORK_NAME}.</span> Sending other tokens or wrong network may result in loss.
                </p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={handleCopyAddress}
              className="w-full bg-[#8D6E63] text-white hover:bg-[#795548]"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Address Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Address
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};