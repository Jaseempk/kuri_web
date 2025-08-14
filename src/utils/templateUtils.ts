import { 
  Canvas, 
  Text, 
  Image, 
  Circle, 
  Rect, 
  Group, 
  Gradient
} from "fabric";

/**
 * Template data structure for dynamic image generation
 */
export interface ShareTemplateData {
  username: string;
  userAvatar?: string;
  circleData: {
    name: string;
    totalAmount: string;
    participants: number;
    contribution: string;
    interval: 'weekly' | 'monthly';
  };
  marketAddress: string;
  templateType?: 'celebration' | 'invitation' | 'success';
}

/**
 * Template size configurations for different social media platforms
 */
export const TEMPLATE_SIZES = {
  square: { width: 1080, height: 1080 }, // Instagram, Facebook
  landscape: { width: 1200, height: 630 }, // Twitter, LinkedIn
  story: { width: 1080, height: 1920 }, // Instagram Stories, TikTok
} as const;

/**
 * Brand colors from CSS variables (converted to hex for Fabric.js)
 */
export const BRAND_COLORS = {
  terracotta: '#C2410C', // hsl(18 80% 45%)
  ochre: '#D97706', // hsl(35 80% 50%) 
  gold: '#F59E0B', // hsl(35 70% 60%)
  sand: '#F3F4F6', // hsl(35 40% 90%)
  ivory: '#FEFCE8', // hsl(40 33% 96%)
  forest: '#065F46', // hsl(150 30% 35%)
  background: '#F9FAFB', // hsl(36 40% 95%)
  foreground: '#1F2937', // hsl(30 25% 15%)
} as const;

/**
 * Typography configurations using existing brand fonts
 */
export const TYPOGRAPHY = {
  display: {
    fontFamily: 'Playfair Display',
    fontWeight: 800,
  },
  elegant: {
    fontFamily: 'Cormorant Garamond', 
    fontWeight: 600,
  },
  body: {
    fontFamily: 'Inter',
    fontWeight: 500,
  },
  mono: {
    fontFamily: 'DM Mono',
    fontWeight: 400,
  },
} as const;

/**
 * Create a gradient background for the canvas
 */
export const createGradientBackground = (
  canvas: Canvas,
  colors: [string, string] = [BRAND_COLORS.terracotta, BRAND_COLORS.gold]
): Gradient => {
  return new Gradient({
    type: 'linear',
    coords: {
      x1: 0,
      y1: 0,
      x2: 0,
      y2: canvas.height || 1080,
    },
    colorStops: [
      { offset: 0, color: colors[0] },
      { offset: 1, color: colors[1] },
    ],
  });
};

/**
 * Create a text object with brand styling
 */
export const createBrandText = (
  text: string,
  options: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    fill?: string;
    shadow?: string;
    textAlign?: string;
    maxWidth?: number;
  } = {}
): fabric.Text => {
  const defaultOptions = {
    fontSize: 32,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontWeight: TYPOGRAPHY.body.fontWeight,
    fill: 'white',
    shadow: 'rgba(0,0,0,0.3) 0px 2px 8px',
    textAlign: 'center',
    originX: 'center',
    originY: 'center',
    ...options,
  };

  return new fabric.Text(text, defaultOptions as fabric.ITextOptions);
};

/**
 * Load and create a circular avatar image
 */
export const createCircularAvatar = async (
  imageUrl: string,
  size: number = 120
): Promise<fabric.Image> => {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        if (!img) {
          reject(new Error('Failed to load image'));
          return;
        }

        // Create circular crop
        const radius = size / 2;
        
        // Scale image to fit the circle
        const scale = Math.min(
          size / (img.width || 1),
          size / (img.height || 1)
        );

        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'center',
          originY: 'center',
          clipPath: new fabric.Circle({
            radius: radius,
            originX: 'center',
            originY: 'center',
          }),
        });

        // Add gold border
        const border = new fabric.Circle({
          radius: radius + 3,
          fill: 'transparent',
          stroke: BRAND_COLORS.gold,
          strokeWidth: 6,
          originX: 'center',
          originY: 'center',
        });

        // Group image and border
        const avatarGroup = new fabric.Group([img, border], {
          originX: 'center',
          originY: 'center',
        });

        resolve(avatarGroup as any);
      },
      {
        crossOrigin: 'anonymous',
      }
    );
  });
};

/**
 * Create a default avatar when no image is provided
 */
