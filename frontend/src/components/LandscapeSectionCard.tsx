import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, ArrowUpRight } from 'lucide-react';
import { ModuleData } from '../types';
import { ScrollRevealText } from './ScrollRevealText';
import { LinesCanvas } from './LinesCanvas';
import { HalftoneCanvas } from './HalftoneCanvas';

interface LandscapeSectionCardProps {
  module: ModuleData;
  onOpenModal: (id: number) => void;
  index: number;
}

export const LandscapeSectionCard: React.FC<LandscapeSectionCardProps> = ({
  module,
  onOpenModal,
  index
}) => {
  const isModule1 = module.id === 1;
  const isModule2 = module.id === 2;
  const isModule3 = module.id === 3;

  return (
    <motion.section
      id={`module-0${module.id}`}
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      <article
        onClick={() => onOpenModal(module.id)}
        className={`group cursor-pointer relative w-full rounded-[2.5rem] p-8 sm:p-10 md:p-12 lg:p-14 overflow-hidden shadow-2xl border transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_25px_60px_rgba(0,0,0,0.35)] min-h-[440px] md:min-h-[460px] flex flex-col justify-between ${module.bgStyle} ${module.borderColor}`}
        style={
          isModule1
            ? {
                background:
                  'linear-gradient(135deg, #f4f4f0 0%, #e8e8e3 100%)'
              }
            : isModule2
            ? {
                backgroundColor: '#FDE047'
              }
            : {
                background:
                  'linear-gradient(135deg, #0d0d0d 0%, #050505 100%)'
              }
        }
      >
        {/* Module 01 Background: Noise + Geometric Contour Waves + WebGL Lines */}
        {isModule1 && (
          <>
            <div
              className="absolute inset-0 z-10 pointer-events-none opacity-[0.04] noise-overlay"
              style={{ mixBlendMode: 'multiply' }}
            />
            {/* Editorial Contour Curves */}
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none z-0">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full rotate-12">
                <path d="M0 100 Q50 0 100 100 T200 100" fill="none" stroke="black" strokeWidth="0.5" />
                <path d="M0 110 Q50 10 100 110 T200 110" fill="none" stroke="black" strokeWidth="0.5" />
                <path d="M0 120 Q50 20 100 120 T200 120" fill="none" stroke="black" strokeWidth="0.5" />
                <path d="M0 130 Q50 30 100 130 T200 130" fill="none" stroke="black" strokeWidth="0.5" />
              </svg>
            </div>
            <div className="absolute inset-0 z-0 top-1/6 md:top-0 right-0 md:left-1/3 opacity-70 group-hover:opacity-90 transition-opacity duration-700 pointer-events-none">
              <LinesCanvas className="w-full h-full" />
            </div>
          </>
        )}

        {/* Module 02 Background: Editorial Dot Grid Matrix + Concentric Geometric Circles */}
        {isModule2 && (
          <>
            <div
              className="absolute inset-0 z-0 opacity-[0.22] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#000 0.6px, transparent 0.6px)',
                backgroundSize: '16px 16px'
              }}
            />
            {/* Concentric Architectural Rings */}
            <div className="absolute -right-6 -bottom-6 w-56 h-56 border border-black/10 rounded-full flex items-center justify-center pointer-events-none rotate-12 group-hover:rotate-45 transition-transform duration-700">
              <div className="w-40 h-40 border border-black/15 rounded-full flex items-center justify-center">
                <div className="w-24 h-24 border border-black/25 rounded-full flex items-center justify-center">
                  <div className="w-10 h-10 border border-black/35 rounded-full" />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Module 03 Background: Animated Halftone Canvas + Concentric Radar Rings */}
        {isModule3 && (
          <>
            <div className="absolute inset-0 z-0 md:left-1/4 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity duration-700">
              <HalftoneCanvas className="w-full h-full" />
            </div>
            <div className="absolute -right-8 -bottom-8 w-60 h-60 border border-white/5 rounded-full flex items-center justify-center pointer-events-none">
              <div className="w-44 h-44 border border-white/10 rounded-full flex items-center justify-center">
                <div className="w-24 h-24 border border-white/15 rounded-full" />
              </div>
            </div>
          </>
        )}

        {/* Editorial Card Header */}
        <header className="relative z-20 flex justify-between items-start">
          <div className="space-y-1">
            <p
              className={`font-mono text-[10px] uppercase tracking-[0.25em] ${
                isModule3
                  ? 'text-yellow-400/80'
                  : isModule2
                  ? 'text-black/60'
                  : 'text-black/50'
              }`}
            >
              {module.tag}
            </p>
            <h3
              className={`text-lg sm:text-xl font-medium tracking-tight uppercase font-sans ${
                isModule3 ? 'text-white' : 'text-neutral-950'
              }`}
            >
              {module.title}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            {isModule1 && (
              <span className="px-3 py-1 border border-black/15 rounded-full text-[9px] font-mono uppercase tracking-widest text-black/70 bg-black/[0.02]">
                v2.4.0_ALPHA
              </span>
            )}
            {isModule2 && (
              <div className="flex items-center gap-1.5 px-3 py-1 border border-black/15 rounded-full bg-black/5">
                <div className="w-2 h-2 rounded-full bg-black"></div>
                <div className="w-2 h-2 rounded-full bg-black/30"></div>
                <div className="w-2 h-2 rounded-full bg-black/30"></div>
              </div>
            )}
            {isModule3 && (
              <span className="px-3 py-1 border border-yellow-400/30 rounded-full text-[9px] font-mono uppercase tracking-widest text-yellow-400 bg-yellow-400/10">
                CORE_v4.2
              </span>
            )}

            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                isModule3
                  ? 'bg-white/10 text-white group-hover:bg-yellow-400 group-hover:text-black'
                  : 'bg-black/10 text-black group-hover:bg-black group-hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2]" />
            </div>
          </div>
        </header>

        {/* Editorial Main Content Body (Landscape Orientation) */}
        <main className="relative z-20 mt-10 md:mt-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end">
            {/* Giant Editorial Headline */}
            <div className="lg:col-span-7">
              <ScrollRevealText
                tag="h2"
                text={module.headline}
                className={`text-[44px] sm:text-[54px] md:text-[62px] lg:text-[68px] leading-[0.93] font-light tracking-tighter mb-4 font-sans ${
                  isModule3 ? 'text-white uppercase' : 'text-[#111111]'
                }`}
              />

              {/* Monospace Editorial Subtext */}
              <ScrollRevealText
                tag="p"
                text={module.subtext}
                delay={0.15}
                className={`text-xs md:text-[13px] leading-relaxed max-w-md font-mono ${
                  isModule3
                    ? 'text-white/70'
                    : isModule2
                    ? 'text-black/75'
                    : 'text-neutral-600'
                }`}
              />
            </div>

            {/* Right-side Feature Badges & Specs Link */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              <div className="space-y-2">
                {module.points.slice(0, 2).map((pt, pIdx) => (
                  <div
                    key={pIdx}
                    className={`flex items-start gap-2.5 p-3 rounded-xl backdrop-blur-sm text-xs font-sans transition-all duration-300 ${
                      isModule3
                        ? 'bg-white/[0.05] text-white/85 border border-white/10'
                        : isModule2
                        ? 'bg-black/[0.06] text-neutral-950 border border-black/10'
                        : 'bg-black/[0.03] text-neutral-900 border border-black/5'
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isModule3
                          ? 'text-yellow-400'
                          : isModule2
                          ? 'text-neutral-950'
                          : 'text-neutral-900'
                      }`}
                    />
                    <span className="leading-snug">{pt}</span>
                  </div>
                ))}
              </div>

              {/* Technical Inspect prompt */}
              <div className="pt-1 flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono uppercase tracking-[0.2em] ${
                    isModule3
                      ? 'text-white/40'
                      : isModule2
                      ? 'text-black/60'
                      : 'text-black/50'
                  }`}
                >
                  Inspect Specifications
                </span>

                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-wider group-hover:underline ${
                    isModule3
                      ? 'text-yellow-400'
                      : isModule2
                      ? 'text-neutral-950'
                      : 'text-neutral-900'
                  }`}
                >
                  Specs <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </main>
      </article>
    </motion.section>
  );
};
