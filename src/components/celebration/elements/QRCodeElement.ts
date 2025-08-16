import * as fabric from 'fabric';
import QRCode from 'qrcode-generator';

export class QRCodeElement {
  static async create(
    shareUrl: string,
    size: number = 120,
    position: { x: number; y: number } = { x: 0, y: 0 }
  ): Promise<fabric.Group> {
    try {
      // Handle long URLs by using fallback strategies
      let urlToEncode = shareUrl;
      
      // Strategy 1: If URL is too long, create a shorter version
      if (shareUrl.length > 400) {
        // Extract base domain and market address
        const url = new URL(shareUrl);
        const pathParts = url.pathname.split('/');
        const marketAddress = pathParts[pathParts.length - 1];
        urlToEncode = `${url.origin}/m/${marketAddress}`;
        console.log('QR URL shortened from', shareUrl.length, 'to', urlToEncode.length, 'characters');
      }
      
      // Strategy 2: Use lower error correction for more data capacity
      const qr = QRCode(4, 'L'); // Use 'L' (Low) error correction for maximum data capacity
      qr.addData(urlToEncode);
      qr.make();

      // Get QR code modules (the black/white squares)  
      const moduleCount = qr.getModuleCount();
      const modules = (qr as any).modules || [];
      const moduleSize = size / moduleCount;

      const qrObjects: fabric.Object[] = [];

      // Create white background
      const background = new fabric.Rect({
        width: size,
        height: size,
        fill: '#ffffff',
        left: 0,
        top: 0
      });
      qrObjects.push(background);

      // Create black modules
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (modules[row] && modules[row][col]) {
            const module = new fabric.Rect({
              width: moduleSize,
              height: moduleSize,
              fill: '#000000',
              left: col * moduleSize,
              top: row * moduleSize
            });
            qrObjects.push(module);
          }
        }
      }

      // Create group
      const qrGroup = new fabric.Group(qrObjects, {
        left: position.x,
        top: position.y,
        selectable: false
      });

      return qrGroup;
    } catch (error) {
      console.error('QR code generation failed:', error);
      
      // Strategy 3: Try with even more aggressive URL shortening
      if (error instanceof Error && error.message && error.message.includes('code length overflow')) {
        try {
          const url = new URL(shareUrl);
          const pathParts = url.pathname.split('/');
          const marketAddress = pathParts[pathParts.length - 1];
          // Use just the domain and last 8 characters of address
          const ultraShortUrl = `${url.origin}/${marketAddress.slice(-8)}`;
          
          const fallbackQr = QRCode(4, 'L');
          fallbackQr.addData(ultraShortUrl);
          fallbackQr.make();
          
          const moduleCount = fallbackQr.getModuleCount();
          const modules = (fallbackQr as any).modules || [];
          const moduleSize = size / moduleCount;
          const qrObjects: fabric.Object[] = [];

          // Create white background
          const background = new fabric.Rect({
            width: size,
            height: size,
            fill: '#ffffff',
            left: 0,
            top: 0
          });
          qrObjects.push(background);

          // Create black modules
          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              if (modules[row] && modules[row][col]) {
                const module = new fabric.Rect({
                  width: moduleSize,
                  height: moduleSize,
                  fill: '#000000',
                  left: col * moduleSize,
                  top: row * moduleSize
                });
                qrObjects.push(module);
              }
            }
          }

          console.log('QR generated with ultra-short URL:', ultraShortUrl);
          return new fabric.Group(qrObjects, {
            left: position.x,
            top: position.y,
            selectable: false
          });
        } catch (fallbackError) {
          console.warn('Fallback QR generation also failed:', fallbackError);
        }
      }
      
      // Final fallback: Return a simple placeholder rectangle
      const placeholder = new fabric.Rect({
        width: size,
        height: size,
        fill: '#f3f4f6',
        stroke: '#d1d5db',
        strokeWidth: 1,
        left: position.x,
        top: position.y
      });
      
      const placeholderText = new fabric.FabricText('Share Link', {
        left: position.x + size / 2,
        top: position.y + size / 2,
        fontSize: 10,
        fill: '#6b7280',
        originX: 'center',
        originY: 'center'
      });
      
      return new fabric.Group([placeholder, placeholderText], {
        left: position.x,
        top: position.y,
        selectable: false
      });
    }
  }

  static async createWithBorder(
    shareUrl: string,
    size: number = 120,
    position: { x: number; y: number } = { x: 0, y: 0 },
    borderColor: string = '#E8DED1',
    borderWidth: number = 2,
    borderRadius: number = 8
  ): Promise<fabric.Group> {
    try {
      const qrCode = await this.create(shareUrl, size - (borderWidth * 2), {
        x: borderWidth,
        y: borderWidth
      });

      // Create border
      const border = new fabric.Rect({
        width: size,
        height: size,
        fill: 'transparent',
        stroke: borderColor,
        strokeWidth: borderWidth,
        rx: borderRadius,
        ry: borderRadius,
        left: 0,
        top: 0
      });

      // Create background with rounded corners
      const background = new fabric.Rect({
        width: size,
        height: size,
        fill: '#ffffff',
        rx: borderRadius,
        ry: borderRadius,
        left: 0,
        top: 0
      });

      // Group everything together
      const group = new fabric.Group([background, qrCode, border], {
        left: position.x,
        top: position.y,
        selectable: false
      });

      return group;
    } catch (error) {
      console.error('QR code with border generation failed:', error);
      // Return a simple bordered placeholder
      const placeholder = new fabric.Rect({
        width: size,
        height: size,
        fill: '#f3f4f6',
        stroke: borderColor,
        strokeWidth: borderWidth,
        rx: borderRadius,
        ry: borderRadius,
        left: position.x,
        top: position.y
      });
      
      return new fabric.Group([placeholder], {
        left: position.x,
        top: position.y,
        selectable: false
      });
    }
  }

  static async createWithLabel(
    shareUrl: string,
    label: string = 'Scan to Join',
    size: number = 120,
    position: { x: number; y: number } = { x: 0, y: 0 }
  ): Promise<fabric.Group> {
    try {
      const qrCode = await this.createWithBorder(shareUrl, size, { x: 0, y: 0 });

      // Create label text
      const labelText = new fabric.FabricText(label, {
        left: size / 2,
        top: size + 10,
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fill: '#6b7280',
        textAlign: 'center',
        originX: 'center',
        originY: 'top'
      });

      // Group QR code and label
      const group = new fabric.Group([qrCode, labelText], {
        left: position.x,
        top: position.y,
        selectable: false
      });

      return group;
    } catch (error) {
      console.error('QR code with label generation failed:', error);
      // Return a simple placeholder with label
      const placeholder = new fabric.Rect({
        width: size,
        height: size,
        fill: '#f3f4f6',
        stroke: '#E8DED1',
        strokeWidth: 2,
        rx: 8,
        ry: 8,
        left: 0,
        top: 0
      });
      
      const placeholderText = new fabric.FabricText('QR Code', {
        left: size / 2,
        top: size / 2,
        fontSize: 12,
        fill: '#6b7280',
        originX: 'center',
        originY: 'center'
      });
      
      const labelText = new fabric.FabricText(label, {
        left: size / 2,
        top: size + 10,
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fill: '#6b7280',
        textAlign: 'center',
        originX: 'center',
        originY: 'top'
      });

      return new fabric.Group([placeholder, placeholderText, labelText], {
        left: position.x,
        top: position.y,
        selectable: false
      });
    }
  }
}