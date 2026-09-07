import { validateLabelFile, getImageDimensions, ImageDimensions } from '../utils/imageUtils';

export interface ProcessedImageData {
  file?: File;
  originalSrc: string;
  processedSrc: string;
  upscaledSrc: string;
  thresholdSrc: string;
  topCropSrc: string;
  fileName: string;
  dimensions: ImageDimensions;
}

/**
 * Validates and prepares an uploaded image or camera frame for multi-pass OCR analysis.
 * Stage 0: Preserves natural dimensions and coordinate mapping.
 * Stage 1: Generates multi-scale enhanced variants (sharpened, 2x upscaled, adaptive threshold).
 */
export async function prepareImageForOCR(
  source: File | string,
  customFileName?: string
): Promise<ProcessedImageData> {
  let originalSrc: string;
  let fileName = customFileName || 'packaging-label.jpg';
  let fileObj: File | undefined;

  if (typeof source === 'string') {
    originalSrc = source;
  } else {
    fileObj = source;
    const validation = validateLabelFile(source);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file format.');
    }
    fileName = source.name;
    originalSrc = URL.createObjectURL(source);
  }

  // Fetch image natural dimensions (Stage 0: Input Normalization)
  const dimensions = await getImageDimensions(originalSrc);

  // Generate multi-scale variants (Stage 1: Preprocessing)
  const variants = await generateImageVariants(originalSrc, dimensions);

  return {
    file: fileObj,
    originalSrc,
    processedSrc: variants.standard,
    upscaledSrc: variants.upscaled,
    thresholdSrc: variants.threshold,
    topCropSrc: variants.topCrop,
    fileName,
    dimensions
  };
}

/**
 * Produces multi-scale image representations on offscreen canvases:
 * 1. Standard contrast-stretched grayscale with unsharp mask
 * 2. 2x upscaled high-resolution variant for small 8pt statutory text
 * 3. Adaptive threshold variant for faint ink-jet printed dates and batch codes
 * 4. Top-third crop for brand identification
 */
