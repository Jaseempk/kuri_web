/**
 * Simple template data structure for dynamic image generation
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
 * Brand colors from CSS variables (converted to hex for Canvas)
 */
export const BRAND_COLORS = {
  terracotta: '#C2410C',
  ochre: '#D97706', 
  gold: '#F59E0B',
  sand: '#F3F4F6',
  ivory: '#FEFCE8',
  forest: '#065F46',
  background: '#F9FAFB',
  foreground: '#1F2937',
  white: '#FFFFFF',
} as const;

/**
 * Load an image and return a promise with the image element
 */
export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Create a circular clip path for avatars
 */
export const drawCircularImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  radius: number
) => {
  ctx.save();
  
  // Create circular clipping path
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.clip();
  
  // Calculate scale to cover the circle
  const scale = Math.max((radius * 2) / img.width, (radius * 2) / img.height);
  const scaledWidth = img.width * scale;
  const scaledHeight = img.height * scale;
  
  // Center the image in the circle
  const drawX = x - scaledWidth / 2;
  const drawY = y - scaledHeight / 2;
  
  ctx.drawImage(img, drawX, drawY, scaledWidth, scaledHeight);
  ctx.restore();
  
  // Draw golden border
  ctx.beginPath();
  ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
  ctx.strokeStyle = BRAND_COLORS.gold;
  ctx.lineWidth = 6;
  ctx.stroke();
};

/**
 * Draw text with shadow and proper centering
 */
export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    color?: string;
    textAlign?: CanvasTextAlign;
    shadowColor?: string;
    shadowBlur?: number;
    shadowOffsetX?: number;
    shadowOffsetY?: number;
    maxWidth?: number;
  } = {}
) => {
  const {
    fontSize = 32,
    fontFamily = 'Inter',
    fontWeight = '500',
    color = BRAND_COLORS.white,
    textAlign = 'center',
    shadowColor = 'rgba(0,0,0,0.3)',
    shadowBlur = 8,
    shadowOffsetX = 0,
    shadowOffsetY = 2,
    maxWidth,
  } = options;

  ctx.save();
  
  // Set font
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textAlign = textAlign;
  ctx.textBaseline = 'middle';
  
  // Set shadow
  ctx.shadowColor = shadowColor;
  ctx.shadowBlur = shadowBlur;
  ctx.shadowOffsetX = shadowOffsetX;
  ctx.shadowOffsetY = shadowOffsetY;
  
  // Draw text
  if (maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
  } else {
    ctx.fillText(text, x, y);
  }
  
  ctx.restore();
};

/**
 * Create a gradient background
 */
export const createGradientBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: [string, string] = [BRAND_COLORS.terracotta, BRAND_COLORS.gold]
) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
};

/**
 * Draw decorative particles/confetti
 */
export const drawConfettiParticles = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  count: number = 15
) => {
  const colors = [BRAND_COLORS.gold, BRAND_COLORS.ochre, BRAND_COLORS.ivory];
  
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4;
    const x = Math.random() * width;
    const y = Math.random() * height;
    const rotation = Math.random() * 360;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    
    ctx.fillStyle = color;
    
    if (Math.random() > 0.5) {
      // Circle
      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, 2 * Math.PI);
      ctx.fill();
    } else {
      // Rectangle
      ctx.fillRect(-size / 2, -size / 2, size, size);
    }
    
    ctx.restore();
  }
};

/**
 * Draw a stats card
 */
export const drawStatsCard = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  stats: {
    participants: number;
    amount: string;
    interval: string;
  },
  width: number = 320,
  height: number = 120
) => {
  ctx.save();
  
  // Card background with rounded corners
  const cornerRadius = 16;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, cornerRadius);
  ctx.fill();
  
  // Card border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Stats text
  drawText(ctx, `${stats.participants} members`, x, y - 25, {
    fontSize: 18,
    fontWeight: '600',
    color: BRAND_COLORS.foreground,
    shadowColor: 'transparent',
  });
  
  drawText(ctx, `$${stats.amount}`, x, y, {
    fontSize: 24,
    fontFamily: 'Playfair Display',
    fontWeight: '800',
    color: BRAND_COLORS.terracotta,
    shadowColor: 'transparent',
  });
  
  drawText(ctx, `${stats.interval} contributions`, x, y + 25, {
    fontSize: 14,
    fontWeight: '400',
    color: BRAND_COLORS.foreground,
    shadowColor: 'transparent',
  });
  
  ctx.restore();
};

