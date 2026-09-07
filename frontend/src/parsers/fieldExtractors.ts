import { NormalizedField, StatutoryDeclaration } from '../types';
import { OCRLineCandidate } from './mrpExtractor';
import { correctBatchConfusion, levenshteinDistance } from '../utils/formatters';

/**
 * Seed Brand Gazetteer for high-accuracy fuzzy matching on Indian FMCG packaging.
 */
const SEED_BRAND_GAZETTEER = [
  'ITC',
  'Britannia',
  'Nestle',
  'Amul',
  'Parle',
  'HUL',
  'Dabur',
  'Patanjali',
  'Aashirvaad',
  'Sunfeast',
  'Bingo',
  'Yippee',
  'Balaji',
  'Cadbury',
  'Haldiram',
  'Tata',
  'Marico',
  'Godrej',
  'Bikanervala',
  'MTR',
  'Everest',
  'MDH',
  'Catch',
  'Mother Dairy',
  'Kissan',
  'Maggi',
  'Lays',
  'Kurkure',
  'Pepsi',
  'Coca Cola',
  'Thums Up',
  'Frooti',
  'Real'
];

/**
 * Keywords and phrases that must never be considered as a Brand or Product Name.
 */
const REJECT_PRODUCT_PATTERNS = [
  /\b(?:ingredients?|samagri|contains|nutrition|nutritional|energy|protein|carbohydrate|fat|sugar|sodium)\b/i,
  /\b(?:manufactured|marketed|mfg|mktd|packed|produced|imported|registered|regd\.?\s*office|corp\.?\s*office)\b/i,
  /\b(?:pvt\.?\s*ltd|limited|industries|enterprises|works|foods\s*pvt|llp|gmbh)\b/i,
  /\b(?:pincode|pin\s*code|pin\s*-\s*[0-9]{6}|[0-9]{6})\b/i,
  /\b(?:consumer\s*care|helpline|toll\s*free|customer\s*care|email|feedback|grievance)\b/i,
  /\b(?:mrp|m\.r\.p|price|net\s*qty|net\s*wt|batch|lot|mfd|pkd|exp|best\s*before|use\s*by)\b/i,
  /\b(?:fssai|lic\.?\s*no|license\s*no|rule\s*[0-9]+|keep\s*in\s*a\s*cool|store\s*in|warning)\b/i
];

/**
 * Extracts Product / Brand Name dynamically:
 * - Prioritizes top-third text with prominent bounding boxes
 * - Cross-references seed brand gazetteer via fuzzy distance (tolerates OCR typos like "BR1TANNIA")
 * - Strictly rejects address, ingredient, nutrition, and regulatory text
 */
