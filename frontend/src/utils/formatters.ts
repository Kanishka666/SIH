/**
 * Utility formatters and normalizers for Legal Metrology compliance parsing.
 */

// Month name lookup for parsing month names in dates
const MONTH_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12'
};

/**
 * Normalizes currency and MRP strings.
 * Validates positive numeric amount and plausible retail range (₹1 to ₹100,000).
 */
export function formatCurrencyMRP(rawText: string): {
  amount: number | null;
  formatted: string;
  hasTaxClause: boolean;
  isValid: boolean;
} {
  if (!rawText) {
    return { amount: null, formatted: 'Not detected', hasTaxClause: false, isValid: false };
  }

  // Check for statutory tax inclusion clauses
  const hasTaxClause =
    /(?:incl\.|inclusive|incl)\s*(?:of)?\s*all\s*taxes/i.test(rawText) ||
    /taxes\s*incl/i.test(rawText) ||
    /all\s*taxes/i.test(rawText) ||
    /कर\s*सहित/i.test(rawText);

  // Clean common OCR noise like trailing dots, dashes, colons
  const cleaned = rawText.replace(/[:=\-_]/g, ' ');

  // Match currency number with optional decimals
  // E.g., "MRP ₹ 249.00", "Rs. 20", "MRP: 25.00", "₹ 1,299.00"
  const match = cleaned.match(/(?:₹|rs\.?|inr|mrp|\bprice\b)?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/i);
  
  if (match && match[1]) {
    const rawNum = match[1].replace(/,/g, '');
    const num = parseFloat(rawNum);

    // Validate positive numeric, plausible retail range
    if (!isNaN(num) && num > 0 && num <= 100000) {
      const formatted = `₹ ${num.toFixed(2)}${hasTaxClause ? ' (Incl. of all taxes)' : ''}`;
      return { amount: num, formatted, hasTaxClause, isValid: true };
    }
  }

  return { amount: null, formatted: rawText.trim(), hasTaxClause, isValid: false };
}

/**
 * Normalizes Net Quantity to canonical Legal Metrology units: g | kg | ml | l (or N for count).
 * Rejects "0 g", empty strings, and unit-less partials.
 */
export function formatNetQuantity(rawText: string): {
  value: number | null;
  unit: string | null;
  formatted: string;
  isValid: boolean;
} {
  if (!rawText) {
    return { value: null, unit: null, formatted: 'Not detected', isValid: false };
  }

  // Match metric quantity patterns
  const match = rawText.match(
    /\b([0-9]+(?:\.[0-9]+)?)\s*(kg|k\.g\.?|kilograms?|gm?|gms?|grams?|ml|m\.l\.?|millilitres?|ltr?|litres?|liter|tablets?|capsules?|gummies?|count|pieces?|pcs|n|units?)\b/i
  );

  if (match) {
    const val = parseFloat(match[1]);
    let rawUnit = match[2].toLowerCase().replace(/\./g, '');

    // Rejection rule: Reject 0 or negative values (e.g., "0 g")
    if (isNaN(val) || val <= 0) {
      return { value: null, unit: null, formatted: 'Not detected', isValid: false };
    }

    // Standardize to canonical Legal Metrology units: g | kg | ml | l
    let canonicalUnit: string;
    if (/^(g|gm|gms|gram|grams)$/.test(rawUnit)) {
      canonicalUnit = 'g';
    } else if (/^(kg|kilogram|kilograms)$/.test(rawUnit)) {
      canonicalUnit = 'kg';
    } else if (/^(ml|millilitre|millilitres|milliliter)$/.test(rawUnit)) {
      canonicalUnit = 'ml';
    } else if (/^(l|lt|ltr|litre|litres|liter)$/.test(rawUnit)) {
      canonicalUnit = 'l';
    } else if (/^(n|units?|pieces?|pcs|count|tablets?|capsules?)$/.test(rawUnit)) {
      canonicalUnit = 'N';
    } else {
      canonicalUnit = rawUnit;
    }

    return {
      value: val,
      unit: canonicalUnit,
      formatted: `${val} ${canonicalUnit}`,
      isValid: true
    };
  }

  // Check for rejected "0 g" pattern
  if (/\b0\s*(?:g|gm|kg|ml|l)\b/i.test(rawText)) {
    return { value: null, unit: null, formatted: 'Not detected', isValid: false };
  }

  return { value: null, unit: null, formatted: rawText.trim(), isValid: false };
}

/**
 * Normalizes varied retail packaging date strings (e.g. "08/25", "08-2025", "AUG 2025", "12 AUG 2025")
 * into canonical ISO formats (YYYY-MM or YYYY-MM-DD).
 */
