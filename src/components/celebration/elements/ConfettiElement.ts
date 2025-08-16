import * as fabric from 'fabric';
import { BRAND_COLORS, hexToRgba } from '../utils/colorUtils';

export interface ConfettiOptions {
  count?: number;
  colors?: string[];
  minSize?: number;
  maxSize?: number;
  shapes?: ('circle' | 'rectangle' | 'triangle')[];
  opacity?: number;
  canvasWidth: number;
  canvasHeight: number;
}

export class ConfettiElement {
  static createParticles(options: ConfettiOptions): fabric.Object[] {
    const {
      count = 30,
      colors = [
        BRAND_COLORS.highlight,
        BRAND_COLORS.primary,
        BRAND_COLORS.secondary,
        '#FFD700', // Gold
        '#FF69B4', // Pink
        '#00CED1', // Dark Turquoise
        '#9370DB'  // Medium Purple
      ],
      minSize = 4,
      maxSize = 12,
      shapes = ['circle', 'rectangle'],
      opacity = 0.7,
      canvasWidth,
      canvasHeight
    } = options;

    const particles: fabric.Object[] = [];

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * (maxSize - minSize) + minSize;
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      const rotation = Math.random() * 360;
      const shape = shapes[Math.floor(Math.random() * shapes.length)];

      let particle: fabric.Object;

      switch (shape) {
        case 'circle':
          particle = new fabric.Circle({
            radius: size / 2,
            left: x,
            top: y,
            fill: color,
            opacity,
            angle: rotation,
            selectable: false
          });
          break;

        case 'rectangle':
          particle = new fabric.Rect({
            width: size,
            height: size * 1.5,
            left: x,
            top: y,
            fill: color,
            opacity,
            angle: rotation,
            selectable: false
          });
          break;

        case 'triangle':
          particle = new fabric.Triangle({
            width: size,
            height: size,
            left: x,
            top: y,
            fill: color,
            opacity,
            angle: rotation,
            selectable: false
          });
          break;

        default:
          particle = new fabric.Circle({
            radius: size / 2,
            left: x,
            top: y,
            fill: color,
            opacity,
            selectable: false
          });
      }

      particles.push(particle);
    }

    return particles;
  }

  static createBurst(
    centerX: number,
    centerY: number,
    options: Partial<ConfettiOptions> = {}
  ): fabric.Object[] {
    const {
      count = 20,
      colors = [BRAND_COLORS.highlight, BRAND_COLORS.primary, '#FFD700'],
      minSize = 3,
      maxSize = 8,
      opacity = 0.8
    } = options;

    const particles: fabric.Object[] = [];
    const radius = 100; // Burst radius

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const distance = Math.random() * radius;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * (maxSize - minSize) + minSize;
      const rotation = Math.random() * 360;

      const particle = new fabric.Circle({
        radius: size / 2,
        left: x,
        top: y,
        fill: color,
        opacity,
        angle: rotation,
        selectable: false
      });

      particles.push(particle);
    }

    return particles;
  }

  static createStreamer(
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: string = BRAND_COLORS.highlight,
    width: number = 8
  ): fabric.Object[] {
    const streamers: fabric.Object[] = [];
    const segments = 20;
    const amplitude = 30; // Wave amplitude

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t + Math.sin(t * Math.PI * 4) * amplitude;
      
      const segment = new fabric.Circle({
        radius: width / 2,
        left: x,
        top: y,
        fill: color,
        opacity: 0.7 - (t * 0.3), // Fade out towards the end
        selectable: false
      });

      streamers.push(segment);
    }

    return streamers;
  }

  static createCelebrationText(
    text: string,
    x: number,
    y: number,
    fontSize: number = 24
  ): fabric.FabricText {
    return new fabric.FabricText(text, {
      left: x,
      top: y,
      fontSize,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.highlight,
      stroke: BRAND_COLORS.white,
      strokeWidth: 2,
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      opacity: 0.9,
      selectable: false,
      shadow: new fabric.Shadow({
        color: hexToRgba(BRAND_COLORS.black, 0.3),
        blur: 4,
        offsetX: 2,
        offsetY: 2
      })
    });
  }

  static createSparkles(
    canvasWidth: number,
    canvasHeight: number,
    count: number = 15
  ): fabric.Object[] {
    const sparkles: fabric.Object[] = [];
    const sparkleColors = [BRAND_COLORS.white, '#FFD700', '#FFFF99'];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * canvasWidth;
      const y = Math.random() * canvasHeight;
      const size = Math.random() * 4 + 2;
      const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      const rotation = Math.random() * 360;

      // Create sparkle as a star shape using text
      const sparkle = new fabric.FabricText('✨', {
        left: x,
        top: y,
        fontSize: size * 4,
        fill: color,
        opacity: 0.6 + Math.random() * 0.4,
        angle: rotation,
        originX: 'center',
        originY: 'center',
        selectable: false
      });

      sparkles.push(sparkle);
    }

    return sparkles;
  }
}