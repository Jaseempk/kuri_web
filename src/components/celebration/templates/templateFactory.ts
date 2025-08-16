import * as fabric from 'fabric';
import { ProcessedMarketData, TemplateType } from '../types';
import { BaseTemplate } from './BaseTemplate';
import { CelebrationHeroTemplate } from './CelebrationHeroTemplate';

// Template factory for creating different template instances
export const createTemplate = (
  type: TemplateType,
  canvas: fabric.Canvas,
  data: ProcessedMarketData
): BaseTemplate => {
  switch (type) {
    case 'hero':
      return new CelebrationHeroTemplate(canvas, data);
    case 'stats':
      // TODO: Implement StatsShowcaseTemplate
      return new CelebrationHeroTemplate(canvas, data); // Fallback to hero for now
    case 'minimal':
      // TODO: Implement MinimalistTemplate
      return new CelebrationHeroTemplate(canvas, data); // Fallback to hero for now
    default:
      return new CelebrationHeroTemplate(canvas, data);
  }
};

// Get template configuration without instantiating
export const getTemplateConfig = (type: TemplateType, isMobile: boolean = false) => {
  const mobileConfigs = {
    hero: {
      width: 800,
      height: 420,
      backgroundColor: '#F9F5F1',
      aspectRatio: 'landscape' as const
    },
    stats: {
      width: 600,
      height: 600,
      backgroundColor: '#8B6F47',
      aspectRatio: 'square' as const
    },
    minimal: {
      width: 800,
      height: 420,
      backgroundColor: '#ffffff',
      aspectRatio: 'landscape' as const
    }
  };

  const desktopConfigs = {
    hero: {
      width: 1200,
      height: 630,
      backgroundColor: '#F9F5F1',
      aspectRatio: 'landscape' as const
    },
    stats: {
      width: 1080,
      height: 1080,
      backgroundColor: '#8B6F47',
      aspectRatio: 'square' as const
    },
    minimal: {
      width: 1200,
      height: 630,
      backgroundColor: '#ffffff',
      aspectRatio: 'landscape' as const
    }
  };

  const configs = isMobile ? mobileConfigs : desktopConfigs;
  return configs[type] || configs.hero;
};

// Template metadata for UI display
export const TEMPLATE_METADATA = {
  hero: {
    name: 'Party',
    icon: '🎉',
    description: 'Celebration theme with confetti and excitement'
  },
  stats: {
    name: 'Stats',
    icon: '📊',
    description: 'Professional data-focused presentation'
  },
  minimal: {
    name: 'Clean',
    icon: '✨',
    description: 'Minimalist typography-focused design'
  }
} as const;