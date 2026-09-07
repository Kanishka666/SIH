import React from 'react';
import { Loader2, CheckCircle, Cpu, Clock, Layers } from 'lucide-react';

interface OCRStatusProps {
  phase: string;
  progress: number;
  message?: string;
  durationMs?: number;
  isProcessing: boolean;
}

export const OCRStatus: React.FC<OCRStatusProps> = ({
  phase,
  progress,
  message,
  durationMs,
  isProcessing
}) => {
  if (!isProcessing && (!durationMs || durationMs === 0)) {
    return null;
  }

  return (
    <div className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 sm:p-4 text-xs font-mono">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
          <span className="font-semibold text-white tracking-wide uppercase">
            {isProcessing ? 'OCR Extraction Pipeline' : 'Extraction Complete'}
          </span>
        </div>

        <div className="flex items-center gap-3 text-white/50 text-[11px]">
          {durationMs !== undefined && durationMs > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-yellow-400" />
              <span>{durationMs} ms</span>
            </span>
          )}
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-yellow-400" />
            <span>Neural Engine</span>
          </span>
        </div>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-yellow-400 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(250,204,21,0.5)]"
              style={{ width: `${Math.max(progress, 5)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60">
            <span>{message || 'Analyzing label frame...'}</span>
            <span className="text-yellow-400 font-bold">{Math.round(progress)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};
