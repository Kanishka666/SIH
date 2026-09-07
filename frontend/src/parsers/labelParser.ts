import {
  NormalizedOCRResult,
  NormalizedFields,
  BoundingBox
} from '../types';
import { OCRLineCandidate, extractMRP } from './mrpExtractor';
import { extractNetQuantity } from './quantityExtractor';
import { extractManufacturingDate, extractExpiryDate } from './dateExtractor';
import {
  extractProductBrandName,
  extractManufacturer,
  extractBatchNumber,
  extractConsumerCare,
  extractCountryOfOrigin,
  extractUnitSalePrice,
  extractStatutoryDeclarations
} from './fieldExtractors';
import { createNormalizedBoundingBox } from '../utils/coordinateTransform';
import { levenshteinDistance } from '../utils/formatters';

export interface RawOCRLine {
  text: string;
  confidence: number;
  bbox?: { x0: number; y0: number; x1: number; y1: number };
  passSource?: string;
  scaleFactor?: number;
}

export interface RawOCRInput {
  text: string;
  lines: RawOCRLine[];
  imageDimensions: {
    width: number;
    height: number;
    aspectRatio: number;
  };
  fileName: string;
  imageSrc: string;
  durationMs: number;
  engineInfo?: string;
}

/**
 * Stage 3: Confidence-Weighted Merge
 * Clusters near-duplicate lines across passes, maps coordinates back to base scale,
 * and boosts confidence for cross-pass agreement (+10%).
 */
function mergeAndClusterLines(
  rawLines: RawOCRLine[],
  imgW: number,
  imgH: number
): OCRLineCandidate[] {
  // Step 1: Map all lines to normalized bounding boxes (accounting for upscale factor)
  const normalizedCandidates: OCRLineCandidate[] = [];

  for (const l of rawLines) {
    const trimmed = l.text.trim();
    if (!trimmed) continue;

    const scale = l.scaleFactor || 1.0;
    let bbox: BoundingBox | undefined;

    if (l.bbox) {
      // Map coordinates back from scaled canvas to original image dimensions
      const origX0 = l.bbox.x0 / scale;
      const origY0 = l.bbox.y0 / scale;
      const origW = (l.bbox.x1 - l.bbox.x0) / scale;
      const origH = (l.bbox.y1 - l.bbox.y0) / scale;

      bbox = createNormalizedBoundingBox(origX0, origY0, Math.max(origW, 10), Math.max(origH, 8), imgW, imgH);
    }

    normalizedCandidates.push({
      text: trimmed,
      confidence: Math.max(0.1, Math.min(1.0, l.confidence > 1.0 ? l.confidence / 100 : l.confidence)),
      boundingBox: bbox,
      passSource: l.passSource || 'standard'
    });
  }

  // Step 2: Cluster near-duplicate lines across passes
  const clusters: Array<{
    primaryText: string;
    allTexts: string[];
    confidence: number;
    passSources: Set<string>;
    boundingBox?: BoundingBox;
  }> = [];

  for (const cand of normalizedCandidates) {
    const cleanCandText = cand.text.toLowerCase().replace(/[^a-z0-9]/g, '');
    let matchedCluster = null;

    for (const cluster of clusters) {
      const cleanClusterText = cluster.primaryText.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Exact match or Levenshtein distance <= 2 for lines of comparable length
      if (cleanCandText === cleanClusterText) {
        matchedCluster = cluster;
        break;
      }

      if (cleanCandText.length >= 6 && cleanClusterText.length >= 6) {
        if (Math.abs(cleanCandText.length - cleanClusterText.length) <= 3) {
          const dist = levenshteinDistance(cleanCandText, cleanClusterText);
          if (dist <= 2) {
            matchedCluster = cluster;
            break;
          }
        }
      }
    }

    if (matchedCluster) {
      matchedCluster.allTexts.push(cand.text);
      matchedCluster.passSources.add(cand.passSource || 'standard');
      // Cross-pass agreement boosts confidence (+10%)
      matchedCluster.confidence = Math.min(0.99, matchedCluster.confidence + 0.10);
      // Prefer the bounding box with highest resolution or larger area
      if (cand.boundingBox && (!matchedCluster.boundingBox || cand.passSource === 'upscaled')) {
        matchedCluster.boundingBox = cand.boundingBox;
      }
      // If candidate has higher individual confidence, upgrade primary text representation
      if (cand.confidence > matchedCluster.confidence) {
        matchedCluster.primaryText = cand.text;
      }
    } else {
      clusters.push({
        primaryText: cand.text,
        allTexts: [cand.text],
        confidence: cand.confidence,
        passSources: new Set([cand.passSource || 'standard']),
        boundingBox: cand.boundingBox
      });
    }
  }

  return clusters.map((c) => ({
    text: c.primaryText,
    confidence: c.confidence,
    boundingBox: c.boundingBox,
    passSource: Array.from(c.passSources).join('+')
  }));
}

