import React, { useEffect, useState } from 'react';

export const IntroAnimationOverlay: React.FC = () => {
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const brand = document.getElementById('intro-brand');
    const target = document.getElementById('brand-dock-target');
    const overlay = document.getElementById('intro-overlay');
    const revealElements = document.querySelectorAll('.intro-reveal');

    if (!brand || !target || !overlay) {
      setIsCompleted(true);
      return;
    }

    // Reset initial positions
    brand.style.transform = 'translate(0px, 0px) scale(1)';
    brand.classList.add('breathe-centered');
    brand.classList.remove('animate-flow-dock');
    overlay.style.opacity = '1';
    revealElements.forEach((el) => el.classList.remove('intro-revealed'));

    // Phase 1: Center stage hold for 0.8 seconds
    const timer1 = setTimeout(() => {
      brand.classList.remove('breathe-centered');

      // Measure First (Center) and Last (Header Target) positions
      const startRect = brand.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      // Calculate Delta (distance to top-left dock)
      const deltaX = targetRect.left - startRect.left;
      const deltaY = targetRect.top - startRect.top;
      const targetScale = targetRect.height / startRect.height || 0.85;

      // Phase 2: Slide and dock to top-left header (550ms duration for ultra-smooth buttery feel)
      brand.classList.add('animate-flow-dock');
      brand.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${targetScale})`;

      // Phase 3: Dissolve overlay with gorgeous backdrop blur fade (~250ms mark)
      const timer2 = setTimeout(() => {
        if (overlay) overlay.style.opacity = '0';
        revealElements.forEach((el) => el.classList.add('intro-revealed'));
      }, 250);

      // Final cleanup: Dock cleanly into navbar with compact styling
      const timer3 = setTimeout(() => {
        if (overlay) overlay.style.display = 'none';
        if (target && brand) {
          target.innerHTML = ''; // Clear fallback placeholder content
          
          // Apply compact navbar brand styling
          brand.setAttribute('class', 'flex items-center gap-2 cursor-pointer group');
          brand.style.transform = 'none';
          brand.style.position = 'relative';

          // Update inner structure for compact navbar fit
          const iconWrapper = brand.querySelector('#brand-icon-box');
          if (iconWrapper) {
            iconWrapper.setAttribute('class', 'relative flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-yellow-400/40 shadow-sm shrink-0 group-hover:border-yellow-400 transition-colors');
          }
          const svgEl = brand.querySelector('svg');
          if (svgEl) {
            svgEl.setAttribute('class', 'w-4 h-4 text-yellow-400 transition-transform group-hover:scale-110');
          }
          const textEl = brand.querySelector('#brand-title');
          if (textEl) {
            textEl.setAttribute('class', 'text-base font-bold tracking-tight text-white font-mono group-hover:text-yellow-300 transition-colors');
          }

          target.appendChild(brand);
        }
        setIsCompleted(true);
      }, 550);

      return () => {
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }, 800); // 0.8s center stage hold (Total 1.35s sequence)

    return () => clearTimeout(timer1);
  }, []);

  if (isCompleted) return null;

  return (
    <div
      id="intro-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#09090b]/95 backdrop-blur-md transition-opacity duration-500 pointer-events-none"
    >
      <div
        id="intro-brand"
        className="flex items-center gap-3 transform-gpu will-change-transform bg-[#111111]/90 backdrop-blur-xl p-6 sm:p-7 rounded-2xl border border-yellow-400/35 shadow-[0_0_60px_rgba(255,212,0,0.25)]"
      >
        <div id="brand-icon-box" className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-zinc-900 border border-yellow-400/50 shadow-[0_0_35px_rgba(255,212,0,0.3)] shrink-0">
          <svg className="w-7 h-7 text-yellow-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" strokeDasharray="4 2" />
            <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
            <path d="M7 7h2V5H7v2zm10 0h-2V5h2v2zm0 10h-2v2h2v-2zm-10 0h2v2H7v-2z" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <span id="brand-title" className="text-2xl font-bold tracking-tight text-white font-mono">LabelLens</span>
          <span className="hidden xs:inline-block px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-yellow-400/10 text-yellow-300 border border-yellow-400/25 font-mono">
            v1.4 AI Inspection
          </span>
        </div>
      </div>
    </div>
  );
};
