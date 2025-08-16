import * as fabric from 'fabric';
import { BRAND_COLORS, hexToRgba } from '../utils/colorUtils';
import { addDropShadow } from '../utils/fabricHelpers';

export interface StatsCardOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  padding?: number;
  showIcon?: boolean;
  iconColor?: string;
  shadow?: boolean;
}

export class StatsCardElement {
  static create(
    title: string,
    value: string,
    position: { x: number; y: number },
    options: StatsCardOptions = {}
  ): fabric.Group {
    const {
      width = 280,
      height = 100,
      backgroundColor = BRAND_COLORS.white,
      textColor = BRAND_COLORS.text.primary,
      borderRadius = 12,
      padding = 16,
      shadow = true
    } = options;

    const elements: fabric.Object[] = [];

    // Create card background
    const background = new fabric.Rect({
      width,
      height,
      fill: backgroundColor,
      rx: borderRadius,
      ry: borderRadius,
      left: 0,
      top: 0,
      selectable: false
    });

    if (shadow) {
      addDropShadow(background, {
        color: hexToRgba(BRAND_COLORS.black, 0.1),
        blur: 8,
        offsetX: 0,
        offsetY: 4
      });
    }

    elements.push(background);

    // Create value text (main number/text)
    const valueText = new fabric.FabricText(value, {
      left: width / 2,
      top: padding + 8,
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.primary,
      textAlign: 'center',
      originX: 'center',
      originY: 'top',
      selectable: false
    });

    elements.push(valueText);

    // Create title text (label)
    const titleText = new fabric.FabricText(title, {
      left: width / 2,
      top: height - padding - 8,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.text.secondary,
      textAlign: 'center',
      originX: 'center',
      originY: 'bottom',
      selectable: false
    });

    elements.push(titleText);

    // Create the group
    const group = new fabric.Group(elements, {
      left: position.x,
      top: position.y,
      selectable: false
    });

    return group;
  }

  static createWithIcon(
    title: string,
    value: string,
    icon: string,
    position: { x: number; y: number },
    options: StatsCardOptions = {}
  ): fabric.Group {
    const {
      width = 300,
      height = 120,
      backgroundColor = BRAND_COLORS.white,
      iconColor = BRAND_COLORS.highlight,
      shadow = true
    } = options;

    const elements: fabric.Object[] = [];

    // Create card background
    const background = new fabric.Rect({
      width,
      height,
      fill: backgroundColor,
      rx: 12,
      ry: 12,
      left: 0,
      top: 0,
      selectable: false
    });

    if (shadow) {
      addDropShadow(background);
    }

    elements.push(background);

    // Create icon
    const iconElement = new fabric.FabricText(icon, {
      left: 20,
      top: height / 2,
      fontSize: 32,
      fill: iconColor,
      originX: 'left',
      originY: 'center',
      selectable: false
    });

    elements.push(iconElement);

    // Create value text
    const valueText = new fabric.FabricText(value, {
      left: 70,
      top: height / 2 - 10,
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.primary,
      originX: 'left',
      originY: 'center',
      selectable: false
    });

    elements.push(valueText);

    // Create title text
    const titleText = new fabric.FabricText(title, {
      left: 70,
      top: height / 2 + 15,
      fontSize: 12,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.text.secondary,
      originX: 'left',
      originY: 'center',
      selectable: false
    });

    elements.push(titleText);

    // Create the group
    const group = new fabric.Group(elements, {
      left: position.x,
      top: position.y,
      selectable: false
    });

    return group;
  }

  static createCompact(
    title: string,
    value: string,
    position: { x: number; y: number },
    options: Partial<StatsCardOptions> = {}
  ): fabric.Group {
    return this.create(title, value, position, {
      width: 180,
      height: 80,
      padding: 12,
      ...options
    });
  }

  static createHighlight(
    title: string,
    value: string,
    position: { x: number; y: number },
    options: Partial<StatsCardOptions> = {}
  ): fabric.Group {
    return this.create(title, value, position, {
      backgroundColor: BRAND_COLORS.highlight,
      textColor: BRAND_COLORS.white,
      ...options
    });
  }

  static createGradient(
    title: string,
    value: string,
    position: { x: number; y: number },
    gradientColors: string[] = [BRAND_COLORS.primary, BRAND_COLORS.highlight],
    options: Partial<StatsCardOptions> = {}
  ): fabric.Group {
    const {
      width = 280,
      height = 100,
      borderRadius = 12,
      padding = 16
    } = options;

    const elements: fabric.Object[] = [];

    // Create gradient background
    const gradient = new fabric.Gradient({
      type: 'linear',
      coords: { x1: 0, y1: 0, x2: width, y2: height },
      colorStops: gradientColors.map((color, index) => ({
        offset: index / (gradientColors.length - 1),
        color
      }))
    });

    const background = new fabric.Rect({
      width,
      height,
      fill: gradient,
      rx: borderRadius,
      ry: borderRadius,
      left: 0,
      top: 0,
      selectable: false
    });

    addDropShadow(background);
    elements.push(background);

    // Create value text (white on gradient)
    const valueText = new fabric.FabricText(value, {
      left: width / 2,
      top: padding + 8,
      fontSize: 28,
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.white,
      textAlign: 'center',
      originX: 'center',
      originY: 'top',
      selectable: false
    });

    elements.push(valueText);

    // Create title text
    const titleText = new fabric.FabricText(title, {
      left: width / 2,
      top: height - padding - 8,
      fontSize: 14,
      fontFamily: 'Arial, sans-serif',
      fill: BRAND_COLORS.white,
      textAlign: 'center',
      originX: 'center',
      originY: 'bottom',
      selectable: false,
      opacity: 0.9
    });

    elements.push(titleText);

    // Create the group
    const group = new fabric.Group(elements, {
      left: position.x,
      top: position.y,
      selectable: false
    });

    return group;
  }
}