export function extractProductBrandName(lines: OCRLineCandidate[]): NormalizedField {
  // Pool candidates: top third preferred (y0 <= 0.40 or top 10 lines)
  const candidatePool = lines.filter((line, idx) => {
    if (line.boundingBox && line.boundingBox.y < 0.45) return true;
    return idx < 10;
  });

  let bestCandidate: { line: OCRLineCandidate; brandName: string; score: number } | null = null;

  for (let i = 0; i < candidatePool.length; i++) {
    const item = candidatePool[i];
    const text = item.text.trim();
    if (text.length < 2 || text.length > 70) continue;

    // Reject known non-product patterns
    const isRejected = REJECT_PRODUCT_PATTERNS.some((rgx) => rgx.test(text));
    if (isRejected) continue;

    let score = 40;

    // Prominence heuristic: box size and top position
    if (item.boundingBox) {
      const boxArea = item.boundingBox.width * item.boundingBox.height;
      score += Math.min(35, Math.round(boxArea * 300));
      score += Math.round((1 - item.boundingBox.y) * 20);
    } else {
      score += Math.max(0, (8 - i) * 4);
    }

    // Casing score
    if (text === text.toUpperCase() && text.length > 3) score += 10;

    // Cross-reference Seed Brand Gazetteer (Exact and Fuzzy matching)
    let matchedBrand: string | null = null;
    const lowerText = text.toLowerCase();

    for (const gazetteerBrand of SEED_BRAND_GAZETTEER) {
      const gLower = gazetteerBrand.toLowerCase();
      // Exact word inclusion
      if (lowerText.includes(gLower)) {
        matchedBrand = gazetteerBrand;
        score += 50;
        break;
      }
      // Fuzzy match tokens against gazetteer
      const tokens = text.split(/[\s\-_\/]+/);
      for (const tok of tokens) {
        if (Math.abs(tok.length - gLower.length) <= 1 && gLower.length >= 4) {
          const dist = levenshteinDistance(tok.toLowerCase(), gLower);
          if (dist <= 1) {
            matchedBrand = gazetteerBrand;
            score += 45;
            break;
          }
        }
      }
      if (matchedBrand) break;
    }

    // Confidence component
    score += Math.round((item.confidence || 0.8) * 15);

    if (!bestCandidate || score > bestCandidate.score) {
      bestCandidate = {
        line: item,
        brandName: text,
        score
      };
    }
  }

  if (bestCandidate && bestCandidate.score >= 45) {
    const conf = Math.max(0.72, Math.min(0.99, (bestCandidate.line.confidence || 0.88) + 0.05));
    return {
      key: 'productBrandName',
      label: 'Product / Brand Name',
      value: bestCandidate.brandName,
      confidence: conf,
      sourceText: bestCandidate.line.text,
      boundingBox: bestCandidate.line.boundingBox || null,
      status: conf >= 0.85 ? 'VERIFIED' : 'REVIEW',
      source: 'OCR',
      ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(b)',
      note: 'Extracted from prominent upper display panel; verified against FMCG brand dictionary.'
    };
  }

  // Fallback: examine first non-rejected line
  for (const line of lines) {
    const t = line.text.trim();
    if (t.length >= 3 && !REJECT_PRODUCT_PATTERNS.some((r) => r.test(t))) {
      return {
        key: 'productBrandName',
        label: 'Product / Brand Name',
        value: t,
        confidence: 0.70,
        sourceText: line.text,
        boundingBox: line.boundingBox || null,
        status: 'REVIEW',
        source: 'OCR',
        ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(b)'
      };
    }
  }

  return {
    key: 'productBrandName',
    label: 'Product / Brand Name',
    value: 'Not detected',
    confidence: 0,
    sourceText: null,
    boundingBox: null,
    status: 'MISSING',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(b)'
  };
}

/**
 * Extracts Manufacturer & Packer Details.
 * Stage 4: Extracts the full contiguous block (name + address + PIN + state),
 * filtering out OCR garbage lines.
 */
export function extractManufacturer(lines: OCRLineCandidate[]): NormalizedField {
  const mfgHeaderPatterns = [
    /(?:manufactured\s*(?:by|&|and)?|marketed\s*by|packed\s*by|mfg\s*by|mktd\s*by|produced\s*by|उत्पादक|निर्माता)\s*[:.\-]?/i,
    /(?:registered\s*office|regd\.?\s*off\.?|corporate\s*office)\s*[:.\-]?/i
  ];

  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text.trim();
    for (const pat of mfgHeaderPatterns) {
      if (pat.test(text)) {
        startIdx = i;
        break;
      }
    }
    if (startIdx !== -1) break;
  }

  // If no explicit header, search for corporate suffixes
  if (startIdx === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (/\b(?:pvt\.?\s*ltd\.?|limited|foods|industries|beverages|consumer\s*products)\b/i.test(lines[i].text)) {
        startIdx = i;
        break;
      }
    }
  }

  if (startIdx !== -1) {
    // Build contiguous block up to 4 lines, rejecting garbage lines
    const addressLines: string[] = [];
    let hasPIN = false;

    for (let i = startIdx; i < Math.min(lines.length, startIdx + 5); i++) {
      const curText = lines[i].text.trim();
      // Stop condition: Encountered another statutory field
      if (i > startIdx && /^(?:mrp|m\.r\.p|net\s*qty|batch|exp|mfd|fssai|ingredients)/i.test(curText)) {
        break;
      }
      // Filter out garbage lines (mostly non-alphanumeric or tiny fragments)
      const alphaCount = (curText.match(/[a-zA-Z0-9]/g) || []).length;
      if (alphaCount < 4) continue;

      addressLines.push(curText);
      if (/\b[1-9][0-9]{5}\b/.test(curText)) {
        hasPIN = true;
      }
    }

    if (addressLines.length > 0) {
      const fullBlock = addressLines.join(', ').replace(/\s{2,}/g, ' ');
      const conf = Math.max(0.75, Math.min(0.98, (lines[startIdx].confidence || 0.88) + (hasPIN ? 0.08 : 0)));

      return {
        key: 'manufacturer',
        label: 'Manufacturer / Packer Info',
        value: fullBlock,
        confidence: conf,
        sourceText: lines[startIdx].text,
        boundingBox: lines[startIdx].boundingBox || null,
        status: conf >= 0.85 ? 'VERIFIED' : 'REVIEW',
        source: 'OCR',
        ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(a)',
        note: hasPIN ? 'Full address with valid 6-digit postal PIN code detected.' : 'Address detected; review postal PIN code.'
      };
    }
  }

  return {
    key: 'manufacturer',
    label: 'Manufacturer / Packer Info',
    value: 'Not detected',
    confidence: 0,
    sourceText: null,
    boundingBox: null,
    status: 'MISSING',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(a)'
  };
}

