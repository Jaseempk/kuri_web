import * as fabric from 'fabric';
import { ExportResult } from '../types';

export const exportCanvasAsImage = async (canvas: fabric.Canvas): Promise<ExportResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Render all objects to ensure they're visible
      canvas.renderAll();
      
      // Get the data URL
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      // Convert to blob
      const blob = dataURLToBlob(dataURL);
      
      // Create download URL
      const downloadUrl = URL.createObjectURL(blob);
      
      resolve({
        dataURL,
        blob,
        downloadUrl
      });
    } catch (error) {
      reject(new Error(`Failed to export canvas: ${error}`));
    }
  });
};

export const dataURLToBlob = (dataURL: string): Blob => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

export const generateFileName = (marketAddress: string, template: string): string => {
  const timestamp = new Date().toISOString().slice(0, 10);
  const shortAddress = marketAddress.slice(0, 8);
  return `kuri-circle-${shortAddress}-${template}-${timestamp}.png`;
};

export const copyImageToClipboard = async (dataURL: string): Promise<void> => {
  if (!navigator.clipboard || !navigator.clipboard.write) {
    throw new Error('Clipboard API not supported');
  }

  try {
    const blob = dataURLToBlob(dataURL);
    const clipboardItem = new ClipboardItem({ 'image/png': blob });
    await navigator.clipboard.write([clipboardItem]);
  } catch (error) {
    throw new Error(`Failed to copy to clipboard: ${error}`);
  }
};

export const downloadImage = (downloadUrl: string, fileName: string): void => {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const revokeDownloadUrl = (url: string): void => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};