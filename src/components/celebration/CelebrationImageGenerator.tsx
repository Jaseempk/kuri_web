import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import * as fabric from 'fabric';
import { CelebrationImageProps, ExportResult, TemplateType } from './types';
import { processMarketData, validateMarketData } from './utils/dataProcessors';
import { createTemplate, getTemplateConfig } from './templates/templateFactory';
import { exportCanvasAsImage } from './utils/exportUtils';
import { getCachedImage, setCachedImage } from './utils/cacheUtils';

export const CelebrationImageGenerator: React.FC<CelebrationImageProps> = ({
  market,
  userAddress,
  template = 'hero',
  onImageGenerated,
  onError
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onImageGeneratedRef = useRef(onImageGenerated);
  const onErrorRef = useRef(onError);
  const generateImageRef = useRef<((template: TemplateType) => Promise<void>) | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateType>(template);
  const [error, setError] = useState<string>('');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isDisposing, setIsDisposing] = useState(false);

  // Update refs when callbacks change
  useEffect(() => {
    onImageGeneratedRef.current = onImageGenerated;
    onErrorRef.current = onError;
  }, [onImageGenerated, onError]);

  // Cleanup function with proper async disposal and DOM safety
  const cleanup = useCallback(async () => {
    if (isDisposing || !fabricCanvas) return;
    
    setIsDisposing(true);
    try {
      // Only dispose if canvas is still attached to DOM
      if (canvasRef.current && canvasRef.current.parentNode) {
        await fabricCanvas.dispose();
      }
      setFabricCanvas(null);
    } catch (error) {
      console.warn('Canvas disposal failed:', error);
      setFabricCanvas(null);
    } finally {
      setIsDisposing(false);
    }
    
    // Clear canvas element reference safely
    if (canvasRef.current && canvasRef.current.parentNode) {
      delete (canvasRef.current as any).__fabric;
    }
  }, [fabricCanvas, isDisposing]);


  // Internal generate image function
  const generateImageInternal = useCallback(async (templateToUse: TemplateType) => {
    if (!canvasRef.current || !userAddress || !market) {
      setError('Missing required data for image generation');
      return;
    }

    // Prevent multiple simultaneous generations
    if (isGenerating) {
      console.log('Image generation already in progress, skipping...');
      return;
    }

    // Clear any previous errors when starting generation
    setError('');

    try {
      setIsGenerating(true);
      const startTime = performance.now();

      // Check cache first
      const cachedImage = getCachedImage(market.address, templateToUse);
      if (cachedImage) {
        const cachedBlob = await fetch(cachedImage).then(r => r.blob());
        const cachedDownloadUrl = URL.createObjectURL(cachedBlob);
        const cacheTime = performance.now() - startTime;
        
        onImageGeneratedRef.current(cachedImage, cachedDownloadUrl, cacheTime);
        setIsGenerating(false);
        return;
      }

      // Validate market data
      if (!validateMarketData(market)) {
        throw new Error('Invalid market data provided');
      }

      // Process market data
      const processedData = processMarketData(market, userAddress);

      // Detect mobile device
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
      
      // Get template configuration
      const templateConfig = getTemplateConfig(templateToUse, isMobile);

      // Cleanup existing canvas with proper async disposal and DOM safety
      if (fabricCanvas && !isDisposing) {
        setIsDisposing(true);
        try {
          // Only dispose if canvas is still attached to DOM
          if (canvasRef.current && canvasRef.current.parentNode) {
            await fabricCanvas.dispose();
          }
          setFabricCanvas(null);
        } catch (error) {
          console.warn('Failed to dispose existing canvas:', error);
          setFabricCanvas(null);
        } finally {
          setIsDisposing(false);
        }
      }

      // Check and prevent double initialization with better error handling
      if (canvasRef.current && (canvasRef.current as any).__fabric) {
        console.warn('Canvas already has Fabric instance, attempting cleanup and retry');
        try {
          // Force cleanup of existing fabric instance
          delete (canvasRef.current as any).__fabric;
          // Clear canvas content
          const context = canvasRef.current.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup existing canvas:', cleanupError);
          // Don't show error to user, just retry
          return;
        }
      }

      // Force canvas element reset before initialization
      if (canvasRef.current) {
        // Clear any existing canvas content
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
        // Reset canvas size
        canvasRef.current.width = templateConfig.width;
        canvasRef.current.height = templateConfig.height;
      }

      // Initialize new canvas with mobile optimizations
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: templateConfig.width,
        height: templateConfig.height,
        backgroundColor: templateConfig.backgroundColor,
        renderOnAddRemove: false,
        skipTargetFind: true,
        selection: false,
        preserveObjectStacking: true,
        stateful: false,
        // Mobile optimizations
        enableRetinaScaling: !isMobile,
        imageSmoothingEnabled: !isMobile
      });

      setFabricCanvas(canvas);

      // Create and render template
      const templateInstance = createTemplate(templateToUse, canvas, processedData);
      await templateInstance.render();

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Export image
      const result: ExportResult = await exportCanvasAsImage(canvas);
      const generationTime = performance.now() - startTime;

      // Cache the generated image
      setCachedImage(market.address, templateToUse, result.dataURL);

      // Call success callback
      onImageGeneratedRef.current(result.dataURL, result.downloadUrl, generationTime);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      onErrorRef.current?.(new Error(errorMessage));
    } finally {
      setIsGenerating(false);
    }
  }, [market, userAddress, fabricCanvas, isGenerating]);

  // Update the ref whenever generateImageInternal changes
  useEffect(() => {
    generateImageRef.current = generateImageInternal;
  }, [generateImageInternal]);

  // Effect to handle template changes with debouncing
  useEffect(() => {
    if (template !== currentTemplate) {
      setCurrentTemplate(template);
    }
  }, [template, currentTemplate]);

  // Generate image when template changes
  useEffect(() => {
    if (currentTemplate && !isGenerating && market?.address && userAddress) {
      // Clear existing timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
        setDebounceTimeout(null);
      }

      // Set new timeout
      const newTimeout = setTimeout(async () => {
        if (generateImageRef.current) {
          await generateImageRef.current(currentTemplate);
        }
      }, 300);

      setDebounceTimeout(newTimeout);
    }

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
    };
  }, [currentTemplate, market?.address, userAddress]);

  // Cleanup on unmount with proper sequencing
  useEffect(() => {
    return () => {
      // Clear timeout first
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      // Immediate cleanup for Fabric canvas to avoid React portal conflicts
      if (fabricCanvas && !isDisposing && canvasRef.current && canvasRef.current.parentNode) {
        try {
          fabricCanvas.dispose();
        } catch (error) {
          console.warn('Immediate canvas disposal failed:', error);
        }
      }
      
      // Clear Fabric reference to prevent further disposal attempts
      if (canvasRef.current) {
        delete (canvasRef.current as any).__fabric;
      }
    };
  }, [fabricCanvas, debounceTimeout]);

  return (
    <>
      {/* Portal canvas outside modal DOM tree */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(
        <canvas
          ref={canvasRef}
          style={{ 
            position: 'fixed',
            top: '-10000px',
            left: '-10000px',
            width: '1px',
            height: '1px',
            visibility: 'hidden',
            pointerEvents: 'none'
          }}
        />,
        document.body
      )}
      <div className="relative">
      
      {/* Loading state - compact */}
      {isGenerating && (
        <div className="flex items-center justify-center p-2 bg-gray-50 rounded border border-gray-200">
          <div className="flex items-center space-x-1.5">
            <div className="animate-spin rounded-full h-3 w-3 border-2 border-[#C84E31] border-t-transparent" />
            <span className="text-xs text-gray-600">
              Generating...
            </span>
          </div>
        </div>
      )}

      {/* Error state - centered and compact */}
      {error && !isGenerating && (
        <div className="flex items-center justify-center gap-2 p-1.5 bg-red-50 rounded border border-red-200">
          <span className="text-red-600 text-xs">Generation failed</span>
          <button
            onClick={() => generateImageInternal(currentTemplate)}
            className="px-1.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors flex-shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success state - no UI needed as parent component handles image display */}
      {!isGenerating && !error && (
        <div className="hidden">
          {/* Success state is handled by parent component showing the actual image */}
        </div>
      )}
    </div>
    </>
  );
};

export default CelebrationImageGenerator;