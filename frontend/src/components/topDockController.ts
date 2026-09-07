export type TopDockOptions = {
  proximity?: number;
  spring?: number;
  damping?: number;
  widthGrowth?: number;
  heightGrowth?: number;
  drop?: number;
  axis?: 'x' | 'y';
  distribute?: boolean;
  lockTrack?: boolean;
  [key: string]: unknown;
};

type ItemPhysicsState = {
  element: HTMLElement;
  currentFactor: number;
  targetFactor: number;
  velocity: number;
};

export function createTopDockController(
  root: HTMLElement,
  getOptions: () => TopDockOptions
): () => void {
  let animationFrameId = 0;
  let isPointerInside = false;
  let pointerX = -9999;
  let pointerY = -9999;
  let activeFocusIndex = -1;

  const itemElements = Array.from(
    root.querySelectorAll<HTMLElement>('[data-dock-item]')
  );

  const items: ItemPhysicsState[] = itemElements.map((el) => ({
    element: el,
    currentFactor: 0,
    targetFactor: 0,
    velocity: 0,
  }));

  function updateTargets() {
    const options = getOptions();
    const proximity = options.proximity ?? 122;
    const axis = options.axis ?? 'x';

    if (activeFocusIndex >= 0 && activeFocusIndex < items.length) {
      // Keyboard focus takes priority
      items.forEach((item, index) => {
        const diff = Math.abs(index - activeFocusIndex);
        if (diff === 0) {
          item.targetFactor = 1.0;
        } else if (diff === 1) {
          item.targetFactor = 0.45;
        } else if (diff === 2) {
          item.targetFactor = 0.15;
        } else {
          item.targetFactor = 0;
        }
      });
      return;
    }

    if (!isPointerInside) {
      items.forEach((item) => {
        item.targetFactor = 0;
      });
      return;
    }

    items.forEach((item) => {
      const rect = item.element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      let distance = 0;
      if (axis === 'y') {
        const dy = Math.abs(pointerY - centerY);
        const dx = Math.abs(pointerX - centerX);
        distance = Math.hypot(dx * 0.5, dy);
      } else {
        const dx = Math.abs(pointerX - centerX);
        const dy = Math.abs(pointerY - centerY);
        // Slightly weight horizontal proximity while keeping vertical boundary
        distance = Math.hypot(dx, dy * 0.9);
      }

      if (distance < proximity) {
        // Cosine bell curve for ultra-smooth organic magnification
        const ratio = 1 - distance / proximity;
        item.targetFactor = 0.5 * (1 - Math.cos(Math.PI * ratio));
      } else {
        item.targetFactor = 0;
      }
    });
  }

  function tick() {
    const options = getOptions();
    const spring = options.spring ?? 0.19;
    const damping = options.damping ?? 0.7;
    const widthGrowth = options.widthGrowth ?? 17;
    const heightGrowth = options.heightGrowth ?? 16;
    const drop = options.drop ?? 3.5;

    let maxFactor = 0;
    let needsContinue = isPointerInside || activeFocusIndex >= 0;

    items.forEach((item) => {
      const force = (item.targetFactor - item.currentFactor) * spring;
      item.velocity = (item.velocity + force) * damping;
      item.currentFactor += item.velocity;

      // Small epsilon check to avoid infinite micro-calculations
      if (Math.abs(item.currentFactor - item.targetFactor) < 0.0005 && Math.abs(item.velocity) < 0.0005) {
        item.currentFactor = item.targetFactor;
        item.velocity = 0;
      } else {
        needsContinue = true;
      }

      if (item.currentFactor > maxFactor) {
        maxFactor = item.currentFactor;
      }

      // Apply CSS custom properties to each item
      const factor = Math.max(0, Math.min(1, item.currentFactor));
      const scale = 1 + factor * 0.28;
      const wAdd = widthGrowth * factor;
      const hAdd = heightGrowth * factor;
      const yDrop = drop * factor;

      item.element.style.setProperty('--dock-factor', factor.toFixed(4));
      item.element.style.setProperty('--dock-scale', scale.toFixed(4));
      item.element.style.setProperty('--dock-w-growth', `${wAdd.toFixed(2)}px`);
      item.element.style.setProperty('--dock-h-growth', `${hAdd.toFixed(2)}px`);
      item.element.style.setProperty('--dock-drop', `${yDrop.toFixed(2)}px`);
    });

    root.setAttribute('data-dock-state', maxFactor > 0.02 ? 'active' : 'idle');
    root.setAttribute('data-dock-max', maxFactor.toFixed(2));
    root.style.setProperty('--dock-max-factor', maxFactor.toFixed(4));

    if (needsContinue || maxFactor > 0.001) {
      animationFrameId = requestAnimationFrame(tick);
    } else {
      animationFrameId = 0;
    }
  }

  function startAnimation() {
    updateTargets();
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(tick);
    }
  }

  function onPointerMove(e: PointerEvent) {
    isPointerInside = true;
    pointerX = e.clientX;
    pointerY = e.clientY;
    startAnimation();
  }

  function onPointerLeave() {
    isPointerInside = false;
    pointerX = -9999;
    pointerY = -9999;
    startAnimation();
  }

  function onFocusIn(e: FocusEvent) {
    const target = e.target as HTMLElement;
    const index = items.findIndex((item) => item.element.contains(target) || item.element === target);
    if (index !== -1) {
      activeFocusIndex = index;
      startAnimation();
    }
  }

  function onFocusOut() {
    activeFocusIndex = -1;
    startAnimation();
  }

  root.addEventListener('pointermove', onPointerMove, { passive: true });
  root.addEventListener('pointerenter', onPointerMove, { passive: true });
  root.addEventListener('pointerleave', onPointerLeave, { passive: true });
  root.addEventListener('focusin', onFocusIn, { passive: true });
  root.addEventListener('focusout', onFocusOut, { passive: true });

  // Handle window resize or layout recalculation
  const resizeObserver = new ResizeObserver(() => {
    if (isPointerInside || activeFocusIndex >= 0) {
      startAnimation();
    }
  });
  resizeObserver.observe(root);

  return () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerenter', onPointerMove);
    root.removeEventListener('pointerleave', onPointerLeave);
    root.removeEventListener('focusin', onFocusIn);
    root.removeEventListener('focusout', onFocusOut);
    resizeObserver.disconnect();
  };
}
