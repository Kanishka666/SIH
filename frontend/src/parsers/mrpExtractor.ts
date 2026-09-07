import { BoundingBox, NormalizedField } from '../types';
import { formatCurrencyMRP } from '../utils/formatters';

export interface OCRLineCandidate {
  text: string;
  confidence: number;
  boundingBox?: BoundingBox;
  passSource?: string;
}

/**
 * Extracts Maximum Retail Price (MRP) from OCR text lines.
 * Implements Stage 4 & Stage 5 rules:
 * - Triggers: MRP, M.R.P, Maximum Retail Price, Rs., ₹, Incl. of all taxes, Hindi एमआरपी
 * - Validates positive numeric, plausible retail range (1 to 100,000)
 * - Rejects if MRP contains letters in numeric amount or is <= 0
 * - Cross-pass candidate normalization and confidence weighting
 */
export function extractMRP(lines: OCRLineCandidate[]): NormalizedField {
  const mrpTriggers = [
    /(?:m\.?r\.?p\.?|maximum\s*retail\s*price|max\s*retail\s*price|एम\.?आर\.?पी\.?|एमआरपी)\s*[:.\-]?\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /(?:₹|rs\.?|inr)\s*([0-9]+(?:[.,][0-9]{1,2})?)\s*(?:incl\.?|inclusive|\(incl|कर\s*सहित)/i,
    /(?:m\.?r\.?p\.?|maximum\s*retail\s*price)\s*[:.\-]?\s*(.+)/i
  ];

  interface FoundMRPCandidate {
    amount: number;
    formatted: string;
    hasTaxClause: boolean;
    confidence: number;
    sourceText: string;
    boundingBox?: BoundingBox;
    passSource?: string;
  }

  const detectedCandidates: FoundMRPCandidate[] = [];

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    // Check specific MRP triggers
    for (const pat of mrpTriggers) {
      if (pat.test(text)) {
        const parsed = formatCurrencyMRP(text);
        if (parsed.isValid && parsed.amount !== null) {
          detectedCandidates.push({
            amount: parsed.amount,
            formatted: parsed.formatted,
            hasTaxClause: parsed.hasTaxClause,
            confidence: line.confidence || 0.88,
            sourceText: text,
            boundingBox: line.boundingBox,
            passSource: line.passSource
          });
          break;
        }
      }
    }
  }

  // Fallback: search for standalone ₹ / Rs. lines if no explicit "MRP" keyword was caught
  if (detectedCandidates.length === 0) {
    for (const line of lines) {
      const match = line.text.match(/(?:₹|rs\.?)\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
      if (match) {
        const parsed = formatCurrencyMRP(line.text);
        if (parsed.isValid && parsed.amount !== null) {
          detectedCandidates.push({
            amount: parsed.amount,
            formatted: parsed.formatted,
            hasTaxClause: parsed.hasTaxClause,
            confidence: (line.confidence || 0.75) * 0.9,
            sourceText: line.text,
            boundingBox: line.boundingBox,
            passSource: line.passSource
          });
        }
      }
    }
  }

  // If no candidates found
  if (detectedCandidates.length === 0) {
    return {
      key: 'mrp',
      label: 'Maximum Retail Price (MRP)',
      value: 'Not detected',
      confidence: 0,
      sourceText: null,
      boundingBox: null,
      status: 'MISSING',
      source: 'OCR',
      ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(e)'
    };
  }

  // Stage 3 & 5: Confidence-weighted clustering and selection
  // Group by exact amount to detect cross-pass agreement
  const amountGroups = new Map<number, FoundMRPCandidate[]>();
  for (const cand of detectedCandidates) {
    const existing = amountGroups.get(cand.amount) || [];
    existing.push(cand);
    amountGroups.set(cand.amount, existing);
  }

  // Sort groups by: count of agreeing detections (descending), then max confidence (descending)
  const sortedGroups = Array.from(amountGroups.entries()).sort((a, b) => {
    if (b[1].length !== a[1].length) {
      return b[1].length - a[1].length; // More cross-pass agreement wins
    }
    const maxConfB = Math.max(...b[1].map((c) => c.confidence));
    const maxConfA = Math.max(...a[1].map((c) => c.confidence));
    return maxConfB - maxConfA;
  });

  const [winningAmount, winningCandidates] = sortedGroups[0];
  const primaryCandidate = winningCandidates.find((c) => c.hasTaxClause) || winningCandidates[0];

  // Cross-pass agreement boosts confidence (+5% per agreeing pass, max 0.98)
  const agreementBonus = (winningCandidates.length - 1) * 0.05;
  const finalConfidence = Math.min(0.98, Math.max(0.70, primaryCandidate.confidence + agreementBonus));

  // Collect discarded alternative readings to store in internal note
  const discardedNotes: string[] = [];
  for (let i = 1; i < sortedGroups.length; i++) {
    const [altAmt, altCands] = sortedGroups[i];
    discardedNotes.push(`₹${altAmt} (conf: ${(altCands[0].confidence).toFixed(2)})`);
  }

  const noteDetails: string[] = [];
  if (winningCandidates.length > 1) {
    noteDetails.push(`Cross-pass verification: verified in ${winningCandidates.length} OCR passes.`);
  }
  if (!primaryCandidate.hasTaxClause) {
    noteDetails.push('Warning: Mandatory tax inclusion clause not explicitly verified adjacent to MRP.');
  }
  if (discardedNotes.length > 0) {
    noteDetails.push(`Discarded alternatives: ${discardedNotes.join(', ')}.`);
  }

  return {
    key: 'mrp',
    label: 'Maximum Retail Price (MRP)',
    value: primaryCandidate.formatted,
    confidence: finalConfidence,
    sourceText: primaryCandidate.sourceText,
    boundingBox: primaryCandidate.boundingBox || null,
    status: finalConfidence >= 0.85 && primaryCandidate.hasTaxClause ? 'VERIFIED' : 'REVIEW',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(e)',
    note: noteDetails.length > 0 ? noteDetails.join(' ') : undefined
  };
}
