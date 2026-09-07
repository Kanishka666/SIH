export type RetroOptions = {
  pixelSize?: number;
  noise?: number;
  levels?: number;
  speed?: number;
};

export function createRetroPixelField(
  canvas: HTMLCanvasElement,
  getOptions: () => RetroOptions
) {
  const ctx = canvas.getContext('2d', { alpha: true });
  let width = canvas.width || 300;
  let height = canvas.height || 100;
  let pointerNormX = 0;
  let pointerNormY = 0;
  let hasPointer = false;

  // 4x4 standard Bayer ordered dither matrix normalized [0, 15]
  const bayer4 = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
  ];

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
      pointerNormX = x;
      pointerNormY = y;
      hasPointer = true;
    },

    render(now: number) {
      if (!ctx || width <= 0 || height <= 0) return;
      const options = getOptions();
      const pixelSize = Math.max(2, Math.floor(options.pixelSize ?? 4));
      const speed = options.speed ?? 1;
      const levels = Math.max(2, options.levels ?? 7);

      const t = (now * 0.001 * speed) % 1000;

      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / pixelSize);
      const rows = Math.ceil(height / pixelSize);

      // Map pointer to normalized canvas coordinates [0, 1]
      const px = hasPointer ? (pointerNormX + 1) * 0.5 * cols : cols * 0.5;
      const py = hasPointer ? (-pointerNormY + 1) * 0.5 * rows : rows * 0.5;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // Distance from pointer
          const dx = x - px;
          const dy = y - py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Wave field equation
          const wave = Math.sin(x * 0.2 + t * 2) * Math.cos(y * 0.3 - t * 1.5);
          const pointerWave = hasPointer ? Math.sin(dist * 0.4 - t * 3) / (1 + dist * 0.15) : 0;
          const rawValue = 0.5 + 0.3 * wave + 0.35 * pointerWave;

          // Ordered dither threshold
          const threshold = bayer4[y % 4][x % 4] / 16;
          const quantized = Math.floor(rawValue * levels) / levels;

          if (quantized > threshold * 0.8) {
            const alpha = Math.min(0.35, Math.max(0.04, quantized * 0.3));
            ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize - 0.5, pixelSize - 0.5);
          }
        }
      }
    },

    dispose() {
      if (ctx) {
        ctx.clearRect(0, 0, width, height);
      }
    },
  };
}
