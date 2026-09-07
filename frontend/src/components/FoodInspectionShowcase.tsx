import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  Monitor,
  ScanLine,
  Camera,
  Loader2
} from 'lucide-react';

type DetectedField = {
  label: string;
  value: string;
  status: 'VERIFIED' | 'WARNING';
  boxTop: string;
  boxHeight: string;
};

const DETECTED_FIELDS: DetectedField[] = [
  { label: 'MRP', value: '₹149.00 (Incl. of all taxes)', status: 'VERIFIED', boxTop: '30%', boxHeight: '9%' },
  { label: 'NET QUANTITY', value: '250 g', status: 'VERIFIED', boxTop: '44%', boxHeight: '8%' },
  { label: 'MFG / EXP', value: '03/2026 — 09/2026', status: 'WARNING', boxTop: '57%', boxHeight: '8%' },
  { label: 'FSSAI LICENSE', value: '10023xxxxxxxxx', status: 'VERIFIED', boxTop: '69%', boxHeight: '7%' }
];

export const FoodInspectionShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile'>('desktop');

  return (
    <div className="w-full my-12 p-6 sm:p-8 rounded-3xl bg-[#141414] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header & Mode Selector */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-[10px] font-mono mb-2">
              <ScanLine className="w-3.5 h-3.5 text-yellow-400" />
              <span className="tracking-widest uppercase font-bold">Visual Inspection Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Label Detection & Field Extraction
            </h2>
            <p className="text-xs sm:text-sm text-white/60 font-mono mt-1 max-w-xl">
              Bounding-box OCR extraction and rule-based validation, available from the desktop inspector console or the mobile capture app.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('desktop')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'desktop'
                  ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop Inspector</span>
            </button>
            <button
              onClick={() => setActiveTab('mobile')}
              className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'mobile'
                  ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Capture</span>
            </button>
          </div>
        </div>

        {/* Visual Showcase Content */}
        {activeTab === 'desktop' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-black/40 p-6 sm:p-8 rounded-2xl border border-white/10">
            {/* Left: Label preview with bounding-box overlays */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-[minmax(0,220px)_1fr] gap-6 items-center bg-zinc-950/80 rounded-2xl border border-white/10 p-6 min-h-[340px] relative overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />

              {/* Label mock with scan overlay */}
              <div className="relative z-10 mx-auto">
                <div className="relative w-48 aspect-[3/4] bg-white rounded-md shadow-[0_15px_40px_rgba(0,0,0,0.6)] p-3.5 flex flex-col gap-2.5 overflow-hidden">
                  <div className="h-3 w-4/5 bg-zinc-900 rounded-sm" />
                  <div className="h-2 w-2/3 bg-zinc-400 rounded-sm mb-1" />

                  {DETECTED_FIELDS.map((field) => (
                    <div key={field.label}>
                      <div className="h-2.5 w-3/4 bg-zinc-800 rounded-sm mb-1" />
                      <div className="h-2 w-1/2 bg-zinc-300 rounded-sm" />
                    </div>
                  ))}

                  {/* Corner reticle */}
                  {['top-1 left-1 border-t-2 border-l-2', 'top-1 right-1 border-t-2 border-r-2', 'bottom-1 left-1 border-b-2 border-l-2', 'bottom-1 right-1 border-b-2 border-r-2'].map((pos) => (
                    <div key={pos} className={`absolute w-3 h-3 border-yellow-400/70 ${pos}`} />
                  ))}

                  {/* Bounding boxes over detected fields */}
                  {DETECTED_FIELDS.map((field) => (
                    <div
                      key={field.label}
                      className="absolute left-[8%] w-[84%]"
                      style={{ top: field.boxTop, height: field.boxHeight }}
                    >
                      <div
                        className={`w-full h-full rounded-[3px] border ${
                          field.status === 'VERIFIED' ? 'border-emerald-500' : 'border-amber-400'
                        }`}
                      />
                    </div>
                  ))}

                  {/* Scan sweep */}
                  <motion.div
                    className="absolute left-0 right-0 h-6 bg-gradient-to-b from-yellow-400/0 via-yellow-400/25 to-yellow-400/0 pointer-events-none"
                    animate={{ top: ['4%', '92%', '4%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>

              {/* Extracted fields list */}
              <div className="relative z-10 flex flex-col gap-2 w-full">
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">
                  Live Extraction
                </div>
                {DETECTED_FIELDS.map((field, i) => (
                  <motion.div
                    key={field.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.4 }}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white/[0.04] border border-white/10"
                  >
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">
                        {field.label}
                      </div>
                      <div className="text-xs font-mono text-white truncate">{field.value}</div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        field.status === 'VERIFIED'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      }`}
                    >
                      {field.status === 'VERIFIED' ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <AlertTriangle className="w-2.5 h-2.5" />
                      )}
                      {field.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Inspection Metrics & Controls */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-yellow-400" />
                <span>Automated Regulatory Inspection</span>
              </h3>
              <p className="text-xs text-white/70 font-mono leading-relaxed">
                The inspection engine combines neural OCR extraction with a Legal Metrology rule matrix, flagging every statutory field that falls outside tolerance.
              </p>

              <div className="flex flex-col gap-2.5 mt-2">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-white">Net Quantity & Tolerance Audit</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    COMPLIANT
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono text-white">MRP & Tax Declaration Check</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                    VERIFIED
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-mono text-white">Unit Sale Price (USP) Decimal Precision</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                    WARNING
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-black/40 p-6 sm:p-8 rounded-2xl border border-white/10">
            {/* Left: Mobile capture app UI */}
            <div className="lg:col-span-6 flex items-center justify-center p-6 bg-zinc-950/80 rounded-2xl border border-white/10">
              <div className="relative w-64 h-[460px] bg-zinc-900 rounded-[36px] border-4 border-zinc-700 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col">
                {/* Phone Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-950 rounded-b-xl z-20" />

                {/* Camera preview */}
                <div className="relative flex-1 bg-gradient-to-b from-zinc-800 to-black p-4 pt-8 flex flex-col justify-between overflow-hidden">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[10px] text-white/70 font-mono px-2">
                    <span>9:41</span>
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Analyzing
                    </span>
                  </div>

                  {/* App Header */}
                  <div className="text-center my-2">
                    <span className="text-[10px] font-mono font-bold text-white/80 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10">
                      LabelLens Capture
                    </span>
                  </div>

                  {/* Viewfinder */}
                  <div className="relative flex-1 flex items-center justify-center">
                    <div className="relative w-40 h-52 rounded-xl border border-white/15">
                      {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((pos) => (
                        <div key={pos} className={`absolute w-5 h-5 rounded-sm border-yellow-400 ${pos}`} />
                      ))}

                      <motion.div
                        className="absolute left-1 right-1 h-8 bg-gradient-to-b from-yellow-400/0 via-yellow-400/30 to-yellow-400/0"
                        animate={{ top: ['4%', '90%', '4%'] }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                      />

                      <AnimatePresence>
                        <motion.div
                          key="tag"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.4 }}
                          className="absolute -right-3 top-6 translate-x-full bg-emerald-500/90 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md"
                        >
                          MRP ✓
                        </motion.div>
                      </AnimatePresence>
                      <AnimatePresence>
                        <motion.div
                          key="tag2"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 1.1, duration: 0.4 }}
                          className="absolute -right-3 top-20 translate-x-full bg-emerald-500/90 text-black text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md"
                        >
                          NET QTY ✓
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="text-center mb-1">
                    <div className="text-[9px] font-mono text-white/50">Hold steady — 4 fields detected</div>
                  </div>

                  {/* Shutter control */}
                  <div className="flex items-center justify-center pb-1">
                    <div className="w-12 h-12 rounded-full border-2 border-white/70 flex items-center justify-center">
                      <Camera className="w-4 h-4 text-white/80" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Mobile App Description */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[10px] font-mono">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="tracking-widest uppercase font-bold">Mobile Camera OCR Pipeline</span>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Instant On-Device & Cloud Package Inspection
              </h3>
              <p className="text-xs sm:text-sm text-white/70 font-mono leading-relaxed">
                Field inspectors and quality control officers scan retail packages in real time using a smartphone camera. The app segments statutory labels, evaluates Legal Metrology rules, and issues an instant compliance certificate.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-2 font-mono">
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-1">
                  <span className="text-yellow-400 font-bold text-sm">99.4%</span>
                  <span className="text-[10px] text-white/60">OCR Extraction Accuracy</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-1">
                  <span className="text-emerald-400 font-bold text-sm">&lt; 1.2s</span>
                  <span className="text-[10px] text-white/60">Audit Report Generation</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
