import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown, Sparkles } from 'lucide-react';
import { ScrollRevealText } from './ScrollRevealText';
import { HeroAmbientLayer } from './hero/HeroAmbientLayer';

interface HeroHeaderProps {
  onScrollDown: () => void;
  onOpenSpecs: (id: number) => void;
}

export const HeroHeader: React.FC<HeroHeaderProps> = ({ onScrollDown, onOpenSpecs }) => {
  return (
    <div className="relative">
      {/* Ambient Product Layer (Floating packages, OCR tags, scan beam) */}
      <HeroAmbientLayer />

      <div className="relative z-10 pt-28 sm:pt-36 pb-12 sm:pb-16 text-center max-w-4xl mx-auto px-4">
      {/* Editorial Eyebrow badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-yellow-300 text-[10px] font-mono mb-6"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        <span className="tracking-[0.2em] uppercase font-bold">
          Legal Metrology Compliance Scanner
        </span>
      </motion.div>

      {/* Main Hero Title */}
      <ScrollRevealText
        tag="h1"
        text="Next-Gen Retail Label Compliance."
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-sans font-light tracking-tighter text-white leading-[0.98] mb-6"
      />

      {/* Editorial Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
        className="text-xs sm:text-sm md:text-base text-white/60 font-mono max-w-2xl mx-auto leading-relaxed mb-8"
      >
        Automated OCR extraction, adaptive Legal Metrology rule evaluation, and
        instant regulatory audit dossiers for modern consumer packaged goods.
      </motion.p>

      {/* Primary Hero CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center justify-center gap-3 mb-8"
      >
        <button
          onClick={() => onOpenSpecs(1)}
          className="px-6 py-3 rounded-full bg-yellow-300 hover:bg-yellow-200 text-black font-mono font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_25px_rgba(253,224,71,0.3)] transition-all cursor-pointer active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-black" />
          <span>Start Scanning Label</span>
        </button>
      </motion.div>

      {/* Editorial Jump Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
        className="flex flex-wrap items-center justify-center gap-2.5 text-[10px] font-mono tracking-wider uppercase"
      >
        <button
          onClick={() => onOpenSpecs(1)}
          className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
          01. Scan Engine
        </button>
        <button
          onClick={() => onOpenSpecs(2)}
          className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
          02. Rule Engine
        </button>
        <button
          onClick={() => onOpenSpecs(3)}
          className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white" />
          03. Compliance Core
        </button>
      </motion.div>

      {/* Scroll indicator prompt */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-12 flex justify-center"
      >
        <button
          onClick={onScrollDown}
          aria-label="Scroll to modules"
          className="flex flex-col items-center gap-2 text-white/40 hover:text-white/80 transition-colors group cursor-pointer"
        >
          <span className="text-[9px] font-mono uppercase tracking-[0.25em]">
            Explore Architecture
          </span>
          <ArrowDown className="w-3.5 h-3.5 animate-bounce text-yellow-400" />
        </button>
      </motion.div>
      </div>
    </div>
  );
};