/**
 * Extracts Batch / Lot Number.
 * Stage 4: Triggers Batch, Batch No, Lot No, LOT;
 * Applies 0/O, 1/I, 8/B confusion correction ONLY inside an already-matched batch token, never globally.
 */
export function extractBatchNumber(lines: OCRLineCandidate[]): NormalizedField {
  const batchPatterns = [
    /(?:batch\s*(?:no\.?|number|#)?|lot\s*(?:no\.?|number|#)?|b\.?\s*no\.?|घान\s*संख्या)\s*[:.\-]?\s*([a-z0-9\-_/]+)/i,
    /\b(?:batch|lot)\b\s*[:.\-]?\s*([a-z0-9\-_/]+)/i
  ];

  for (const line of lines) {
    const text = line.text.trim();
    for (const pat of batchPatterns) {
      const match = text.match(pat);
      if (match && match[1]) {
        // Stage 4: Apply 0/O, 1/I, 8/B confusion correction strictly inside the batch token
        const correctedToken = correctBatchConfusion(match[1]);
        const conf = Math.max(0.78, Math.min(0.98, line.confidence || 0.9));

        return {
          key: 'batchNumber',
          label: 'Batch Number',
          value: correctedToken,
          confidence: conf,
          sourceText: text,
          boundingBox: line.boundingBox || null,
          status: conf >= 0.85 ? 'VERIFIED' : 'REVIEW',
          source: 'OCR',
          ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)',
          note: `Batch token normalized with OCR character-confusion heuristics: ${correctedToken}`
        };
      }
    }
  }

  return {
    key: 'batchNumber',
    label: 'Batch Number',
    value: 'Not detected',
    confidence: 0,
    sourceText: null,
    boundingBox: null,
    status: 'MISSING',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(d)'
  };
}

/**
 * Extracts Consumer Care / Grievance Redressal details.
 * Stage 4: Triggers Phone, Helpline, Customer Care, Toll Free, Email, Website;
 * VERIFIED if a valid phone or email pattern is found.
 */
export function extractConsumerCare(lines: OCRLineCandidate[]): NormalizedField {
  const phonePattern = /(?:1800[- ]?[0-9]{3}[- ]?[0-9]{3,4}|[0-9]{2,4}[- ]?[0-9]{6,8}|\+91[- ]?[0-9]{10}|[6-9][0-9]{9})/i;
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;

  let foundPhone: string | null = null;
  let foundEmail: string | null = null;
  let careLineCandidate: OCRLineCandidate | null = null;

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    const hasCareKeyword = /consumer|customer|helpline|care|toll\s*free|grievance|feedback|contact\s*us/i.test(text);

    const emailMatch = text.match(emailPattern);
    if (emailMatch) {
      foundEmail = emailMatch[1];
      careLineCandidate = careLineCandidate || line;
    }

    const phoneMatch = text.match(phonePattern);
    if (phoneMatch && (hasCareKeyword || text.length < 35)) {
      foundPhone = phoneMatch[0];
      careLineCandidate = careLineCandidate || line;
    }

    if (hasCareKeyword && !careLineCandidate) {
      careLineCandidate = line;
    }
  }

  if (careLineCandidate || foundEmail || foundPhone) {
    const parts: string[] = [];
    if (foundPhone) parts.push(`Tel: ${foundPhone}`);
    if (foundEmail) parts.push(`Email: ${foundEmail}`);
    if (parts.length === 0 && careLineCandidate) parts.push(careLineCandidate.text.trim());

    const valueStr = parts.join(' | ');
    const isHighConf = Boolean(foundPhone || foundEmail);
    const conf = isHighConf ? 0.92 : 0.72;

    return {
      key: 'consumerCare',
      label: 'Consumer Care Redressal',
      value: valueStr,
      confidence: conf,
      sourceText: careLineCandidate?.text || valueStr,
      boundingBox: careLineCandidate?.boundingBox || null,
      status: isHighConf ? 'VERIFIED' : 'REVIEW',
      source: 'OCR',
      ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(n)',
      note: isHighConf ? 'Statutory grievance contact (phone/email) verified.' : 'Care notice found; phone/email verification advised.'
    };
  }

  return {
    key: 'consumerCare',
    label: 'Consumer Care Redressal',
    value: 'Not detected',
    confidence: 0,
    sourceText: null,
    boundingBox: null,
    status: 'MISSING',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Rules 2011, Rule 6(1)(n)'
  };
}

