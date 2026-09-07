import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { createTopDockController, type TopDockOptions } from './topDockController';
import { UserProfile, AuthMode } from '../types';
import { ChevronDown, Radio, Sparkles, LogOut, Palette, LayoutDashboard } from 'lucide-react';
import './AnimatedTopDock.css';

export const ANIMATED_TOP_DOCK_VARIANTS = ['modern', 'sable', 'retro', 'glass'] as const;
export type AnimatedTopDockVariant = (typeof ANIMATED_TOP_DOCK_VARIANTS)[number];

export type AnimatedTopDockProps = {
  variant?: AnimatedTopDockVariant;
  proximity?: number;
  spring?: number;
  damping?: number;
  widthGrowth?: number;
  heightGrowth?: number;
  drop?: number;
  /* retro field */
  pixelSize?: number;
  speed?: number;
  noise?: number;
  levels?: number;
  scanlines?: number;
  /* glass field */
  particles?: number;
  thickness?: number;
  dispersion?: number;
  specular?: number;
  rim?: number;
  drift?: number;
  className?: string;

  /* App integration props */
  user?: UserProfile | null;
  onOpenModal?: (id: number) => void;
  onScrollToSection?: (id: number) => void;
  onOpenAuth?: (mode: AuthMode) => void;
  onOpenDashboard?: () => void;
  onLogout?: () => void;
  onVariantChange?: (variant: AnimatedTopDockVariant) => void;
};

export const ANIMATED_TOP_DOCK_DEFAULTS = {
  variant: 'modern' as AnimatedTopDockVariant,
  proximity: 122,
  spring: 0.19,
  damping: 0.7,
  widthGrowth: 17,
  heightGrowth: 16,
  drop: 3.5,
  pixelSize: 4,
  speed: 1,
  noise: 1,
  levels: 7,
  scanlines: 0.32,
  particles: 22,
  thickness: 0.115,
  dispersion: 0.05,
  specular: 0.85,
  rim: 0.5,
  drift: 1,
} as const;

type DockItem = {
  id: string;
  label: string;
  icon: ReactNode;
  action?: () => void;
};

const BRAND_MARK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <rect width="24" height="24" rx="4.5" fill="#ffd245" />
    <path d="M6 6h8.6L18 9.35v8.15H9.15L6 14.35V6Z" fill="#111" />
    <path d="M9 9h5.15L15 9.85V15H9.85L9 14.15V9Z" fill="#ffd245" />
    <path d="M12 9v6M9 12h6" stroke="#111" strokeWidth=".7" />
  </svg>
);

function useDockController(getOptions: () => TopDockOptions) {
  const rootRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    return createTopDockController(root, getOptions);
  }, []);
  return rootRef;
}

type ShaderField = {
  resize: (width: number, height: number) => void;
  render: (now: number) => void;
  setPointer?: (x: number, y: number) => void;
  dispose: () => void;
};

function useShaderField(
  active: boolean,
  load: () => Promise<(canvas: HTMLCanvasElement) => ShaderField>
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [factory, setFactory] = useState<{
    create: (canvas: HTMLCanvasElement) => ShaderField;
  } | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    load().then((create) => {
      if (!cancelled) setFactory({ create });
    });
    return () => {
      cancelled = true;
    };
  }, [active]);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!active || !factory || !host || !canvas) return undefined;
    const field = factory.create(canvas);
    let frame = 0;
    let visible = true;
    let bounds = host.getBoundingClientRect();

    const resize = () => {
      bounds = host.getBoundingClientRect();
      field.resize(bounds.width, bounds.height);
    };

    const tick = (now: number) => {
      field.resize(bounds.width, bounds.height);
      field.render(now);
      frame = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      field.setPointer?.(
        ((event.clientX - bounds.left) / Math.max(1, bounds.width)) * 2 - 1,
        -(((event.clientY - bounds.top) / Math.max(1, bounds.height)) * 2 - 1)
      );
    };

    const resizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible && !frame) frame = requestAnimationFrame(tick);
      if (!visible && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });

    resizeObserver.observe(host);
    intersection.observe(host);
    host.addEventListener('pointermove', onPointerMove, { passive: true });
    resize();
    frame = requestAnimationFrame(tick);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersection.disconnect();
      host.removeEventListener('pointermove', onPointerMove);
      field.dispose();
    };
  }, [active, factory]);

  return { hostRef, canvasRef };
}

