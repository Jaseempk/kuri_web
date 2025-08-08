import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_IMAGE = path.join(__dirname, '../public/images/KuriLogo.png');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Icon sizes needed
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('Generating PWA icons from KuriLogo.png...');
  
  try {
    for (const size of ICON_SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      
      await sharp(INPUT_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
        
      console.log(`✓ Generated ${size}x${size} icon`);
    }
    
    // Generate maskable icon (192x192 with padding)
    const maskableOutput = path.join(OUTPUT_DIR, 'icon-maskable-192.png');
    await sharp(INPUT_IMAGE)
      .resize(154, 154, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .extend({
        top: 19,
        bottom: 19,
        left: 19,
        right: 19,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(maskableOutput);
      
    console.log('✓ Generated maskable icon');
    
    // Generate additional icons referenced in manifest
    const additionalIcons = ['create', 'markets', 'checkmark', 'close', 'badge-72x72'];
    
    for (const iconName of additionalIcons) {
      let outputPath;
      let size = 192;
      
      if (iconName === 'badge-72x72') {
        size = 72;
        outputPath = path.join(OUTPUT_DIR, `${iconName}.png`);
      } else {
        outputPath = path.join(OUTPUT_DIR, `${iconName}.png`);
      }
      
      await sharp(INPUT_IMAGE)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
        
      console.log(`✓ Generated ${iconName} icon`);
    }
    
    console.log('🎉 All PWA icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();