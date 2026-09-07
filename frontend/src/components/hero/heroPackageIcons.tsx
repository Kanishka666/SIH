import React from 'react';

/**
 * Premium SVG retail package illustrations for Hero Ambient Layer.
 * High-tech industrial monochrome outlines styled with stroke="currentColor".
 */

// 1. Milk Carton with gable top and statutory grid lines
export const MilkCartonIcon: React.FC<{ className?: string; id?: string }> = ({ className = 'w-24 h-36', id = 'milk-carton' }) => {
  const clipId = `${id}-clip`;
  return (
    <svg viewBox="0 0 100 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <clipPath id={clipId}>
          <path d="M25 32 L50 12 L75 32 L85 45 L85 150 L15 150 L15 45 Z" />
        </clipPath>
      </defs>
      {/* Outer gable carton silhouette */}
      <path
        d="M25 32 L50 12 L75 32 L85 45 L85 150 L15 150 L15 45 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="rgba(255, 255, 255, 0.02)"
      />
      {/* Gable top ridge & folds */}
      <path d="M50 12 L50 32" stroke="currentColor" strokeWidth="1.25" strokeDasharray="2 2" opacity="0.6" />
      <path d="M15 45 L85 45" stroke="currentColor" strokeWidth="1.25" />
      <path d="M25 32 L15 45" stroke="currentColor" strokeWidth="1.25" />
      <path d="M75 32 L85 45" stroke="currentColor" strokeWidth="1.25" />
      <path d="M50 32 L50 45" stroke="currentColor" strokeWidth="1.25" />
      {/* Screw cap on gable slope */}
      <ellipse cx="62" cy="28" rx="7" ry="4" stroke="currentColor" strokeWidth="1.25" />
      {/* Statutory Label Area / Measurement lines */}
      <rect x="25" y="60" width="50" height="42" rx="2" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <line x1="30" y1="72" x2="65" y2="72" stroke="currentColor" strokeWidth="1.5" opacity="0.8" />
      <line x1="30" y1="80" x2="55" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="30" y1="88" x2="70" y2="88" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      {/* Volume indicator tick */}
      <line x1="20" y1="120" x2="26" y2="120" stroke="currentColor" strokeWidth="1.5" />
      <line x1="20" y1="130" x2="24" y2="130" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="20" y1="140" x2="26" y2="140" stroke="currentColor" strokeWidth="1.5" />
      {/* Barcode representation */}
      <g opacity="0.75">
        <line x1="55" y1="125" x2="55" y2="142" stroke="currentColor" strokeWidth="1.2" />
        <line x1="58" y1="125" x2="58" y2="142" stroke="currentColor" strokeWidth="0.8" />
        <line x1="61" y1="125" x2="61" y2="142" stroke="currentColor" strokeWidth="1.5" />
        <line x1="64" y1="125" x2="64" y2="142" stroke="currentColor" strokeWidth="0.8" />
        <line x1="67" y1="125" x2="67" y2="142" stroke="currentColor" strokeWidth="1.2" />
        <line x1="72" y1="125" x2="72" y2="142" stroke="currentColor" strokeWidth="1" />
      </g>
    </svg>
  );
};

