import React, { useRef, useEffect, useState } from 'react';
import { fabric } from "fabric";
import { Button } from '../ui/button';
import { Download, Share2, Loader2 } from 'lucide-react';
import {
  ShareTemplateData,
  TEMPLATE_SIZES,
  BRAND_COLORS,
  TYPOGRAPHY,
  createGradientBackground,
  createBrandText,
  createCircularAvatar,
  createDefaultAvatar,
  addConfettiParticles,
  createStatsCard,
  exportCanvasAsImage,
  downloadImage,
  getTemplateSizeForPlatform,
} from '../../utils/templateUtils';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface ShareTemplateGeneratorProps {
  data: ShareTemplateData;
  platform?: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'story';
  onImageGenerated?: (dataUrl: string) => void;
  className?: string;
}

export const ShareTemplateGenerator: React.FC<ShareTemplateGeneratorProps> = ({
  data,
  platform = 'instagram',
  onImageGenerated,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const templateSize = getTemplateSizeForPlatform(platform);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      width: templateSize.width,
      height: templateSize.height,
      backgroundColor: BRAND_COLORS.background,
    });

    fabricCanvasRef.current = canvas;

    // Generate template on mount
    generateTemplate();

    return () => {
      canvas.dispose();
    };
  }, [data, platform]);

  const generateTemplate = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    
    try {
      // Clear canvas
      canvas.clear();
      canvas.setBackgroundColor(BRAND_COLORS.background, canvas.renderAll.bind(canvas));

      // Create gradient background
      const gradient = createGradientBackground(canvas, [BRAND_COLORS.terracotta, BRAND_COLORS.gold]);
      const background = new fabric.Rect({
        width: canvas.width,
        height: canvas.height,
        fill: gradient,
        selectable: false,
      });
      canvas.add(background);

      // Add decorative elements
      addConfettiParticles(canvas, 15);

      // Create main celebration text
      const celebrationText = createBrandText('🎉 Circle Created!', {
        fontSize: platform === 'story' ? 72 : 48,
        fontFamily: TYPOGRAPHY.display.fontFamily,
        fontWeight: TYPOGRAPHY.display.fontWeight,
        fill: 'white',
        shadow: 'rgba(0,0,0,0.4) 0px 4px 12px',
      });
      celebrationText.set({
        left: canvas.width / 2,
        top: canvas.height * 0.15,
      });
      canvas.add(celebrationText);

      // Create user avatar
      let avatar: fabric.Object;
      if (data.userAvatar) {
        try {
          avatar = await createCircularAvatar(data.userAvatar, platform === 'story' ? 140 : 100);
        } catch (error) {
          avatar = createDefaultAvatar(data.username, platform === 'story' ? 140 : 100);
        }
      } else {
        avatar = createDefaultAvatar(data.username, platform === 'story' ? 140 : 100);
      }
      
      avatar.set({
        left: canvas.width / 2,
        top: canvas.height * 0.32,
      });
      canvas.add(avatar);

      // Username text
      const usernameText = createBrandText(data.username, {
        fontSize: platform === 'story' ? 36 : 28,
        fontFamily: TYPOGRAPHY.elegant.fontFamily,
        fontWeight: TYPOGRAPHY.elegant.fontWeight,
        fill: 'white',
        shadow: 'rgba(0,0,0,0.3) 0px 2px 8px',
      });
      usernameText.set({
        left: canvas.width / 2,
        top: canvas.height * 0.48,
      });
      canvas.add(usernameText);

      // Circle name
      const circleNameText = createBrandText(`"${data.circleData.name}"`, {
        fontSize: platform === 'story' ? 32 : 24,
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontWeight: 600,
        fill: BRAND_COLORS.ivory,
        maxWidth: canvas.width * 0.8,
      });
      circleNameText.set({
        left: canvas.width / 2,
        top: canvas.height * 0.58,
      });
      canvas.add(circleNameText);

      // Stats card
      const statsCard = createStatsCard(
        {
          participants: data.circleData.participants,
          amount: data.circleData.totalAmount,
          interval: data.circleData.interval,
        },
        platform === 'story' ? 350 : 320,
        platform === 'story' ? 140 : 120
      );
      statsCard.set({
        left: canvas.width / 2,
        top: canvas.height * 0.75,
      });
      canvas.add(statsCard);

      // Call to action
      const ctaText = createBrandText('Join my Kuri Circle! 💰', {
        fontSize: platform === 'story' ? 28 : 22,
        fontFamily: TYPOGRAPHY.body.fontFamily,
        fontWeight: 700,
        fill: 'white',
        shadow: 'rgba(0,0,0,0.4) 0px 2px 8px',
      });
      ctaText.set({
        left: canvas.width / 2,
        top: canvas.height * 0.88,
      });
      canvas.add(ctaText);

      // Branding
      const brandText = createBrandText('kuri.finance', {
        fontSize: platform === 'story' ? 20 : 16,
        fontFamily: TYPOGRAPHY.mono.fontFamily,
        fontWeight: TYPOGRAPHY.mono.fontWeight,
        fill: 'rgba(255, 255, 255, 0.8)',
      });
      brandText.set({
        left: canvas.width / 2,
        top: canvas.height * 0.95,
      });
      canvas.add(brandText);

      // Render canvas
      canvas.renderAll();

      // Generate image
      const dataUrl = exportCanvasAsImage(canvas, 'png', 1.0);
      setGeneratedImageUrl(dataUrl);
      onImageGenerated?.(dataUrl);

      toast.success('Template generated successfully!');
    } catch (error) {
      console.error('Error generating template:', error);
      toast.error('Failed to generate template');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImageUrl) return;
    
    const filename = `kuri-circle-${data.username}-${Date.now()}.png`;
    downloadImage(generatedImageUrl, filename);
    toast.success('Image downloaded successfully!');
  };

  const handleRegenerate = () => {
    generateTemplate();
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Canvas Container */}
      <div className="relative bg-white rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: '400px',
            display: 'block',
            margin: '0 auto',
          }}
        />
        
        {/* Loading overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--terracotta))]" />
              <span className="text-sm font-medium">Generating template...</span>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Regenerate
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={!generatedImageUrl || isGenerating}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Platform indicator */}
      <div className="text-center">
        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
          Optimized for {platform.charAt(0).toUpperCase() + platform.slice(1)}
        </span>
      </div>
    </div>
  );
};