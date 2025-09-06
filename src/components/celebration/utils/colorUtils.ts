// Brand color management for celebration images
export const BRAND_COLORS = {
  primary: '#8B6F47',
  secondary: '#E8DED1', 
  accent: '#F9F5F1',
  highlight: '#C84E31',
  white: '#ffffff',
  black: '#000000',
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    light: '#ffffff',
    dark: '#111827'
  },
  gradients: {
    warm: ['#F9F5F1', '#E8DED1'],
    primary: ['#8B6F47', '#6B5637'],
    accent: ['#C84E31', '#B83A21'],
    // Enhanced gradients for new template design
    celebration: ['#C84E31', '#8B6F47'],
    richWarm: ['#8B6F47', '#C84E31', '#B83A21']
  }
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;
export type GradientType = 'warm' | 'cool' | 'neutral' | 'primary' | 'accent' | 'celebration' | 'richWarm';

export const createBrandGradient = (type: GradientType): string[] => {
  switch (type) {
    case 'warm':
      return [...BRAND_COLORS.gradients.warm];
    case 'primary':
      return [...BRAND_COLORS.gradients.primary];
    case 'accent':
      return [...BRAND_COLORS.gradients.accent];
    case 'celebration':
      return [...BRAND_COLORS.gradients.celebration];
    case 'richWarm':
      return [...BRAND_COLORS.gradients.richWarm];
    case 'cool':
      return [BRAND_COLORS.secondary, BRAND_COLORS.white];
    case 'neutral':
      return [BRAND_COLORS.accent, BRAND_COLORS.white];
    default:
      return [...BRAND_COLORS.gradients.warm];
  }
};

export const getContrastColor = (backgroundColor: string): string => {
  // Simple contrast calculation - use white text on dark backgrounds
  const darkColors = [BRAND_COLORS.primary, BRAND_COLORS.highlight, BRAND_COLORS.black];
  return darkColors.includes(backgroundColor as any) ? BRAND_COLORS.text.light : BRAND_COLORS.text.primary;
};

export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};