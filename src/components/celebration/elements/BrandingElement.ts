import * as fabric from 'fabric';
import { BRAND_COLORS } from '../utils/colorUtils';

export class BrandingElement {
  static createLogo(
    position: { x: number; y: number },
    size: number = 24
  ): fabric.FabricText {
    // Simple text-based logo for now
    return new fabric.FabricText('Kuri', {
      left: position.x,
      top: position.y,
      fontSize: size,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.primary,
      selectable: false
    });
  }

  static createSubtleBranding(
    position: { x: number; y: number },
    text: string = 'Powered by Kuri'
  ): fabric.FabricText {
    return new fabric.FabricText(text, {
      left: position.x,
      top: position.y,
      fontSize: 11,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.text.secondary,
      opacity: 0.7,
      selectable: false
    });
  }

  static createWatermark(
    canvasWidth: number,
    canvasHeight: number,
    text: string = 'kuri.io'
  ): fabric.FabricText {
    return new fabric.FabricText(text, {
      left: canvasWidth - 20,
      top: canvasHeight - 20,
      fontSize: 10,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.text.secondary,
      opacity: 0.5,
      angle: -45,
      originX: 'right',
      originY: 'bottom',
      selectable: false
    });
  }

  static createBrandBadge(
    position: { x: number; y: number },
    size: number = 40
  ): fabric.Group {
    const elements: fabric.Object[] = [];

    // Create circular background
    const background = new fabric.Circle({
      radius: size / 2,
      fill: BRAND_COLORS.primary,
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center'
    });

    elements.push(background);

    // Create letter "K" in the center
    const letter = new fabric.FabricText('K', {
      fontSize: size * 0.6,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.white,
      left: 0,
      top: 0,
      originX: 'center',
      originY: 'center'
    });

    elements.push(letter);

    return new fabric.Group(elements, {
      left: position.x,
      top: position.y,
      selectable: false
    });
  }

  static createWebsiteUrl(
    position: { x: number; y: number },
    url: string = 'kuri.io'
  ): fabric.FabricText {
    return new fabric.FabricText(url, {
      left: position.x,
      top: position.y,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.primary,
      underline: true,
      selectable: false
    });
  }

  static createTagline(
    position: { x: number; y: number },
    tagline: string = 'Building Financial Communities'
  ): fabric.FabricText {
    return new fabric.FabricText(tagline, {
      left: position.x,
      top: position.y,
      fontSize: 14,
      fontStyle: 'italic',
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.text.secondary,
      selectable: false
    });
  }
}