/**
 * Parses raw multi-pass OCR engine output into the standardized NormalizedOCRResult data contract.
 * Orchestrates Stages 3, 4, 5, and 6 of the compliance pipeline.
 */
export function parseLabelOCR(input: RawOCRInput): NormalizedOCRResult {
  const { text, lines, imageDimensions, fileName, imageSrc, durationMs, engineInfo } = input;
  const imgW = imageDimensions.width || 800;
  const imgH = imageDimensions.height || 600;

  // Stage 3: Confidence-Weighted Merge
  const mergedCandidates = mergeAndClusterLines(lines, imgW, imgH);

  // Stage 4: Field Extraction
  const productBrandName = extractProductBrandName(mergedCandidates);
  const manufacturer = extractManufacturer(mergedCandidates);
  const mrp = extractMRP(mergedCandidates);
  const netQuantity = extractNetQuantity(mergedCandidates);
  const batchNumber = extractBatchNumber(mergedCandidates);
  const manufacturingDate = extractManufacturingDate(mergedCandidates);
  const expiryDate = extractExpiryDate(mergedCandidates, manufacturingDate);
  const consumerCare = extractConsumerCare(mergedCandidates);
  const countryOfOrigin = extractCountryOfOrigin(mergedCandidates);
  const unitSalePrice = extractUnitSalePrice(mergedCandidates, mrp, netQuantity);
  const declarations = extractStatutoryDeclarations(mergedCandidates);

  // Stage 5: Validation Hardening
  // 1. Net Quantity must not be '0 g' or <= 0
  if (netQuantity.value.startsWith('0 ') || netQuantity.value === '0g') {
    netQuantity.value = 'Not detected';
    netQuantity.status = 'MISSING';
    netQuantity.confidence = 0;
    netQuantity.note = 'Rejected: 0 net quantity is invalid under Legal Metrology Rule 12.';
  }

  // 2. MRP must be valid positive numeric
  if (mrp.value !== 'Not detected' && mrp.value.includes('₹')) {
    const num = parseFloat(mrp.value.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) {
      mrp.value = 'Not detected';
      mrp.status = 'MISSING';
      mrp.confidence = 0;
      mrp.note = 'Rejected: Non-positive or unparseable retail price.';
    }
  }

  const fields: NormalizedFields = {
    productBrandName,
    manufacturer,
    mrp,
    netQuantity,
    batchNumber,
    manufacturingDate,
    expiryDate,
    consumerCare,
    countryOfOrigin,
    unitSalePrice
  };

  return {
    id: `scan-${Date.now()}`,
    fileName: fileName || 'packaging-label.jpg',
    image: {
      src: imageSrc,
      width: imgW,
      height: imgH,
      aspectRatio: imageDimensions.aspectRatio || imgW / imgH
    },
    rawText: text,
    ocrLines: mergedCandidates,
    fields,
    declarations,
    processing: {
      status: 'COMPLETE',
      durationMs,
      engine: engineInfo || 'Tesseract.js Engine v5 (Multi-Pass eng+hin)'
    }
  };
}

