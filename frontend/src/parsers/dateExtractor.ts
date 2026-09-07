import { NormalizedField } from '../types';
import { OCRLineCandidate } from './mrpExtractor';
import { normalizeDateToISO, computeRelativeExpiry } from '../utils/formatters';

/**
 * Extracts Manufacturing / Packing Date from OCR text lines.
 * Implements Stage 4 rules:
 * - Triggers: MFD, PKD, Packed On, Manufactured On, Date of Mfg, Mfg Date, Pkg Date, पैकिंग तिथि
 * - Normalizes varied formats (08/25, 08-2025, AUG 2025, 12 AUG 2025) to ISO format (YYYY-MM or YYYY-MM-DD)
 * - Retains original text in sourceText
 */
export function extractManufacturingDate(lines: OCRLineCandidate[]): NormalizedField {
  const mfgPatterns = [
    /(?:mfg\.?\s*(?:date|dt\.?)?|date\s*of\s*mfg|manufactured\s*(?:on|date)?|pkd\.?\s*(?:date)?|packed\s*on|पैकिंग\s*तिथि)\s*[:.\-]?\s*([0-9]{1,2}[/.\-][0-9]{2,4}|[0-9]{1,2}[\s/\-.][a-z]{3,9}[\s/\-.][0-9]{2,4}|[a-z]{3,9}[\s/\-.][0-9]{2,4})/i,
    /\b(?:mfg|pkd|mfd)\b\s*[:.\-]?\s*([0-9]{1,2}[/.\-][0-9]{2,4}|[a-z]{3,9}[\s/\-.][0-9]{2,4})/i
  ];

  interface FoundDateCandidate {
    iso: string;
    original: string;
    fullLineText: string;
    confidence: number;
    boundingBox?: any;
    passSource?: string;
  }

  const detected: FoundDateCandidate[] = [];

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    for (const pat of mfgPatterns) {
      const match = text.match(pat);
      if (match) {
        const rawDate = match[1] || match[0];
        const normalized = normalizeDateToISO(rawDate);
        if (normalized.isValid && normalized.iso) {
          detected.push({
            iso: normalized.iso,
            original: rawDate.trim(),
            fullLineText: text,
            confidence: line.confidence || 0.9,
            boundingBox: line.boundingBox,
            passSource: line.passSource
          });
          break;
        }
      }
    }
  }

  // Fallback: search for date patterns adjacent to "MFG" or standalone MM/YYYY if preceded by MFD
  if (detected.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i].text.trim();
      if (/mfg|pkd|mfd/i.test(text)) {
        const dateMatch = text.match(/\b([0-9]{1,2}[/.\-][0-9]{2,4}|[a-zA-Z]{3,9}\s*[0-9]{2,4})\b/);
        if (dateMatch) {
          const norm = normalizeDateToISO(dateMatch[0]);
          if (norm.isValid && norm.iso) {
            detected.push({
              iso: norm.iso,
              original: dateMatch[0],
              fullLineText: text,
              confidence: (lines[i].confidence || 0.8) * 0.9,
              boundingBox: lines[i].boundingBox,
              passSource: lines[i].passSource
            });
          }
        }
      }
    }
  }

  if (detected.length === 0) {
    return {
      key: 'manufacturingDate',
      label: 'Manufacturing Date',
      value: 'Not detected',
      confidence: 0,
      sourceText: null,
      boundingBox: null,
      status: 'MISSING',
      source: 'OCR',
      ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)'
    };
  }

  // Group by ISO date
  const groups = new Map<string, FoundDateCandidate[]>();
  for (const d of detected) {
    const arr = groups.get(d.iso) || [];
    arr.push(d);
    groups.set(d.iso, arr);
  }

  const sorted = Array.from(groups.entries()).sort((a, b) => {
    if (b[1].length !== a[1].length) return b[1].length - a[1].length;
    return Math.max(...b[1].map((x) => x.confidence)) - Math.max(...a[1].map((x) => x.confidence));
  });

  const [bestISO, bestList] = sorted[0];
  const primary = bestList[0];
  const conf = Math.min(0.98, Math.max(0.72, primary.confidence + (bestList.length - 1) * 0.05));

  return {
    key: 'manufacturingDate',
    label: 'Manufacturing Date',
    value: bestISO, // Normalized ISO representation
    confidence: conf,
    sourceText: primary.fullLineText,
    boundingBox: primary.boundingBox || null,
    status: conf >= 0.85 ? 'VERIFIED' : 'REVIEW',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)',
    note: `Original text: "${primary.original}". Normalized to ISO: ${bestISO}.`
  };
}

