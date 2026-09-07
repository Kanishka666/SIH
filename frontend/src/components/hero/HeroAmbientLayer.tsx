import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  MilkCartonIcon,
  BiscuitPacketIcon,
  ChipsPacketIcon,
  SoftDrinkBottleIcon,
  SpiceContainerIcon
} from './heroPackageIcons';

interface OCRTagData {
  packageIndex: number;
  label: string;
  sublabel: string;
  status: 'VERIFIED' | 'PASS';
  position: 'right' | 'left';
}

const OCR_TAGS: OCRTagData[] = [
  { packageIndex: 0, label: 'MRP ₹ 249.00', sublabel: '(Incl. of all taxes)', status: 'VERIFIED', position: 'right' },
  { packageIndex: 0, label: 'Net Qty: 1000 ml', sublabel: 'Schedule 2 Metric', status: 'PASS', position: 'right' },
  { packageIndex: 1, label: 'FSSAI Lic. Verified', sublabel: 'No. 10019043002', status: 'VERIFIED', position: 'left' },
  { packageIndex: 2, label: 'Batch #BL-2098', sublabel: 'Traceability Hash', status: 'PASS', position: 'right' },
  { packageIndex: 3, label: 'MFD: 03/2026', sublabel: 'EXP: 03/2027 (12M)', status: 'VERIFIED', position: 'left' },
  { packageIndex: 4, label: 'Origin: INDIA', sublabel: 'Rule 6(10) Pass', status: 'PASS', position: 'left' }
];