/**
 * Generate celebration template
 */
export const generateCelebrationTemplate = async (
  canvas: HTMLCanvasElement,
  data: ShareTemplateData,
  platform: 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'story' = 'instagram'
): Promise<string> => {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  const size = getTemplateSizeForPlatform(platform);
  canvas.width = size.width;
  canvas.height = size.height;

  const { width, height } = canvas;
  const isStory = platform === 'story';

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Create gradient background
  createGradientBackground(ctx, width, height);

  // Add confetti particles
  drawConfettiParticles(ctx, width, height, 15);

  // Main celebration text
  drawText(ctx, '🎉 Circle Created!', width / 2, height * 0.15, {
    fontSize: isStory ? 72 : 48,
    fontFamily: 'Playfair Display',
    fontWeight: '800',
    shadowBlur: 12,
    shadowOffsetY: 4,
    shadowColor: 'rgba(0,0,0,0.4)',
  });

  // User avatar (or placeholder)
  const avatarSize = isStory ? 70 : 50;
  const avatarY = height * 0.32;
  
  if (data.userAvatar) {
    try {
      const avatarImg = await loadImage(data.userAvatar);
      drawCircularImage(ctx, avatarImg, width / 2, avatarY, avatarSize);
    } catch (error) {
      // Draw default avatar
      drawDefaultAvatar(ctx, width / 2, avatarY, avatarSize, data.username);
    }
  } else {
    drawDefaultAvatar(ctx, width / 2, avatarY, avatarSize, data.username);
  }

  // Username
  drawText(ctx, data.username, width / 2, height * 0.48, {
    fontSize: isStory ? 36 : 28,
    fontFamily: 'Cormorant Garamond',
    fontWeight: '600',
    shadowBlur: 8,
    shadowOffsetY: 2,
  });

  // Circle name
  drawText(ctx, `"${data.circleData.name}"`, width / 2, height * 0.58, {
    fontSize: isStory ? 32 : 24,
    fontWeight: '600',
    color: BRAND_COLORS.ivory,
    maxWidth: width * 0.8,
  });

  // Stats card
  drawStatsCard(ctx, width / 2, height * 0.75, {
    participants: data.circleData.participants,
    amount: data.circleData.totalAmount,
    interval: data.circleData.interval,
  }, isStory ? 350 : 320, isStory ? 140 : 120);

  // Call to action
  drawText(ctx, 'Join my Kuri Circle! 💰', width / 2, height * 0.88, {
    fontSize: isStory ? 28 : 22,
    fontWeight: '700',
    shadowBlur: 8,
    shadowOffsetY: 2,
  });

  // Branding
  drawText(ctx, 'kuri.finance', width / 2, height * 0.95, {
    fontSize: isStory ? 20 : 16,
    fontFamily: 'DM Mono',
    color: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'transparent',
  });

  return canvas.toDataURL('image/png', 1.0);
};

/**
 * Draw default avatar when no image is provided
 */
const drawDefaultAvatar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  username: string
) => {
  // Background circle
  ctx.fillStyle = BRAND_COLORS.sand;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI);
  ctx.fill();

  // Initial letter
  drawText(ctx, username.charAt(0).toUpperCase(), x, y, {
    fontSize: radius * 0.8,
    fontFamily: 'Playfair Display',
    fontWeight: '800',
    color: BRAND_COLORS.terracotta,
    shadowColor: 'transparent',
  });

  // Golden border
  ctx.beginPath();
  ctx.arc(x, y, radius + 3, 0, 2 * Math.PI);
  ctx.strokeStyle = BRAND_COLORS.gold;
  ctx.lineWidth = 6;
  ctx.stroke();
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