// 2. Biscuit / Cookie Flow-Wrap Packet with serrated crimp seals
export const BiscuitPacketIcon: React.FC<{ className?: string }> = ({ className = 'w-32 h-20' }) => {
  return (
    <svg viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Main body wrapper */}
      <rect x="22" y="18" width="116" height="54" rx="4" stroke="currentColor" strokeWidth="1.75" fill="rgba(255, 255, 255, 0.02)" />
      {/* Left serrated crimp seal */}
      <path
        d="M22 18 L12 21 L16 26 L12 31 L16 36 L12 41 L16 45 L12 50 L16 55 L12 60 L16 65 L12 69 L22 72 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="rgba(255, 255, 255, 0.04)"
      />
      {/* Right serrated crimp seal */}
      <path
        d="M138 18 L148 21 L144 26 L148 31 L144 36 L148 41 L144 45 L148 50 L144 55 L148 60 L144 65 L148 69 L138 72 Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
        fill="rgba(255, 255, 255, 0.04)"
      />
      {/* Biscuit stack contours */}
      <path d="M48 26 C54 26 58 35 58 45 C58 55 54 64 48 64" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 2" opacity="0.6" />
      <path d="M62 26 C68 26 72 35 72 45 C72 55 68 64 62 64" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 2" opacity="0.6" />
      <path d="M76 26 C82 26 86 35 86 45 C86 55 82 64 76 64" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 2" opacity="0.6" />
      {/* Statutory Box with MRP & Net Wt */}
      <rect x="94" y="26" width="36" height="38" rx="2" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" opacity="0.8" />
      <line x1="98" y1="34" x2="124" y2="34" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <line x1="98" y1="42" x2="118" y2="42" stroke="currentColor" strokeWidth="1" opacity="0.65" />
      <line x1="98" y1="50" x2="122" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.65" />
      {/* Green Veg dot mark */}
      <rect x="30" y="26" width="10" height="10" stroke="currentColor" strokeWidth="1" />
      <circle cx="35" cy="31" r="2.5" fill="currentColor" />
    </svg>
  );
};

// 3. Snack / Chips Pillow Pouch with top/bottom crimp seals and central inspection window
export const ChipsPacketIcon: React.FC<{ className?: string; id?: string }> = ({ className = 'w-28 h-40', id = 'chips-pouch' }) => {
  const clipId = `${id}-clip`;
  return (
    <svg viewBox="0 0 110 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <clipPath id={clipId}>
          <path d="M20 18 C20 18 55 22 90 18 C98 55 98 105 90 142 C55 138 55 138 20 142 C12 105 12 55 20 18 Z" />
        </clipPath>
      </defs>
      {/* Top seal with crimp ribs */}
      <path d="M16 12 L94 12 L90 22 L20 22 Z" stroke="currentColor" strokeWidth="1.25" fill="rgba(255, 255, 255, 0.04)" />
      <line x1="28" y1="12" x2="28" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="42" y1="12" x2="42" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="56" y1="12" x2="56" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="70" y1="12" x2="70" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="84" y1="12" x2="84" y2="22" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />

      {/* Main Pillow Pouch Body */}
      <path
        d="M20 22 C12 58 12 102 20 138 L90 138 C98 102 98 58 90 22 Z"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="rgba(255, 255, 255, 0.02)"
      />

      {/* Bottom seal with crimp ribs */}
      <path d="M20 138 L90 138 L94 148 L16 148 Z" stroke="currentColor" strokeWidth="1.25" fill="rgba(255, 255, 255, 0.04)" />
      <line x1="28" y1="138" x2="28" y2="148" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="42" y1="138" x2="42" y2="148" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="56" y1="138" x2="56" y2="148" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="70" y1="138" x2="70" y2="148" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />
      <line x1="84" y1="138" x2="84" y2="148" stroke="currentColor" strokeWidth="0.8" opacity="0.6" />

      {/* Glossy packaging contour line */}
      <path d="M28 35 C24 65 24 95 28 125" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" opacity="0.45" />

      {/* Brand & Statutory HUD Box */}
      <rect x="30" y="44" width="50" height="24" rx="3" stroke="currentColor" strokeWidth="1.25" opacity="0.85" />
      <line x1="36" y1="52" x2="74" y2="52" stroke="currentColor" strokeWidth="1.75" />
      <line x1="36" y1="60" x2="64" y2="60" stroke="currentColor" strokeWidth="1" opacity="0.7" />

      {/* Lower Mandatory Panel */}
      <rect x="30" y="80" width="50" height="42" rx="2" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.75" />
      <line x1="35" y1="90" x2="68" y2="90" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />
      <line x1="35" y1="98" x2="75" y2="98" stroke="currentColor" strokeWidth="1.2" opacity="0.8" />
      <line x1="35" y1="106" x2="58" y2="106" stroke="currentColor" strokeWidth="1" opacity="0.6" />
      <line x1="35" y1="114" x2="70" y2="114" stroke="currentColor" strokeWidth="1" opacity="0.6" />
    </svg>
  );
};

