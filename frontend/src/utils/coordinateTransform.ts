import { BoundingBox } from '../types';

export interface RenderedImageRect {
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

/**
 * Calculates the exact rendered rectangle of an image inside an `object-contain` container.
 */
export function calculateObjectContainRect(
  containerWidth: number,
  containerHeight: number,
  imageWidth: number,
  imageHeight: number
): RenderedImageRect {
  if (!containerWidth || !containerHeight || !imageWidth || !imageHeight) {
    return { left: 0, top: 0, width: 0, height: 0, scale: 1 };
  }

  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageWidth / imageHeight;

  let renderedWidth = 0;
  let renderedHeight = 0;

  if (imageAspect > containerAspect) {
    // Letterbox on top & bottom (horizontal fit)
    renderedWidth = containerWidth;
    renderedHeight = containerWidth / imageAspect;
  } else {
    // Letterbox on left & right (vertical fit)
    renderedHeight = containerHeight;
    renderedWidth = containerHeight * imageAspect;
  }

  const left = (containerWidth - renderedWidth) / 2;
  const top = (containerHeight - renderedHeight) / 2;
  const scale = renderedWidth / imageWidth;

  return {
    left,
    top,
    width: renderedWidth,
    height: renderedHeight,
    scale
  };
}

/**
 * Converts normalized bounding box (0..1) to pixel coordinates inside the container viewport,
 * incorporating zoom level and pan offsets.
 */
export function normalizedToViewportRect(
  bbox: BoundingBox,
  renderedRect: RenderedImageRect,
  zoom: number = 1,
  pan: { x: number; y: number } = { x: 0, y: 0 }
) {
  const norm = bbox.normalized;

  // Position relative to the container center with zoom applied
  const baseLeft = renderedRect.left + norm.x * renderedRect.width;
  const baseTop = renderedRect.top + norm.y * renderedRect.height;
  const baseWidth = norm.width * renderedRect.width;
  const baseHeight = norm.height * renderedRect.height;

  // Center point of rendered rect
  const centerX = renderedRect.left + renderedRect.width / 2;
  const centerY = renderedRect.top + renderedRect.height / 2;

  // Zoomed coordinates around center + pan offset
  const zoomedLeft = centerX + (baseLeft - centerX) * zoom + pan.x;
  const zoomedTop = centerY + (baseTop - centerY) * zoom + pan.y;
  const zoomedWidth = baseWidth * zoom;
  const zoomedHeight = baseHeight * zoom;

  return {
    left: zoomedLeft,
    top: zoomedTop,
    width: zoomedWidth,
    height: zoomedHeight
  };
}

/**
 * Creates a normalized BoundingBox object from pixel coordinates and original image dimensions.
 */
export function createNormalizedBoundingBox(
  x: number,
  y: number,
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): BoundingBox {
  const safeImgW = Math.max(imageWidth, 1);
  const safeImgH = Math.max(imageHeight, 1);

  // Clamp within 0..image dimensions
  const clampedX = Math.max(0, Math.min(x, safeImgW));
  const clampedY = Math.max(0, Math.min(y, safeImgH));
  const clampedW = Math.max(1, Math.min(width, safeImgW - clampedX));
  const clampedH = Math.max(1, Math.min(height, safeImgH - clampedY));

  return {
    x: clampedX,
    y: clampedY,
    width: clampedW,
    height: clampedH,
    normalized: {
      x: Number((clampedX / safeImgW).toFixed(4)),
      y: Number((clampedY / safeImgH).toFixed(4)),
      width: Number((clampedW / safeImgW).toFixed(4)),
      height: Number((clampedH / safeImgH).toFixed(4))
    }
  };
}