export const AnimatedTopDock: React.FC<AnimatedTopDockProps> = ({
  className = '',
  user,
  onOpenModal,
  onScrollToSection,
  onOpenAuth,
  onOpenDashboard,
  onLogout,
  onVariantChange,
  ...props
}) => {
  const optionsRef = useRef({ ...ANIMATED_TOP_DOCK_DEFAULTS, ...props });
  optionsRef.current = { ...ANIMATED_TOP_DOCK_DEFAULTS, ...props };
  const variant = optionsRef.current.variant;

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showVariantMenu, setShowVariantMenu] = useState(false);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowUserMenu(false);
        setShowVariantMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // App-integrated Action items for each variant
  const MODERN_ITEMS: readonly DockItem[] = [
    {
      id: 'scan',
      label: 'Scan Engine',
      action: () => onOpenModal?.(1),
      icon: (
        <>
          <path d="M8 1.9 14.1 5v6L8 14.1 1.9 11V5z" />
          <path d="M1.9 5 8 8.1 14.1 5M8 8.1v6" />
        </>
      ),
    },
    {
      id: 'rules',
      label: 'Rule Engine',
      action: () => onScrollToSection?.(2),
      icon: (
        <>
          <path d="M8 1.9 14.4 5.6 8 9.3 1.6 5.6z" />
          <path d="m2.6 8 5.4 3.1L13.4 8M2.6 10.7 8 13.8l5.4-3.1" />
        </>
      ),
    },
    {
      id: 'audit',
      label: 'Compliance',
      action: () => onScrollToSection?.(3),
      icon: (
        <>
          <path d="M3.4 2.4h5.4l3.8 3.8v7.4H3.4z" />
          <path d="M8.8 2.4v3.8h3.8M5.9 9h4.2M5.9 11.2h3" />
        </>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      action: () => onOpenDashboard?.(),
      icon: (
        <>
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </>
      ),
    },
  ];

  const SABLE_ITEMS: readonly DockItem[] = [
    {
      id: 'scan',
      label: 'SCAN',
      action: () => onOpenModal?.(1),
      icon: (
        <>
          <rect x="2.25" y="2.25" width="4.5" height="4.5" rx=".8" />
          <rect x="9.25" y="2.25" width="4.5" height="4.5" rx=".8" />
          <rect x="2.25" y="9.25" width="4.5" height="4.5" rx=".8" />
          <rect x="9.25" y="9.25" width="4.5" height="4.5" rx=".8" />
        </>
      ),
    },
    {
      id: 'rules',
      label: 'RULES',
      action: () => onScrollToSection?.(2),
      icon: (
        <>
          <circle cx="3" cy="8" r="1.5" />
          <circle cx="12.5" cy="3.5" r="1.5" />
          <circle cx="12.5" cy="12.5" r="1.5" />
          <path d="M4.5 7.3 11 4.2M4.5 8.7l6.5 3.1" />
        </>
      ),
    },
    {
      id: 'audit',
      label: 'AUDIT',
      action: () => onScrollToSection?.(3),
      icon: (
        <>
          <rect x="2" y="3" width="12" height="10" rx="1.5" />
          <path d="M2 6h12M5 4.5h.01M7 4.5h.01" />
        </>
      ),
    },
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      action: () => onOpenDashboard?.(),
      icon: (
        <>
          <rect x="2" y="2" width="5" height="5" rx="1" />
          <rect x="9" y="2" width="5" height="5" rx="1" />
          <rect x="2" y="9" width="5" height="5" rx="1" />
          <rect x="9" y="9" width="5" height="5" rx="1" />
        </>
      ),
    },
    {
      id: 'specs',
      label: 'SPECS',
      action: () => onOpenModal?.(2),
      icon: (
        <>
          <path d="M4 2.25h5.4L12 4.85v8.9H4z" />
          <path d="M9.25 2.25V5h2.7M6 8h4M6 10.5h4" />
        </>
      ),
    },
  ];

  const RETRO_ITEMS: readonly DockItem[] = [
    {
      id: 'scan',
      label: 'SCAN',
      action: () => onOpenModal?.(1),
      icon: (
        <>
          <rect x="1" y="1" width="2" height="2" />
          <rect x="4" y="1" width="2" height="2" />
          <rect x="1" y="4" width="2" height="2" />
          <rect x="4" y="4" width="2" height="2" />
        </>
      ),
    },
    {
      id: 'rules',
      label: 'RULES',
      action: () => onScrollToSection?.(2),
      icon: (
        <>
          <rect x="1" y="0" width="4" height="1" />
          <rect x="1" y="1" width="1" height="5" />
          <rect x="5" y="1" width="1" height="5" />
          <rect x="1" y="6" width="5" height="1" />
          <rect x="2" y="2" width="3" height="1" />
          <rect x="2" y="4" width="3" height="1" />
        </>
      ),
    },
    {
      id: 'core',
      label: 'CORE',
      action: () => onScrollToSection?.(3),
      icon: (
        <>
          <rect x="3" y="0" width="1" height="7" />
          <rect x="0" y="3" width="7" height="1" />
          <rect x="1" y="1" width="1" height="1" />
          <rect x="5" y="1" width="1" height="1" />
          <rect x="1" y="5" width="1" height="1" />
          <rect x="5" y="5" width="1" height="1" />
        </>
      ),
    },
    {
      id: 'dashboard',
      label: 'DASHBOARD',
      action: () => onOpenDashboard?.(),
      icon: (
        <>
          <rect x="0" y="0" width="3" height="3" />
          <rect x="4" y="0" width="3" height="3" />
          <rect x="0" y="4" width="3" height="3" />
          <rect x="4" y="4" width="3" height="3" />
        </>
      ),
    },
  ];

  const GLASS_ITEMS: readonly DockItem[] = [
    {
      id: 'scan',
      label: 'Scanner',
      action: () => onOpenModal?.(1),
      icon: (
        <>
          <circle cx="8" cy="8" r="5.8" />
          <path d="M2.4 8c2.4-3.5 9-3.5 11.3 0" />
        </>
      ),
    },
    {
      id: 'rules',
      label: 'Rules',
      action: () => onScrollToSection?.(2),
      icon: (
        <>
          <rect x="2.2" y="2.2" width="11.6" height="11.6" rx="3.6" />
          <circle cx="8" cy="8" r="2.5" />
        </>
      ),
    },
    {
      id: 'audit',
      label: 'Compliance',
      action: () => onScrollToSection?.(3),
      icon: (
        <>
          <rect x="2.1" y="2.6" width="3" height="10.8" rx="1" />
          <rect x="6.4" y="2.6" width="3" height="10.8" rx="1" />
          <path d="m10.9 3.7 2.9 1-2.4 8.6-2.2-.8" />
        </>
      ),
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      action: () => onOpenDashboard?.(),
      icon: (
        <>
          <rect x="2.5" y="2.5" width="5" height="5" rx="1.5" />
          <rect x="8.5" y="2.5" width="5" height="5" rx="1.5" />
          <rect x="2.5" y="8.5" width="5" height="5" rx="1.5" />
          <rect x="8.5" y="8.5" width="5" height="5" rx="1.5" />
        </>
      ),
    },
  ];

  const VARIANT_ITEMS: Record<AnimatedTopDockVariant, readonly DockItem[]> = {
    modern: MODERN_ITEMS,
    sable: SABLE_ITEMS,
    retro: RETRO_ITEMS,
    glass: GLASS_ITEMS,
  };

  const items = VARIANT_ITEMS[variant] ?? MODERN_ITEMS;
  const [active, setActive] = useState(items[0].id);

  const rootRef = useDockController(() => ({
    ...optionsRef.current,
    axis: 'x',
    distribute: variant === 'retro',
    lockTrack: variant === 'modern',
  }));

  const retro = useShaderField(variant === 'retro', async () => {
    const { createRetroPixelField } = await import('./retroPixelField');
    return (canvas: HTMLCanvasElement) =>
      createRetroPixelField(canvas, () => ({
        pixelSize: optionsRef.current.pixelSize,
        noise: optionsRef.current.noise,
        levels: optionsRef.current.levels,
        speed: optionsRef.current.speed,
      }));
  });

  const glass = useShaderField(variant === 'glass', async () => {
    const { createGlassParticleField } = await import('./glassParticleField');
    return (canvas: HTMLCanvasElement) =>
      createGlassParticleField(canvas, () => ({
        count: optionsRef.current.particles,
        thickness: optionsRef.current.thickness,
        dispersion: optionsRef.current.dispersion,
        specular: optionsRef.current.specular,
        rim: optionsRef.current.rim,
        drift: optionsRef.current.drift,
      }));
  });

  const dockItems = (itemClass: string, iconClass: string, viewBox: string) =>
    items.map((item) => (
      <button
        key={item.id}
        className={itemClass}
        data-dock-item
        type="button"
        aria-pressed={active === item.id}
        onClick={() => {
          setActive(item.id);
          item.action?.();
        }}
      >
        <span className={iconClass} aria-hidden="true">
          <svg viewBox={viewBox}>{item.icon}</svg>
        </span>
        <span>{item.label}</span>
      </button>
    ));

  // Variant selector pill
  const variantSwitcher = (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowVariantMenu((prev) => !prev);
          setShowUserMenu(false);
        }}
        className="h-8 px-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 hover:border-yellow-400/40 text-[10px] font-mono tracking-wider text-white/80 hover:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
        title="Switch Animated Dock Theme"
        aria-expanded={showVariantMenu}
      >
        <Palette className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
        <span className="text-white/40 hidden sm:inline">Theme:</span>
        <span className="font-bold text-yellow-300 uppercase">{variant}</span>
        <ChevronDown
          className={`w-3 h-3 text-white/50 transition-transform duration-200 ${
            showVariantMenu ? 'rotate-180 text-yellow-400' : ''
          }`}
        />
      </button>

      {showVariantMenu && (
        <>
          {/* Backdrop to ensure any click outside closes the dropdown instantly */}
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setShowVariantMenu(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-full mt-2 w-44 bg-[#141414] border border-white/15 rounded-xl p-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.85),0_0_20px_rgba(250,204,21,0.08)] z-[100] font-mono text-[10px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2.5 py-1 text-[9px] text-white/40 uppercase tracking-wider font-semibold border-b border-white/10 mb-1 flex items-center justify-between">
              <span>Theme Mode</span>
              <span className="text-[8px] text-yellow-400/70 font-mono">4 VARIANTS</span>
            </div>
            {ANIMATED_TOP_DOCK_VARIANTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setShowVariantMenu(false);
                  onVariantChange?.(v);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg uppercase tracking-wider flex items-center justify-between cursor-pointer transition-all ${
                  variant === v
                    ? 'bg-yellow-400/20 text-yellow-300 font-bold shadow-inner'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      variant === v
                        ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.9)]'
                        : 'bg-white/30'
                    }`}
                  />
                  <span>{v}</span>
                </span>
                {variant === v && (
                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-mono font-bold">
                    ACTIVE
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // User Auth Actions Area
  const userActions = (
    <div className="flex items-center gap-2 shrink-0">
      {user ? (
        <div className="relative shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowUserMenu((prev) => !prev);
              setShowVariantMenu(false);
            }}
            className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-yellow-400/30 text-white font-mono text-[10px] tracking-wider transition-all cursor-pointer"
          >
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_6px_rgba(250,204,21,0.8)]" />
            <span className="font-bold text-yellow-300 uppercase truncate max-w-[70px] sm:max-w-[110px]">
              {user.name}
            </span>
            <ChevronDown className="w-3 h-3 text-white/50" />
          </button>

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-[90]"
                onClick={() => setShowUserMenu(false)}
                aria-hidden="true"
              />
              <div
                className="absolute right-0 top-full mt-2 w-56 p-3 bg-[#141414] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl z-[100] text-left font-mono"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5 mb-2">
                  <div className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider mb-0.5">
                    {user.clearanceLevel}
                  </div>
                  <div className="text-xs text-white font-medium truncate">{user.email}</div>
                </div>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenDashboard?.();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-yellow-300 hover:bg-yellow-400/10 transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenModal?.(1);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Compliance Scanner</span>
                </button>

                <div className="border-t border-white/10 my-1 pt-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => onOpenAuth?.('login')}
          className="atd-modern__ghost shrink-0"
          type="button"
        >
          Sign in
        </button>
      )}

      {/* Primary Scan Button */}
      <button
        onClick={() => onOpenModal?.(1)}
        className="atd-modern__cta shrink-0"
        type="button"
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">Start Scanning</span>
        <span className="sm:hidden">Scan</span>
      </button>

      {/* Variant Selector */}
      {variantSwitcher}
    </div>
  );

  /* MODERN VARIANT */
  if (variant === 'modern') {
    return (
      <div className={`animated-top-dock-component atd-modern w-full h-16${className ? ` ${className}` : ''}`}>
        <div className="atd-modern__aurora" aria-hidden="true" />
        <div className="atd-modern__bar max-w-6xl mx-auto px-4 sm:px-6 w-full h-16 flex items-center justify-between">
          <div id="brand-dock-target" className="w-44 h-10 flex items-center">
            <a
              className="atd-modern__brand shrink-0"
              href="#top-dock"
              onClick={(event) => {
                event.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <span className="atd-modern__mark" aria-hidden="true">
                {BRAND_MARK}
              </span>
              <span className="atd-modern__word hidden xs:inline">LabelLens</span>
            </a>
          </div>

          <nav
            ref={rootRef}
            className="atd-modern__dock hidden lg:flex shrink-0 mx-2"
            aria-label="Primary"
            data-dock-state="idle"
            data-dock-max="0.00"
          >
            {dockItems('atd-modern__item', 'atd-modern__icon', '0 0 16 16')}
          </nav>

          <div className="atd-modern__actions shrink-0">{userActions}</div>
        </div>
      </div>
    );
  }

  /* RETRO VARIANT */
  if (variant === 'retro') {
    return (
      <div className={`animated-top-dock-component w-full h-16 flex items-center px-4 sm:px-6${className ? ` ${className}` : ''}`}>
        <div
          ref={retro.hostRef}
          className="atd-retro w-full max-w-6xl mx-auto h-12 flex items-center justify-between px-3 sm:px-4"
          style={{ '--atd-retro-scan': optionsRef.current.scanlines } as React.CSSProperties}
        >
          <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
            <canvas ref={retro.canvasRef} className="atd-retro__field" aria-hidden="true" />
            <div className="atd-retro__vignette" aria-hidden="true" />
          </div>

          <div
            className="atd-retro__brand cursor-pointer shrink-0 z-10"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <span className="atd-retro__badge" aria-hidden="true">
              <svg viewBox="0 0 7 7">
                <rect x="0" y="2" width="7" height="3" />
                <rect x="2" y="0" width="3" height="7" />
              </svg>
            </span>
            <span className="hidden xs:inline">LABELLENS//OS</span>
          </div>

          <nav
            ref={rootRef}
            className="atd-retro__dock hidden lg:flex shrink-0 z-10 mx-2"
            aria-label="Primary"
            data-dock-state="idle"
            data-dock-max="0.00"
          >
            {dockItems('atd-retro__item', 'atd-retro__icon', '0 0 7 7')}
          </nav>

          <div className="flex items-center gap-2 shrink-0 z-10">
            <button
              onClick={() => onOpenModal?.(1)}
              className="atd-retro__cta cursor-pointer shrink-0"
              type="button"
            >
              <span aria-hidden="true">▶</span>
              <span className="hidden sm:inline">RUN SCAN</span>
              <span className="sm:hidden">SCAN</span>
            </button>
            {variantSwitcher}
          </div>
        </div>
      </div>
    );
  }

  /* GLASS VARIANT */
  if (variant === 'glass') {
    return (
      <div className={`animated-top-dock-component w-full h-16 flex items-center px-4 sm:px-6${className ? ` ${className}` : ''}`}>
        <div
          ref={glass.hostRef}
          className="atd-glass w-full max-w-6xl mx-auto h-12 flex items-center justify-between px-3 sm:px-4"
          data-dock-frame
        >
          <div className="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
            <canvas ref={glass.canvasRef} className="atd-glass__field" aria-hidden="true" />
          </div>

          <a
            className="atd-glass__brand shrink-0 z-10"
            href="#top-dock"
            onClick={(event) => {
              event.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className="atd-glass__mark" aria-hidden="true">
              {BRAND_MARK}
            </span>
            <span className="atd-glass__word hidden xs:inline">LabelLens</span>
          </a>

          <nav
            ref={rootRef}
            className="atd-glass__dock hidden lg:flex shrink-0 z-10 mx-2"
            aria-label="Primary"
            data-dock-state="idle"
            data-dock-max="0.00"
          >
            {dockItems('atd-glass__item', 'atd-glass__icon', '0 0 16 16')}
          </nav>

          <div className="flex items-center gap-2 shrink-0 z-10">
            <button
              onClick={() => onOpenModal?.(1)}
              className="atd-glass__cta cursor-pointer shrink-0"
              type="button"
            >
              <span className="hidden sm:inline">Inspect PDP</span>
              <span className="sm:hidden">Inspect</span>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.4 8h9.2M8.8 4.2 12.6 8l-3.8 3.8" />
              </svg>
            </button>
            {variantSwitcher}
          </div>
        </div>
      </div>
    );
  }

  /* SABLE (DEFAULT DOCK PILL) */
  return (
    <div className={`animated-top-dock-component w-full h-16 flex items-center justify-between max-w-6xl mx-auto px-4 sm:px-6${className ? ` ${className}` : ''}`}>
      <div id="brand-dock-target" className="w-44 h-10 flex items-center">
        <a
          className="atd-modern__brand shrink-0"
          href="#top-dock"
          onClick={(event) => {
            event.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <span className="atd-modern__mark" aria-hidden="true">
            {BRAND_MARK}
          </span>
          <span className="atd-modern__word hidden xs:inline">LabelLens</span>
        </a>
      </div>

      <nav
        ref={rootRef}
        className="animated-top-dock__nav hidden sm:inline-flex"
        aria-label="Animated top dock"
        data-dock-state="idle"
        data-dock-max="0.00"
      >
        {items.map((item) => (
          <button
            key={item.id}
            className="animated-top-dock__item animated-top-dock__link"
            data-dock-item
            type="button"
            aria-pressed={active === item.id}
            onClick={() => {
              setActive(item.id);
              item.action?.();
            }}
          >
            <span className="animated-top-dock__icon" aria-hidden="true">
              <svg viewBox="0 0 16 16">{item.icon}</svg>
            </span>
            <span className="hidden md:inline">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onOpenModal?.(1)}
          className="px-3.5 py-1.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm active:scale-95 shrink-0"
        >
          <Sparkles className="w-3 h-3" />
          <span className="hidden sm:inline">Start Scanning</span>
          <span className="sm:hidden">Scan</span>
        </button>
        {variantSwitcher}
      </div>
    </div>
  );
};