// 4. Soft Drink / Beverage Bottle with threaded cap, ergonomic contours & central label wrap
export const SoftDrinkBottleIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-44' }) => {
  return (
    <svg viewBox="0 0 90 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cap & neck threads */}
      <rect x="36" y="8" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="rgba(255, 255, 255, 0.05)" />
      <line x1="39" y1="12" x2="51" y2="12" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="39" y1="16" x2="51" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <rect x="34" y="20" width="22" height="4" rx="1" stroke="currentColor" strokeWidth="1.25" />
      {/* Neck tapering */}
      <path d="M38 24 L38 38 C38 48 20 62 20 78 L20 156 C20 166 28 172 45 172 C62 172 70 166 70 156 L70 78 C70 62 52 48 52 38 L52 24 Z" stroke="currentColor" strokeWidth="1.75" fill="rgba(255, 255, 255, 0.02)" />
      {/* Ribbed ergonomic grip waist */}
      <path d="M20 116 C25 118 65 118 70 116" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <path d="M20 124 C25 126 65 126 70 124" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      {/* Label wrap around bottle */}
      <rect x="22" y="74" width="46" height="38" rx="2" stroke="currentColor" strokeWidth="1.25" fill="rgba(255, 255, 255, 0.03)" />
      <line x1="28" y1="84" x2="62" y2="84" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <line x1="28" y1="92" x2="54" y2="92" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="28" y1="100" x2="60" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      {/* Liquid level wave */}
      <path d="M24 146 C34 148 40 144 55 146 C62 147 66 145 66 145" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Base pedaloid feet */}
      <path d="M26 168 C34 172 56 172 64 168" stroke="currentColor" strokeWidth="1.25" opacity="0.75" />
    </svg>
  );
};

// 5. Spice / Seasoning Container with perforated shaker flip-top
export const SpiceContainerIcon: React.FC<{ className?: string }> = ({ className = 'w-20 h-36' }) => {
  return (
    <svg viewBox="0 0 90 150" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Shaker Flip Cap */}
      <rect x="26" y="10" width="38" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" fill="rgba(255, 255, 255, 0.05)" />
      {/* Dispenser holes */}
      <circle cx="34" cy="19" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="45" cy="19" r="1.5" fill="currentColor" opacity="0.8" />
      <circle cx="56" cy="19" r="1.5" fill="currentColor" opacity="0.8" />
      {/* Cap rim */}
      <rect x="22" y="28" width="46" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.25" fill="rgba(255, 255, 255, 0.04)" />
      {/* Cylindrical jar body */}
      <rect x="20" y="34" width="50" height="102" rx="6" stroke="currentColor" strokeWidth="1.75" fill="rgba(255, 255, 255, 0.02)" />
      {/* Glass / Plastic reflection curve */}
      <path d="M26 44 L26 126" stroke="currentColor" strokeWidth="1" strokeDasharray="6 3" opacity="0.4" />
      {/* Central Spice label */}
      <rect x="24" y="52" width="42" height="58" rx="2" stroke="currentColor" strokeWidth="1.25" strokeDasharray="3 2" opacity="0.85" />
      <line x1="29" y1="62" x2="61" y2="62" stroke="currentColor" strokeWidth="1.5" opacity="0.9" />
      <line x1="29" y1="70" x2="52" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="29" y1="78" x2="58" y2="78" stroke="currentColor" strokeWidth="1" opacity="0.7" />
      <line x1="29" y1="88" x2="48" y2="88" stroke="currentColor" strokeWidth="1.2" opacity="0.75" />
      {/* FSSAI small logo block */}
      <rect x="29" y="96" width="16" height="8" rx="1" stroke="currentColor" strokeWidth="0.8" opacity="0.7" />
    </svg>
  );
};