export const HeroAmbientLayer: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [activeTagIndex, setActiveTagIndex] = useState<number>(0);

  // Periodic OCR reveal cycle (swaps tags every 3.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTagIndex((prev) => (prev + 1) % OCR_TAGS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
    >
      {/* 5. Ultra-subtle wireframe food background pattern (2-4% opacity) */}
      <div className="absolute inset-0 opacity-[0.035] flex items-center justify-between pointer-events-none px-6">
        <div className="flex flex-col gap-32 transform -translate-x-8">
          <BiscuitPacketIcon className="w-40 h-24 text-white/70 transform -rotate-12" />
          <SpiceContainerIcon className="w-28 h-44 text-yellow-300/80 transform rotate-6" />
          <SoftDrinkBottleIcon className="w-24 h-48 text-white/70 transform -rotate-6" />
        </div>
        <div className="flex flex-col gap-36 transform translate-x-8">
          <MilkCartonIcon className="w-32 h-48 text-white/70 transform rotate-12" />
          <ChipsPacketIcon className="w-36 h-48 text-yellow-300/80 transform -rotate-8" />
          <BiscuitPacketIcon className="w-40 h-24 text-white/70 transform rotate-6" />
        </div>
      </div>

      {/* Outer wrapper: Gated to xl: and up to ensure text column never has clutter */}
      <div className="hidden xl:block absolute inset-0 max-w-[1440px] mx-auto">
        {/* Left Side Showcase: Package 0 (Featured Milk Carton with laser scan beam) & Package 1 (Biscuit Packet) */}
        
        {/* ITEM 1: Featured Milk Carton (Top Left Gutter) with clipped laser scan beam */}
        <div className="absolute left-6 2xl:left-12 top-28">
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    y: [-8, 8, -8],
                    rotate: [-2, 2, -2]
                  }
            }
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            {/* Package Outline Icon with 18-22% opacity */}
            <div className="relative text-yellow-300 opacity-22 hover:opacity-35 transition-opacity">
              <MilkCartonIcon className="w-28 h-44 drop-shadow-[0_0_12px_rgba(253,224,71,0.15)]" id="hero-milk" />
              
              {/* 4. Compliance Laser Scan Beam (Clipped to Package Outline via SVG clip-path) */}
              {!prefersReducedMotion && (
                <svg
                  viewBox="0 0 100 160"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <defs>
                    <clipPath id="hero-milk-beam-clip">
                      <path d="M25 32 L50 12 L75 32 L85 45 L85 150 L15 150 L15 45 Z" />
                    </clipPath>
                    <linearGradient id="scan-laser-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" stopOpacity="0" />
                      <stop offset="50%" stopColor="#fde047" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Laser bar moving vertically inside the package envelope */}
                  <g clipPath="url(#hero-milk-beam-clip)">
                    <motion.g
                      animate={{
                        y: [0, 160, 0]
                      }}
                      transition={{
                        duration: 4.8,
                        repeat: Infinity,
                        ease: 'easeInOut'
                      }}
                    >
                      <rect x="0" y="-12" width="100" height="24" fill="url(#scan-laser-grad)" />
                      <line
                        x1="10"
                        y1="0"
                        x2="90"
                        y2="0"
                        stroke="#fef08a"
                        strokeWidth="1.5"
                        strokeOpacity="0.85"
                        strokeDasharray="4 2"
                      />
                    </motion.g>
                  </g>
                </svg>
              )}
            </div>

            {/* 3. Floating OCR Data Reveal Tag (Periodic) */}
            {OCR_TAGS.filter((t) => t.packageIndex === 0).map((tag, i) => {
              const isCurrent = OCR_TAGS[activeTagIndex]?.label === tag.label;
              return (
                <motion.div
                  key={tag.label}
                  initial={{ opacity: 0, x: 10 }}
                  animate={isCurrent ? { opacity: 1, x: 0 } : { opacity: 0, x: 10 }}
                  transition={{ duration: 0.5 }}
                  className="absolute left-full ml-4 top-10 whitespace-nowrap bg-black/85 border border-yellow-400/35 px-2.5 py-1 rounded-sm shadow-[0_0_15px_rgba(253,224,71,0.15)] flex flex-col gap-0.5"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold text-yellow-300 tracking-wider uppercase">
                      {tag.label}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-white/50 tracking-tight pl-3">
                    {tag.sublabel}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ITEM 2: Biscuit Flow-Wrap Packet (Bottom Left Gutter) */}
        <div className="absolute left-10 2xl:left-16 bottom-16">
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    y: [10, -10, 10],
                    rotate: [2, -2, 2]
                  }
            }
            transition={{
              duration: 9.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            <div className="text-white opacity-20 hover:opacity-35 transition-opacity">
              <BiscuitPacketIcon className="w-36 h-22 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
            </div>

            {/* OCR Data Reveal Tag */}
            {OCR_TAGS.filter((t) => t.packageIndex === 1).map((tag) => {
              const isCurrent = OCR_TAGS[activeTagIndex]?.label === tag.label;
              return (
                <motion.div
                  key={tag.label}
                  initial={{ opacity: 0, y: -6 }}
                  animate={isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                  transition={{ duration: 0.5 }}
                  className="absolute left-full ml-3 top-2 whitespace-nowrap bg-black/85 border border-white/25 px-2 py-1 rounded-sm shadow-[0_0_12px_rgba(255,255,255,0.1)] flex flex-col"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-mono font-bold text-white/90 tracking-wider">
                      {tag.label}
                    </span>
                  </div>
                  <span className="text-[8px] font-mono text-white/50 pl-3">
                    {tag.sublabel}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Right Side Showcase: Package 2 (Chips Pillow Pouch) & Package 3 (Bottle) & Package 4 (Spice) */}
        
        {/* ITEM 3: Chips Pillow Pouch (Top Right Gutter) */}
        <div className="absolute right-8 2xl:right-14 top-24">
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    y: [-10, 8, -10],
                    rotate: [3, -2, 3]
                  }
            }
            transition={{
              duration: 8.8,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            <div className="text-yellow-300 opacity-20 hover:opacity-35 transition-opacity">
              <ChipsPacketIcon className="w-30 h-44 drop-shadow-[0_0_12px_rgba(253,224,71,0.15)]" id="hero-chips" />
            </div>

            {/* OCR Data Reveal Tag */}
            {OCR_TAGS.filter((t) => t.packageIndex === 2).map((tag) => {
              const isCurrent = OCR_TAGS[activeTagIndex]?.label === tag.label;
              return (
                <motion.div
                  key={tag.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isCurrent ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ duration: 0.5 }}
                  className="absolute right-full mr-3 top-12 whitespace-nowrap bg-black/85 border border-yellow-400/35 px-2.5 py-1 rounded-sm shadow-[0_0_15px_rgba(253,224,71,0.15)] flex flex-col text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-yellow-300 tracking-wider">
                      {tag.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  </div>
                  <span className="text-[8px] font-mono text-white/50 pr-3">
                    {tag.sublabel}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ITEM 4: Soft Drink Bottle (Mid-Bottom Right Gutter) */}
        <div className="absolute right-20 2xl:right-28 bottom-12">
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    y: [8, -8, 8],
                    rotate: [-2, 2, -2]
                  }
            }
            transition={{
              duration: 7.6,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            <div className="text-white opacity-22 hover:opacity-35 transition-opacity">
              <SoftDrinkBottleIcon className="w-20 h-44 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
            </div>

            {/* OCR Data Reveal Tag */}
            {OCR_TAGS.filter((t) => t.packageIndex === 3).map((tag) => {
              const isCurrent = OCR_TAGS[activeTagIndex]?.label === tag.label;
              return (
                <motion.div
                  key={tag.label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={isCurrent ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                  transition={{ duration: 0.5 }}
                  className="absolute right-full mr-3 top-16 whitespace-nowrap bg-black/85 border border-white/25 px-2.5 py-1 rounded-sm shadow-[0_0_12px_rgba(255,255,255,0.1)] flex flex-col text-right"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-[10px] font-mono font-bold text-white/90 tracking-wider">
                      {tag.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  </div>
                  <span className="text-[8px] font-mono text-white/50 pr-3">
                    {tag.sublabel}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* ITEM 5: Spice Shaker Container (Far Right Gutter) */}
        <div className="absolute right-6 2xl:right-10 top-80">
          <motion.div
            animate={
              prefersReducedMotion
                ? {}
                : {
                    y: [-6, 6, -6],
                    rotate: [1, -1, 1]
                  }
            }
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="relative"
          >
            <div className="text-yellow-400 opacity-18 hover:opacity-30 transition-opacity">
              <SpiceContainerIcon className="w-18 h-32 drop-shadow-[0_0_10px_rgba(253,224,71,0.12)]" />
            </div>

            {/* OCR Data Reveal Tag */}
            {OCR_TAGS.filter((t) => t.packageIndex === 4).map((tag) => {
              const isCurrent = OCR_TAGS[activeTagIndex]?.label === tag.label;
              return (
                <motion.div
                  key={tag.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isCurrent ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                  transition={{ duration: 0.5 }}
                  className="absolute right-full mr-2 top-8 whitespace-nowrap bg-black/85 border border-yellow-400/35 px-2 py-0.5 rounded-sm shadow-[0_0_12px_rgba(253,224,71,0.12)] flex flex-col text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-[9px] font-mono font-bold text-yellow-300">
                      {tag.label}
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[8px] font-mono text-white/50 pr-2.5">
                    {tag.sublabel}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
