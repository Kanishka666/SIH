import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, Crosshair, Eye } from 'lucide-react';
import { BoundingBox } from '../types';
import {
  calculateObjectContainRect,
  normalizedToViewportRect,
  RenderedImageRect
} from '../utils/coordinateTransform';

interface ImageInspectionViewerProps {
  imageSrc: string;
  imageWidth?: number;
  imageHeight?: number;
  selectedBoundingBox: BoundingBox | null;
  selectedFieldLabel?: string;
  isScanning?: boolean;
}

export const ImageInspectionViewer: React.FC<ImageInspectionViewerProps> = ({
  imageSrc,
  imageWidth = 800,
  imageHeight = 600,
  selectedBoundingBox,
  selectedFieldLabel,
  isScanning = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalDims, setNaturalDims] = useState({ width: imageWidth, height: imageHeight });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Track container size using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // When image loads, capture actual natural dimensions
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalDims({
      width: img.naturalWidth || imageWidth,
      height: img.naturalHeight || imageHeight
    });
    setImageLoaded(true);
  };

  // Reset zoom & pan when imageSrc changes
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setImageLoaded(false);
  }, [imageSrc]);

  // Calculate rendered image bounding rectangle inside object-contain container
  const renderedRect: RenderedImageRect = calculateObjectContainRect(
    containerSize.width,
    containerSize.height,
    naturalDims.width,
    naturalDims.height
  );

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

  const updateZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(Math.max(Number(newZoom.toFixed(2)), MIN_ZOOM), MAX_ZOOM);
    setZoom(clamped);
    if (clamped === MIN_ZOOM) {
      setPan({ x: 0, y: 0 });
    }
  }, []);

  // Zoom helpers
  const handleZoomIn = () => updateZoom(zoom + ZOOM_STEP);
  const handleZoomOut = () => updateZoom(zoom - ZOOM_STEP);
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handlePresetZoom = (val: number) => updateZoom(val);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateZoom(parseFloat(e.target.value));
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
      updateZoom(touchStateRef.current.initialZoom * ratio);
    } else if (e.touches.length === 1 && zoom > 1 && !touchStateRef.current.isPinching) {
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

  // Compute active highlight box coordinates
  const highlightBox = selectedBoundingBox
    ? normalizedToViewportRect(selectedBoundingBox, renderedRect, zoom, pan)
    : null;

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] md:min-h-[520px] bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden flex flex-col select-none">
      {/* Top Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-auto text-[11px] font-mono text-white/70">
          <Eye className="w-3.5 h-3.5 text-yellow-400" />
          <span>PDP Inspection Canvas</span>
        </div>

        {/* Zoom Controls & Slider */}
        <div className="flex items-center gap-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 pointer-events-auto">
          <button
            onClick={handleZoomOut}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom Out (-)"
            className="p-1 rounded-full text-white/70 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={handleSliderChange}
            aria-label="Inspection zoom slider"
            className="w-16 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-400 focus:outline-none"
          />

          <span className="text-[11px] font-mono text-yellow-300 font-bold px-1 min-w-[38px] text-right">
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom In (+)"
            className="p-1 rounded-full text-white/70 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          {/* Quick Presets on desktop */}
          <div className="hidden sm:flex items-center gap-1 border-l border-white/10 pl-1.5 ml-0.5">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePresetZoom(p)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  Math.abs(zoom - p) < 0.15
                    ? 'bg-yellow-400 text-black font-bold'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {p}x
              </button>
            ))}
          </div>

          {zoom > 1 && (
            <button
              onClick={handleResetZoom}
              title="Reset Zoom (1:1)"
              className="p-1 rounded-full text-yellow-400 hover:text-yellow-300 hover:bg-white/10 transition-colors ml-0.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Image Stage */}
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
        {/* Subtle grid pattern background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        {/* The Image itself with object-contain */}
        <img
          src={imageSrc}
          alt="Retail Label Inspection"
          onLoad={handleImageLoad}
          className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center'
          }}
        />

        {/* Laser scan animation when processing */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
            <div className="w-full h-1 bg-yellow-400 shadow-[0_0_20px_#fde047] animate-pulse absolute top-0 animate-[scanline_2s_linear_infinite]" />
          </div>
        )}

        {/* Field Bounding Box Highlight - ONLY VISIBLE WHEN USER SELECTS A FIELD */}
        {highlightBox && imageLoaded && (
          <div
            className="absolute pointer-events-none transition-all duration-300 ease-out border-2 border-yellow-400 bg-yellow-400/15 rounded shadow-[0_0_20px_rgba(250,204,21,0.5)] z-10"
            style={{
              left: `${highlightBox.left}px`,
              top: `${highlightBox.top}px`,
              width: `${Math.max(highlightBox.width, 24)}px`,
              height: `${Math.max(highlightBox.height, 16)}px`
            }}
          >
            {/* Label tag above bounding box */}
            {selectedFieldLabel && (
              <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow whitespace-nowrap">
                {selectedFieldLabel}
              </div>
            )}
            {/* Precision corner ticks */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-yellow-300" />
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-yellow-300" />
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-yellow-300" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-yellow-300" />
          </div>
        )}
      </div>

      {/* Bottom Hint Banner */}
      <div className="p-2.5 bg-black/60 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-white/50">
        <span>{zoom > 1 ? 'Drag image to pan' : 'Clean image view • Click any declaration to inspect region'}</span>
        <span>{naturalDims.width} × {naturalDims.height} px</span>
      </div>
    </div>
  );
};
