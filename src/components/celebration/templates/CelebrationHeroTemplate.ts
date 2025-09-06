import * as fabric from 'fabric';
import { BaseTemplate } from './BaseTemplate';
import { TemplateConfig } from '../types';
import { BRAND_COLORS, createBrandGradient } from '../utils/colorUtils';
import { createText, createGradient, addDropShadow, createRectangle, createCircle } from '../utils/fabricHelpers';

export class CelebrationHeroTemplate extends BaseTemplate {
  getTemplateConfig(): TemplateConfig {
    return {
      width: 1200,
      height: 630,
      backgroundColor: BRAND_COLORS.accent,
      aspectRatio: 'landscape'
    };
  }

  async renderBackground(): Promise<void> {
    // Create enhanced gradient background inspired by new design
    const gradientColors = createBrandGradient('celebration');
    const gradient = createGradient(gradientColors, [0, 0, this.config.width, this.config.height]);
    
    const background = createRectangle(this.config.width, this.config.height, {
      left: 0,
      top: 0,
      fill: gradient,
      selectable: false
    });

    this.canvas.add(background);

    // Add enhanced subtle patterns
    await this.addEnhancedBackgroundElements();
  }

  async renderMainContent(): Promise<void> {
    const center = this.getCenter();
    let currentY = 60;

    // Add celebration icon/logo at the top
    await this.renderCelebrationIcon(center.x, currentY);
    currentY += 80;

    // Main celebration title - enhanced typography
    const titleText = createText('Circle Created!', {
      left: center.x,
      top: currentY,
      fontSize: 52,
      fontWeight: 'bold',
      fill: BRAND_COLORS.white,
      textAlign: 'center',
      originX: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    
    addDropShadow(titleText, {
      color: 'rgba(0, 0, 0, 0.2)',
      blur: 6,
      offsetX: 0,
      offsetY: 3
    });

    titleText.set({ objectCaching: true });
    this.canvas.add(titleText);
    currentY += 70;

    // Add subtitle inspired by new design
    const subtitleText = createText("You're all set to go!", {
      left: center.x,
      top: currentY,
      fontSize: 20,
      fontWeight: 'normal',
      fill: BRAND_COLORS.white,
      textAlign: 'center',
      originX: 'center',
      fontFamily: 'Arial, sans-serif',
      opacity: 0.9
    });

    this.canvas.add(subtitleText);
    currentY += 60;

    // Circle name with enhanced styling
    const circleNameText = createText(this.truncateText(this.data.circleName, 40), {
      left: center.x,
      top: currentY,
      fontSize: 32,
      fontWeight: 'bold',
      fill: BRAND_COLORS.white,
      textAlign: 'center',
      originX: 'center',
      fontFamily: 'Arial, sans-serif'
    });

    circleNameText.set({ objectCaching: true });
    this.canvas.add(circleNameText);
    currentY += 80;

    // Stats grid with enhanced styling
    await this.renderEnhancedStatsGrid(currentY);
  }

  async renderDecorations(): Promise<void> {
    // Add confetti particles
    await this.addConfetti();
    
    // Add celebration icons
    await this.addCelebrationIcons();
  }

  async renderQRCode(): Promise<void> {
    try {
      // Import QRCodeElement dynamically to avoid circular dependencies
      const { QRCodeElement } = await import('../elements/QRCodeElement');
      
      const qrCode = await QRCodeElement.createWithLabel(
        this.data.shareUrl,
        'Scan to Join',
        120,
        {
          x: this.config.width - 140,
          y: this.config.height - 160
        }
      );

      this.canvas.add(qrCode);
    } catch (error) {
      console.warn('Failed to generate QR code, using placeholder:', error);
      
      // Fallback to placeholder
      const qrPlaceholder = createRectangle(120, 120, {
        left: this.config.width - 140,
        top: this.config.height - 140,
        fill: BRAND_COLORS.white,
        stroke: BRAND_COLORS.secondary,
        strokeWidth: 2,
        rx: 8,
        ry: 8
      });

      const qrText = createText('QR Code', {
        left: this.config.width - 80,
        top: this.config.height - 80,
        fontSize: 12,
        fill: BRAND_COLORS.text.secondary,
        textAlign: 'center',
        originX: 'center',
        originY: 'center'
      });

      this.canvas.add(qrPlaceholder);
      this.canvas.add(qrText);
    }
  }

  private async renderStatsGrid(startY: number): Promise<void> {
    const center = this.getCenter();
    const cardWidth = 300;
    const cardHeight = 80;
    const spacing = 40;

    // Three stats cards side by side
    const stats = [
      { label: 'Total Pool', value: this.data.totalAmount },
      { label: 'Participants', value: this.data.participantCount.toString() },
      { label: 'Contribution', value: this.data.contribution }
    ];

    const totalWidth = (cardWidth * 3) + (spacing * 2);
    const startX = center.x - (totalWidth / 2);

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      const x = startX + (i * (cardWidth + spacing));
      
      await this.createStatsCard(stat.label, stat.value, x, startY, cardWidth, cardHeight);
    }

    // Interval badge below
    const intervalBadge = this.createTextWithBackground(
      `${this.data.interval} Deposits`,
      {
        left: center.x,
        top: startY + cardHeight + 30,
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        textColor: BRAND_COLORS.white,
        backgroundColor: BRAND_COLORS.highlight,
        padding: 12
      }
    );

    this.canvas.add(intervalBadge);
  }

  private async createStatsCard(
    label: string, 
    value: string, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<void> {
    // Card background
    const cardBg = createRectangle(width, height, {
      left: x,
      top: y,
      fill: BRAND_COLORS.white,
      rx: 12,
      ry: 12,
      selectable: false
    });

    addDropShadow(cardBg, {
      color: 'rgba(0, 0, 0, 0.1)',
      blur: 8,
      offsetX: 0,
      offsetY: 4
    });

    // Value text
    const valueText = createText(value, {
      left: x + width / 2,
      top: y + 20,
      fontSize: 24,
      fontWeight: 'bold',
      fill: BRAND_COLORS.primary,
      textAlign: 'center',
      originX: 'center'
    });

    // Label text
    const labelText = createText(label, {
      left: x + width / 2,
      top: y + 50,
      fontSize: 14,
      fill: BRAND_COLORS.text.secondary,
      textAlign: 'center',
      originX: 'center'
    });

    // Enable object caching for complex elements
    cardBg.set({ objectCaching: true });
    valueText.set({ objectCaching: true });
    labelText.set({ objectCaching: true });

    this.canvas.add(cardBg);
    this.canvas.add(valueText);
    this.canvas.add(labelText);
  }

  private async addGeometricPatterns(): Promise<void> {
    // Add subtle geometric decorations in corners
    const patterns = [];
    
    // Top left pattern
    for (let i = 0; i < 3; i++) {
      const circle = createCircle(8 - i * 2, {
        left: 40 + i * 15,
        top: 40 + i * 15,
        fill: BRAND_COLORS.secondary,
        opacity: 0.3 - i * 0.1
      });
      patterns.push(circle);
    }

    // Bottom right pattern
    for (let i = 0; i < 3; i++) {
      const circle = createCircle(10 - i * 2, {
        left: this.config.width - 60 - i * 20,
        top: this.config.height - 60 - i * 20,
        fill: BRAND_COLORS.highlight,
        opacity: 0.2 - i * 0.05
      });
      patterns.push(circle);
    }

    patterns.forEach(pattern => this.canvas.add(pattern));
  }

  private async addConfetti(): Promise<void> {
    const confettiColors = [
      BRAND_COLORS.highlight,
      BRAND_COLORS.primary,
      BRAND_COLORS.secondary,
      '#FFD700', // Gold
      '#FF69B4'  // Pink
    ];

    // Generate random confetti particles
    for (let i = 0; i < 20; i++) {
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const size = Math.random() * 8 + 4;
      const x = Math.random() * this.config.width;
      const y = Math.random() * this.config.height;
      const rotation = Math.random() * 360;

      const shape = Math.random() > 0.5 ? 'circle' : 'rectangle';

      let confetti: fabric.Object;
      
      if (shape === 'circle') {
        confetti = createCircle(size / 2, {
          left: x,
          top: y,
          fill: color,
          opacity: 0.7
        });
      } else {
        confetti = createRectangle(size, size * 1.5, {
          left: x,
          top: y,
          fill: color,
          opacity: 0.7,
          angle: rotation
        });
      }

      this.canvas.add(confetti);
    }
  }

  private async addCelebrationIcons(): Promise<void> {
    // Add some celebration emojis as text objects
    const icons = ['✨', '🎊', '🌟', '💫'];
    const positions = [
      { x: 150, y: 200 },
      { x: this.config.width - 150, y: 180 },
      { x: 100, y: this.config.height - 200 },
      { x: this.config.width - 100, y: this.config.height - 250 }
    ];

    for (let i = 0; i < icons.length; i++) {
      const icon = createText(icons[i], {
        left: positions[i].x,
        top: positions[i].y,
        fontSize: 32,
        opacity: 0.6,
        originX: 'center',
        originY: 'center'
      });

      this.canvas.add(icon);
    }
  }

  /**
   * Render celebration icon with Kuri logo
   */
  private async renderCelebrationIcon(centerX: number, y: number): Promise<void> {
    try {
      // Create a circular background for the celebration icon
      const iconBg = createCircle(30, {
        left: centerX,
        top: y,
        fill: BRAND_COLORS.white,
        originX: 'center',
        originY: 'center',
        opacity: 0.9
      });

      addDropShadow(iconBg, {
        color: 'rgba(0, 0, 0, 0.15)',
        blur: 8,
        offsetX: 0,
        offsetY: 4
      });

      this.canvas.add(iconBg);

      // Add celebration emoji in the center
      const celebrationEmoji = createText('🎉', {
        left: centerX,
        top: y,
        fontSize: 36,
        originX: 'center',
        originY: 'center'
      });

      this.canvas.add(celebrationEmoji);
    } catch (error) {
      console.warn('Failed to render celebration icon:', error);
      // Fallback to simple emoji
      const fallbackEmoji = createText('🎉', {
        left: centerX,
        top: y,
        fontSize: 40,
        originX: 'center',
        originY: 'center'
      });
      this.canvas.add(fallbackEmoji);
    }
  }

  /**
   * Enhanced background elements inspired by new design
   */
  private async addEnhancedBackgroundElements(): Promise<void> {
    // Add subtle overlay pattern for texture
    const overlayPattern = createRectangle(this.config.width, this.config.height, {
      left: 0,
      top: 0,
      fill: 'rgba(255, 255, 255, 0.03)',
      selectable: false
    });
    
    this.canvas.add(overlayPattern);

    // Add corner accent elements
    await this.addCornerAccents();
  }

  /**
   * Add corner accent elements
   */
  private async addCornerAccents(): Promise<void> {
    // Top-left accent
    const topLeftAccent = createCircle(4, {
      left: 40,
      top: 40,
      fill: BRAND_COLORS.white,
      opacity: 0.3
    });
    
    // Top-right accent
    const topRightAccent = createCircle(6, {
      left: this.config.width - 40,
      top: 40,
      fill: BRAND_COLORS.white,
      opacity: 0.2
    });

    // Bottom accents with different sizes
    const bottomLeftAccent = createCircle(3, {
      left: 60,
      top: this.config.height - 60,
      fill: BRAND_COLORS.white,
      opacity: 0.25
    });

    this.canvas.add(topLeftAccent);
    this.canvas.add(topRightAccent);
    this.canvas.add(bottomLeftAccent);
  }

  /**
   * Enhanced stats grid with improved styling
   */
  private async renderEnhancedStatsGrid(startY: number): Promise<void> {
    const center = this.getCenter();
    const cardWidth = 280;
    const cardHeight = 90;
    const spacing = 30;

    // Create stats with enhanced data presentation
    const stats = [
      { label: 'Total Pool', value: this.data.totalAmount, icon: '💰' },
      { label: 'Participants', value: this.data.participantCount.toString(), icon: '👥' },
      { label: 'Contribution', value: this.data.contribution, icon: '📈' }
    ];

    const totalWidth = (cardWidth * 3) + (spacing * 2);
    const startX = center.x - (totalWidth / 2);

    for (let i = 0; i < stats.length; i++) {
      const stat = stats[i];
      const x = startX + (i * (cardWidth + spacing));
      
      await this.createEnhancedStatsCard(stat.label, stat.value, stat.icon, x, startY, cardWidth, cardHeight);
    }

    // Enhanced interval badge
    const intervalBadge = this.createTextWithBackground(
      `${this.data.interval} Deposits`,
      {
        left: center.x,
        top: startY + cardHeight + 40,
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
        textColor: BRAND_COLORS.white,
        backgroundColor: BRAND_COLORS.highlight,
        padding: 16
      }
    );

    this.canvas.add(intervalBadge);
  }

  /**
   * Create enhanced stats card with better styling
   */
  private async createEnhancedStatsCard(
    label: string, 
    value: string,
    icon: string,
    x: number, 
    y: number, 
    width: number, 
    height: number
  ): Promise<void> {
    // Enhanced card background with gradient
    const cardBg = createRectangle(width, height, {
      left: x,
      top: y,
      fill: BRAND_COLORS.white,
      rx: 16,
      ry: 16,
      selectable: false,
      opacity: 0.95
    });

    addDropShadow(cardBg, {
      color: 'rgba(0, 0, 0, 0.15)',
      blur: 12,
      offsetX: 0,
      offsetY: 6
    });

    // Icon
    const iconText = createText(icon, {
      left: x + 20,
      top: y + height / 2,
      fontSize: 24,
      originY: 'center'
    });

    // Value text with enhanced styling
    const valueText = createText(value, {
      left: x + width / 2,
      top: y + 25,
      fontSize: 28,
      fontWeight: 'bold',
      fill: BRAND_COLORS.primary,
      textAlign: 'center',
      originX: 'center'
    });

    // Label text
    const labelText = createText(label, {
      left: x + width / 2,
      top: y + 60,
      fontSize: 14,
      fill: BRAND_COLORS.text.secondary,
      textAlign: 'center',
      originX: 'center'
    });

    // Enable object caching for performance
    cardBg.set({ objectCaching: true });
    valueText.set({ objectCaching: true });
    labelText.set({ objectCaching: true });

    this.canvas.add(cardBg);
    this.canvas.add(iconText);
    this.canvas.add(valueText);
    this.canvas.add(labelText);
  }
}