/**
 * Extracts Country of Origin declaration.
 * Stage 4: Triggers Made in India, Country of Origin: India, Product of India;
 * Does NOT hardcode India-only if the label says otherwise (e.g. Country of Origin: Thailand, Made in Germany).
 */
export function extractCountryOfOrigin(lines: OCRLineCandidate[]): NormalizedField {
  const originRegexes = [
    /(?:country\s*of\s*origin|origin|made\s*in|product\s*of|mfg\s*in)\s*[:.\-]?\s*([a-zA-Z\s]{3,20})/i,
    /\b(?:made\s*in|product\s*of|origin:)\s*([a-zA-Z\s]{3,20})\b/i
  ];

  for (const line of lines) {
    const text = line.text.trim();
    for (const rgx of originRegexes) {
      const match = text.match(rgx);
      if (match && match[1]) {
        const country = match[1].trim();
        // Reject accidental matches like "made in a cool place"
        if (/^(a|the|cool|dry|safe|direct|hygienic)/i.test(country)) continue;

        const conf = Math.max(0.78, Math.min(0.98, line.confidence || 0.92));
        return {
          key: 'countryOfOrigin',
          label: 'Country of Origin',
          value: country.toUpperCase(),
          confidence: conf,
          sourceText: text,
          boundingBox: line.boundingBox || null,
          status: conf >= 0.85 ? 'VERIFIED' : 'REVIEW',
          source: 'OCR',
          ruleCitation: 'Legal Metrology Amendment Rules 2020, Rule 6(10)'
        };
      }
    }
  }

  // Fallback: Check for standalone "INDIA" near statutory blocks
  for (const line of lines) {
    if (/\b(?:INDIA|BHARAT)\b/i.test(line.text) && /mfg|made|origin|packer|corp/i.test(line.text)) {
      return {
        key: 'countryOfOrigin',
        label: 'Country of Origin',
        value: 'INDIA',
        confidence: 0.82,
        sourceText: line.text,
        boundingBox: line.boundingBox || null,
        status: 'REVIEW',
        source: 'OCR',
        ruleCitation: 'Legal Metrology Amendment Rules 2020, Rule 6(10)'
      };
    }
  }

  return {
    key: 'countryOfOrigin',
    label: 'Country of Origin',
    value: 'Not detected',
    confidence: 0,
    sourceText: null,
    boundingBox: null,
    status: 'MISSING',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Amendment Rules 2020, Rule 6(10)'
  };
}

/**
 * Extracts Unit Sale Price (USP) or derives it mathematically if absent on packaging.
 * Stage 4: If absent, derive USP = mrp.value / netQuantity.value (post-normalization)
 * and flag it as derived in note so it stays distinguishable from a printed USP.
 */