async function generateImageVariants(
  imageSrc: string,
  dims: ImageDimensions
): Promise<{ standard: string; upscaled: string; threshold: string; topCrop: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const origW = dims.width || img.naturalWidth || img.width || 800;
      const origH = dims.height || img.naturalHeight || img.height || 600;

      // 1. Standard variant
      const maxDim = 2000;
      let w = origW;
      let h = origH;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvasStd = document.createElement('canvas');
      canvasStd.width = w;
      canvasStd.height = h;
      const ctxStd = canvasStd.getContext('2d', { willReadFrequently: true });

      if (!ctxStd) {
        resolve({
          standard: imageSrc,
          upscaled: imageSrc,
          threshold: imageSrc,
          topCrop: imageSrc
        });
        return;
      }

      ctxStd.drawImage(img, 0, 0, w, h);
      const imgDataStd = ctxStd.getImageData(0, 0, w, h);
      const dataStd = imgDataStd.data;

      // Contrast stretching & Grayscale conversion
      let minLum = 255;
      let maxLum = 0;
      for (let i = 0; i < dataStd.length; i += 4) {
        const lum = Math.round(0.2126 * dataStd[i] + 0.7152 * dataStd[i + 1] + 0.0722 * dataStd[i + 2]);
        if (lum < minLum) minLum = lum;
        if (lum > maxLum) maxLum = lum;
      }
      const range = Math.max(maxLum - minLum, 1);

      for (let i = 0; i < dataStd.length; i += 4) {
        const lum = 0.2126 * dataStd[i] + 0.7152 * dataStd[i + 1] + 0.0722 * dataStd[i + 2];
        let stretched = ((lum - minLum) / range) * 255;
        stretched = Math.pow(stretched / 255, 1.08) * 255;
        dataStd[i] = stretched;
        dataStd[i + 1] = stretched;
        dataStd[i + 2] = stretched;
      }
      ctxStd.putImageData(imgDataStd, 0, 0);
      const standardUrl = canvasStd.toDataURL('image/jpeg', 0.92);

      // 2. 2x Upscaled Sharp Variant (ideal for 8pt fine text, batch numbers, phone numbers)
      const upW = Math.min(w * 2, 2800);
      const upH = Math.min(h * 2, 2800);
      const canvasUp = document.createElement('canvas');
      canvasUp.width = upW;
      canvasUp.height = upH;
      const ctxUp = canvasUp.getContext('2d', { willReadFrequently: true });
      let upscaledUrl = standardUrl;

      if (ctxUp) {
        ctxUp.imageSmoothingEnabled = true;
        ctxUp.imageSmoothingQuality = 'high';
        ctxUp.drawImage(canvasStd, 0, 0, upW, upH);

        try {
          const imgDataUp = ctxUp.getImageData(0, 0, upW, upH);
          const dUp = imgDataUp.data;
          const copy = new Uint8ClampedArray(dUp);

          for (let y = 1; y < upH - 1; y += 2) {
            for (let x = 1; x < upW - 1; x += 2) {
              const idx = (y * upW + x) * 4;
              const val =
                5 * copy[idx] -
                copy[idx - 4] -
                copy[idx + 4] -
                copy[idx - upW * 4] -
                copy[idx + upW * 4];
              const clamped = Math.max(0, Math.min(255, val));
              dUp[idx] = clamped;
              dUp[idx + 1] = clamped;
              dUp[idx + 2] = clamped;
            }
          }
          ctxUp.putImageData(imgDataUp, 0, 0);
          upscaledUrl = canvasUp.toDataURL('image/jpeg', 0.90);
        } catch {
          upscaledUrl = canvasUp.toDataURL('image/jpeg', 0.88);
        }
      }

      // 3. Adaptive Threshold Variant (for ink-jet dot matrix mfg dates)
      const canvasThresh = document.createElement('canvas');
      canvasThresh.width = w;
      canvasThresh.height = h;
      const ctxThresh = canvasThresh.getContext('2d', { willReadFrequently: true });
      let thresholdUrl = standardUrl;

      if (ctxThresh) {
        ctxThresh.drawImage(canvasStd, 0, 0, w, h);
        try {
          const imgDataThresh = ctxThresh.getImageData(0, 0, w, h);
          const dThresh = imgDataThresh.data;
          const avgLum = (minLum + maxLum) / 2;
          const thresholdVal = avgLum > 50 ? avgLum : 128;

          for (let i = 0; i < dThresh.length; i += 4) {
            const v = dThresh[i] > thresholdVal ? 255 : 0;
            dThresh[i] = v;
            dThresh[i + 1] = v;
            dThresh[i + 2] = v;
          }
          ctxThresh.putImageData(imgDataThresh, 0, 0);
          thresholdUrl = canvasThresh.toDataURL('image/jpeg', 0.90);
        } catch {
          thresholdUrl = standardUrl;
        }
      }

      // 4. Top-Third Crop for Brand / Product Name Isolation
      const canvasTop = document.createElement('canvas');
      const cropH = Math.round(h * 0.4);
      canvasTop.width = w;
      canvasTop.height = cropH;
      const ctxTop = canvasTop.getContext('2d');
      let topCropUrl = standardUrl;
      if (ctxTop) {
        ctxTop.drawImage(canvasStd, 0, 0, w, cropH, 0, 0, w, cropH);
        topCropUrl = canvasTop.toDataURL('image/jpeg', 0.90);
      }

      resolve({
        standard: standardUrl,
        upscaled: upscaledUrl,
        threshold: thresholdUrl,
        topCrop: topCropUrl
      });
    };

    img.onerror = () => {
      resolve({
        standard: imageSrc,
        upscaled: imageSrc,
        threshold: imageSrc,
        topCrop: imageSrc
      });
    };

    img.src = imageSrc;
  });
}

/**
 * Releases memory for temporary object URLs.
 */
export function cleanupImageUrl(url: string) {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}
