/**
 * Image Generation Service - Web Worker Integration
 * 
 * Manages Web Worker communication for image generation
 * while maintaining integration with existing analytics and error handling.
 */

import { useEffect, useRef } from 'react';
import { KuriMarket } from '../types/market';
import { TemplateType } from '../stores/postCreationStore';
import { eventBus } from '../utils/eventBus';
import { trackEvent } from '../utils/analytics';

interface ImageGenerationResult {
  imageData: string;
  downloadUrl: string;
  generationTime: number;
}


export class ImageGenerationService {
  private static instance: ImageGenerationService;
  private worker: Worker | null = null;
  private isInitialized = false;
  private activeRequests = new Map<string, AbortController>();

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): ImageGenerationService {
    if (!ImageGenerationService.instance) {
      ImageGenerationService.instance = new ImageGenerationService();
    }
    return ImageGenerationService.instance;
  }

  /**
   * Initialize the Web Worker
   */
  private async initializeWorker(): Promise<void> {
    if (this.isInitialized && this.worker) {
      return;
    }

    try {
      // Create worker with correct path for Vite build system
      this.worker = new Worker(
        new URL('../workers/imageGenerator.worker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up worker message handlers
      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      this.isInitialized = true;
      
      console.log('Image generation worker initialized');
    } catch (error) {
      console.error('Failed to initialize image generation worker:', error);
      throw new Error('Web Worker not supported or failed to load');
    }
  }

  /**
   * Generate celebration image
   */
  public async generateImage(
    market: KuriMarket,
    template: TemplateType,
    userAddress: string
  ): Promise<ImageGenerationResult> {
    // Generate unique request ID
    const requestId = `${market.address}-${template}-${Date.now()}`;
    const abortController = new AbortController();
    
    // Store the abort controller for this request
    this.activeRequests.set(requestId, abortController);

    try {
      await this.initializeWorker();

      if (!this.worker) {
        throw new Error('Worker not initialized');
      }

      // Check if already aborted
      if (abortController.signal.aborted) {
        throw new Error('Request was cancelled');
      }

      // Track generation start
      try {
        trackEvent('celebration_image_generation_started' as any, {
          template,
          market_address: market.address,
          participant_count: market.totalParticipants,
          interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
          source: 'post_creation_service',
        });
      } catch (analyticsError) {
        console.warn('Analytics tracking failed:', analyticsError);
      }

      // Emit event bus event
      eventBus.emit('image:generate-start', {
        market,
        template,
        userAddress,
      });

      return new Promise<ImageGenerationResult>((resolve, reject) => {
        const startTime = Date.now();
        let messageHandler: ((e: MessageEvent) => void) | null = null;
        let timeoutId: NodeJS.Timeout | null = null;

        // Cleanup function
        const cleanup = () => {
          if (messageHandler && this.worker) {
            this.worker.removeEventListener('message', messageHandler);
          }
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          this.activeRequests.delete(requestId);
        };

        // Handle abort signal
        const onAbort = () => {
          cleanup();
          reject(new Error('Image generation was cancelled'));
        };

        if (abortController.signal.aborted) {
          onAbort();
          return;
        }

        abortController.signal.addEventListener('abort', onAbort);
        
        // Set up message handler
        messageHandler = (e: MessageEvent) => {
          const { type, data, id } = e.data;

          // Only handle messages for this specific request
          if (id !== requestId) return;

          switch (type) {
            case 'IMAGE_GENERATED':
              cleanup();
              
              // Track successful generation
              try {
                trackEvent('celebration_image_generated' as any, {
                  template,
                  market_address: market.address,
                  participant_count: market.totalParticipants,
                  interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
                  generation_time: data.generationTime,
                  source: 'post_creation_service',
                });
              } catch (analyticsError) {
                console.warn('Analytics tracking failed:', analyticsError);
              }

              // Emit success event
              eventBus.emit('image:generate-complete', {
                imageData: data.imageData,
                downloadUrl: data.downloadUrl,
                generationTime: data.generationTime,
              });

              resolve(data);
              break;

            case 'IMAGE_ERROR':
              cleanup();
              
              // Track error
              try {
                trackEvent('celebration_image_generation_failed' as any, {
                  template,
                  error_message: data.error,
                  market_address: market.address,
                  generation_time: Date.now() - startTime,
                  source: 'post_creation_service',
                });
              } catch (analyticsError) {
                console.warn('Analytics tracking failed:', analyticsError);
              }

              // Emit error event
              eventBus.emit('image:generate-error', {
                error: data.error,
                template,
              });

              reject(new Error(data.error));
              break;

            case 'IMAGE_PROGRESS':
              // Only emit progress for non-aborted requests
              if (!abortController.signal.aborted) {
                eventBus.emit('image:generate-progress', {
                  progress: data.progress,
                  stage: data.stage,
                });
              }
              break;
          }
        };

        // Add message listener
        this.worker!.addEventListener('message', messageHandler);

        // Send generation request to worker
        this.worker!.postMessage({
          type: 'GENERATE_IMAGE',
          id: requestId,
          data: {
            market,
            template,
            userAddress,
            timestamp: Date.now(),
          },
        });

        // Set timeout to prevent hanging
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error('Image generation timeout'));
        }, 30000); // 30 second timeout
      });
    } catch (error) {
      // Clean up on any error
      this.activeRequests.delete(requestId);
      throw error;
    }
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(_e: MessageEvent): void {
    // This is handled by the specific promise handlers in generateImage
    // This method is for any global worker message handling if needed
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Image generation worker error:', error);
    
    try {
      trackEvent('image_generation_worker_error' as any, {
        error_message: error.message,
        filename: error.filename,
        line_number: error.lineno,
        source: 'post_creation_service',
      });
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError);
    }

    // Emit error event
    eventBus.emit('image:generate-error', {
      error: `Worker error: ${error.message}`,
      template: 'unknown' as TemplateType,
    });
  }

  /**
   * Cancel all active requests
   */
  public cancelAllRequests(): void {
    for (const [_requestId, controller] of this.activeRequests) {
      controller.abort();
    }
    this.activeRequests.clear();
  }

  /**
   * Cancel a specific request
   */
  public cancelRequest(market: KuriMarket, template: TemplateType): void {
    for (const [requestId, controller] of this.activeRequests) {
      if (requestId.includes(market.address) && requestId.includes(template)) {
        controller.abort();
        this.activeRequests.delete(requestId);
        break;
      }
    }
  }

  /**
   * Terminate the worker (cleanup)
   */
  public terminate(): void {
    // Cancel all active requests first
    this.cancelAllRequests();
    
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('Image generation worker terminated');
    }
  }

  /**
   * Check if worker is available
   */
  public isWorkerSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  /**
   * Fallback image generation for browsers without Web Worker support
   */
  public async generateImageFallback(
    market: KuriMarket,
    template: TemplateType,
    _userAddress: string
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    
    try {
      trackEvent('celebration_image_fallback_used' as any, {
        template,
        market_address: market.address,
        reason: 'worker_fallback_requested',
        source: 'post_creation_service',
      });
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError);
    }

    // Emit progress events to match worker behavior
    eventBus.emit('image:generate-progress', {
      progress: 20,
      stage: 'Initializing fallback generation...',
    });

    // Small delay to show progress
    await new Promise(resolve => setTimeout(resolve, 200));

    eventBus.emit('image:generate-progress', {
      progress: 50,
      stage: 'Creating canvas...',
    });

    // Create portrait canvas optimized for card design (Instagram Stories/Mobile sharing)
    const canvas = document.createElement('canvas');
    canvas.width = 600;   // Portrait width for mobile sharing
    canvas.height = 800;  // 3:4 aspect ratio for Instagram Stories/portrait
    const ctx = canvas.getContext('2d')!;
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Template-specific rendering with enhanced visuals
    switch (template) {
      case 'hero':
        // Enhanced hero template with gradient background and effects
        await this.renderEnhancedHeroTemplate(ctx, market, canvas.width, canvas.height);
        break;
        
      case 'stats':
        // Stats template - data focused
        ctx.fillStyle = '#F9F5F1'; // Light background
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#8B6F47';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📊 Circle Statistics', 400, 100);
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(market.name || 'New Savings Circle', 400, 180);
        ctx.font = '20px Inter, sans-serif';
        ctx.fillText(`Members: ${market.totalParticipants}`, 400, 240);
        ctx.fillText(`Pool: ${market.kuriAmount} USDC`, 400, 280);
        ctx.fillText(`Frequency: ${market.intervalType === 0 ? 'Weekly' : 'Monthly'}`, 400, 320);
        break;
        
      case 'minimal':
        // Minimal template - clean design
        ctx.fillStyle = '#FFFFFF'; // White background
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#8B6F47';
        ctx.font = '32px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ Circle Created', 400, 200);
        ctx.font = '20px Inter, sans-serif';
        ctx.fillText(market.name || 'New Savings Circle', 400, 260);
        ctx.font = '16px Inter, sans-serif';
        ctx.fillStyle = '#666';
        ctx.fillText(`${market.totalParticipants} members • ${market.kuriAmount} USDC`, 400, 300);
        break;
    }

    eventBus.emit('image:generate-progress', {
      progress: 90,
      stage: 'Finalizing image...',
    });

    const imageData = canvas.toDataURL('image/png');
    
    // Convert canvas to blob for download URL
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      }, 'image/png');
    });
    
    const downloadUrl = URL.createObjectURL(blob);

    eventBus.emit('image:generate-progress', {
      progress: 100,
      stage: 'Complete',
    });

    const generationTime = Date.now() - startTime;

    return {
      imageData,
      downloadUrl,
      generationTime,
    };
  }

  /**
   * Portrait card celebration template matching HTML design exactly
   */
  private async renderEnhancedHeroTemplate(
    ctx: CanvasRenderingContext2D, 
    market: KuriMarket, 
    width: number, 
    height: number
  ): Promise<void> {
    // Kuri brand colors (exact from HTML CSS variables)
    const KURI_COLORS = {
      primary: '#8B6F47',      // --primary-color
      secondary: '#E8DED1',    // --secondary-color
      accent: '#F9F5F1',       // --accent-color
      highlight: '#C84E31',    // --highlight-color
      supporting: '#6B7280'    // --supporting-color
    };

    // 1. BACKGROUND (accent color like HTML body)
    ctx.fillStyle = KURI_COLORS.accent;
    ctx.fillRect(0, 0, width, height);

    // 2. MAIN CARD (full canvas with minimal edge margin)
    const cardMargin = 20;  // Minimal edge margin
    const cardWidth = width - (cardMargin * 2);   // Almost full width
    const cardHeight = height - (cardMargin * 2); // Almost full height
    const cardX = cardMargin;
    const cardY = cardMargin;
    const cardRadius = 24; // rounded-3xl equivalent

    // Card shadow (matching HTML shadow-lg)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    
    // Card background (primary color)
    ctx.fillStyle = KURI_COLORS.primary;
    this.drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';

    // 3. CARD PADDING (p-8 = 32px, scaled up)
    const padding = 40;
    const contentX = cardX + padding;
    const contentWidth = cardWidth - (padding * 2);
    let currentY = cardY + padding;

    // 4. CHECK CIRCLE ICON (w-20 h-20 = 80px, bg-secondary, rounded-full)
    const iconSize = 80;
    const iconX = cardX + cardWidth / 2;
    const iconY = currentY + iconSize / 2;
    
    // Icon background circle (secondary color)
    ctx.fillStyle = KURI_COLORS.secondary;
    ctx.beginPath();
    ctx.arc(iconX, iconY, iconSize / 2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Check circle icon (Material Icons check_circle equivalent)
    ctx.fillStyle = KURI_COLORS.primary;
    ctx.font = '50px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', iconX, iconY);
    
    currentY += iconSize + 30; // mb-6 equivalent

    // 5. MAIN TITLE (text-3xl font-bold = ~48px)
    ctx.font = 'bold 48px Poppins, system-ui, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Circle Created!', cardX + cardWidth / 2, currentY);
    currentY += 60;

    // 6. SUBTITLE (text-secondary mt-2)
    ctx.font = '20px Poppins, system-ui, sans-serif';
    ctx.fillStyle = KURI_COLORS.secondary;
    ctx.fillText("You're all set to go!", cardX + cardWidth / 2, currentY);
    currentY += 50; // mt-8 equivalent

    // 7. STATS CONTAINER (bg-white bg-opacity-10 p-6 rounded-2xl)
    const statsContainerHeight = 240;
    const statsRadius = 16; // rounded-2xl
    const statsPadding = 24; // p-6
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'; // bg-white bg-opacity-10
    this.drawRoundedRect(ctx, contentX, currentY, contentWidth, statsContainerHeight, statsRadius);
    ctx.fill();

    // 8. CIRCLE NAME (text-xl font-semibold, left-aligned)
    ctx.font = 'bold 24px Poppins, system-ui, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    const circleName = market.name || 'Testing Alchemy AA-kit';
    const truncatedName = circleName.length > 25 ? circleName.substring(0, 25) + '...' : circleName;
    ctx.fillText(truncatedName, contentX + statsPadding, currentY + 40);

    // 9. STATS ROW (flex justify-between items-center mt-4)
    const statsRowY = currentY + 80;
    ctx.font = '18px Poppins, system-ui, sans-serif';
    ctx.fillStyle = KURI_COLORS.secondary;
    
    // Members (left side with groups icon)
    ctx.textAlign = 'left';
    ctx.fillText('👥', contentX + statsPadding, statsRowY);
    ctx.fillText(`${market.totalParticipants} Members`, contentX + statsPadding + 35, statsRowY);
    
    // Frequency (right side with calendar icon)
    const intervalText = market.intervalType === 0 ? 'Weekly' : 'Monthly';
    ctx.textAlign = 'right';
    ctx.fillText(intervalText, contentX + contentWidth - statsPadding, statsRowY);
    ctx.fillText('📅', contentX + contentWidth - statsPadding - (intervalText.length * 12), statsRowY);

    // 10. POOL AMOUNT CARD (mt-6 bg-white bg-opacity-20 p-4 rounded-xl text-center)
    const poolCardY = currentY + 120;
    const poolCardHeight = 80;
    const poolCardRadius = 12; // rounded-xl
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; // bg-white bg-opacity-20
    this.drawRoundedRect(ctx, contentX + statsPadding, poolCardY, contentWidth - (statsPadding * 2), poolCardHeight, poolCardRadius);
    ctx.fill();

    // Pool amount content
    ctx.textAlign = 'center';
    const poolCenterX = cardX + cardWidth / 2;
    
    ctx.font = '14px Poppins, system-ui, sans-serif';
    ctx.fillStyle = KURI_COLORS.secondary;
    ctx.fillText('USDC Pool', poolCenterX, poolCardY + 25);
    
    ctx.font = 'bold 36px Poppins, system-ui, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    const poolAmount = (Number(market.kuriAmount) / 1_000_000).toFixed(2);
    ctx.fillText(poolAmount, poolCenterX, poolCardY + 60);

    currentY += statsContainerHeight + 40; // mt-8 equivalent

    // 11. KURI LOGO AND DOMAIN AT BOTTOM
    const bottomY = cardY + cardHeight - 60;
    
    // Try to load and draw Kuri logo
    try {
      await this.loadAndDrawKuriLogo(ctx, cardX + cardWidth / 2 - 60, bottomY, 40);
      // Domain text next to logo
      ctx.font = '16px Poppins, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'left';
      ctx.fillText('kuri.fi', cardX + cardWidth / 2 - 10, bottomY + 8);
    } catch (error) {
      // Fallback: just show domain
      ctx.font = '16px Poppins, system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.textAlign = 'center';
      ctx.fillText('kuri.fi', cardX + cardWidth / 2, bottomY);
    }
  }

  /**
   * Load and draw Kuri logo from public images
   */
  private async loadAndDrawKuriLogo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    maxSize: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let drawWidth = maxSize;
        let drawHeight = maxSize / aspectRatio;
        
        if (drawHeight > maxSize) {
          drawHeight = maxSize;
          drawWidth = maxSize * aspectRatio;
        }
        
        ctx.drawImage(
          img,
          x - drawWidth / 2,
          y - drawHeight / 2,
          drawWidth,
          drawHeight
        );
        resolve();
      };
      
      img.onerror = () => reject(new Error('Failed to load logo'));
      
      // Try to load the logo - adjust path as needed for your build process
      img.src = '/images/KuriLogo.png';
    });
  }

  /**
   * Helper method to draw rounded rectangles
   */
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    radius: number
  ): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

