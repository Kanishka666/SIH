import { NormalizedFields, ComplianceCheck, ComplianceResult } from '../types';

/**
 * Validates extracted fields under the Legal Metrology (Packaged Commodities) Rules, 2011 & 2021 Amendments.
 */
export function evaluateLegalMetrologyCompliance(fields: NormalizedFields): ComplianceResult {
  const passedChecks: ComplianceCheck[] = [];
  const warnings: ComplianceCheck[] = [];
  const violations: ComplianceCheck[] = [];

  // Check 1: Product / Brand Name
  const brand = fields.productBrandName;
  if (!brand.value || brand.status === 'MISSING') {
    violations.push({
      id: 'rule-brand-name',
      fieldKey: 'productBrandName',
      ruleName: 'Generic / Brand Identification',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(b)',
      status: 'FAIL',
      summary: 'Product generic or brand name was not detected on the principal display panel.',
      recommendation: 'Ensure common or generic name of commodity is conspicuously declared.'
    });
  } else if (brand.confidence < 0.7 && brand.status !== 'MANUALLY_VERIFIED') {
    warnings.push({
      id: 'rule-brand-name',
      fieldKey: 'productBrandName',
      ruleName: 'Generic / Brand Identification',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(b)',
      status: 'WARN',
      summary: `Product name detected with low OCR confidence (${Math.round(brand.confidence * 100)}%). Verification recommended.`,
      recommendation: 'Verify exact commodity nomenclature.'
    });
  } else {
    passedChecks.push({
      id: 'rule-brand-name',
      fieldKey: 'productBrandName',
      ruleName: 'Generic / Brand Identification',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(b)',
      status: 'PASS',
      summary: `Compliant product identification: "${brand.value}".`
    });
  }

  // Check 2: Maximum Retail Price (MRP)
  const mrp = fields.mrp;
  if (!mrp.value || mrp.status === 'MISSING') {
    violations.push({
      id: 'rule-mrp',
      fieldKey: 'mrp',
      ruleName: 'Maximum Retail Price Declaration',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(e)',
      status: 'FAIL',
      summary: 'MRP declaration missing on primary package panel.',
      recommendation: 'Declare Maximum Retail Price with "Inclusive of all taxes" and Indian Rupee symbol (₹).'
    });
  } else {
    const rawVal = mrp.value.toLowerCase();
    const hasTax = rawVal.includes('all taxes') || rawVal.includes('tax') || rawVal.includes('incl');
    const hasSymbol = rawVal.includes('₹') || rawVal.includes('rs') || rawVal.includes('inr');

    if (!hasTax) {
      warnings.push({
        id: 'rule-mrp',
        fieldKey: 'mrp',
        ruleName: 'Maximum Retail Price Tax Clause',
        legalActCitation: 'LM Rules 2011 Rule 6(1)(e)',
        status: 'WARN',
        summary: 'MRP detected but statutory clause "(Inclusive of all taxes)" may be omitted or obscured.',
        recommendation: 'Add "(Inclusive of all taxes)" immediately adjacent to the price numeral.'
      });
    } else {
      passedChecks.push({
        id: 'rule-mrp',
        fieldKey: 'mrp',
        ruleName: 'Maximum Retail Price Declaration',
        legalActCitation: 'LM Rules 2011 Rule 6(1)(e)',
        status: 'PASS',
        summary: `Compliant MRP declaration with statutory tax inclusion: ${mrp.value}`
      });
    }
  }

  // Check 3: Net Quantity
  const netQty = fields.netQuantity;
  if (!netQty.value || netQty.status === 'MISSING') {
    violations.push({
      id: 'rule-net-quantity',
      fieldKey: 'netQuantity',
      ruleName: 'Standard Metric Net Quantity',
      legalActCitation: 'LM Rules 2011 Rule 12 & Rule 6(1)(c)',
      status: 'FAIL',
      summary: 'Net quantity declaration not found.',
      recommendation: 'Declare net content in standard metric units (g, kg, ml, L, or N) with compliant minimum numeral height.'
    });
  } else {
    passedChecks.push({
      id: 'rule-net-quantity',
      fieldKey: 'netQuantity',
      ruleName: 'Standard Metric Net Quantity',
      legalActCitation: 'LM Rules 2011 Rule 12',
      status: 'PASS',
      summary: `Compliant net quantity: ${netQty.value}`
    });
  }

  // Check 4: Manufacturer / Packer Information
  const mfg = fields.manufacturer;
  if (!mfg.value || mfg.status === 'MISSING') {
    violations.push({
      id: 'rule-manufacturer',
      fieldKey: 'manufacturer',
      ruleName: 'Manufacturer / Packer Identity & Address',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(a)',
      status: 'FAIL',
      summary: 'Name and complete physical address of manufacturer/packer missing.',
      recommendation: 'Declare registered entity name, manufacturing location premise, and postal PIN code.'
    });
  } else {
    const hasPin = /[0-9]{6}/.test(mfg.value);
    if (!hasPin && mfg.value.length < 30) {
      warnings.push({
        id: 'rule-manufacturer',
        fieldKey: 'manufacturer',
        ruleName: 'Manufacturer Address Completeness',
        legalActCitation: 'LM Rules 2011 Rule 6(1)(a)',
        status: 'WARN',
        summary: 'Manufacturer address appears abbreviated; verify postal pincode and industrial address.',
        recommendation: 'Ensure full postal address with valid 6-digit PIN code is printed.'
      });
    } else {
      passedChecks.push({
        id: 'rule-manufacturer',
        fieldKey: 'manufacturer',
        ruleName: 'Manufacturer / Packer Identity & Address',
        legalActCitation: 'LM Rules 2011 Rule 6(1)(a)',
        status: 'PASS',
        summary: `Manufacturer details declared: ${mfg.value.slice(0, 50)}...`
      });
    }
  }

  // Check 5: Manufacturing Date / Packing Date
  const mfgDate = fields.manufacturingDate;
  if (!mfgDate.value || mfgDate.status === 'MISSING') {
    warnings.push({
      id: 'rule-mfg-date',
      fieldKey: 'manufacturingDate',
      ruleName: 'Date of Manufacture / Packing',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(d)',
      status: 'WARN',
      summary: 'Month and year of manufacture or packing was not detected.',
      recommendation: 'Print MFG / PKD date in MM/YYYY or DD/MM/YYYY format.'
    });
  } else {
    passedChecks.push({
      id: 'rule-mfg-date',
      fieldKey: 'manufacturingDate',
      ruleName: 'Date of Manufacture / Packing',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(d)',
      status: 'PASS',
      summary: `Manufacturing date verified: ${mfgDate.value}`
    });
  }

  // Check 6: Expiry Date / Best Before
  const expDate = fields.expiryDate;
  if (!expDate.value || expDate.status === 'MISSING') {
    warnings.push({
      id: 'rule-exp-date',
      fieldKey: 'expiryDate',
      ruleName: 'Best Before / Expiry Indication',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(d) & FSSAI Packaging Regs',
      status: 'WARN',
      summary: 'Best before or expiry timeframe not detected on inspected label.',
      recommendation: 'Declare best before duration or exact expiry date.'
    });
  } else if (
    mfgDate.value &&
    mfgDate.value !== 'Not detected' &&
    expDate.value &&
    expDate.value !== 'Not detected' &&
    expDate.value < mfgDate.value
  ) {
    violations.push({
      id: 'rule-exp-chronology',
      fieldKey: 'expiryDate',
      ruleName: 'Expiry Chronological Integrity',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(d)',
      status: 'FAIL',
      summary: `Contradictory dates: Expiry date (${expDate.value}) precedes manufacturing date (${mfgDate.value}).`,
      recommendation: 'Verify package date stamps for misread or misprinted dates.'
    });
  } else {
    passedChecks.push({
      id: 'rule-exp-date',
      fieldKey: 'expiryDate',
      ruleName: 'Best Before / Expiry Indication',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(d)',
      status: 'PASS',
      summary: `Expiry / Best Before verified: ${expDate.value}`
    });
  }

  // Check 7: Batch / Lot Number
  const batch = fields.batchNumber;
  if (!batch.value || batch.status === 'MISSING') {
    warnings.push({
      id: 'rule-batch',
      fieldKey: 'batchNumber',
      ruleName: 'Batch / Lot Identification',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(d)',
      status: 'WARN',
      summary: 'Batch or lot identification code was not detected.',
      recommendation: 'Print Batch No. / Lot No. conspicuously for product traceability.'
    });
  } else {
    passedChecks.push({
      id: 'rule-batch',
      fieldKey: 'batchNumber',
      ruleName: 'Batch / Lot Identification',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(d)',
      status: 'PASS',
      summary: `Batch number verified: ${batch.value}`
    });
  }

  // Check 8: Consumer Care Details
  const care = fields.consumerCare;
  if (!care.value || care.status === 'MISSING') {
    warnings.push({
      id: 'rule-consumer-care',
      fieldKey: 'consumerCare',
      ruleName: 'Consumer Care Grievance Redressal',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(n)',
      status: 'WARN',
      summary: 'Consumer grievance redressal channel (toll-free, email, or telephone) not detected.',
      recommendation: 'Provide email address and telephone contact of consumer care officer.'
    });
  } else {
    passedChecks.push({
      id: 'rule-consumer-care',
      fieldKey: 'consumerCare',
      ruleName: 'Consumer Care Grievance Redressal',
      legalActCitation: 'LM Rules 2011 Rule 6(1)(n)',
      status: 'PASS',
      summary: `Consumer grievance redressal verified: ${care.value}`
    });
  }

  // Check 9: Country of Origin
  const origin = fields.countryOfOrigin;
  if (!origin.value || origin.status === 'MISSING') {
    warnings.push({
      id: 'rule-origin',
      fieldKey: 'countryOfOrigin',
      ruleName: 'Country of Origin Declaration',
      legalActCitation: 'LM Amendment Rules 2020 & Rule 6(10)',
      status: 'WARN',
      summary: 'Country of origin not detected.',
      recommendation: 'Provide prominent "Country of Origin: [COUNTRY]" mark.'
    });
  } else {
    passedChecks.push({
      id: 'rule-origin',
      fieldKey: 'countryOfOrigin',
      ruleName: 'Country of Origin Declaration',
      legalActCitation: 'LM Amendment Rules 2020',
      status: 'PASS',
      summary: `Country of Origin verified: ${origin.value}`
    });
  }

  // Check 10: Unit Sale Price (USP)
  const usp = fields.unitSalePrice;
  if (!usp.value || usp.status === 'MISSING') {
    warnings.push({
      id: 'rule-usp',
      fieldKey: 'unitSalePrice',
      ruleName: 'Unit Sale Price Declaration',
      legalActCitation: 'LM Amendment Rules 2021 Rule 6(11)',
      status: 'WARN',
      summary: 'Unit Sale Price (e.g. ₹ per g / ml) not detected or declared.',
      recommendation: 'Declare Unit Sale Price rounded to the nearest two decimal places.'
    });
  } else {
    passedChecks.push({
      id: 'rule-usp',
      fieldKey: 'unitSalePrice',
      ruleName: 'Unit Sale Price Declaration',
      legalActCitation: 'LM Amendment Rules 2021 Rule 6(11)',
      status: 'PASS',
      summary: `Unit Sale Price verified: ${usp.value}${usp.note?.includes('Derived') ? ' (derived calculation)' : ''}`
    });
  }

  // Calculate score & legally cautious status
  const total = passedChecks.length + warnings.length + violations.length;
  // Deductions: violation = -22, warning = -8
  const calculatedScore = Math.max(
    10,
    Math.min(100, Math.round(100 - violations.length * 22 - warnings.length * 8))
  );

  let overallStatus: 'APPEARS COMPLIANT' | 'REQUIRES REVIEW' | 'POTENTIALLY NON-COMPLIANT';
  if (violations.length === 0 && warnings.length <= 1 && calculatedScore >= 88) {
    overallStatus = 'APPEARS COMPLIANT';
  } else if (violations.length === 0 || calculatedScore >= 70) {
    overallStatus = 'REQUIRES REVIEW';
  } else {
    overallStatus = 'POTENTIALLY NON-COMPLIANT';
  }

  return {
    score: calculatedScore,
    status: overallStatus,
    passedChecks,
    warnings,
    violations,
    totalChecks: total,
    legalDisclaimer:
      'LabelLens provides automated label screening based on detected information and configured requirements. Results should be reviewed by an authorized professional or relevant authority.'
  };
}
