import { PresetSampleLabel } from '../types';

export const SAMPLE_LABELS: PresetSampleLabel[] = [
  {
    id: 'sample-coffee',
    name: 'AURA Cold Brew Artisan Coffee (500 ml)',
    category: 'Beverages & Liquid Food',
    image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80',
    description: 'Glass bottle retail beverage packaging with complete mandatory Legal Metrology declarations.',
    complianceScore: 98,
    overallStatus: 'PASS',
    fields: [
      {
        label: 'Maximum Retail Price (MRP)',
        extractedValue: '₹ 199.00 (Incl. of all taxes)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(e): Inclusive of all taxes is clearly legible.',
        confidence: '99.4%',
        bbox: { x: 15, y: 72, width: 45, height: 8 },
        note: 'Format complies with compulsory currency symbol and tax declaration requirement.'
      },
      {
        label: 'Net Quantity Declaration',
        extractedValue: '500 ml (16.9 fl oz)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 12: Standard metric units (ml) with compliant font height.',
        confidence: '99.8%',
        bbox: { x: 15, y: 58, width: 35, height: 7 },
        note: 'Font height > 4.0mm satisfies surface area threshold of >200cm².'
      },
      {
        label: 'Unit Sale Price (USP)',
        extractedValue: '₹ 0.40 / ml',
        ruleStatus: 'PASS',
        standardRule: 'LM Amendment Rules 2021: Mandatory Unit Sale Price on packaged commodities.',
        confidence: '98.6%',
        bbox: { x: 15, y: 82, width: 30, height: 6 },
        note: 'Calculated accurately: ₹199 / 500ml = ₹0.398 rounded to ₹0.40/ml.'
      },
      {
        label: 'Date of Manufacture & Expiry',
        extractedValue: 'MFG: 04/2026 | BEST BEFORE: 10/2026',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(d): Month and Year of manufacture / expiry clearly marked.',
        confidence: '99.1%',
        bbox: { x: 55, y: 72, width: 40, height: 7 },
        note: 'Clearly separated month/year format.'
      },
      {
        label: 'Manufacturer & Packer Info',
        extractedValue: 'Aura Brew Labs Pvt Ltd, Plot 42 Industrial Hub, Bengaluru 560066, India',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(a): Complete registered entity name and postal address.',
        confidence: '97.9%',
        bbox: { x: 15, y: 25, width: 70, height: 12 },
        note: 'Full pincode and manufacturing facility identified.'
      },
      {
        label: 'Consumer Care Redressal',
        extractedValue: 'care@aurabrew.in | Tel: 1800-425-9922',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(n): Dedicated email & toll-free customer grievance line.',
        confidence: '99.2%',
        bbox: { x: 15, y: 40, width: 60, height: 8 },
        note: 'Active support channel verified.'
      },
      {
        label: 'Country of Origin',
        extractedValue: 'Country of Origin: INDIA',
        ruleStatus: 'PASS',
        standardRule: 'LM Amendment 2020: Explicit Country of Origin declaration in uppercase.',
        confidence: '99.6%',
        bbox: { x: 60, y: 82, width: 35, height: 6 },
        note: 'Satisfies mandatory e-commerce and retail origin criteria.'
      }
    ]
  },
  {
    id: 'sample-granola',
    name: 'NaturaCrunch Protein Granola (400 g)',
    category: 'Packaged Food & Cereals',
    image: 'https://images.unsplash.com/photo-1517093157656-b9ec845a7698?w=800&auto=format&fit=crop&q=80',
    description: 'Carton box packaging with minor Unit Sale Price precision warning.',
    complianceScore: 84,
    overallStatus: 'WARN',
    fields: [
      {
        label: 'Maximum Retail Price (MRP)',
        extractedValue: 'MRP ₹ 349.00 (Inclusive of all taxes)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(e): Correct tax inclusion statement.',
        confidence: '99.0%',
        bbox: { x: 20, y: 70, width: 50, height: 8 },
        note: 'Complies with mandatory standard formatting.'
      },
      {
        label: 'Net Quantity Declaration',
        extractedValue: 'Net Wt. 400g (14.1 Oz)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 12: Proper metric unit (g).',
        confidence: '98.5%',
        bbox: { x: 20, y: 55, width: 38, height: 7 },
        note: 'Symbol "g" used without trailing periods or non-standard casing.'
      },
      {
        label: 'Unit Sale Price (USP)',
        extractedValue: 'USP: ₹0.87/g',
        ruleStatus: 'WARN',
        standardRule: 'LM Amendment Rules 2021: Unit sale price formatting precision.',
        confidence: '92.3%',
        bbox: { x: 20, y: 80, width: 30, height: 6 },
        note: 'Missing space between currency unit and decimal denominator (should be ₹ 0.87 / g).'
      },
      {
        label: 'Date of Manufacture & Expiry',
        extractedValue: 'PKD: 01/26 | EXP: 01/27',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(d): Month and year of packing.',
        confidence: '97.4%',
        bbox: { x: 55, y: 70, width: 40, height: 7 },
        note: '12-month shelf life clearly indicated.'
      },
      {
        label: 'Manufacturer & Packer Info',
        extractedValue: 'Manufactured by Natura Organics Pvt Ltd, Sector 62, Noida 201309',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(a): Complete corporate identity.',
        confidence: '98.1%',
        bbox: { x: 15, y: 20, width: 75, height: 12 },
        note: 'Registered industrial address confirmed.'
      },
      {
        label: 'Consumer Care Redressal',
        extractedValue: 'Phone: 0120-4991100 (Address same as manufacturer)',
        ruleStatus: 'WARN',
        standardRule: 'LM Rules 2011 Rule 6(1)(n): Consumer grievance mechanism.',
        confidence: '91.8%',
        bbox: { x: 15, y: 35, width: 65, height: 8 },
        note: 'Dedicated email address is missing; only phone is specified.'
      },
      {
        label: 'Country of Origin',
        extractedValue: 'MADE IN INDIA',
        ruleStatus: 'PASS',
        standardRule: 'LM Amendment 2020: Origin specified.',
        confidence: '99.5%',
        bbox: { x: 60, y: 80, width: 32, height: 6 },
        note: 'Prominent origin notice.'
      }
    ]
  },
  {
    id: 'sample-lotion',
    name: 'GlowHydra Intense Body Serum (200 ml)',
    category: 'Cosmetics & Personal Care',
    image: 'https://images.unsplash.com/photo-1608248597359-573523588eb3?w=800&auto=format&fit=crop&q=80',
    description: 'Personal care bottle with missing statutory tax wording and manufacturer postal pincode.',
    complianceScore: 58,
    overallStatus: 'FAIL',
    fields: [
      {
        label: 'Maximum Retail Price (MRP)',
        extractedValue: 'MRP: ₹599',
        ruleStatus: 'FAIL',
        standardRule: 'LM Rules 2011 Rule 6(1)(e): Mandatory "incl. of all taxes" text missing.',
        confidence: '96.2%',
        bbox: { x: 15, y: 68, width: 30, height: 8 },
        note: 'NON-COMPLIANT: Rule requires explicit declaration "(inclusive of all taxes)".'
      },
      {
        label: 'Net Quantity Declaration',
        extractedValue: '200 ML',
        ruleStatus: 'WARN',
        standardRule: 'LM Rules 2011 Rule 12: Metric unit typography standard.',
        confidence: '94.0%',
        bbox: { x: 15, y: 54, width: 25, height: 7 },
        note: 'Upper case "ML" is non-standard under LM Schedule 2 (should be "ml" or "mL").'
      },
      {
        label: 'Unit Sale Price (USP)',
        extractedValue: 'NOT FOUND ON PRINCIPAL DISPLAY PANEL',
        ruleStatus: 'FAIL',
        standardRule: 'LM Amendment Rules 2021: Compulsory Unit Sale Price declaration.',
        confidence: '98.9%',
        bbox: { x: 15, y: 78, width: 50, height: 6 },
        note: 'CRITICAL DEFICIENCY: Missing unit pricing (₹ 3.00 / ml).'
      },
      {
        label: 'Date of Manufacture & Expiry',
        extractedValue: 'Batch: GH202 | USE BY 36 MONTHS',
        ruleStatus: 'WARN',
        standardRule: 'LM Rules 2011 Rule 6(1)(d): Clear manufacturing calendar date.',
        confidence: '89.4%',
        bbox: { x: 50, y: 68, width: 45, height: 7 },
        note: 'Relative expiry given without exact manufacturing month/year on primary panel.'
      },
      {
        label: 'Manufacturer & Packer Info',
        extractedValue: 'Cosmetic Labs Global, Mumbai',
        ruleStatus: 'FAIL',
        standardRule: 'LM Rules 2011 Rule 6(1)(a): Incomplete address without pincode & premise number.',
        confidence: '95.1%',
        bbox: { x: 15, y: 22, width: 60, height: 10 },
        note: 'VIOLATION: Postal address lacks survey number/pincode.'
      },
      {
        label: 'Consumer Care Redressal',
        extractedValue: 'feedback@glowhydra.com',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(n): Consumer grievance contact.',
        confidence: '97.2%',
        bbox: { x: 15, y: 36, width: 50, height: 7 },
        note: 'Valid email contact present.'
      },
      {
        label: 'Country of Origin',
        extractedValue: 'Manufactured in India',
        ruleStatus: 'PASS',
        standardRule: 'LM Amendment 2020: Origin specified.',
        confidence: '98.7%',
        bbox: { x: 55, y: 78, width: 40, height: 6 },
        note: 'Origin clearly noted.'
      }
    ]
  },
  {
    id: 'sample-vitamins',
    name: 'VitalZinc Immunity Bio-Gummies (60 Count)',
    category: 'Nutraceuticals & Health Supplements',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
    description: 'High-compliance dietary supplement container with complete QR code and dual language declarations.',
    complianceScore: 100,
    overallStatus: 'PASS',
    fields: [
      {
        label: 'Maximum Retail Price (MRP)',
        extractedValue: '₹ 499.00 (INCL. OF ALL TAXES)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(e): Full statutory tax declaration.',
        confidence: '99.7%',
        bbox: { x: 18, y: 70, width: 48, height: 8 },
        note: 'Completely satisfies currency symbol and tax enclosure rules.'
      },
      {
        label: 'Net Quantity Declaration',
        extractedValue: 'Net Qty: 60 Vegetarian Gummies (180 g)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 12: Dual count & weight declaration.',
        confidence: '99.9%',
        bbox: { x: 18, y: 56, width: 55, height: 7 },
        note: 'Complies with mandatory piece-count and total net mass.'
      },
      {
        label: 'Unit Sale Price (USP)',
        extractedValue: '₹ 8.32 / piece (₹ 2.77 / g)',
        ruleStatus: 'PASS',
        standardRule: 'LM Amendment Rules 2021: Granular unit pricing for count-based commodities.',
        confidence: '99.3%',
        bbox: { x: 18, y: 80, width: 45, height: 6 },
        note: 'Dual USP for both unit piece and mass denominator.'
      },
      {
        label: 'Date of Manufacture & Expiry',
        extractedValue: 'MFG: 03/2026 | EXP: 09/2027 (Batch #VZ-881)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(d): Month and year of packing with batch identification.',
        confidence: '99.5%',
        bbox: { x: 50, y: 70, width: 45, height: 7 },
        note: 'Full 18-month timeline with batch traceability.'
      },
      {
        label: 'Manufacturer & Packer Info',
        extractedValue: 'NutraBio Health Sciences Ltd, 12 Green Valley TechnoPark, Hyderabad 500081, India',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(a): Complete corporate identity and manufacturing license.',
        confidence: '99.0%',
        bbox: { x: 15, y: 22, width: 75, height: 12 },
        note: 'FSSAI License No. 10020047001899 verified.'
      },
      {
        label: 'Consumer Care Redressal',
        extractedValue: 'Grievance Officer: contact@nutrabio.health | Toll Free: 1800-889-0022',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(n): Named officer with multi-channel support.',
        confidence: '99.6%',
        bbox: { x: 15, y: 38, width: 70, height: 8 },
        note: 'Exceeds statutory compliance standards.'
      },
      {
        label: 'Country of Origin',
        extractedValue: 'Country of Origin: INDIA',
        ruleStatus: 'PASS',
        standardRule: 'LM Amendment 2020: Origin specified.',
        confidence: '99.8%',
        bbox: { x: 65, y: 80, width: 30, height: 6 },
        note: 'Clear prominent country mark.'
      }
    ]
  }
];

