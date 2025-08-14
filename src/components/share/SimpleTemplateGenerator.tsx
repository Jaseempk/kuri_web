import React, { useRef, useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Download, Share2, Loader2 } from 'lucide-react';
import {
  ShareTemplateData,
  generateCelebrationTemplate,
  downloadImage,
  getTemplateSizeForPlatform,
} from '../../utils/simpleTemplateUtils';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface SimpleTemplateGeneratorProps {
  data: ShareTemplateData;
  platform?: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'story';
  onImageGenerated?: (dataUrl: string) => void;
  className?: string;
}

export const SimpleTemplateGenerator: React.FC<SimpleTemplateGeneratorProps> = ({
  data,
  platform = 'instagram',
  onImageGenerated,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  const templateSize = getTemplateSizeForPlatform(platform);

  useEffect(() => {
    generateTemplate();
  }, [data, platform]);

  const generateTemplate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    
    try {
      const dataUrl = await generateCelebrationTemplate(canvas, data, platform);
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