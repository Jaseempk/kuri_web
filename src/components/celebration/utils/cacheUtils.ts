interface CachedImageData {
  dataURL: string;
  timestamp: number;
  template: string;
  marketAddress: string;
}

const CACHE_PREFIX = 'celebration_image_';
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

export const generateCacheKey = (marketAddress: string, template: string): string => {
  return `${CACHE_PREFIX}${marketAddress}_${template}`;
};

export const getCachedImage = (marketAddress: string, template: string): string | null => {
  try {
    const cacheKey = generateCacheKey(marketAddress, template);
    const cached = sessionStorage.getItem(cacheKey);
    
    if (!cached) {
      return null;
    }
    
    const cachedData: CachedImageData = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - cachedData.timestamp > CACHE_EXPIRY) {
      sessionStorage.removeItem(cacheKey);
      return null;
    }
    
    return cachedData.dataURL;
  } catch (error) {
    console.warn('Failed to retrieve cached image:', error);
    return null;
  }
};

export const setCachedImage = (
  marketAddress: string, 
  template: string, 
  dataURL: string
): void => {
  try {
    const cacheKey = generateCacheKey(marketAddress, template);
    const cacheData: CachedImageData = {
      dataURL,
      timestamp: Date.now(),
      template,
      marketAddress
    };
    
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    // Storage full or not available, silently fail
    console.warn('Failed to cache image:', error);
  }
};

export const clearImageCache = (marketAddress?: string): void => {
  try {
    if (marketAddress) {
      // Clear specific market's cached images
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX) && key.includes(marketAddress)) {
          sessionStorage.removeItem(key);
        }
      });
    } else {
      // Clear all celebration image cache
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_PREFIX)) {
          sessionStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
};

export const getCacheSize = (): number => {
  try {
    const keys = Object.keys(sessionStorage);
    return keys.filter(key => key.startsWith(CACHE_PREFIX)).length;
  } catch (error) {
    return 0;
  }
};