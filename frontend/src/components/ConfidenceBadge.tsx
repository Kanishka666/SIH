import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, Edit3 } from 'lucide-react';
import { FieldStatus } from '../types';
import { formatConfidencePercent } from '../utils/formatters';

interface ConfidenceBadgeProps {
  status: FieldStatus;
  confidence?: number;
  showPercent?: boolean;
  size?: 'sm' | 'md';
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  status,
  confidence,
  showPercent = true,
  size = 'md'
}) => {
  const isSm = size === 'sm';

  switch (status) {
    case 'MANUALLY_VERIFIED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-cyan-500/10 text-cyan-400 border-cyan-500/30`}
        >
          <Edit3 className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>MANUALLY VERIFIED</span>
        </span>
      );

    case 'VERIFIED':
      return (
        <span
          className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-emerald-500/10 text-emerald-400 border-emerald-500/30`}
        >
          <CheckCircle2 className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>VERIFIED</span>
          {showPercent && confidence !== undefined && (
            <span className="opacity-75 font-normal">({formatConfidencePercent(confidence)})</span>
          )}
        </span>
      );

    case 'REVIEW':
      return (
        <span
          className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-yellow-500/10 text-yellow-400 border-yellow-500/30`}
        >
          <AlertCircle className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>REVIEW</span>
          {showPercent && confidence !== undefined && (
            <span className="opacity-75 font-normal">({formatConfidencePercent(confidence)})</span>
          )}
        </span>
      );

    case 'WARNING':
      return (
        <span
          className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-amber-500/10 text-amber-400 border-amber-500/30`}
        >
          <AlertTriangle className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>WARNING</span>
        </span>
      );

    case 'MISSING':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider font-semibold rounded-md border ${
            isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
          } bg-rose-500/10 text-rose-400 border-rose-500/30`}
        >
          <HelpCircle className={isSm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
          <span>NOT DETECTED</span>
        </span>
      );
  }
};
