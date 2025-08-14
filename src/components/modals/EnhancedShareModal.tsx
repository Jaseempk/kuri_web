import * as React from "react";
import { X, Image as ImageIcon, Link, QrCode } from "lucide-react";
import QRCode from "react-qr-code";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { KuriMarket } from "../../hooks/useKuriMarkets";
import { useShare } from "../../hooks/useShare";
import { SocialShareButtons } from "../share/SocialShareButtons";
import { SimpleTemplateGenerator } from "../share/SimpleTemplateGenerator";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { ShareTemplateData } from "../../utils/simpleTemplateUtils";
import { toast } from "sonner";
import { useAccount } from "wagmi";

interface EnhancedShareModalProps {
  market: KuriMarket;
  isOpen: boolean;
  onClose: () => void;
  // Enhanced props for template generation
  templateData?: Partial<ShareTemplateData>;
  showTemplateTab?: boolean;
  defaultTab?: 'template' | 'link' | 'qr';
}

export const EnhancedShareModal: React.FC<EnhancedShareModalProps> = ({
  market,
  isOpen,
  onClose,
  templateData,
  showTemplateTab = true,
  defaultTab = 'template',
}) => {
  const [customMessage, setCustomMessage] = React.useState("");
  const [selectedPlatform, setSelectedPlatform] = React.useState<'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'story'>('instagram');
  const [generatedImageUrl, setGeneratedImageUrl] = React.useState<string | null>(null);
  
  const { copyShareLink } = useShare();
  const { address } = useAccount();
  const shareUrl = `${window.location.origin}/market/${market.address}`;

  // Build template data with fallbacks
  const fullTemplateData: ShareTemplateData = React.useMemo(() => ({
    username: templateData?.username || `${address?.slice(0,6)}...${address?.slice(-4)}` || 'Anonymous',
    userAvatar: templateData?.userAvatar,
    circleData: {
      name: templateData?.circleData?.name || market.name || 'Savings Circle',
      totalAmount: templateData?.circleData?.totalAmount || market.kuriAmount?.toString() || '0',
      participants: templateData?.circleData?.participants || market.totalParticipants || 0,
      contribution: templateData?.circleData?.contribution || '0',
      interval: templateData?.circleData?.interval || (market.intervalType === 0 ? 'weekly' : 'monthly'),
    },
    marketAddress: templateData?.marketAddress || market.address,
    templateType: 'celebration',
  }), [templateData, market, address]);

  const handleCopyLink = async () => {
    const result = await copyShareLink(market, { customMessage });
    if (result.success) {
      toast.success("Link copied to clipboard!");
    }
  };

  const handleImageGenerated = (dataUrl: string) => {
    setGeneratedImageUrl(dataUrl);
  };

  const handleShareWithImage = () => {
    if (!generatedImageUrl) {
      toast.error('Please generate an image first');
      return;
    }
    
    // Convert data URL to blob and share
    try {
      fetch(generatedImageUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `kuri-circle-${Date.now()}.png`, { type: 'image/png' });
          
          if (navigator.share) {
            navigator.share({
              title: `Join ${fullTemplateData.circleData.name} on Kuri Finance`,
              text: customMessage || `🎉 I just created a new Kuri Circle! Join me and let's build wealth together.`,
              url: shareUrl,
              files: [file],
            });
          } else {
            toast.info('Image generated! Use the download button to save it.');
          }
        });
    } catch (error) {
      toast.error('Failed to share image');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold pr-8">
            Share {market.name || "Kuri Circle"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Share this Kuri savings circle with social media templates, custom messages, QR codes, or direct links.
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

        <Tabs defaultValue={defaultTab} className="space-y-4 overflow-y-auto">
          <TabsList className="grid w-full grid-cols-3">
            {showTemplateTab && (
              <TabsTrigger value="template" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Template</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Link</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Code</span>
            </TabsTrigger>
          </TabsList>

          {/* Template Generation Tab */}
          {showTemplateTab && (
            <TabsContent value="template" className="space-y-4">
              <div className="space-y-4">
                {/* Platform Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Platform</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['instagram', 'twitter', 'facebook', 'linkedin', 'story'] as const).map((platform) => (
                      <Button
                        key={platform}
                        variant={selectedPlatform === platform ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedPlatform(platform)}
                        className="text-xs"
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Message */}
                <div className="space-y-2">
                  <Label htmlFor="template-message" className="text-sm font-medium">
                    Custom Message (Optional)
                  </Label>
                  <Textarea
                    id="template-message"
                    placeholder="Add a personal message for your social media post..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-[60px] text-sm resize-none"
                  />
                </div>

                {/* Template Generator */}
                <SimpleTemplateGenerator
                  data={fullTemplateData}
                  platform={selectedPlatform}
                  onImageGenerated={handleImageGenerated}
                  className="border-t pt-4"
                />

                {/* Share with Image Button */}
                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleShareWithImage}
                    disabled={!generatedImageUrl}
                    className="flex-1 bg-gradient-to-r from-[hsl(var(--terracotta))] to-[hsl(var(--gold))] hover:from-[hsl(var(--terracotta))]/90 hover:to-[hsl(var(--gold))]/90"
                  >
                    Share Image
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Link Sharing Tab */}
          <TabsContent value="link" className="space-y-4">
            <div className="space-y-4">
              {/* Custom Message */}
              <div className="space-y-2">
                <Label htmlFor="link-message" className="text-sm font-medium">
                  Custom Message (Optional)
                </Label>
                <Textarea
                  id="link-message"
                  placeholder="Add a personal message to your share..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
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
                  <Button 
                    onClick={handleCopyLink} 
                    variant="outline" 
                    className="px-3 sm:px-4 text-xs sm:text-sm"
                  >
                    Copy
                  </Button>
                </div>
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
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4">
            <div className="space-y-4 flex flex-col items-center">
              <div className="space-y-2 flex flex-col items-center">
                <Label className="text-sm font-medium">QR Code</Label>
                <div className="p-4 bg-white rounded-lg border shadow-sm">
                  <QRCode value={shareUrl} size={128} className="sm:w-40 sm:h-40" />
                </div>
                <span className="text-xs mt-2 text-muted-foreground text-center">
                  Scan with your phone to share this circle
                </span>
              </div>

              <div className="w-full space-y-2">
                <Label className="text-sm font-medium">Circle Details</Label>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <p><span className="font-medium">Circle:</span> {fullTemplateData.circleData.name}</p>
                  <p><span className="font-medium">Members:</span> {fullTemplateData.circleData.participants}</p>
                  <p><span className="font-medium">Amount:</span> ${fullTemplateData.circleData.totalAmount}</p>
                  <p><span className="font-medium">Frequency:</span> {fullTemplateData.circleData.interval}</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};