export function normalizeDateToISO(dateString: string): {
  iso: string | null;
  original: string;
  isValid: boolean;
  dateObj: Date | null;
} {
  if (!dateString) {
    return { iso: null, original: '', isValid: false, dateObj: null };
  }

  const cleaned = dateString.trim().replace(/[,:]/g, ' ');

  // 1. Day Month Year (e.g., "12 AUG 2025" or "12/08/2025" or "12-08-2025")
  const dayMonthYearNamed = cleaned.match(/\b([0-9]{1,2})[\s/\-.]([a-zA-Z]{3,9})[\s/\-.]([0-9]{2,4})\b/);
  if (dayMonthYearNamed) {
    const day = parseInt(dayMonthYearNamed[1], 10);
    const mStr = dayMonthYearNamed[2].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[mStr];
    let year = parseInt(dayMonthYearNamed[3], 10);
    if (year < 100) year += 2000;

    if (month && day >= 1 && day <= 31) {
      const padDay = day.toString().padStart(2, '0');
      const iso = `${year}-${month}-${padDay}`;
      const dateObj = new Date(year, parseInt(month, 10) - 1, day);
      return { iso, original: dateString, isValid: true, dateObj };
    }
  }

  // 2. Named Month Year (e.g., "AUG 2025" or "August 2025")
  const namedMonthYear = cleaned.match(/\b([a-zA-Z]{3,9})[\s/\-.]([0-9]{2,4})\b/);
  if (namedMonthYear) {
    const mStr = namedMonthYear[1].toLowerCase().slice(0, 3);
    const month = MONTH_MAP[mStr];
    let year = parseInt(namedMonthYear[2], 10);
    if (year < 100) year += 2000;

    if (month) {
      const iso = `${year}-${month}`;
      const dateObj = new Date(year, parseInt(month, 10) - 1, 1);
      return { iso, original: dateString, isValid: true, dateObj };
    }
  }

  // 3. Numeric Month/Year or Day/Month/Year (e.g., "08/2025", "08/25", "08-2025", "12/08/2025")
  const numericMatch = cleaned.match(/\b([0-9]{1,2})[\s/\-.]([0-9]{1,2})[\s/\-.]([0-9]{2,4})\b/);
  if (numericMatch) {
    const part1 = parseInt(numericMatch[1], 10);
    const part2 = parseInt(numericMatch[2], 10);
    let year = parseInt(numericMatch[3], 10);
    if (year < 100) year += 2000;

    // Typically DD/MM/YYYY in India
    let day = part1;
    let month = part2;
    if (month > 12 && day <= 12) {
      // Swapped MM/DD/YYYY
      const tmp = month;
      month = day;
      day = tmp;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const padM = month.toString().padStart(2, '0');
      const padD = day.toString().padStart(2, '0');
      const iso = `${year}-${padM}-${padD}`;
      const dateObj = new Date(year, month - 1, day);
      return { iso, original: dateString, isValid: true, dateObj };
    }
  }

  // 4. MM/YYYY or MM/YY format (e.g. "08/25", "08-2025", "03/2026")
  const mmYyyy = cleaned.match(/\b([0-9]{1,2})[\s/\-.]([0-9]{2,4})\b/);
  if (mmYyyy) {
    const month = parseInt(mmYyyy[1], 10);
    let year = parseInt(mmYyyy[2], 10);
    if (year < 100) year += 2000;

    if (month >= 1 && month <= 12 && year >= 2020 && year <= 2035) {
      const padM = month.toString().padStart(2, '0');
      const iso = `${year}-${padM}`;
      const dateObj = new Date(year, month - 1, 1);
      return { iso, original: dateString, isValid: true, dateObj };
    }
  }

  return { iso: null, original: dateString, isValid: false, dateObj: null };
}

/**
 * Computes projected expiry date from manufacturing date when relative duration
 * (e.g. "Best Before 9 Months") is printed on the packaging.
 */
export function computeRelativeExpiry(
  mfgDateISO: string,
  durationMonths: number
): { iso: string; formatted: string } | null {
  const parts = mfgDateISO.split('-');
  if (parts.length < 2) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parts[2] ? parseInt(parts[2], 10) : 1;

  if (isNaN(year) || isNaN(month)) return null;

  const mfgDate = new Date(year, month - 1, day);
  mfgDate.setMonth(mfgDate.getMonth() + durationMonths);

  const expYear = mfgDate.getFullYear();
  const expMonth = (mfgDate.getMonth() + 1).toString().padStart(2, '0');
  const expDay = parts[2] ? mfgDate.getDate().toString().padStart(2, '0') : null;

  const iso = expDay ? `${expYear}-${expMonth}-${expDay}` : `${expYear}-${expMonth}`;
  const formatted = expDay ? `${expDay}/${expMonth}/${expYear}` : `${expMonth}/${expYear}`;

  return { iso, formatted };
}

/**
 * Optical character confusion correction strictly for inside an already-matched Batch Number token.
 * Corrects typical Tesseract misrecognitions: 'O' vs '0', 'I' vs '1', 'B' vs '8' based on surrounding digits.
 */
export function correctBatchConfusion(batchToken: string): string {
  if (!batchToken) return '';
  let token = batchToken.trim();

  // If token has mostly numbers with an isolated 'O' or 'o', replace with '0'
  // E.g., "B2O25" -> "B2025", "LOT-O9" -> "LOT-09"
  token = token.replace(/([0-9])[Oo]([0-9])/g, '$10$2');
  token = token.replace(/([0-9])[Oo]$/g, '$10');

  // If token has digit followed by 'I' or 'l' followed by digit, replace with '1'
  token = token.replace(/([0-9])[Il]([0-9])/g, '$11$2');

  // Clean trailing punctuation
  token = token.replace(/[,;:.]$/, '');

  return token;
}

/**
 * Standardizes confidence percentage.
 */
export function formatConfidencePercent(conf: number): string {
  if (typeof conf !== 'number' || isNaN(conf)) return '0%';
  const pct = Math.round(conf * 100);
  return `${Math.min(Math.max(pct, 0), 100)}%`;
}

/**
 * Cleans multi-line or whitespace-padded text.
 */
export function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Computes Levenshtein edit distance between two lowercase strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

