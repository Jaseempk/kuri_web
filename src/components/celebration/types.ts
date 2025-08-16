import { KuriMarket } from "../../types/market";

// Core interfaces for the celebration image system
export interface ProcessedMarketData {
  circleName: string;
  totalAmount: string;
  participantCount: number;
  contribution: string;
  interval: 'Weekly' | 'Monthly';
  creatorAddress: string;
  shareUrl: string;
  description: string;
}

export interface CelebrationImageProps {
  market: KuriMarket;
  userAddress: string;
  template?: 'hero' | 'stats' | 'minimal';
  onImageGenerated: (imageData: string, downloadUrl: string, generationTime?: number) => void;
  onError?: (error: Error) => void;
}

export interface TemplateConfig {
  width: number;
  height: number;
  backgroundColor: string;
  aspectRatio: 'landscape' | 'square' | 'portrait';
}

export interface ShadowOptions {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export interface ExportResult {
  dataURL: string;
  blob: Blob;
  downloadUrl: string;
}

export type TemplateType = 'hero' | 'stats' | 'minimal';