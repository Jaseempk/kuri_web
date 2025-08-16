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
    // Create gradient background
    const gradientColors = createBrandGradient('warm');
    const gradient = createGradient(gradientColors, [0, 0, this.config.width, this.config.height]);
    
    const background = createRectangle(this.config.width, this.config.height, {
      left: 0,
      top: 0,
      fill: gradient,
      selectable: false
    });

    this.canvas.add(background);

    // Add subtle geometric patterns
    await this.addGeometricPatterns();
  }

  async renderMainContent(): Promise<void> {
    const center = this.getCenter();
    let currentY = 80;

    // Main celebration title
    const titleText = createText('🎉 Circle Created!', {
      left: center.x,
      top: currentY,
      fontSize: 48,
      fontWeight: 'bold',
      fill: BRAND_COLORS.highlight,
      textAlign: 'center',
      originX: 'center',
      fontFamily: 'Arial, sans-serif'
    });
    
    addDropShadow(titleText, {
      color: 'rgba(0, 0, 0, 0.1)',
      blur: 4,
      offsetX: 2,
      offsetY: 2
    });

    // Enable object caching for performance
    titleText.set({ objectCaching: true });
    this.canvas.add(titleText);
    currentY += 80;

    // Circle name
    const circleNameText = createText(this.truncateText(this.data.circleName, 40), {
      left: center.x,
      top: currentY,
      fontSize: 36,
      fontWeight: 'bold',
      fill: BRAND_COLORS.primary,
      textAlign: 'center',
      originX: 'center',
      fontFamily: 'Arial, sans-serif'
    });

    // Enable object caching for performance
    circleNameText.set({ objectCaching: true });
    this.canvas.add(circleNameText);
    currentY += 80;

    // Creator info
    const creatorText = createText(`Created by ${this.data.creatorAddress}`, {
      left: center.x,
      top: currentY,
      fontSize: 18,
      fill: BRAND_COLORS.text.secondary,
      textAlign: 'center',
      originX: 'center',
      fontFamily: 'Arial, sans-serif'
    });

    this.canvas.add(creatorText);
    currentY += 60;

    // Stats grid
    await this.renderStatsGrid(currentY);
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
}