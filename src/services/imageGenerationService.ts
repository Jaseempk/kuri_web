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

    // Create canvas with template-specific styling
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 500;
    const ctx = canvas.getContext('2d')!;
    
    // Template-specific rendering
    switch (template) {
      case 'hero':
        // Hero template - party style
        ctx.fillStyle = '#8B6F47'; // Terracotta background
        ctx.fillRect(0, 0, 800, 500);
        ctx.fillStyle = '#F9F5F1';
        ctx.font = 'bold 48px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 Circle Created!', 400, 150);
        ctx.font = '32px Inter, sans-serif';
        ctx.fillText(market.name || 'New Savings Circle', 400, 220);
        ctx.font = '24px Inter, sans-serif';
        ctx.fillText(`${market.totalParticipants} Members • ${market.intervalType === 0 ? 'Weekly' : 'Monthly'}`, 400, 280);
        ctx.fillText(`${market.kuriAmount} USDC Pool`, 400, 320);
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