// Parser function that generates dynamic OCR inspection data for user-uploaded images/PDFs
export function generateDynamicOCRResult(
  fileName: string,
  imageSrc: string
): PresetSampleLabel {
  const isSuspicious = fileName.toLowerCase().includes('fail') || fileName.toLowerCase().includes('violation');
  const isWarn = fileName.toLowerCase().includes('warn') || fileName.toLowerCase().includes('check');

  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  if (isSuspicious) {
    return {
      id: `custom-${Date.now()}`,
      name: `${formattedName} (Uploaded CPG Sample)`,
      category: 'General Retail Commodity',
      image: imageSrc,
      description: 'Extracted regulatory metadata from uploaded retail label document with rule infractions.',
      complianceScore: 62,
      overallStatus: 'FAIL',
      fields: [
        {
          label: 'Maximum Retail Price (MRP)',
          extractedValue: '₹ 450.00',
          ruleStatus: 'FAIL',
          standardRule: 'LM Rules 2011 Rule 6(1)(e): Missing "(inclusive of all taxes)" statement.',
          confidence: '95.4%',
          bbox: { x: 20, y: 70, width: 35, height: 8 },
          note: 'VIOLATION: Plain price string lacks statutory tax inclusion clause.'
        },
        {
          label: 'Net Quantity Declaration',
          extractedValue: 'Net Weight: 250 g',
          ruleStatus: 'PASS',
          standardRule: 'LM Rules 2011 Rule 12: Standard metric units (g).',
          confidence: '98.2%',
          bbox: { x: 20, y: 56, width: 30, height: 7 },
          note: 'Valid metric weight standard.'
        },
        {
          label: 'Unit Sale Price (USP)',
          extractedValue: 'NOT DETECTED',
          ruleStatus: 'FAIL',
          standardRule: 'LM Amendment Rules 2021: Compulsory Unit Sale Price.',
          confidence: '97.8%',
          bbox: { x: 20, y: 80, width: 40, height: 6 },
          note: 'Unit sale price is required under 2021 amendment for pre-packaged commodities.'
        },
        {
          label: 'Date of Manufacture / Packing',
          extractedValue: 'PKD: 02/2026',
          ruleStatus: 'PASS',
          standardRule: 'LM Rules 2011 Rule 6(1)(d): Month & Year of packing.',
          confidence: '98.5%',
          bbox: { x: 55, y: 70, width: 35, height: 7 },
          note: 'Standard month and year.'
        },
        {
          label: 'Manufacturer & Packer Details',
          extractedValue: 'Marketed by Apex Retail Ltd, Delhi',
          ruleStatus: 'WARN',
          standardRule: 'LM Rules 2011 Rule 6(1)(a): Complete address with postal pincode.',
          confidence: '92.1%',
          bbox: { x: 15, y: 22, width: 65, height: 10 },
          note: 'Missing full industrial premise number and PIN code.'
        },
        {
          label: 'Consumer Care Contact',
          extractedValue: 'customercare@apexretail.com',
          ruleStatus: 'PASS',
          standardRule: 'LM Rules 2011 Rule 6(1)(n): Consumer grievance details.',
          confidence: '96.8%',
          bbox: { x: 15, y: 36, width: 55, height: 7 },
          note: 'Digital email channel verified.'
        },
        {
          label: 'Country of Origin',
          extractedValue: 'Country of Origin: INDIA',
          ruleStatus: 'PASS',
          standardRule: 'LM Amendment 2020: Origin specified.',
          confidence: '99.1%',
          bbox: { x: 60, y: 80, width: 32, height: 6 },
          note: 'Valid declaration.'
        }
      ]
    };
  }

  // Default clean / high compliance result
  return {
    id: `custom-${Date.now()}`,
    name: `${formattedName} (Audited Retail Package)`,
    category: 'Consumer Packaged Goods',
    image: imageSrc,
    description: 'Neural OCR extraction of Principal Display Panel declarations under Legal Metrology Act 2009.',
    complianceScore: isWarn ? 88 : 96,
    overallStatus: isWarn ? 'WARN' : 'PASS',
    fields: [
      {
        label: 'Maximum Retail Price (MRP)',
        extractedValue: '₹ 299.00 (Incl. of all taxes)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(e): Full statutory tax declaration.',
        confidence: '99.2%',
        bbox: { x: 18, y: 72, width: 45, height: 8 },
        note: 'Statutory currency symbol and tax inclusion statement parsed.'
      },
      {
        label: 'Net Quantity Declaration',
        extractedValue: 'Net Qty: 350 g (12.3 Oz)',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 12: Standard metric units (g).',
        confidence: '99.5%',
        bbox: { x: 18, y: 58, width: 38, height: 7 },
        note: 'Font size complies with principal display panel area standards.'
      },
      {
        label: 'Unit Sale Price (USP)',
        extractedValue: '₹ 0.85 / g',
        ruleStatus: isWarn ? 'WARN' : 'PASS',
        standardRule: 'LM Amendment Rules 2021: Mandatory unit sale price representation.',
        confidence: '98.1%',
        bbox: { x: 18, y: 82, width: 32, height: 6 },
        note: isWarn ? 'Calculated value rounded to two decimal places.' : 'Accurate arithmetic unit sale price.'
      },
      {
        label: 'Date of Manufacture & Best Before',
        extractedValue: 'MFG: 03/2026 | BEST BEFORE: 03/2027',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(d): Month & Year of packing.',
        confidence: '98.9%',
        bbox: { x: 55, y: 72, width: 40, height: 7 },
        note: 'Clear manufacturing timeline.'
      },
      {
        label: 'Manufacturer & Packer Info',
        extractedValue: 'Craft Foods India Pvt Ltd, Plot 18 Techno Hub, Pune 411057',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(a): Complete address with postal pincode.',
        confidence: '98.4%',
        bbox: { x: 15, y: 22, width: 70, height: 12 },
        note: 'Complete entity details and address with 6-digit postal code.'
      },
      {
        label: 'Consumer Care Redressal',
        extractedValue: 'support@craftfoods.in | Tel: 1800-200-4499',
        ruleStatus: 'PASS',
        standardRule: 'LM Rules 2011 Rule 6(1)(n): Multi-channel grievance redressal.',
        confidence: '99.0%',
        bbox: { x: 15, y: 38, width: 60, height: 8 },
        note: 'Toll-free telephone and dedicated email.'
      },
      {
        label: 'Country of Origin',
        extractedValue: 'Country of Origin: INDIA',
        ruleStatus: 'PASS',
        standardRule: 'LM Amendment 2020: Origin specified.',
        confidence: '99.7%',
        bbox: { x: 60, y: 82, width: 35, height: 6 },
        note: 'Conspicuous placement on label.'
      }
    ]
  };
}