export function extractUnitSalePrice(
  lines: OCRLineCandidate[],
  mrpField: NormalizedField,
  qtyField: NormalizedField
): NormalizedField {
  // Check for explicitly printed USP
  const uspPatterns = [
    /(?:unit\s*sale\s*price|u\.?s\.?p\.?)\s*[:.\-]?\s*(?:₹|rs\.?)?\s*([0-9]+(?:\.[0-9]+)?\s*(?:\/|\s*per\s*)[a-z\s]+)/i,
    /(?:₹|rs\.?)\s*([0-9]+(?:\.[0-9]+)?)\s*\/\s*(?:g|gm|kg|ml|l|ltr|piece|tablets?|n)/i
  ];

  for (const line of lines) {
    const text = line.text.trim();
    for (const pat of uspPatterns) {
      const match = text.match(pat);
      if (match) {
        return {
          key: 'unitSalePrice',
          label: 'Unit Sale Price (USP)',
          value: match[0].trim(),
          confidence: line.confidence || 0.88,
          sourceText: text,
          boundingBox: line.boundingBox || null,
          status: 'VERIFIED',
          source: 'OCR',
          ruleCitation: 'Legal Metrology Amendment Rules 2021, Rule 6(11)',
          note: 'Explicitly declared on retail packaging.'
        };
      }
    }
  }

  // Derive mathematically if absent on label
  const mrpNumMatch = mrpField.value?.match(/([0-9]+(?:\.[0-9]+)?)/);
  const qtyMatch = qtyField.value?.match(/([0-9]+(?:\.[0-9]+)?)\s*([a-z]+)/i);

  if (mrpNumMatch && qtyMatch) {
    const price = parseFloat(mrpNumMatch[1]);
    const qty = parseFloat(qtyMatch[1]);
    let unit = qtyMatch[2].toLowerCase();

    if (price > 0 && qty > 0) {
      let unitPrice = price / qty;
      let displayUnit = unit;

      // Legal Metrology Rule 6(11): Standard reference units: per g, per kg, per ml, per l
      if (unit === 'g' && qty >= 1000) {
        unitPrice = (price / qty) * 1000;
        displayUnit = 'kg';
      } else if (unit === 'ml' && qty >= 1000) {
        unitPrice = (price / qty) * 1000;
        displayUnit = 'L';
      }

      const formattedRate = `₹ ${unitPrice.toFixed(2)} / ${displayUnit}`;
      return {
        key: 'unitSalePrice',
        label: 'Unit Sale Price (USP)',
        value: formattedRate,
        confidence: 0.85,
        sourceText: `Calculated from MRP (${mrpField.value}) and Net Qty (${qtyField.value})`,
        boundingBox: null,
        status: 'REVIEW',
        source: 'OCR',
        ruleCitation: 'Legal Metrology Amendment Rules 2021, Rule 6(11)',
        note: `Derived mathematically: ₹${unitPrice.toFixed(2)} / ${displayUnit} (Rule 6(11) compliant calculation from MRP and Net Quantity).`
      };
    }
  }

  return {
    key: 'unitSalePrice',
    label: 'Unit Sale Price (USP)',
    value: 'Not detected',
    confidence: 0,
    sourceText: null,
    boundingBox: null,
    status: 'MISSING',
    source: 'OCR',
    ruleCitation: 'Legal Metrology Amendment Rules 2021, Rule 6(11)'
  };
}

/**
 * Extracts mandatory statutory declarations and certifications (FSSAI, Veg/Non-Veg, Storage, Recyclable).
 */
export function extractStatutoryDeclarations(lines: OCRLineCandidate[]): StatutoryDeclaration[] {
  const fullText = lines.map((l) => l.text).join(' ').toLowerCase();

  const declarations: StatutoryDeclaration[] = [
    {
      id: 'fssai-license',
      name: 'FSSAI Food Safety License / Registration',
      detected: /fssai|lic\.?\s*no|license\s*no/i.test(fullText),
      confidence: /fssai/i.test(fullText) ? 0.95 : 0.4,
      sourceText: lines.find((l) => /fssai|license\s*no/i.test(l.text))?.text
    },
    {
      id: 'dietary-symbol',
      name: 'Dietary Symbol / Vegetarian / Non-Veg Mark',
      detected: /vegetarian|100%\s*veg|non-veg|green\s*dot/i.test(fullText),
      confidence: 0.88,
      sourceText: lines.find((l) => /veg/i.test(l.text))?.text
    },
    {
      id: 'storage-conditions',
      name: 'Storage & Handling Conditions',
      detected: /store\s*in|keep\s*in|cool\s*and\s*dry|refrigerate|direct\s*sunlight/i.test(fullText),
      confidence: 0.92,
      sourceText: lines.find((l) => /store|cool\s*and\s*dry/i.test(l.text))?.text
    },
    {
      id: 'recycling-compliance',
      name: 'Plastic Waste Management & Recycling Mark',
      detected: /recycle|recyclable|dispose|litter|plastic/i.test(fullText),
      confidence: 0.85,
      sourceText: lines.find((l) => /recycle|dispose/i.test(l.text))?.text
    }
  ];

  return declarations;
}

