export interface ModuleData {
  id: number;
  tag: string;
  title: string;
  headline: string;
  subtext: string;
  description: string;
  points: string[];
  metrics: { label: string; value: string }[];
  accentColor: string;
  bgStyle: string;
  borderColor: string;
  textColor: string;
  subtextColor: string;
  badgeBg: string;
  badgeText: string;
}

export type FieldStatus = 'VERIFIED' | 'REVIEW' | 'WARNING' | 'MISSING' | 'MANUALLY_VERIFIED';
export type FieldSource = 'OCR' | 'USER';

export interface BoundingBox {
  x: number; // pixel in original image
  y: number;
  width: number;
  height: number;
  normalized: {
    x: number; // 0 to 1
    y: number; // 0 to 1
    width: number; // 0 to 1
    height: number; // 0 to 1
  };
}

export interface NormalizedField {
  key: string;
  label: string;
  value: string | null;
  confidence: number; // 0 to 1
  sourceText: string | null;
  boundingBox: BoundingBox | null;
  status: FieldStatus;
  source: FieldSource;
  ruleCitation?: string;
  note?: string;
}

export interface NormalizedFields {
  productBrandName: NormalizedField;
  manufacturer: NormalizedField;
  mrp: NormalizedField;
  netQuantity: NormalizedField;
  batchNumber: NormalizedField;
  manufacturingDate: NormalizedField;
  expiryDate: NormalizedField;
  consumerCare: NormalizedField;
  countryOfOrigin: NormalizedField;
  unitSalePrice?: NormalizedField;
  [key: string]: NormalizedField | undefined;
}

export interface StatutoryDeclaration {
  id: string;
  name: string;
  detected: boolean;
  value?: string;
  confidence: number;
  sourceText?: string;
  boundingBox?: BoundingBox | null;
}

export interface NormalizedOCRResult {
  id: string;
  fileName: string;
  image: {
    src: string;
    width: number;
    height: number;
    aspectRatio: number;
  };
  rawText: string;
  ocrLines: Array<{
    text: string;
    confidence: number;
    boundingBox?: BoundingBox;
  }>;
  fields: NormalizedFields;
  declarations: StatutoryDeclaration[];
  processing: {
    status: 'IDLE' | 'UPLOADING' | 'PREPROCESSING' | 'OCR_PROCESSING' | 'EXTRACTION_COMPLETE' | 'REVIEW_REQUIRED' | 'COMPLIANCE_ANALYSIS' | 'COMPLETE' | 'ERROR';
    durationMs: number;
    errorMessage?: string;
    engine?: string;
  };
}

export type OverallComplianceStatus = 'APPEARS COMPLIANT' | 'REQUIRES REVIEW' | 'POTENTIALLY NON-COMPLIANT';

export interface ComplianceCheck {
  id: string;
  fieldKey: string;
  ruleName: string;
  legalActCitation: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  summary: string;
  recommendation?: string;
}

export interface ComplianceResult {
  score: number; // 0 to 100
  status: OverallComplianceStatus;
  passedChecks: ComplianceCheck[];
  warnings: ComplianceCheck[];
  violations: ComplianceCheck[];
  legalDisclaimer: string;
  totalChecks: number;
}

// Retained legacy interfaces for compatibility where referenced
export interface InspectionField {
  label: string;
  extractedValue: string;
  ruleStatus: 'PASS' | 'WARN' | 'FAIL';
  standardRule: string;
  confidence: string;
  bbox?: { x: number; y: number; width: number; height: number };
  note?: string;
}

export interface PresetSampleLabel {
  id: string;
  name: string;
  category: string;
  image: string;
  description: string;
  complianceScore: number;
  overallStatus: 'PASS' | 'WARN' | 'FAIL';
  fields: InspectionField[];
  normalizedData?: NormalizedOCRResult;
}

export type AuthMode = 'login' | 'signup';

export interface UserProfile {
  name: string;
  email: string;
  organization?: string;
  role: string;
  clearanceLevel: string;
  token: string;
  lastLogin: string;
}