/**
 * Extracts Expiry Date / Best Before from OCR text lines.
 * Implements Stage 4 rules:
 * - Triggers: EXP, Best Before, Use Before, Expiry Date, Use By, उपभोग की अंतिम तिथि
 * - Absolute dates parsed directly to ISO
 * - Relative durations (e.g. "Best Before 9 Months from packaging") computed from manufacturingDate
 *   only if manufacturingDate is VERIFIED, otherwise flagged as REVIEW
 * - Validation: Expiry date must not precede Manufacturing date
 */
export function extractExpiryDate(
  lines: OCRLineCandidate[],
  mfgField?: NormalizedField
): NormalizedField {
  const expAbsolutePatterns = [
    /(?:exp\.?\s*(?:date|dt\.?)?|expiry\s*date|use\s*(?:by|before)|उपभोग\s*की\s*अंतिम\s*तिथि)\s*[:.\-]?\s*([0-9]{1,2}[/.\-][0-9]{2,4}|[0-9]{1,2}[\s/\-.][a-z]{3,9}[\s/\-.][0-9]{2,4}|[a-z]{3,9}[\s/\-.][0-9]{2,4})/i,
    /\b(?:exp|use\s*by)\b\s*[:.\-]?\s*([0-9]{1,2}[/.\-][0-9]{2,4}|[a-z]{3,9}[\s/\-.][0-9]{2,4})/i
  ];

  const relativePatterns = [
    /best\s*before\s*([0-9]+)\s*months?(?:\s*from\s*(?:mfg|pkg|pkd|manufacture|packing))?/i,
    /use\s*within\s*([0-9]+)\s*months?/i,
    /shelf\s*life\s*[:.\-]?\s*([0-9]+)\s*months?/i
  ];

  // 1. Try to find absolute date first
  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    for (const pat of expAbsolutePatterns) {
      const match = text.match(pat);
      if (match) {
        const rawDate = match[1] || match[0];
        const normalized = normalizeDateToISO(rawDate);
        if (normalized.isValid && normalized.iso) {
          const conf = Math.max(0.75, Math.min(0.99, line.confidence || 0.9));

          // Stage 5 Validation: Check if expiry precedes manufacturing date
          let dateWarning = '';
          if (mfgField && mfgField.value && mfgField.value !== 'Not detected') {
            if (normalized.iso < mfgField.value) {
              return {
                key: 'expiryDate',
                label: 'Expiry Date',
                value: normalized.iso,
                confidence: 0.5,
                sourceText: text,
                boundingBox: line.boundingBox || null,
                status: 'WARNING',
                source: 'OCR',
                ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)',
                note: `Validation violation: Detected expiry date (${normalized.iso}) precedes manufacturing date (${mfgField.value}).`
              };
            }
          }

          return {
            key: 'expiryDate',
            label: 'Expiry Date',
            value: normalized.iso,
            confidence: conf,
            sourceText: text,
            boundingBox: line.boundingBox || null,
            status: conf >= 0.85 ? 'VERIFIED' : 'REVIEW',
            source: 'OCR',
            ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)',
            note: `Original text: "${rawDate.trim()}". Normalized to ISO: ${normalized.iso}.${dateWarning}`
          };
        }
      }
    }
  }

  // 2. Check for relative duration (e.g. "Best Before 9 Months")
  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    for (const pat of relativePatterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        const durationMonths = parseInt(match[1], 10);
        if (durationMonths > 0 && durationMonths <= 60) {
          const isMfgVerified = mfgField?.status === 'VERIFIED' && mfgField.value && mfgField.value !== 'Not detected';

          if (isMfgVerified) {
            const computed = computeRelativeExpiry(mfgField.value, durationMonths);
            if (computed) {
              return {
                key: 'expiryDate',
                label: 'Expiry Date',
                value: computed.iso,
                confidence: 0.90,
                sourceText: text,
                boundingBox: line.boundingBox || null,
                status: 'VERIFIED',
                source: 'OCR',
                ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)',
                note: `Computed from relative declaration: "${match[0]}" + MFG Date (${mfgField.value}) -> Projected Expiry: ${computed.iso}.`
              };
            }
          }

          // If MFG date is not VERIFIED, set to REVIEW as specified
          return {
            key: 'expiryDate',
            label: 'Expiry Date',
            value: `Best Before ${durationMonths} Months`,
            confidence: 0.72,
            sourceText: text,
            boundingBox: line.boundingBox || null,
            status: 'REVIEW',
            source: 'OCR',
            ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)',
            note: `Relative shelf-life detected (${durationMonths} months), but manufacturing date is not yet fully verified to project absolute expiry.`
          };
        }
      }
    }
  }

  return {
    key: 'expiryDate',
    label: 'Expiry Date',
    value: 'Not detected',
    confidence: 0,
    sourceText: null,
    boundingBox: null,
    status: 'MISSING',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)'
  };
}

