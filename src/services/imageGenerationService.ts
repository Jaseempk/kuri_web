/**
 * Image Generation Service - Web Worker Integration
 * 
 * Manages Web Worker communication for image generation
 * while maintaining integration with existing analytics and error handling.
 */

import { KuriMarket } from '../types/market';
import { TemplateType } from '../stores/postCreationStore';
import { eventBus } from '../utils/eventBus';
import { trackEvent } from '../utils/analytics';

interface ImageGenerationResult {
  imageData: string;
  downloadUrl: string;
  generationTime: number;
}

interface ImageGenerationProgress {
  progress: number;
  stage: string;
}

export class ImageGenerationService {
  private static instance: ImageGenerationService;
  private worker: Worker | null = null;
  private isInitialized = false;

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
    await this.initializeWorker();

    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    // Track generation start
    trackEvent('celebration_image_generation_started', {
      template,
      market_address: market.address,
      participant_count: market.totalParticipants,
      interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
      source: 'post_creation_service',
    });

    // Emit event bus event
    eventBus.emit('image:generate-start', {
      market,
      template,
      userAddress,
    });

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      // Set up one-time message handlers for this specific generation
      const handleMessage = (e: MessageEvent) => {
        const { type, data } = e.data;

        switch (type) {
          case 'IMAGE_GENERATED':
            this.worker?.removeEventListener('message', handleMessage);
            
            // Track successful generation
            trackEvent('celebration_image_generated', {
              template,
              market_address: market.address,
              participant_count: market.totalParticipants,
              interval_type: market.intervalType === 0 ? 'weekly' : 'monthly',
              generation_time: data.generationTime,
              source: 'post_creation_service',
            });

            // Emit success event
            eventBus.emit('image:generate-complete', {
              imageData: data.imageData,
              downloadUrl: data.downloadUrl,
              generationTime: data.generationTime,
            });

            resolve(data);
            break;

          case 'IMAGE_ERROR':
            this.worker?.removeEventListener('message', handleMessage);
            
            // Track error
            trackEvent('celebration_image_generation_failed', {
              template,
              error_message: data.error,
              market_address: market.address,
              generation_time: Date.now() - startTime,
              source: 'post_creation_service',
            });

            // Emit error event
            eventBus.emit('image:generate-error', {
              error: data.error,
              template,
            });

            reject(new Error(data.error));
            break;

          case 'IMAGE_PROGRESS':
            // Emit progress event
            eventBus.emit('image:generate-progress', {
              progress: data.progress,
              stage: data.stage,
            });
            break;
        }
      };

      this.worker?.addEventListener('message', handleMessage);

      // Send generation request to worker
      this.worker?.postMessage({
        type: 'GENERATE_IMAGE',
        data: {
          market,
          template,
          userAddress,
          timestamp: Date.now(),
        },
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        this.worker?.removeEventListener('message', handleMessage);
        reject(new Error('Image generation timeout'));
      }, 30000); // 30 second timeout
    });
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(e: MessageEvent): void {
    // This is handled by the specific promise handlers in generateImage
    // This method is for any global worker message handling if needed
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error('Image generation worker error:', error);
    
    trackEvent('image_generation_worker_error', {
      error_message: error.message,
      filename: error.filename,
      line_number: error.lineno,
      source: 'post_creation_service',
    });

    // Emit error event
    eventBus.emit('image:generate-error', {
      error: `Worker error: ${error.message}`,
      template: 'unknown' as TemplateType,
    });
  }

  /**
   * Terminate the worker (cleanup)
   */
  public terminate(): void {
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
    userAddress: string
  ): Promise<ImageGenerationResult> {
    const startTime = Date.now();
    
    trackEvent('celebration_image_fallback_used', {
      template,
      market_address: market.address,
      reason: 'worker_fallback_requested',
      source: 'post_creation_service',
    });

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
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
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
import { useEffect, useRef } from 'react';

export function useImageGeneration() {
  const serviceRef = useRef(imageGenerationService);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      // Don't terminate worker on component unmount since it might be used by other components
      // Worker termination should be handled at app level if needed
    };
  }, []);

  return {
    generateImage: serviceRef.current.generateImage.bind(serviceRef.current),
    isWorkerSupported: serviceRef.current.isWorkerSupported.bind(serviceRef.current),
    generateImageFallback: serviceRef.current.generateImageFallback.bind(serviceRef.current),
  };
}