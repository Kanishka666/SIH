import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UploadCloud,
  Camera,
  FileImage,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Square
} from 'lucide-react';
import {
  NormalizedOCRResult,
  ComplianceResult,
  BoundingBox
} from '../types';
import { SAMPLE_LABELS } from '../data/sampleLabels';
import { runLabelOCR, OCRProgressCallback } from '../services/ocrService';
import { auditLabelCompliance } from '../services/complianceService';
import {
  isWebSpeechSupported,
  isAudioFeedbackEnabled,
  setAudioFeedbackEnabled,
  playScanConfirmationAudio,
  stopSpeech,
  subscribeSpeakingStatus
} from '../services/speechService';
import { ImageInspectionViewer } from './ImageInspectionViewer';
import { StatutoryGrid } from './StatutoryGrid';
import { OCRStatus } from './OCRStatus';
import { ScanActions } from './ScanActions';
import { PreScanImagePreview } from './PreScanImagePreview';
import { validateLabelFile } from '../utils/imageUtils';
import { cleanupImageUrl } from '../services/imageProcessingService';
import { backendApi, BackendApiError, BackendScan } from '../services/backendApi';

interface OCRScannerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onScanComplete?: (result: NormalizedOCRResult) => void;
  initialPresetId?: string;
}

interface PendingImageState {
  source: File | string;
  previewUrl: string;
  fileName: string;
}

