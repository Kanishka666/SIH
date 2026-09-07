import React, { useState } from 'react';
import { Download, FileText, Send, RefreshCw, Copy, Check, ShieldAlert, X, Volume2, Square } from 'lucide-react';
import { NormalizedOCRResult, ComplianceResult } from '../types';
import { buildAuditDossier, generateComplaintDraft } from '../services/reportService';

interface ScanActionsProps {
  ocrResult: NormalizedOCRResult;
  compliance: ComplianceResult;
  onResetScan: () => void;
  isAudioSpeaking?: boolean;
  onReplayAudio?: () => void;
}

export const ScanActions: React.FC<ScanActionsProps> = ({
  ocrResult,
  compliance,
  onResetScan,
  isAudioSpeaking,
  onReplayAudio
}) => {
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleExportJSON = () => {
    const dossier = buildAuditDossier(ocrResult, compliance);
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LabelLens-Audit-${ocrResult.fields.productBrandName.value?.replace(/[^a-z0-9]/gi, '_') || 'scan'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const complaintDraft = generateComplaintDraft(ocrResult, compliance);

  const handleCopyDraft = () => {
    navigator.clipboard.writeText(complaintDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleExportJSON}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border border-white/10"
        >
          <Download className="w-3.5 h-3.5 text-yellow-400" />
          <span>Export JSON</span>
        </button>

        <button
          onClick={handlePrintReport}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border border-white/10"
        >
          <FileText className="w-3.5 h-3.5 text-yellow-400" />
          <span>Print Audit</span>
        </button>

        <button
          onClick={() => setShowComplaintModal(true)}
          className="px-3.5 py-2 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-xs font-mono font-medium flex items-center gap-1.5 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Grievance Notice Draft</span>
        </button>

        {onReplayAudio && (
          <button
            type="button"
            onClick={onReplayAudio}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
              isAudioSpeaking
                ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 shadow-[0_0_12px_rgba(250,204,21,0.25)]'
                : 'bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border-white/10'
            }`}
            title={isAudioSpeaking ? 'Stop audio speech' : 'Replay spoken audio confirmation feedback via Web Speech API'}
          >
            {isAudioSpeaking ? (
              <>
                <Square className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                <span>Stop Voice Feedback</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                <span>Audio Confirmation</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={onResetScan}
          className="px-3.5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.2)] ml-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Scan New Label</span>
        </button>
      </div>

      {/* Complaint Notice Draft Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl bg-[#111111] border border-white/15 rounded-2xl p-6 text-white shadow-2xl space-y-4">
            <button
              onClick={() => setShowComplaintModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-yellow-400">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-base font-sans font-semibold text-white">
                Statutory Notice Draft (Legal Metrology Act 2009)
              </h4>
            </div>

            <p className="text-xs font-mono text-white/60">
              Pre-formatted formal notice ready for dispatch to manufacturer / National Consumer Helpline (NCH).
            </p>

            <textarea
              readOnly
              value={complaintDraft}
              rows={12}
              className="w-full bg-black/70 border border-white/10 rounded-xl p-3.5 text-xs font-mono text-white/90 focus:outline-none select-all"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] font-mono text-white/40">
                Rule reference: LM (Packaged Commodities) Rules, 2011
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowComplaintModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-mono text-white"
                >
                  Close
                </button>
                <button
                  onClick={handleCopyDraft}
                  className="px-4 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-mono font-bold flex items-center gap-1.5 shadow"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Notice Text'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
