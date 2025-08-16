import * as fabric from 'fabric';
import { ProcessedMarketData, TemplateConfig } from '../types';
import { formatCurrency, truncateText } from '../utils/dataProcessors';
import { BRAND_COLORS } from '../utils/colorUtils';

export abstract class BaseTemplate {
  protected canvas: fabric.Canvas;
  protected data: ProcessedMarketData;
  protected config: TemplateConfig;

  constructor(canvas: fabric.Canvas, data: ProcessedMarketData) {
    this.canvas = canvas;
    this.data = data;
    this.config = this.getTemplateConfig();
    
    // Apply template configuration to canvas
    this.canvas.setDimensions({
      width: this.config.width,
      height: this.config.height
    });
    this.canvas.backgroundColor = this.config.backgroundColor;
  }

  // Abstract methods each template must implement
  abstract getTemplateConfig(): TemplateConfig;
  abstract renderBackground(): Promise<void>;
  abstract renderMainContent(): Promise<void>;
  abstract renderDecorations(): Promise<void>;
  abstract renderQRCode(): Promise<void>;

  // Main render method that orchestrates the template rendering
  public async render(): Promise<void> {
    try {
      // Clear the canvas first
      this.canvas.clear();
      this.canvas.backgroundColor = this.config.backgroundColor;
      
      // Render in proper order
      await this.renderBackground();
      await this.renderMainContent();
      await this.renderDecorations();
      await this.renderQRCode();
      
      // Add branding last so it's on top
      this.addBranding();
      
      // Final render
      this.canvas.renderAll();
    } catch (error) {
      throw new Error(`Template rendering failed: ${error}`);
    }
  }

  // Common utility methods available to all templates
  protected addBranding(): void {
    // Add subtle Kuri branding in bottom left
    const brandText = new fabric.FabricText('Kuri Circle', {
      left: 20,
      top: this.config.height - 30,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.text.secondary,
      selectable: false
    });
    
    this.canvas.add(brandText);
  }

  protected formatCurrency(amount: string): string {
    return formatCurrency(amount);
  }

  protected truncateText(text: string, maxLength: number): string {
    return truncateText(text, maxLength);
  }

  protected addPadding(x: number, y: number, padding: number = 20): { x: number; y: number } {
    return {
      x: x + padding,
      y: y + padding
    };
  }

  protected getCenter(): { x: number; y: number } {
    return {
      x: this.config.width / 2,
      y: this.config.height / 2
    };
  }

  protected async loadImage(url: string): Promise<fabric.FabricImage> {
    return new Promise((resolve, reject) => {
      fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
        .then((img) => {
          if (img) {
            resolve(img);
          } else {
            reject(new Error('Failed to load image'));
          }
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  protected createTextWithBackground(
    text: string,
    options: {
      left: number;
      top: number;
      fontSize?: number;
      fontFamily?: string;
      textColor?: string;
      backgroundColor?: string;
      padding?: number;
    }
  ): fabric.Group {
    const {
      left,
      top,
      fontSize = 16,
      fontFamily = 'Arial, sans-serif',
      textColor = BRAND_COLORS.text.primary,
      backgroundColor = BRAND_COLORS.white,
      padding = 8
    } = options;

    // Create text
    const textObj = new fabric.FabricText(text, {
      fontSize,
      fontFamily,
      fill: textColor,
      originX: 'center',
      originY: 'center'
    });

    // Create background rectangle
    const background = new fabric.Rect({
      width: textObj.width! + (padding * 2),
      height: textObj.height! + (padding * 2),
      fill: backgroundColor,
      rx: 4,
      ry: 4,
      originX: 'center',
      originY: 'center'
    });

    // Group them together
    const group = new fabric.Group([background, textObj], {
      left,
      top,
      selectable: false
    });

    return group;
  }

  // Helper to wait for async operations
  protected async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}