// Export singleton instance
export const imageGenerationService = ImageGenerationService.getInstance();

/**
 * React hook for image generation with automatic cleanup
 */
export function useImageGeneration() {
  const serviceRef = useRef(imageGenerationService);
  const currentRequestRef = useRef<{ market: KuriMarket; template: TemplateType } | null>(null);

  useEffect(() => {
    // Cleanup on unmount - cancel any active requests from this component
    return () => {
      if (currentRequestRef.current) {
        const { market, template } = currentRequestRef.current;
        serviceRef.current.cancelRequest(market, template);
      }
    };
  }, []);

  const generateImage = async (
    market: KuriMarket,
    template: TemplateType,
    userAddress: string
  ): Promise<ImageGenerationResult> => {
    // Cancel previous request from this component if any
    if (currentRequestRef.current) {
      const { market: prevMarket, template: prevTemplate } = currentRequestRef.current;
      serviceRef.current.cancelRequest(prevMarket, prevTemplate);
    }

    // Store current request
    currentRequestRef.current = { market, template };

    try {
      const result = await serviceRef.current.generateImage(market, template, userAddress);
      // Clear current request on success
      currentRequestRef.current = null;
      return result;
    } catch (error) {
      // Clear current request on error
      currentRequestRef.current = null;
      throw error;
    }
  };

  const generateImageFallback = async (
    market: KuriMarket,
    template: TemplateType,
    userAddress: string
  ): Promise<ImageGenerationResult> => {
    return serviceRef.current.generateImageFallback(market, template, userAddress);
  };

  return {
    generateImage,
    isWorkerSupported: serviceRef.current.isWorkerSupported.bind(serviceRef.current),
    generateImageFallback,
    cancelCurrentRequest: () => {
      if (currentRequestRef.current) {
        const { market, template } = currentRequestRef.current;
        serviceRef.current.cancelRequest(market, template);
        currentRequestRef.current = null;
      }
    },
  };
}