export type GlassOptions = {
  count?: number;
  thickness?: number;
  dispersion?: number;
  specular?: number;
  rim?: number;
  drift?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  phase: number;
  colorType: number;
};

export function createGlassParticleField(
  canvas: HTMLCanvasElement,
  getOptions: () => GlassOptions
) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = canvas.width || 300;
  let height = canvas.height || 100;
  let pointerX = width / 2;
  let pointerY = height / 2;
  let hasPointer = false;

  const particles: Particle[] = [];
  const particleCount = getOptions().count ?? 22;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 1.5 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
      colorType: i % 3, // 0 = warm amber, 1 = cyan dispersion, 2 = white specular
    });
  }

  return {
    resize(w: number, h: number) {
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.floor(w));
      height = Math.max(1, Math.floor(h));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.resetTransform?.();
      ctx.scale(dpr, dpr);
    },

    setPointer(x: number, y: number) {
      pointerX = (x + 1) * 0.5 * width;
      pointerY = (-y + 1) * 0.5 * height;
      hasPointer = true;
    },

    render(now: number) {
      if (!ctx || width <= 0 || height <= 0) return;
      const options = getOptions();
      const drift = options.drift ?? 1;
      const specular = options.specular ?? 0.85;
      const dispersion = options.dispersion ?? 0.05;

      ctx.clearRect(0, 0, width, height);

      // Subtle glass specular gradient following pointer
      if (hasPointer) {
        const radGrad = ctx.createRadialGradient(
          pointerX,
          pointerY,
          2,
          pointerX,
          pointerY,
          Math.max(60, width * 0.4)
        );
        radGrad.addColorStop(0, `rgba(255, 255, 255, ${0.12 * specular})`);
        radGrad.addColorStop(0.3, `rgba(250, 204, 21, ${0.08 * specular})`);
        radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // Render floating glass refraction particles
      for (const p of particles) {
        p.x += p.vx * drift;
        p.y += p.vy * drift;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Pointer attraction/deflection
        if (hasPointer) {
          const dx = pointerX - p.x;
          const dy = pointerY - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100 && dist > 1) {
            p.x += (dx / dist) * 0.35;
            p.y += (dy / dist) * 0.35;
          }
        }

        const pulse = 0.5 + 0.5 * Math.sin(now * 0.002 + p.phase);
        const radius = p.size * (0.8 + 0.4 * pulse);

        // Chromatic split
        if (dispersion > 0.02) {
          ctx.beginPath();
          ctx.arc(p.x - 1, p.y, radius * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(56, 189, 248, ${0.18 * specular})`;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x + 1, p.y, radius * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(250, 204, 21, ${0.22 * specular})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.35 * specular * pulse})`;
        ctx.fill();
      }
    },

    dispose() {
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    },
  };
}
