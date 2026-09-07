import React from 'react';
import { ArrowUp } from 'lucide-react';

interface FooterProps {
  onScrollToTop: () => void;
  onOpenModal: (id: number) => void;
}

export const Footer: React.FC<FooterProps> = ({ onScrollToTop, onOpenModal }) => {
  return (
    <footer className="w-full border-t border-white/10 bg-[#111111] mt-24 py-12 text-white font-mono text-xs">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 md:px-12">
        {/* Technical Status Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 mb-10">
          <div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">Standard Jurisdiction</span>
            <span className="text-white/90 text-xs font-bold font-mono">Legal Metrology Act (2009)</span>
          </div>
          <div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">OCR Precision Index</span>
            <span className="text-yellow-300 text-xs font-bold font-mono">99.84% Field Accuracy</span>
          </div>
          <div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">Engine Latency</span>
            <span className="text-white/90 text-xs font-bold font-mono">&lt; 150ms Execution</span>
          </div>
          <div>
            <span className="text-[9px] text-white/40 uppercase tracking-widest block mb-1">System State</span>
            <span className="text-emerald-400 text-xs font-bold font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Operational 24/7
            </span>
          </div>
        </div>

        {/* Footer Navigation & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-6 border-t border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-yellow-400 rounded-sm"></div>
            <span className="font-bold text-[11px] font-mono tracking-widest uppercase text-white">labellens</span>
            <span className="text-white/40 text-[10px] ml-2">© 2026 Legal Metrology Core</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-white/50 text-[10px] font-mono uppercase tracking-widest">
            <button
              onClick={() => onOpenModal(1)}
              className="hover:text-yellow-300 transition-colors cursor-pointer"
            >
              Scan Engine
            </button>
            <button
              onClick={() => onOpenModal(2)}
              className="hover:text-yellow-300 transition-colors cursor-pointer"
            >
              Rule Engine
            </button>
            <button
              onClick={() => onOpenModal(3)}
              className="hover:text-yellow-300 transition-colors cursor-pointer"
            >
              Compliance Core
            </button>
          </div>

          <button
            onClick={onScrollToTop}
            aria-label="Back to top"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-[10px] font-mono uppercase tracking-widest transition-colors cursor-pointer"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3 h-3 text-yellow-400" />
          </button>
        </div>
      </div>
    </footer>
  );
};
