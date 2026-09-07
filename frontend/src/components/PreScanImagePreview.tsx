import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Scan,
  ArrowLeft,
  Eye,
  Sliders,
  Sparkles,
  Move,
  Info,
  CheckCircle2
} from 'lucide-react';

interface PreScanImagePreviewProps {
  imageSrc: string;
  fileName: string;
  onProceedToScan: () => void;
  onCancel: () => void;
}

export const PreScanImagePreview: React.FC<PreScanImagePreviewProps> = ({
  imageSrc,
  fileName,
  onProceedToScan,
  onCancel
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [naturalDims, setNaturalDims] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showGridReticle, setShowGridReticle] = useState<boolean>(true);

  // Multi-touch pinch-to-zoom tracking refs
  const touchStateRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    touchStartPos: { x: number; y: number };
    isPinching: boolean;
  }>({
    initialDist: 0,
    initialZoom: 1,
    initialPan: { x: 0, y: 0 },
    touchStartPos: { x: 0, y: 0 },
    isPinching: false
  });

  const MIN_ZOOM = 1.0;
  const MAX_ZOOM = 4.5;
  const ZOOM_STEP = 0.25;

  // Measure natural dimensions upon load
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDims({
      width: img.naturalWidth || 800,
      height: img.naturalHeight || 600
    });
  };

  // Reset zoom & pan when image source changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [imageSrc]);

  // Handle zoom adjustment with clamping
  const updateZoom = useCallback((newZoom: number, focalPoint?: { x: number; y: number }) => {
    const clamped = Math.min(Math.max(Number(newZoom.toFixed(2)), MIN_ZOOM), MAX_ZOOM);
    setZoom(clamped);
    if (clamped === MIN_ZOOM) {
      setPan({ x: 0, y: 0 });
    }
  }, []);

  const handleZoomIn = () => updateZoom(zoom + ZOOM_STEP);
  const handleZoomOut = () => updateZoom(zoom - ZOOM_STEP);
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Slider change handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    updateZoom(val);
  };

  // Preset buttons (1x, 2x, 3x, 4x)
  const handlePresetZoom = (targetZoom: number) => {
    updateZoom(targetZoom);
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel / Trackpad pinch zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
    updateZoom(zoom + zoomDelta);
  };

  // Touch handlers for pinch-to-zoom and touch panning
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers = Pinch-to-zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

      touchStateRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        initialPan: { ...pan },
        touchStartPos: {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2
        },
        isPinching: true
      };
    } else if (e.touches.length === 1 && zoom > 1) {
      // 1 finger = Pan when zoomed
      const touch = e.touches[0];
      touchStateRef.current.isPinching = false;
      touchStateRef.current.touchStartPos = { x: touch.clientX, y: touch.clientY };
      touchStateRef.current.initialPan = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = currentDist / (touchStateRef.current.initialDist || 1);
      const targetZoom = touchStateRef.current.initialZoom * ratio;
      updateZoom(targetZoom);
    } else if (e.touches.length === 1 && zoom > 1 && !touchStateRef.current.isPinching) {
      // 1 finger touch drag
      const touch = e.touches[0];
      const dx = touch.clientX - touchStateRef.current.touchStartPos.x;
      const dy = touch.clientY - touchStateRef.current.touchStartPos.y;
      setPan({
        x: touchStateRef.current.initialPan.x + dx,
        y: touchStateRef.current.initialPan.y + dy
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStateRef.current.isPinching = false;
    }
    if (e.touches.length === 0 && zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Top Pre-Scan Status & Info Header */}
      <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center text-yellow-400 shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-sans font-semibold text-white">
                Pre-Scan Label Inspection & Quality Check
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-yellow-400/15 text-yellow-300 border border-yellow-400/30">
                Pinch & Slider Zoom Active
              </span>
            </div>
            <p className="text-xs font-mono text-white/50">
              Inspect small statutory declarations (MRP, Net Qty, Dates, Address) for sharpness before running OCR.
            </p>
          </div>
        </div>

        {/* Quick Quality Note */}
        <div className="flex items-center gap-2 text-xs font-mono text-white/60 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
          <Info className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span>{naturalDims.width > 0 ? `${naturalDims.width} × ${naturalDims.height} px` : 'High-Res Preview'}</span>
          <span className="text-white/20">•</span>
          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={fileName}>
            {fileName}
          </span>
        </div>
      </div>

      {/* Main Interactive Inspection Canvas */}
      <div className="relative w-full h-[380px] sm:h-[460px] md:h-[500px] bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden flex flex-col select-none shadow-2xl">
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* Reticle / Crosshair Overlay (Toggleable) */}
        {showGridReticle && (
          <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/15" />
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/15" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-yellow-400/30 rounded-full" />
          </div>
        )}

        {/* Top Floating Info Bar on Canvas */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-auto text-[11px] font-mono text-white/80">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Magnification: <span className="text-yellow-300 font-bold">{Math.round(zoom * 100)}%</span></span>
            <span className="text-white/30">•</span>
            <span>{zoom > 1 ? 'Panned detail view' : '1.0x baseline'}</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowGridReticle(!showGridReticle)}
              title={showGridReticle ? 'Hide inspection reticle' : 'Show inspection reticle'}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono border backdrop-blur-md transition-all ${
                showGridReticle
                  ? 'bg-yellow-400/15 border-yellow-400/30 text-yellow-300'
                  : 'bg-black/80 border-white/10 text-white/50 hover:text-white'
              }`}
            >
              Reticle {showGridReticle ? 'On' : 'Off'}
            </button>
          </div>
        </div>

        {/* The Zoomable & Pannable Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none ${
            zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
        >
          <img
            src={imageSrc}
            alt="Packaging label preview"
            onLoad={handleImageLoad}
            className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          />

          {/* Pinch Guide Badge for touch users if at 1x */}
          {zoom === 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-[11px] font-mono text-white/70 pointer-events-none flex items-center gap-2 shadow-lg">
              <Sliders className="w-3.5 h-3.5 text-yellow-400" />
              <span>Use slider below or pinch on touch screen to inspect fine text</span>
            </div>
          )}

          {/* Pan Navigation Hint when zoomed */}
          {zoom > 1 && (
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[11px] font-mono text-white/60 pointer-events-none flex items-center gap-1.5">
              <Move className="w-3 h-3 text-yellow-400" />
              <span>Drag / swipe to pan across packaging details</span>
            </div>
          )}
        </div>

        {/* Integrated Floating Zoom Control Toolbar */}
        <div className="p-3 bg-[#121212]/95 backdrop-blur-md border-t border-white/10 flex flex-wrap items-center justify-between gap-3 z-20">
          {/* Zoom In/Out & Slider Control */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              title="Zoom out"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/80 hover:text-white transition-colors border border-white/5"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Continuous Smooth Range Slider */}
            <div className="flex-1 flex items-center gap-2 max-w-[220px] sm:max-w-[280px]">
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                onChange={handleSliderChange}
                aria-label="Image zoom level"
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none"
              />
              <span className="text-xs font-mono font-bold text-yellow-300 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              title="Zoom in"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/80 hover:text-white transition-colors border border-white/5"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {zoom > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset zoom to 1:1"
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-yellow-400 text-xs font-mono flex items-center gap-1 border border-white/5 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>1:1</span>
              </button>
            )}
          </div>

          {/* Quick Preset Buttons (1x, 2x, 3x, 4x) */}
          <div className="flex items-center gap-1.5 bg-black/50 p-1 rounded-xl border border-white/5">
            {[1, 2, 3, 4].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetZoom(preset)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                  Math.abs(zoom - preset) < 0.15
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {preset}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-Processing Checklist & Primary Actions */}
      <div className="bg-[#141414] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs font-mono text-white/60">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Small text verified legible? Proceed with OCR Legal Metrology rule audit.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-mono border border-white/10 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Choose Different Image</span>
          </button>

          <button
            type="button"
            onClick={onProceedToScan}
            className="px-5 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black text-xs font-mono font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(250,204,21,0.25)] transition-all"
          >
            <Scan className="w-4 h-4" />
            <span>Start Legal Metrology OCR Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
