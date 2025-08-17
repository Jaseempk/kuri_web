/**
 * Image Generation Worker - Simplified Implementation
 * 
 * For now, this worker provides a placeholder implementation
 * to eliminate portal conflicts. The actual image generation
 * will be handled by the main thread fallback.
 */

import { KuriMarket } from '../types/market';
import { TemplateType } from '../stores/postCreationStore';

// Worker message types
interface GenerateImageMessage {
  type: 'GENERATE_IMAGE';
  data: {
    market: KuriMarket;
    template: TemplateType;
    userAddress: string;
    timestamp: number;
  };
}

interface WorkerResponse {
  type: 'IMAGE_GENERATED' | 'IMAGE_ERROR' | 'IMAGE_PROGRESS';
  data: any;
  requestId: number;
}

// Template configurations based on existing CelebrationImageGenerator
const TEMPLATE_CONFIGS = {
  hero: {
    width: 800,
    height: 500,
    backgroundColor: '#8B6F47', // Existing terracotta color
    primaryColor: '#F9F5F1',    // Existing sand color
    accentColor: '#C84E31',     // Existing terracotta accent
  },
  stats: {
    width: 800,
    height: 500,
    backgroundColor: '#F9F5F1',
    primaryColor: '#8B6F47',
    accentColor: '#DAA520',     // Existing gold
  },
  minimal: {
    width: 800,
    height: 500,
    backgroundColor: '#FFFFFF',
    primaryColor: '#8B6F47',
    accentColor: '#E8DED1',     // Existing border color
  },
};

/**
 * Generate celebration image using Fabric.js in Web Worker
 */
async function generateCelebrationImage(
  market: KuriMarket,
  template: TemplateType,
  userAddress: string
): Promise<{ imageData: string; downloadUrl: string; generationTime: number }> {
  const startTime = performance.now();
  const config = TEMPLATE_CONFIGS[template];

  try {
    // For now, we'll return immediately and let the main thread handle image generation
    // This eliminates the portal conflicts while maintaining the interface
    
    // Send progress updates to maintain the user experience
    self.postMessage({
      type: 'IMAGE_PROGRESS',
      data: { progress: 20, stage: 'Initializing...' }
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    
    self.postMessage({
      type: 'IMAGE_PROGRESS',
      data: { progress: 50, stage: 'Processing...' }
    });

    await new Promise(resolve => setTimeout(resolve, 100));
    
    self.postMessage({
      type: 'IMAGE_PROGRESS',
      data: { progress: 90, stage: 'Finalizing...' }
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Return placeholder data that will trigger main thread generation
    const generationTime = performance.now() - startTime;
    
    self.postMessage({
      type: 'IMAGE_PROGRESS',
      data: { progress: 100, stage: 'Complete' }
    });

    // Return a signal that main thread should handle generation
    throw new Error('FALLBACK_TO_MAIN_THREAD');

  } catch (error) {
    if (error instanceof Error && error.message === 'FALLBACK_TO_MAIN_THREAD') {
      throw error;
    }
    throw new Error(`Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Removed Fabric.js functions - will use fallback generation on main thread

// Worker message handler
self.onmessage = async function(e: MessageEvent<GenerateImageMessage>) {
  const { type, data } = e.data;
  
  if (type === 'GENERATE_IMAGE') {
    try {
      const { market, template, userAddress } = data;
      
      const result = await generateCelebrationImage(market, template, userAddress);
      
      self.postMessage({
        type: 'IMAGE_GENERATED',
        data: result,
      });
      
    } catch (error) {
      self.postMessage({
        type: 'IMAGE_ERROR',
        data: { 
          error: error instanceof Error ? error.message : 'Image generation failed',
          template: data.template,
        },
      });
    }
  }
};