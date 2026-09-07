import { ModuleData } from '../types';

export const MODULES: Record<number, ModuleData> = {
  1: {
    id: 1,
    tag: 'Module.01',
    title: 'Scan Engine',
    headline: 'Absolute clarity.\nZero guesswork.',
    subtext: 'Every label, scanned.\nEvery field, extracted.',
    description: 'High-throughput optical character recognition engineered specifically for curved, reflective, micro-printed, and distorted consumer product packaging.',
    points: [
      'Drag-and-drop upload, camera capture, or file picker — PNG, JPG, JPEG, WEBP.',
      'OCR extraction pulls every regulated field off the label automatically.',
      'Instant preview before a scan is submitted, so a bad photo never wastes a cycle.',
      'Automatic perspective rectification and cylindrical de-warping for bottles, cans, and cartons.',
      'Sub-millimeter font height measurement to verify minimum numeral height mandates (Legal Metrology Rule 7).'
    ],
    metrics: [
      { label: 'Character Accuracy', value: '99.84%' },
      { label: 'Mean Parse Latency', value: '142ms' },
      { label: 'Supported Formats', value: 'PNG, JPG, WEBP, PDF' },
      { label: 'Font Detection Limit', value: '0.8mm' }
    ],
    accentColor: '#111111',
    bgStyle: 'bg-[#f4f4f0]',
    borderColor: 'border-white/40',
    textColor: 'text-neutral-900',
    subtextColor: 'text-neutral-600',
    badgeBg: 'bg-black/5 border border-black/10',
    badgeText: 'text-black/80'
  },
  2: {
    id: 2,
    tag: 'Module.02',
    title: 'Rule Engine',
    headline: 'Adaptive rules.\nTotal coverage.',
    subtext: 'Legal Metrology rules applied per product category — MRP, net quantity, expiry, manufacturer declaration, and allergen compliance.',
    description: 'Autonomous compliance validator constantly synced with the Legal Metrology (Packaged Commodities) Rules, FSSAI regulations, and international OIML standards.',
    points: [
      'Legal Metrology rules applied per product category — MRP, net quantity, expiry, and more.',
      'Missing or malformed fields are auto-flagged the moment they are detected.',
      'Rule set stays current as regulations change, with no re-scan required for old reports.',
      'Cross-checks unit sale price (USP) calculation against Maximum Retail Price (MRP) and declared net weight.',
      'Validates mandatory declarations: Manufacturer Address, Consumer Care Details, Country of Origin, Date of Packing.'
    ],
    metrics: [
      { label: 'Rule Sets Active', value: '148+ Rules' },
      { label: 'Category Coverage', value: 'FMCG, Pharma, Cosmetics, Electronics' },
      { label: 'Jurisdictions', value: 'LM Act 2009, OIML R79, OIML R87' },
      { label: 'Validation Cycle', value: '< 25ms' }
    ],
    accentColor: '#FDE047',
    bgStyle: 'bg-[#FDE047]',
    borderColor: 'border-white/50',
    textColor: 'text-neutral-950',
    subtextColor: 'text-neutral-800',
    badgeBg: 'bg-black/10 border border-black/15',
    badgeText: 'text-black'
  },
  3: {
    id: 3,
    tag: 'Module.03',
    title: 'Compliance Core',
    headline: 'Compliance\nCore.',
    subtext: 'Next-gen OCR & rule engine for modern retail. Instant audit-ready verdicts and automated risk reports.',
    description: 'Deterministic risk assessment core that generates certified compliance verdicts, automated corrective action plans, and exportable regulatory audit dossiers.',
    points: [
      'A compliance score and a clear COMPLIANT / NON-COMPLIANT verdict for every scan.',
      'Violations ranked by severity — pass, review, or violation — with actionable fix recommendations.',
      'Exportable, shareable PDF and JSON reports ready to file with regulatory authorities or vendor teams.',
      'Legal notice risk calculation model based on active compounding fine schedules.',
      'Automated batch audit capabilities with webhook notifications for enterprise supply chains.'
    ],
    metrics: [
      { label: 'Verdict Precision', value: '100% Deterministic' },
      { label: 'Severity Levels', value: 'Critical, Major, Minor, Advisory' },
      { label: 'Report Formats', value: 'Signed PDF, JSON, CSV' },
      { label: 'Audit Trail', value: 'Immutable Timestamp Log' }
    ],
    accentColor: '#FDE047',
    bgStyle: 'bg-[#0A0A0A]',
    borderColor: 'border-white/15',
    textColor: 'text-white',
    subtextColor: 'text-white/70',
    badgeBg: 'bg-yellow-400/10 border border-yellow-400/30',
    badgeText: 'text-yellow-400'
  }
};
