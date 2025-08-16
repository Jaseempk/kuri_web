// Export main components
export { CelebrationImageGenerator } from './CelebrationImageGenerator';

// Export types
export type {
  ProcessedMarketData,
  CelebrationImageProps,
  TemplateConfig,
  TemplateType,
  ExportResult
} from './types';

// Export template factory
export { createTemplate, getTemplateConfig, TEMPLATE_METADATA } from './templates/templateFactory';

// Export utilities
export {
  processMarketData,
  formatAddress,
  formatCurrency,
  truncateText,
  validateMarketData
} from './utils/dataProcessors';

export {
  exportCanvasAsImage,
  dataURLToBlob,
  generateFileName,
  copyImageToClipboard,
  downloadImage,
  revokeDownloadUrl
} from './utils/exportUtils';

export { BRAND_COLORS } from './utils/colorUtils';

// Export elements for advanced usage
export { QRCodeElement } from './elements/QRCodeElement';
export { ConfettiElement } from './elements/ConfettiElement';
export { StatsCardElement } from './elements/StatsCardElement';
export { BrandingElement } from './elements/BrandingElement';