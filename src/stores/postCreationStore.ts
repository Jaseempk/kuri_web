/**
 * Post Creation Store - Zustand-based state management
 * 
 * Manages post-creation modal state with integration to existing
 * Kuri market types and sharing functionality.
 */

import { create } from 'zustand';
import { KuriMarket } from '../types/market';

export type TemplateType = 'hero' | 'stats' | 'minimal';

export interface PostCreationState {
  // Modal visibility and lifecycle
  isVisible: boolean;
  isLoading: boolean;
  error: string | null;

  // Market data
  market: KuriMarket | null;

  // Template and image generation
  selectedTemplate: TemplateType;
  generatedImage: string;
  downloadUrl: string;
  imageGenerationTime: number;

  // Sharing state
  customMessage: string;
  isSharing: boolean;
  shareError: string | null;

  // Actions
  showModal: (market: KuriMarket) => void;
  hideModal: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Template management
  setTemplate: (template: TemplateType) => void;
  
  // Image generation
  setGeneratedImage: (image: string, downloadUrl: string, generationTime?: number) => void;
  clearGeneratedImage: () => void;
  
  // Sharing
  setCustomMessage: (message: string) => void;
  setSharing: (sharing: boolean) => void;
  setShareError: (error: string | null) => void;
  
  // Complete reset
  reset: () => void;
}

const initialState = {
  isVisible: false,
  isLoading: false,
  error: null,
  market: null,
  selectedTemplate: 'hero' as TemplateType,
  generatedImage: '',
  downloadUrl: '',
  imageGenerationTime: 0,
  customMessage: '',
  isSharing: false,
  shareError: null,
};

export const usePostCreationStore = create<PostCreationState>((set, get) => ({
  ...initialState,

  showModal: (market: KuriMarket) => {
    set({ 
      isVisible: true, 
      market,
      // Reset state for new modal instance
      error: null,
      generatedImage: '',
      downloadUrl: '',
      customMessage: '',
      isSharing: false,
      shareError: null,
      imageGenerationTime: 0,
    });
  },

  hideModal: () => {
    const state = get();
    
    // Clean up download URL if it exists
    if (state.downloadUrl) {
      try {
        URL.revokeObjectURL(state.downloadUrl);
      } catch (error) {
        console.warn('Failed to revoke download URL:', error);
      }
    }
    
    set({ 
      isVisible: false,
      // Keep some data for potential re-opening
      error: null,
      isSharing: false,
      shareError: null,
    });
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),

  setTemplate: (template: TemplateType) => {
    set({ selectedTemplate: template });
    
    // Clear existing image when template changes to trigger regeneration
    const state = get();
    if (state.generatedImage) {
      set({ 
        generatedImage: '', 
        downloadUrl: '',
        imageGenerationTime: 0,
      });
    }
  },

  setGeneratedImage: (image: string, downloadUrl: string, generationTime = 0) => {
    // Clean up previous download URL
    const currentUrl = get().downloadUrl;
    if (currentUrl && currentUrl !== downloadUrl) {
      try {
        URL.revokeObjectURL(currentUrl);
      } catch (error) {
        console.warn('Failed to cleanup previous download URL:', error);
      }
    }
    
    set({ 
      generatedImage: image, 
      downloadUrl,
      imageGenerationTime: generationTime,
      error: null, // Clear any previous errors
    });
  },

  clearGeneratedImage: () => {
    const state = get();
    
    // Clean up download URL
    if (state.downloadUrl) {
      try {
        URL.revokeObjectURL(state.downloadUrl);
      } catch (error) {
        console.warn('Failed to cleanup download URL:', error);
      }
    }
    
    set({ 
      generatedImage: '', 
      downloadUrl: '',
      imageGenerationTime: 0,
    });
  },

  setCustomMessage: (message: string) => set({ customMessage: message }),
  
  setSharing: (sharing: boolean) => set({ isSharing: sharing }),
  
  setShareError: (error: string | null) => set({ shareError: error }),

  reset: () => {
    const state = get();
    
    // Clean up download URL before reset
    if (state.downloadUrl) {
      try {
        URL.revokeObjectURL(state.downloadUrl);
      } catch (error) {
        console.warn('Failed to cleanup download URL during reset:', error);
      }
    }
    
    set(initialState);
  },
}));

/**
 * Computed selectors for derived state
 */
export const usePostCreationSelectors = () => {
  const store = usePostCreationStore();
  
  return {
    // Check if modal is ready to display
    isReady: store.market !== null && !store.isLoading,
    
    // Check if image generation is in progress
    isGeneratingImage: store.isLoading && !store.generatedImage,
    
    // Check if sharing is available
    canShare: store.generatedImage !== '' && !store.isSharing,
    
    // Get share URL for current market
    shareUrl: store.market 
      ? `${window.location.origin}/markets/${store.market.address}`
      : '',
    
    // Get formatted market info for sharing
    shareTitle: store.market 
      ? `🎉 I just created a Kuri Circle: ${store.market.name || 'New Circle'}`
      : '',
    
    // Get default share message
    defaultShareMessage: store.market
      ? `Join my savings circle "${store.market.name || 'New Circle'}" and let's achieve our financial goals together! 💰`
      : '',
  };
};