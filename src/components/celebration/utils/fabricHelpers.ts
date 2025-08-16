import * as fabric from 'fabric';
import { TemplateConfig, ShadowOptions } from '../types';
import { BRAND_COLORS, hexToRgba } from './colorUtils';

export const createCanvas = (config: TemplateConfig): fabric.Canvas => {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = config.width;
  canvasElement.height = config.height;
  
  const canvas = new fabric.Canvas(canvasElement, {
    width: config.width,
    height: config.height,
    backgroundColor: config.backgroundColor,
    renderOnAddRemove: false,
    skipTargetFind: true,
    selection: false,
    preserveObjectStacking: true,
    stateful: false
  });

  return canvas;
};

export const createText = (
  text: string, 
  options: any = {}
): fabric.FabricText => {
  const defaultOptions: any = {
    fontFamily: 'Arial, sans-serif',
    fill: BRAND_COLORS.text.primary,
    fontSize: 16,
    textAlign: 'left',
    originX: 'left',
    originY: 'top'
  };

  return new fabric.FabricText(text, {
    ...defaultOptions,
    ...options
  });
};

export const createGradient = (
  colors: string[], 
  coords: number[] = [0, 0, 0, 100]
): any => {
  const colorStops = colors.map((color, index) => ({
    offset: index / (colors.length - 1),
    color
  }));

  return new fabric.Gradient({
    type: 'linear',
    coords: {
      x1: coords[0],
      y1: coords[1],
      x2: coords[2],
      y2: coords[3]
    },
    colorStops
  });
};

export const addDropShadow = (
  object: fabric.Object, 
  options: Partial<ShadowOptions> = {}
): void => {
  const defaultShadow: ShadowOptions = {
    color: hexToRgba(BRAND_COLORS.black, 0.2),
    blur: 4,
    offsetX: 2,
    offsetY: 2
  };

  const shadowOptions = { ...defaultShadow, ...options };
  
  object.set({
    shadow: new fabric.Shadow({
      color: shadowOptions.color,
      blur: shadowOptions.blur,
      offsetX: shadowOptions.offsetX,
      offsetY: shadowOptions.offsetY
    })
  });
};

export const createRectangle = (
  width: number,
  height: number,
  options: any = {}
): fabric.Rect => {
  return new fabric.Rect({
    width,
    height,
    fill: BRAND_COLORS.white,
    stroke: 'transparent',
    strokeWidth: 0,
    ...options
  });
};

export const createCircle = (
  radius: number,
  options: any = {}
): fabric.Circle => {
  return new fabric.Circle({
    radius,
    fill: BRAND_COLORS.highlight,
    stroke: 'transparent',
    strokeWidth: 0,
    ...options
  });
};

export const centerObject = (
  object: fabric.Object,
  canvas: fabric.Canvas,
  horizontal: boolean = true,
  vertical: boolean = true
): void => {
  if (horizontal) {
    object.set('left', (canvas.width! - object.width!) / 2);
  }
  if (vertical) {
    object.set('top', (canvas.height! - object.height!) / 2);
  }
  object.setCoords();
};

export const addToCanvas = (canvas: fabric.Canvas, objects: fabric.Object[]): void => {
  objects.forEach(obj => canvas.add(obj));
};