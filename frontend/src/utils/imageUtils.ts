export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

/**
 * Validates whether the uploaded file is a supported image or document format.
 */
export function validateLabelFile(file: File): { valid: boolean; error?: string } {
  const validMimeTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'application/pdf'
  ];

  const maxSizeBytes = 30 * 1024 * 1024; // 30MB

  if (!validMimeTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp|bmp|tiff|pdf)$/i)) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload PNG, JPG, JPEG, WEBP, or PDF.'
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'File size exceeds 30MB limit. Please upload a smaller packaging scan.'
    };
  }

  return { valid: true };
}

/**
 * Extracts natural image dimensions asynchronously.
 */
export function getImageDimensions(imageSrc: string): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = img.naturalWidth || img.width || 800;
      const height = img.naturalHeight || img.height || 600;
      resolve({
        width,
        height,
        aspectRatio: width / height
      });
    };
    img.onerror = () => {
      // Fallback default
      resolve({
        width: 800,
        height: 600,
        aspectRatio: 800 / 600
      });
    };
    img.src = imageSrc;
  });
}

/**
 * Preprocesses an image on an offscreen canvas to optimize OCR text recognition.
 * Enhances contrast, converts to grayscale, and applies slight sharpening.
 */
export async function preprocessImageForOCR(imageSrc: string): Promise<{
  processedDataUrl: string;
  width: number;
  height: number;
}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 2000;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Scale down if exceedingly large to maintain responsive OCR speed
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve({ processedDataUrl: imageSrc, width, height });
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // Grayscale + Contrast stretch
        let minLum = 255;
        let maxLum = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Rec. 709 luminance
          const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }

        const range = Math.max(maxLum - minLum, 1);

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

          // Normalized stretched contrast
          let stretched = ((lum - minLum) / range) * 255;
          // Apply slight gamma curve for clearer text edges
          stretched = Math.pow(stretched / 255, 1.1) * 255;

          data[i] = stretched;
          data[i + 1] = stretched;
          data[i + 2] = stretched;
        }

        ctx.putImageData(imgData, 0, 0);
        resolve({
          processedDataUrl: canvas.toDataURL('image/jpeg', 0.92),
          width,
          height
        });
      } catch {
        // In case of any canvas tainted issues, return original
        resolve({ processedDataUrl: imageSrc, width, height });
      }
    };

    img.onerror = () => {
      resolve({ processedDataUrl: imageSrc, width: 800, height: 600 });
    };

    img.src = imageSrc;
  });
}
