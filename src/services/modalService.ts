/**
 * Modal Service - Portal-free modal management
 * 
 * This service eliminates React portal conflicts by using native DOM APIs
 * while maintaining integration with the existing Kuri design system.
 */

interface ModalOptions {
  className?: string;
  preventBackdropClose?: boolean;
  onClose?: () => void;
  zIndex?: number;
}

interface ModalElements {
  overlay: HTMLElement;
  container: HTMLElement;
  content: HTMLElement;
}

export class ModalService {
  private static instance: ModalService;
  private activeModal: ModalElements | null = null;
  private isOpen = false;
  private options: ModalOptions = {};

  private constructor() {
    // Singleton pattern to prevent multiple modal instances
  }

  public static getInstance(): ModalService {
    if (!ModalService.instance) {
      ModalService.instance = new ModalService();
    }
    return ModalService.instance;
  }

  /**
   * Show modal with native DOM manipulation
   * Integrates with existing Kuri design tokens and responsive system
   */
  public show(contentElement: HTMLElement, options: ModalOptions = {}): void {
    if (this.isOpen) {
      this.hide(); // Close existing modal first
    }

    this.options = options;
    this.createModalElements();
    this.setupEventListeners();
    this.renderContent(contentElement);
    this.applyKuriDesignSystem();
    this.handleResponsivePositioning();
    
    // Add to DOM and trigger show animation
    document.body.appendChild(this.activeModal!.overlay);
    this.isOpen = true;
    
    // Trigger animation after DOM insertion
    requestAnimationFrame(() => {
      this.activeModal!.overlay.style.opacity = '1';
      this.activeModal!.container.style.transform = 'scale(1)';
    });
  }

  /**
   * Hide modal with safe cleanup
   */
  public hide(): void {
    if (!this.isOpen || !this.activeModal) return;

    const { overlay, container } = this.activeModal;
    
    // Animate out (but don't wait)
    overlay.style.opacity = '0';
    container.style.transform = 'scale(0.95)';
    
    // Immediate cleanup - no setTimeout to avoid race conditions
    requestAnimationFrame(() => {
      this.cleanup();
      if (this.options.onClose) {
        this.options.onClose();
      }
    });
  }

  /**
   * Create modal DOM structure using Kuri design patterns
   */
  private createModalElements(): void {
    // Overlay - matches PostCreationShare backdrop styling
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: ${this.options.zIndex || 999999999};
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

    // Container - responsive width without calc() conflicts
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      width: 100%;
      max-width: 400px;
      max-height: 90vh;
      background: rgba(245, 245, 220, 0.95);
      border: 1px solid rgba(184, 134, 11, 0.2);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      overflow-y: auto;
      transform: scale(0.95);
      transition: transform 0.2s ease;
    `;

    // Content wrapper
    const content = document.createElement('div');
    content.style.cssText = `
      width: 100%;
      height: 100%;
    `;

    container.appendChild(content);
    overlay.appendChild(container);

    this.activeModal = { overlay, container, content };
  }

  /**
   * Apply responsive design matching existing Kuri breakpoints
   */
  private handleResponsivePositioning(): void {
    if (!this.activeModal) return;

    const { overlay, container } = this.activeModal;
    
    // Match existing responsive patterns from MarketList.tsx
    const updateForViewport = () => {
      const vw = window.innerWidth;
      
      if (vw <= 375) {
        // Small mobile - matches xs:px-4 pattern
        overlay.style.padding = '4px';
        container.style.maxWidth = '100%';
        container.style.maxHeight = '95vh';
      } else if (vw <= 768) {
        // Mobile - matches sm: breakpoint
        overlay.style.padding = '8px';
        container.style.maxWidth = '100%';
        container.style.maxHeight = '90vh';
      } else {
        // Desktop - matches lg: breakpoint
        overlay.style.padding = '16px';
        container.style.maxWidth = '400px';
        container.style.maxHeight = '90vh';
      }
    };

    updateForViewport();
    window.addEventListener('resize', updateForViewport);
  }

  /**
   * Apply Kuri design system tokens to match existing components
   */
  private applyKuriDesignSystem(): void {
    if (!this.activeModal) return;

    const { container } = this.activeModal;
    
    // Apply design tokens from index.css and tailwind.config.js
    container.style.setProperty('font-family', 'Inter, General Sans, system-ui, sans-serif');
    container.style.setProperty('color', 'hsl(30, 25%, 15%)'); // --foreground
    
    // Apply scrollbar styling to match existing system
    const style = document.createElement('style');
    style.textContent = `
      .kuri-modal-content::-webkit-scrollbar {
        width: 8px;
      }
      .kuri-modal-content::-webkit-scrollbar-track {
        background: hsl(35, 40%, 90%);
      }
      .kuri-modal-content::-webkit-scrollbar-thumb {
        background: hsl(18, 80%, 45%);
        border-radius: 9999px;
      }
      .kuri-modal-content::-webkit-scrollbar-thumb:hover {
        background: hsl(18, 80%, 35%);
      }
    `;
    document.head.appendChild(style);
    container.classList.add('kuri-modal-content');
  }

  /**
   * Setup event listeners for backdrop click and keyboard
   */
  private setupEventListeners(): void {
    if (!this.activeModal) return;

    const { overlay } = this.activeModal;

    // Backdrop click handler - native implementation without lifecycle conflicts
    const handleBackdropClick = (e: MouseEvent) => {
      if (e.target === overlay && !this.options.preventBackdropClose) {
        this.hide();
      }
    };

    // Keyboard event handler
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !this.options.preventBackdropClose) {
        this.hide();
      }
    };

    overlay.addEventListener('click', handleBackdropClick);
    document.addEventListener('keydown', handleKeydown);

    // Store references for cleanup
    (overlay as any).__backdropHandler = handleBackdropClick;
    (overlay as any).__keydownHandler = handleKeydown;
  }

  /**
   * Render content into modal
   */
  private renderContent(contentElement: HTMLElement): void {
    if (!this.activeModal) return;
    
    this.activeModal.content.appendChild(contentElement);
  }

  /**
   * Safe cleanup without portal conflicts
   */
  private cleanup(): void {
    if (!this.activeModal) return;

    const { overlay } = this.activeModal;

    // Remove event listeners first
    if ((overlay as any).__backdropHandler) {
      overlay.removeEventListener('click', (overlay as any).__backdropHandler);
    }
    if ((overlay as any).__keydownHandler) {
      document.removeEventListener('keydown', (overlay as any).__keydownHandler);
    }

    // Enhanced DOM removal safety for React integration
    try {
      if (overlay && overlay.parentNode) {
        if (overlay.parentNode === document.body) {
          document.body.removeChild(overlay);
        } else {
          // React might have moved it - remove from current parent
          overlay.parentNode.removeChild(overlay);
        }
      }
    } catch (error) {
      console.warn('Modal cleanup: Failed to remove overlay from DOM', error);
      // Fallback - direct removal
      try {
        if (overlay && overlay.remove) {
          overlay.remove();
        }
      } catch (fallbackError) {
        console.warn('Modal cleanup completely failed:', fallbackError);
        // Last resort - mark as cleaned up anyway to prevent infinite retries
      }
    }

    this.activeModal = null;
    this.isOpen = false;
  }

  /**
   * Check if modal is currently open
   */
  public isModalOpen(): boolean {
    return this.isOpen;
  }
}

// Export singleton instance
export const modalService = ModalService.getInstance();