export const createDefaultAvatar = (
  username: string,
  size: number = 120
): fabric.Group => {
  const radius = size / 2;
  
  // Background circle
  const background = new fabric.Circle({
    radius: radius,
    fill: BRAND_COLORS.sand,
    originX: 'center',
    originY: 'center',
  });

  // Initial letter
  const initial = new fabric.Text(username.charAt(0).toUpperCase(), {
    fontSize: size * 0.4,
    fontFamily: TYPOGRAPHY.display.fontFamily,
    fontWeight: TYPOGRAPHY.display.fontWeight,
    fill: BRAND_COLORS.terracotta,
    textAlign: 'center',
    originX: 'center',
    originY: 'center',
  });

  // Gold border
  const border = new fabric.Circle({
    radius: radius + 3,
    fill: 'transparent',
    stroke: BRAND_COLORS.gold,
    strokeWidth: 6,
    originX: 'center',
    originY: 'center',
  });

  return new fabric.Group([background, initial, border], {
    originX: 'center',
    originY: 'center',
  });
};

/**
 * Add confetti particles for celebration effect
 */
export const addConfettiParticles = (
  canvas: fabric.Canvas,
  count: number = 20
): fabric.Object[] => {
  const particles: fabric.Object[] = [];
  const colors = [BRAND_COLORS.gold, BRAND_COLORS.ochre, BRAND_COLORS.terracotta];

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4;
    
    // Random shape - circle or rectangle
    const isCircle = Math.random() > 0.5;
    
    let particle: fabric.Object;
    
    if (isCircle) {
      particle = new fabric.Circle({
        radius: size / 2,
        fill: color,
        left: Math.random() * (canvas.width || 1080),
        top: Math.random() * (canvas.height || 1080),
        angle: Math.random() * 360,
      });
    } else {
      particle = new fabric.Rect({
        width: size,
        height: size,
        fill: color,
        left: Math.random() * (canvas.width || 1080),
        top: Math.random() * (canvas.height || 1080),
        angle: Math.random() * 360,
      });
    }

    particles.push(particle);
    canvas.add(particle);
  }

  return particles;
};

/**
 * Create a stats card for circle information
 */
export const createStatsCard = (
  stats: {
    participants: number;
    amount: string;
    interval: string;
  },
  width: number = 300,
  height: number = 120
): fabric.Group => {
  // Card background
  const cardBg = new fabric.Rect({
    width: width,
    height: height,
    fill: 'rgba(255, 255, 255, 0.9)',
    stroke: 'rgba(255, 255, 255, 0.2)',
    strokeWidth: 1,
    rx: 16,
    ry: 16,
    shadow: 'rgba(0,0,0,0.1) 0px 8px 24px',
    originX: 'center',
    originY: 'center',
  });

  // Stats text
  const participantText = new fabric.Text(`${stats.participants} members`, {
    fontSize: 18,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontWeight: 600,
    fill: BRAND_COLORS.foreground,
    originX: 'center',
    originY: 'center',
    top: -25,
  });

  const amountText = new fabric.Text(`$${stats.amount}`, {
    fontSize: 24,
    fontFamily: TYPOGRAPHY.display.fontFamily,
    fontWeight: 800,
    fill: BRAND_COLORS.terracotta,
    originX: 'center',
    originY: 'center',
    top: 0,
  });

  const intervalText = new fabric.Text(`${stats.interval} contributions`, {
    fontSize: 14,
    fontFamily: TYPOGRAPHY.body.fontFamily,
    fontWeight: 400,
    fill: BRAND_COLORS.foreground,
    originX: 'center',
    originY: 'center',
    top: 25,
  });

  return new fabric.Group([cardBg, participantText, amountText, intervalText], {
    originX: 'center',
    originY: 'center',
  });
};

/**
 * Export canvas as high-quality image
 */
export const exportCanvasAsImage = (
  canvas: fabric.Canvas,
  format: 'png' | 'jpeg' = 'png',
  quality: number = 1.0
): string => {
  return canvas.toDataURL({
    format: format,
    quality: quality,
    multiplier: 2, // 2x resolution for crisp images
  });
};

/**
 * Download generated image
 */
export const downloadImage = (dataUrl: string, filename: string): void => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Get optimized template size for platform
 */
export const getTemplateSizeForPlatform = (
  platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'story'
) => {
  switch (platform) {
    case 'instagram':
      return TEMPLATE_SIZES.square;
    case 'story':
      return TEMPLATE_SIZES.story;
    case 'twitter':
    case 'facebook':
    case 'linkedin':
    default:
      return TEMPLATE_SIZES.landscape;
  }
};