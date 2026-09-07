import { NormalizedOCRResult, ComplianceResult } from '../types';

export interface AuditReportExport {
  id: string;
  timestamp: string;
  targetProduct: string;
  sourceFile: string;
  complianceScore: number;
  overallVerdict: string;
  declarations: Record<string, any>;
  findings: {
    passed: string[];
    warnings: string[];
    violations: string[];
  };
  legalDisclaimer: string;
}

/**
 * Builds a structured JSON audit dossier.
 */
export function buildAuditDossier(
  ocrResult: NormalizedOCRResult,
  compliance: ComplianceResult
): AuditReportExport {
  const fields = ocrResult.fields;

  return {
    id: ocrResult.id,
    timestamp: new Date().toISOString(),
    targetProduct: fields.productBrandName.value || 'Unidentified Commodity',
    sourceFile: ocrResult.fileName,
    complianceScore: compliance.score,
    overallVerdict: compliance.status,
    declarations: {
      mrp: fields.mrp.value,
      netQuantity: fields.netQuantity.value,
      unitSalePrice: fields.unitSalePrice?.value || 'N/A',
      manufacturer: fields.manufacturer.value,
      batchNumber: fields.batchNumber.value,
      manufacturingDate: fields.manufacturingDate.value,
      expiryDate: fields.expiryDate.value,
      consumerCare: fields.consumerCare.value,
      countryOfOrigin: fields.countryOfOrigin.value
    },
    findings: {
      passed: compliance.passedChecks.map((c) => `[${c.legalActCitation}] ${c.summary}`),
      warnings: compliance.warnings.map((c) => `[${c.legalActCitation}] ${c.summary}`),
      violations: compliance.violations.map((c) => `[${c.legalActCitation}] ${c.summary}`)
    },
    legalDisclaimer: compliance.legalDisclaimer
  };
}

/**
 * Generates a formal Consumer Grievance / Legal Notice draft for packaging violations.
 */
export function generateComplaintDraft(
  ocrResult: NormalizedOCRResult,
  compliance: ComplianceResult
): string {
  const fields = ocrResult.fields;
  const productName = fields.productBrandName.value || 'Packaged Commodity';
  const mfg = fields.manufacturer.value || 'The Manufacturer / Packer';
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const violationsText =
    compliance.violations.length > 0
      ? compliance.violations.map((v, i) => `${i + 1}. Violation of ${v.legalActCitation}: ${v.summary} (${v.recommendation || ''})`).join('\n')
      : '1. Omission of required statutory packaging declarations as mandated by Legal Metrology (Packaged Commodities) Rules, 2011.';

  return `FORMAL NOTICE OF STATUTORY NON-COMPLIANCE
Under the Legal Metrology Act, 2009 & Legal Metrology (Packaged Commodities) Rules, 2011

Date: ${dateStr}

TO:
${mfg}
Consumer Care Cell / Grievance Officer: ${fields.consumerCare.value || 'Not Disclosed'}

SUBJECT: Statutory Notice regarding Non-Compliant Retail Label Declarations on "${productName}"

Sir / Madam,

This formal communication serves to highlight apparent statutory non-compliance observed on the packaging label of the following pre-packaged commodity:

1. Commodity / Brand: ${productName}
2. Declared MRP: ${fields.mrp.value || 'Missing/Unclear'}
3. Declared Net Quantity: ${fields.netQuantity.value || 'Missing'}
4. Batch / Lot Number: ${fields.batchNumber.value || 'N/A'}
5. Date of Packaging/Mfg: ${fields.manufacturingDate.value || 'N/A'}

PRIMARY STATUTORY INFRACTIONS DETECTED:
${violationsText}

LEGAL PROVISIONS:
As per Section 18 and Section 36 of the Legal Metrology Act, 2009 read with the Legal Metrology (Packaged Commodities) Rules, 2011, manufacturing, packing, or distributing any pre-packaged commodity without mandatory statutory declarations constitutes a punishable offense.

DEMAND FOR CORRECTIVE ACTION:
You are requested to:
1. Provide an official clarification regarding the observed omissions within 15 working days.
2. Ensure corrective measures are immediately implemented across all existing retail distribution batches.

Sincerely,
Verified Compliance Inspector / Consumer
Generated via LabelLens Legal Metrology Screening Engine`;
}
