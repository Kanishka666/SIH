import { NormalizedField } from '../types';
import { OCRLineCandidate } from './mrpExtractor';
import { formatNetQuantity } from '../utils/formatters';

/**
 * Extracts Net Quantity from OCR text lines.
 * Implements Stage 4 & Stage 5 rules:
 * - Triggers: Net Qty, Net Weight, Net Volume, Net Content, N.W., शुद्ध मात्रा
 * - Normalizes unit variants to canonical Legal Metrology units: g | kg | ml | l (and N for count)
 * - Rejection rule: Rejects "0 g", empty, or unit-less partials
 * - Low numeric confidence -> REVIEW, never a fabricated value
 */
export function extractNetQuantity(lines: OCRLineCandidate[]): NormalizedField {
  const prefixPatterns = [
    /(?:net\s*(?:wt\.?|weight|quantity|qty\.?|vol\.?|volume|content)|n\.w\.?|शुद्ध\s*मात्रा)\s*[:.\-]?\s*([0-9]+(?:\.[0-9]+)?\s*(?:kg|g|gm|grams?|ml|l|ltr|litres?|n|tablets?|capsules?|pcs|pieces?|units?))/i,
    /(?:net\s*(?:qty|quantity|content|volume|weight)|शुद्ध\s*मात्रा)\s*[:.\-]?\s*(.+)/i
  ];

  interface FoundQtyCandidate {
    value: number;
    unit: string;
    formatted: string;
    confidence: number;
    sourceText: string;
    boundingBox?: any;
    passSource?: string;
  }

  const candidates: FoundQtyCandidate[] = [];

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    // Reject immediate "0 g" or "0 ml"
    if (/\b0\s*(?:g|gm|kg|ml|l)\b/i.test(text)) {
      continue;
    }

    for (const pat of prefixPatterns) {
      const match = text.match(pat);
      if (match) {
        const parsed = formatNetQuantity(match[1] || text);
        if (parsed.isValid && parsed.value !== null && parsed.unit !== null && parsed.value > 0) {
          candidates.push({
            value: parsed.value,
            unit: parsed.unit,
            formatted: parsed.formatted,
            confidence: line.confidence || 0.9,
            sourceText: text,
            boundingBox: line.boundingBox,
            passSource: line.passSource
          });
          break;
        }
      }
    }
  }

  // Fallback: standalone metric patterns e.g. "500 ml", "1 kg", "200 g"
  if (candidates.length === 0) {
    for (const line of lines) {
      const text = line.text.trim();
      // Skip if line looks like nutritional facts (e.g., "Protein 5g", "Fat 2g", "Sodium 120mg")
      if (/protein|energy|fat|carb|sugar|sodium|cholesterol|calcium|iron|vitamin/i.test(text)) {
        continue;
      }
      if (/\b0\s*(?:g|gm|kg|ml|l)\b/i.test(text)) {
        continue;
      }

      const match = text.match(/\b([1-9][0-9]*(?:\.[0-9]+)?)\s*(kg|k\.g|gm?|gms?|grams?|ml|m\.l|ltr?|litres?|n)\b/i);
      if (match) {
        const parsed = formatNetQuantity(match[0]);
        if (parsed.isValid && parsed.value !== null && parsed.unit !== null && parsed.value > 0) {
          candidates.push({
            value: parsed.value,
            unit: parsed.unit,
            formatted: parsed.formatted,
            confidence: (line.confidence || 0.78) * 0.88,
            sourceText: text,
            boundingBox: line.boundingBox,
            passSource: line.passSource
          });
        }
      }
    }
  }

  if (candidates.length === 0) {
    return {
      key: 'netQuantity',
      label: 'Net Quantity',
      value: 'Not detected',
      confidence: 0,
      sourceText: null,
      boundingBox: null,
      status: 'MISSING',
      source: 'OCR',
      ruleCitation: 'Legal Metrology Rules 2011, Rule 12'
    };
  }

  // Group by canonical formatted string (e.g. "500 ml")
  const groups = new Map<string, FoundQtyCandidate[]>();
  for (const c of candidates) {
    const existing = groups.get(c.formatted) || [];
    existing.push(c);
    groups.set(c.formatted, existing);
  }

  const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    const maxB = Math.max(...b[1].map((x) => x.confidence));
    const maxA = Math.max(...a[1].map((x) => x.confidence));
    return maxB - maxA;
  });

  const [bestFormatted, bestList] = sortedGroups[0];
  const primary = bestList[0];

  const agreementBonus = (bestList.length - 1) * 0.05;
  const finalConfidence = Math.min(0.98, Math.max(0.68, primary.confidence + agreementBonus));

  const note =
    bestList.length > 1
      ? `Cross-pass verification: verified in ${bestList.length} OCR passes.`
      : undefined;

  return {
    key: 'netQuantity',
    label: 'Net Quantity',
    value: bestFormatted,
    confidence: finalConfidence,
    sourceText: primary.sourceText,
    boundingBox: primary.boundingBox || null,
    status: finalConfidence >= 0.85 ? 'VERIFIED' : 'REVIEW',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 12',
    note
  };
}

