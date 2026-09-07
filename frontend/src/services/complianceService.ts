import { NormalizedOCRResult, ComplianceResult } from '../types';
import { evaluateLegalMetrologyCompliance } from '../utils/validators';

/**
 * Service to execute statutory compliance audits on normalized OCR records.
 */
export function auditLabelCompliance(ocrResult: NormalizedOCRResult): ComplianceResult {
  return evaluateLegalMetrologyCompliance(ocrResult.fields);
}