export const OCRScannerModal: React.FC<OCRScannerModalProps> = ({
  isOpen = true,
  onClose,
  onScanComplete,
  initialPresetId
}) => {
  // Processing & State
  const [activeStep, setActiveStep] = useState<'UPLOAD' | 'PREVIEW' | 'PROCESSING' | 'INSPECTION'>('UPLOAD');
  const [pendingImage, setPendingImage] = useState<PendingImageState | null>(null);
  const [ocrResult, setOcrResult] = useState<NormalizedOCRResult | null>(null);
  const [compliance, setCompliance] = useState<ComplianceResult | null>(null);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Progress tracking
  const [progressState, setProgressState] = useState<{
    phase: string;
    progress: number;
    message: string;
  }>({
    phase: 'IDLE',
    progress: 0,
    message: ''
  });

  // Camera Mode
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Expandable legal breakdown
  const [showRuleAuditList, setShowRuleAuditList] = useState(false);

  // Web Speech API Confirmation Feedback States
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const [audioFeedbackOn, setAudioFeedbackOn] = useState<boolean>(true);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState<boolean>(false);

  useEffect(() => {
    setSpeechSupported(isWebSpeechSupported());
    setAudioFeedbackOn(isAudioFeedbackEnabled());
    const unsubscribe = subscribeSpeakingStatus(setIsSpeakingAudio);
    return () => {
      unsubscribe();
      stopSpeech();
    };
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Clean up camera stream on close or unmount
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleClose = () => {
    stopCamera();
    stopSpeech();
    if (pendingImage?.previewUrl && pendingImage.previewUrl.startsWith('blob:')) {
      cleanupImageUrl(pendingImage.previewUrl);
    }
    onClose();
  };

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setErrorMessage('Camera access was denied or is unavailable. Please upload an image file instead.');
    }
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCamera();
    setPendingImage({
      source: dataUrl,
      previewUrl: dataUrl,
      fileName: 'live-packaging-capture.jpg'
    });
    setActiveStep('PREVIEW');
  };

  // Run OCR pipeline on an image source
  const executeOCR = async (source: File | string, fileName?: string) => {
    setErrorMessage(null);
    setActiveStep('PROCESSING');
    setProgressState({
      phase: 'PREPROCESSING',
      progress: 10,
      message: 'Analyzing frame...'
    });

    try {
      const uploadFile = source instanceof File
        ? source
        : new File([await (await fetch(source)).blob()], fileName || 'label.jpg', { type: 'image/jpeg' });
      setProgressState({ phase: 'UPLOADING', progress: 25, message: 'Uploading image to FastAPI...' });
      const created = await backendApi.uploadScan(uploadFile);
      setProgressState({ phase: 'OCR_PROCESSING', progress: 60, message: `Backend scan ${created.scan_id} is processing...` });
      const scan = await backendApi.getScan(created.scan_id);
      const result = backendScanToNormalizedResult(scan, uploadFile, fileName || uploadFile.name);
      const audit = backendScanToCompliance(scan);

      setOcrResult(result);
      setCompliance(audit);
      setSelectedFieldKey(null);
      setActiveStep('INSPECTION');

      // Web Speech API: Provide audio confirmation feedback once OCR scan finishes processing
      playScanConfirmationAudio(result, audit);

      if (onScanComplete) {
        onScanComplete(result);
      }
    } catch (err: any) {
      console.error('OCR analysis failed:', err);
      const backendError = err as BackendApiError;
      setErrorMessage(backendError.status ? `${backendError.status}: ${backendError.message}` : (err.message || 'Failed to upload image.'));
      setActiveStep('UPLOAD');
    }
  };

  const backendScanToNormalizedResult = (scan: BackendScan, source: File, fileName: string): NormalizedOCRResult => {
    const extracted = scan.extracted_information || {};
    const value = (key: string) => extracted[key] || null;
    const fields = {
      productBrandName: { key: 'productBrandName', label: 'Product Name', value: value('product_name'), confidence: 1, sourceText: value('product_name'), boundingBox: null, status: value('product_name') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      manufacturer: { key: 'manufacturer', label: 'Manufacturer', value: value('manufacturer'), confidence: 1, sourceText: value('manufacturer'), boundingBox: null, status: value('manufacturer') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      mrp: { key: 'mrp', label: 'MRP', value: value('mrp'), confidence: 1, sourceText: value('mrp'), boundingBox: null, status: value('mrp') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      netQuantity: { key: 'netQuantity', label: 'Net Quantity', value: value('net_quantity'), confidence: 1, sourceText: value('net_quantity'), boundingBox: null, status: value('net_quantity') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      batchNumber: { key: 'batchNumber', label: 'Batch Number', value: value('batch_number'), confidence: 1, sourceText: value('batch_number'), boundingBox: null, status: value('batch_number') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      manufacturingDate: { key: 'manufacturingDate', label: 'Manufacturing Date', value: value('manufacturing_date'), confidence: 1, sourceText: value('manufacturing_date'), boundingBox: null, status: value('manufacturing_date') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      expiryDate: { key: 'expiryDate', label: 'Expiry Date', value: value('expiry_date'), confidence: 1, sourceText: value('expiry_date'), boundingBox: null, status: value('expiry_date') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      consumerCare: { key: 'consumerCare', label: 'Consumer Care', value: value('consumer_care'), confidence: 1, sourceText: value('consumer_care'), boundingBox: null, status: value('consumer_care') ? 'VERIFIED' : 'MISSING', source: 'OCR' },
      countryOfOrigin: { key: 'countryOfOrigin', label: 'Country of Origin', value: value('country_of_origin'), confidence: 1, sourceText: value('country_of_origin'), boundingBox: null, status: value('country_of_origin') ? 'VERIFIED' : 'MISSING', source: 'OCR' }
    } as any;
    return { id: scan.scan_id, fileName, image: { src: URL.createObjectURL(source), width: 1, height: 1, aspectRatio: 1 }, rawText: scan.raw_text || '', ocrLines: [], fields, declarations: [], processing: { status: 'COMPLETE', durationMs: 0, engine: 'FastAPI backend scan endpoint' } };
  };

  const backendScanToCompliance = (scan: BackendScan): ComplianceResult => {
    const checks = scan.rule_results || [];
    const toCheck = (rule: typeof checks[number], status: 'PASS' | 'WARN' | 'FAIL', summary = rule.message) => ({ id: rule.rule, fieldKey: '', ruleName: rule.clause, legalActCitation: rule.rule, status, summary, recommendation: '' });
    const violations = checks.filter((rule) => rule.status === 'VIOLATION').map((rule) => toCheck(rule, 'FAIL'));
    const warnings = checks.filter((rule) => rule.status !== 'PASS' && rule.status !== 'VIOLATION').map((rule) => toCheck(rule, 'WARN', `${rule.status}: ${rule.message}`));
    const passedChecks = checks.filter((rule) => rule.status === 'PASS').map((rule) => toCheck(rule, 'PASS'));
    return {
    score: scan.compliance_score ?? 0,
    status: scan.overall_status === 'COMPLIANT' ? 'APPEARS COMPLIANT' : scan.overall_status === 'NON_COMPLIANT' ? 'POTENTIALLY NON-COMPLIANT' : 'REQUIRES REVIEW',
    passedChecks,
    warnings,
    violations,
    legalDisclaimer: 'Compliance data shown here is returned by the FastAPI backend. The current backend identifies its rules/results as mock/demo data.',
    totalChecks: checks.length
    };
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validation = validateLabelFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid file format.');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setPendingImage({
        source: file,
        previewUrl,
        fileName: file.name
      });
      setActiveStep('PREVIEW');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateLabelFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid file format.');
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setPendingImage({
        source: file,
        previewUrl,
        fileName: file.name
      });
      setActiveStep('PREVIEW');
    }
  };

  // Load sample label preset
  const handleSelectSample = useCallback((sampleId: string) => {
    const sample = SAMPLE_LABELS.find((s) => s.id === sampleId);
    if (sample) {
      setPendingImage({
        source: sample.image,
        previewUrl: sample.image,
        fileName: `${sample.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      });
      setActiveStep('PREVIEW');
    }
  }, []);

  const handleStartScanFromPreview = () => {
    if (!pendingImage) return;
    executeOCR(pendingImage.source, pendingImage.fileName);
  };

  const handleCancelPreview = () => {
    if (pendingImage?.previewUrl && pendingImage.previewUrl.startsWith('blob:')) {
      cleanupImageUrl(pendingImage.previewUrl);
    }
    setPendingImage(null);
    setActiveStep('UPLOAD');
  };

  // Trigger initial preset if provided
  useEffect(() => {
    if (initialPresetId) {
      handleSelectSample(initialPresetId);
    }
  }, [initialPresetId, handleSelectSample]);

  // Field update handler (manual verification / correction)
  const handleUpdateField = (fieldKey: string, newValue: string) => {
    if (!ocrResult) return;

    const updatedFields = {
      ...ocrResult.fields,
      [fieldKey]: {
        ...ocrResult.fields[fieldKey],
        value: newValue,
        status: 'MANUALLY_VERIFIED' as const,
        source: 'USER' as const
      }
    };

    const updatedResult: NormalizedOCRResult = {
      ...ocrResult,
      fields: updatedFields as any
    };

    const updatedCompliance = auditLabelCompliance(updatedResult);
    setOcrResult(updatedResult);
    setCompliance(updatedCompliance);
  };

  const handleResetScan = () => {
    stopSpeech();
    if (ocrResult?.image.src) {
      cleanupImageUrl(ocrResult.image.src);
    }
    if (pendingImage?.previewUrl && pendingImage.previewUrl.startsWith('blob:')) {
      cleanupImageUrl(pendingImage.previewUrl);
    }
    setPendingImage(null);
    setOcrResult(null);
    setCompliance(null);
    setSelectedFieldKey(null);
    setActiveStep('UPLOAD');
  };

  const toggleAudioFeedback = () => {
    const nextState = !audioFeedbackOn;
    setAudioFeedbackOn(nextState);
    setAudioFeedbackEnabled(nextState);
    if (!nextState) {
      stopSpeech();
    }
  };

  const handleReplayAudio = () => {
    if (isSpeakingAudio) {
      stopSpeech();
    } else if (ocrResult && compliance) {
      playScanConfirmationAudio(ocrResult, compliance, { forcePlay: true });
    }
  };

  if (!isOpen) return null;

  // Selected bounding box for ImageInspectionViewer
  const selectedFieldObj = selectedFieldKey && ocrResult ? ocrResult.fields[selectedFieldKey] : null;
  const selectedBoundingBox: BoundingBox | null = selectedFieldObj?.boundingBox || null;

  return (
    <AnimatePresence>
      <div
        id="ocr-modal-backdrop"
        onClick={(e) => {
          if ((e.target as HTMLElement).id === 'ocr-modal-backdrop') handleClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-7xl max-h-[94vh] bg-[#0f0f0f] border border-white/15 rounded-3xl text-white shadow-2xl flex flex-col overflow-hidden my-auto"
        >
          {/* Header Bar */}
          <div className="px-5 sm:px-7 py-4 border-b border-white/10 flex items-center justify-between gap-4 bg-[#141414] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-sans font-semibold text-white tracking-tight">
                    Legal Metrology Packaging Inspection
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                    PCR 2011 & 2021
                  </span>
                </div>
                <p className="text-[11px] font-mono text-white/50">
                  Automated statutory declaration screening, unit parsing, and compliance scoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleAudioFeedback}
                  title={
                    audioFeedbackOn
                      ? 'Voice audio confirmation: Enabled (Click to mute)'
                      : 'Voice audio confirmation: Muted (Click to enable)'
                  }
                  className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                    audioFeedbackOn
                      ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/20 shadow-[0_0_8px_rgba(250,204,21,0.15)]'
                      : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10'
                  }`}
                >
                  {audioFeedbackOn ? (
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeakingAudio ? 'text-yellow-300 animate-pulse' : ''}`} />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {audioFeedbackOn ? 'Voice Audio: On' : 'Voice Audio: Muted'}
                  </span>
                </button>
              )}

              <button
                onClick={handleClose}
                aria-label="Close dialog"
                className="p-2 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content Area */}
          <div className="flex-1 p-4 sm:p-6 md:p-7 overflow-y-auto">
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-white/60 hover:text-white ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* VIEW 1: UPLOAD & CAMERA CAPTURE */}
            {activeStep === 'UPLOAD' && (
              <div className="max-w-4xl mx-auto space-y-6">
                {!cameraActive ? (
                  <>
                    {/* Drag & Drop Main Card */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative rounded-3xl p-8 sm:p-12 border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer ${
                        isDragOver
                          ? 'border-yellow-400 bg-yellow-400/[0.06] shadow-[0_0_30px_rgba(250,204,21,0.2)]'
                          : 'border-white/20 hover:border-yellow-400/60 bg-[#141414] hover:bg-[#171717]'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/bmp,application/pdf"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />

                      <div className="w-16 h-16 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-4 text-yellow-400">
                        <UploadCloud className="w-8 h-8" />
                      </div>

                      <h3 className="text-lg sm:text-xl font-sans font-semibold text-white mb-1.5">
                        Drop packaging label image here
                      </h3>
                      <p className="text-xs sm:text-sm font-mono text-white/60 max-w-md mb-6">
                        Supports high-resolution PNG, JPG, JPEG, WEBP, or PDF scans of FMCG & retail packaging.
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-mono font-bold tracking-tight shadow-md transition-colors"
                        >
                          Browse Device Files
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startCamera();
                          }}
                          className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-medium flex items-center gap-2 border border-white/10 transition-colors"
                        >
                          <Camera className="w-4 h-4 text-yellow-400" />
                          <span>Use Live Camera</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Test Samples */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono uppercase tracking-wider text-white/50">
                          Or test with verified sample packaging labels:
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {SAMPLE_LABELS.map((sample) => (
                          <div
                            key={sample.id}
                            onClick={() => handleSelectSample(sample.id)}
                            className="p-3.5 rounded-2xl bg-[#141414] hover:bg-[#1c1c1c] border border-white/10 hover:border-yellow-400/50 transition-all cursor-pointer group flex flex-col justify-between"
                          >
                            <div className="aspect-[4/3] w-full rounded-xl overflow-hidden mb-2.5 bg-black/40 relative">
                              <img
                                src={sample.image}
                                alt={sample.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <span
                                className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  sample.overallStatus === 'PASS'
                                    ? 'bg-emerald-500/90 text-white'
                                    : sample.overallStatus === 'WARN'
                                    ? 'bg-yellow-500/90 text-black'
                                    : 'bg-rose-500/90 text-white'
                                }`}
                              >
                                {sample.complianceScore}/100
                              </span>
                            </div>

                            <div>
                              <div className="text-[11px] font-mono text-yellow-400/80 mb-0.5">
                                {sample.category}
                              </div>
                              <div className="text-xs font-sans font-semibold text-white truncate">
                                {sample.name}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Live Camera View */
                  <div className="space-y-4">
                    <div className="relative rounded-3xl overflow-hidden bg-black border border-white/20 aspect-video max-h-[500px] flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />

                      {/* Alignment guide box */}
                      <div className="absolute inset-8 sm:inset-16 border-2 border-dashed border-yellow-400/70 rounded-2xl pointer-events-none flex items-center justify-center">
                        <span className="bg-black/70 px-3 py-1 rounded-full text-xs font-mono text-yellow-300">
                          Align Principal Display Panel inside frame
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={stopCamera}
                        className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={captureCameraFrame}
                        className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-mono font-bold flex items-center gap-2 shadow-lg transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Capture & Inspect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: PRE-SCAN IMAGE PREVIEW WITH PINCH & SLIDER ZOOM */}
            {activeStep === 'PREVIEW' && pendingImage && (
              <div className="max-w-5xl mx-auto">
                <PreScanImagePreview
                  imageSrc={pendingImage.previewUrl}
                  fileName={pendingImage.fileName}
                  onProceedToScan={handleStartScanFromPreview}
                  onCancel={handleCancelPreview}
                />
              </div>
            )}

            {/* VIEW 3: PROCESSING STATE */}
            {activeStep === 'PROCESSING' && (
              <div className="max-w-xl mx-auto py-12 space-y-6 text-center">
                <OCRStatus
                  phase={progressState.phase}
                  progress={progressState.progress}
                  message={progressState.message}
                  isProcessing={true}
                />
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-white/50">
                  {audioFeedbackOn && speechSupported ? (
                    <span className="flex items-center gap-1.5 text-yellow-400/80">
                      <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                      <span>Audio confirmation feedback will speak via Web Speech API upon completion</span>
                    </span>
                  ) : (
                    <span>Executing Legal Metrology PCR (2011) rule matrix & unit validation...</span>
                  )}
                </div>
              </div>
            )}

            {/* VIEW 3: ENTERPRISE SPLIT-PANE INSPECTION WORKFLOW */}
            {activeStep === 'INSPECTION' && ocrResult && compliance && (
              <div className="space-y-5">
                {/* Top Compliance Overview Banner */}
                <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-sans font-bold text-white">
                        {ocrResult.fields.productBrandName.value || 'Inspected Commodity'}
                      </h3>
                      <span className="text-xs font-mono text-white/40">
                        ({ocrResult.fileName})
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-white/60 flex-wrap">
                      <span>Checks Evaluated: {compliance.totalChecks}</span>
                      <span className="text-emerald-400 font-medium">Passed: {compliance.passedChecks.length}</span>
                      <span className="text-yellow-400 font-medium">Warnings: {compliance.warnings.length}</span>
                      <span className="text-rose-400 font-medium">Violations: {compliance.violations.length}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={handleReplayAudio}
                        className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center gap-2 border transition-all ${
                          isSpeakingAudio
                            ? 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40 shadow-[0_0_15px_rgba(250,204,21,0.25)]'
                            : 'bg-white/5 hover:bg-white/10 text-white/90 hover:text-white border-white/10 hover:border-yellow-400/30'
                        }`}
                        title={
                          isSpeakingAudio
                            ? 'Speech synthesis is currently speaking. Click to stop audio.'
                            : 'Replay spoken audio confirmation feedback via Web Speech API'
                        }
                      >
                        {isSpeakingAudio ? (
                          <>
                            <Square className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                            <span>Stop Audio Feedback</span>
                            <span className="flex items-center gap-0.5 ml-1">
                              <span className="w-1 h-3 bg-yellow-400 rounded-full animate-pulse" />
                              <span className="w-1 h-4 bg-yellow-300 rounded-full animate-pulse delay-75" />
                              <span className="w-1 h-2 bg-yellow-400 rounded-full animate-pulse delay-150" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Audio Confirmation</span>
                          </>
                        )}
                      </button>
                    )}

                    <div className="text-right">
                      <div className="text-[10px] font-mono text-white/40 uppercase">Compliance Grade</div>
                      <div
                        className={`text-2xl font-mono font-bold ${
                          compliance.score >= 85
                            ? 'text-emerald-400'
                            : compliance.score >= 70
                            ? 'text-yellow-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {compliance.score}/100
                      </div>
                    </div>

                    <div
                      className={`px-3 py-2 rounded-xl text-xs font-mono font-bold uppercase border ${
                        compliance.status === 'APPEARS COMPLIANT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : compliance.status === 'REQUIRES REVIEW'
                          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {compliance.status}
                    </div>
                  </div>
                </div>

                {/* SPLIT-PANE CONTAINER */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* Left Column (50% on large): Image Inspection Viewer */}
                  <div className="lg:col-span-6 h-full space-y-3">
                    <ImageInspectionViewer
                      imageSrc={ocrResult.image.src}
                      imageWidth={ocrResult.image.width}
                      imageHeight={ocrResult.image.height}
                      selectedBoundingBox={selectedBoundingBox}
                      selectedFieldLabel={selectedFieldObj?.label}
                    />

                    <div className="p-3 bg-[#141414] border border-white/5 rounded-xl text-[11px] font-mono text-white/50 flex items-center justify-between">
                      <span>OCR Engine: {ocrResult.processing.engine || 'Neural OCR v5'}</span>
                      <span>Processing Time: {ocrResult.processing.durationMs} ms</span>
                    </div>
                  </div>

                  {/* Right Column (50% on large): Statutory Grid & Compliance Audit */}
                  <div className="lg:col-span-6 space-y-4">
                    {/* Declarations Grid */}
                    <div className="bg-[#0e0e0e] border border-white/10 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono uppercase tracking-wider text-white/60 font-semibold">
                          Mandatory Statutory Declarations
                        </span>
                        <span className="text-[11px] font-mono text-white/40">
                          Click field to highlight on label • Click edit to correct
                        </span>
                      </div>

                      <StatutoryGrid
                        fields={ocrResult.fields}
                        selectedFieldKey={selectedFieldKey}
                        onSelectField={setSelectedFieldKey}
                        onUpdateField={handleUpdateField}
                      />
                    </div>

                    {/* Expandable Legal Rule Matrix Breakdown */}
                    <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 space-y-2">
                      <button
                        onClick={() => setShowRuleAuditList(!showRuleAuditList)}
                        className="w-full flex items-center justify-between text-xs font-mono text-white/80 hover:text-white"
                      >
                        <span className="flex items-center gap-2 font-semibold">
                          <Layers className="w-3.5 h-3.5 text-yellow-400" />
                          <span>Legal Metrology Audit Findings ({compliance.totalChecks} Rules)</span>
                        </span>
                        {showRuleAuditList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {showRuleAuditList && (
                        <div className="pt-2 space-y-2 max-h-60 overflow-y-auto font-mono text-xs">
                          {compliance.violations.map((v) => (
                            <div
                              key={v.id}
                              className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold">{v.ruleName}</span>
                                <span className="text-rose-400 uppercase font-bold">VIOLATION</span>
                              </div>
                              <p className="text-[11px] text-white/80">{v.summary}</p>
                              {v.recommendation && (
                                <p className="text-[10px] text-rose-300/80">Rec: {v.recommendation}</p>
                              )}
                            </div>
                          ))}

                          {compliance.warnings.map((w) => (
                            <div
                              key={w.id}
                              className="p-2.5 rounded-lg bg-yellow-950/30 border border-yellow-500/30 text-yellow-300 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold">{w.ruleName}</span>
                                <span className="text-yellow-400 uppercase font-bold">WARNING</span>
                              </div>
                              <p className="text-[11px] text-white/80">{w.summary}</p>
                            </div>
                          ))}

                          {compliance.passedChecks.map((p) => (
                            <div
                              key={p.id}
                              className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 flex items-center justify-between text-[11px]"
                            >
                              <span>{p.summary}</span>
                              <span className="text-emerald-400 font-bold uppercase text-[10px]">PASS</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions and Export toolbar */}
                    <div className="pt-2">
                      <ScanActions
                        ocrResult={ocrResult}
                        compliance={compliance}
                        onResetScan={handleResetScan}
                        isAudioSpeaking={isSpeakingAudio}
                        onReplayAudio={speechSupported ? handleReplayAudio : undefined}
                      />
                    </div>
                  </div>
                </div>

                {/* Statutory Legal Disclaimer */}
                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] font-mono text-white/40 text-center">
                  {compliance.legalDisclaimer}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

