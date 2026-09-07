import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  ScanLine,
  Scale,
  ShieldCheck,
  Cpu,
  ArrowRight,
  AlertTriangle,
  FileText,
  Sparkles,
  UploadCloud
} from 'lucide-react';
import { ModuleData } from '../types';

interface ModuleModalProps {
  module: ModuleData | null;
  onClose: () => void;
  onSelectModule: (id: number) => void;
  onOpenScanner?: () => void;
}

export const ModuleModal: React.FC<ModuleModalProps> = ({
  module,
  onClose,
  onSelectModule,
  onOpenScanner
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'simulator'>('overview');
  const [simState, setSimState] = useState<{
    scanning: boolean;
    progress: number;
    completed: boolean;
  }>({
    scanning: false,
    progress: 0,
    completed: false
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    setActiveTab('overview');
    setSimState({ scanning: false, progress: 0, completed: false });
  }, [module?.id]);

  const runSimulation = () => {
    setSimState({ scanning: true, progress: 10, completed: false });
    const interval = setInterval(() => {
      setSimState((prev) => {
        if (prev.progress >= 100) {
          clearInterval(interval);
          return { scanning: false, progress: 100, completed: true };
        }
        return { ...prev, progress: prev.progress + 20 };
      });
    }, 180);
  };

  if (!module) return null;

  return (
    <AnimatePresence>
      <div
        id="modal-overlay"
        onClick={(e) => {
          if ((e.target as HTMLElement).id === 'modal-overlay') onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          id="modal-panel"
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl bg-[#0e0e0e] border border-white/15 rounded-[2rem] p-6 sm:p-8 md:p-10 text-white shadow-2xl overflow-hidden my-auto"
        >
          {/* Subtle ambient light gradient */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            id="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-5 right-5 p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors z-20"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Top Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pr-10">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-[11px] font-mono uppercase tracking-widest rounded-full bg-yellow-400/15 text-yellow-400 border border-yellow-400/30">
                {module.tag}
              </span>
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                System Specification
              </span>
            </div>

            {/* Sub-navigation between modules */}
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-full border border-white/10 text-[11px] font-mono">
              {[1, 2, 3].map((id) => (
                <button
                  key={id}
                  onClick={() => onSelectModule(id)}
                  className={`px-2.5 py-0.5 rounded-full transition-all ${
                    module.id === id
                      ? 'bg-yellow-300 text-black font-medium'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  0{id}
                </button>
              ))}
            </div>
          </div>

          <h3 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight font-sans text-white mb-2">
            {module.title}
          </h3>

          <p className="text-xs sm:text-sm text-white/60 font-mono mb-6 leading-relaxed">
            {module.description}
          </p>

          {/* Tab Switcher */}
          <div className="flex border-b border-white/10 mb-6 gap-6 text-xs font-mono uppercase tracking-wider">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'border-yellow-300 text-yellow-300 font-bold'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              Core Capabilities
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`pb-2.5 transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === 'simulator'
                  ? 'border-yellow-300 text-yellow-300 font-bold'
                  : 'border-transparent text-white/50 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Live Interactive Demo
            </button>
          </div>

          {activeTab === 'overview' ? (
            <div className="space-y-6">
              {/* Feature Points */}
              <ul className="space-y-3 font-sans text-sm text-white/80">
                {module.points.map((point, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-3 bg-white/[0.03] p-3 rounded-xl border border-white/5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{point}</span>
                  </motion.li>
                ))}
              </ul>

              {/* Technical Metrics Grid */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-white/40 uppercase tracking-wider mb-3">
                  Technical Benchmark Parameters
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {module.metrics.map((metric, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between"
                    >
                      <span className="text-[10px] font-mono text-white/50 uppercase leading-tight mb-1">
                        {metric.label}
                      </span>
                      <span className="text-xs sm:text-sm font-mono text-yellow-300 font-bold">
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Simulator Tab */
            <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/10">
              {module.id === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-white/70">
                    <span className="flex items-center gap-1.5">
                      <ScanLine className="w-4 h-4 text-yellow-400" />
                      OCR Field Extractor Pipeline
                    </span>
                    <span className="text-yellow-400 text-[11px]">
                      {simState.completed ? 'EXTRACTION COMPLETE' : simState.scanning ? 'DEWARPING & SCANNING...' : 'READY'}
                    </span>
                  </div>

                  <div className="relative h-44 rounded-xl border border-dashed border-white/20 bg-neutral-900/60 p-4 flex flex-col justify-between overflow-hidden">
                    {simState.scanning && (
                      <motion.div
                        className="absolute left-0 right-0 h-1 bg-yellow-400 shadow-[0_0_15px_#fde047]"
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2 rounded bg-white/5 border border-white/10">
                        <span className="text-white/40 text-[10px] block">Extracted MRP</span>
                        <span className="text-white font-bold">
                          {simState.completed ? '₹ 249.00 (incl. all taxes)' : '—'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white/5 border border-white/10">
                        <span className="text-white/40 text-[10px] block">Net Quantity</span>
                        <span className="text-white font-bold">
                          {simState.completed ? '500 ml / 520 g' : '—'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white/5 border border-white/10">
                        <span className="text-white/40 text-[10px] block">Unit Sale Price</span>
                        <span className="text-white font-bold">
                          {simState.completed ? '₹ 0.50 / ml' : '—'}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white/5 border border-white/10">
                        <span className="text-white/40 text-[10px] block">Batch / Expiry</span>
                        <span className="text-white font-bold">
                          {simState.completed ? 'LOT #882 / 12-2027' : '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-white/40">
                      <span>Source: Sample FMCG Packaging</span>
                      <span>Font Metric: 1.6mm (Pass)</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={runSimulation}
                      disabled={simState.scanning}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-bold tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/10"
                    >
                      <ScanLine className="w-4 h-4 text-yellow-400" />
                      {simState.scanning ? 'Analyzing Frame...' : 'Run Quick Simulation'}
                    </button>
                    {onOpenScanner && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenScanner();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-yellow-300 text-black text-xs font-mono font-bold tracking-tight hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(250,204,21,0.25)]"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Launch Drag-and-Drop OCR</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {module.id === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-white/70">
                    <span className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-yellow-400" />
                      Legal Metrology PCR 2011 Validator
                    </span>
                    <span className="text-yellow-400 text-[11px]">
                      {simState.completed ? 'RULES VERIFIED' : 'ACTIVE RULE MATRIX'}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-500/30 flex items-center justify-between">
                      <span className="text-white/90">Rule 6(1)(e): MRP with Tax Declaration</span>
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                        PASS
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-green-950/40 border border-green-500/30 flex items-center justify-between">
                      <span className="text-white/90">Rule 7: Numeral Height Ratio (&gt;1.5mm)</span>
                      <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-400 text-[10px] font-bold">
                        PASS
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-yellow-950/40 border border-yellow-500/30 flex items-center justify-between">
                      <span className="text-white/90">Rule 6(1)(g): Customer Care Tel & Email</span>
                      <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                        REVIEW
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={runSimulation}
                    disabled={simState.scanning}
                    className="w-full py-2.5 rounded-xl bg-yellow-300 text-black text-xs font-mono font-bold tracking-tight hover:bg-yellow-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Scale className="w-4 h-4" />
                    {simState.scanning ? 'Evaluating Rules...' : 'Run Rules Evaluation'}
                  </button>
                </div>
              )}

              {module.id === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-white/70">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-yellow-400" />
                      Compliance Audit Dossier
                    </span>
                    <span className="text-yellow-400 text-[11px]">CERTIFIED MANIFEST</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Overall Verdict:</span>
                      <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                        COMPLIANT (Grade 98/100)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Legal Penalty Risk:</span>
                      <span className="text-emerald-400 font-bold">ZERO (No Violations Found)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50">Audit Hash:</span>
                      <span className="text-white/70 font-mono text-[11px]">
                        0x8f2d...c3a9 (Signed)
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl bg-yellow-300 text-black text-xs font-mono font-bold tracking-tight hover:bg-yellow-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Export PDF Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Action */}
          <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="text-[11px] font-mono text-white/40">
              Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white/70">ESC</kbd> to exit detail view
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors"
            >
              Back to Overview
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
