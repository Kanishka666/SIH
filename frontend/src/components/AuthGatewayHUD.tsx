import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RotateCcw, ArrowRight, ShieldCheck, Lock, Cpu } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthGatewayHUDProps {
  user?: UserProfile | null;
  mode?: 'login' | 'signup' | 'demo';
  onComplete: () => void;
  onClose?: () => void;
  onSwitchToForm?: () => void;
}

export const AuthGatewayHUD: React.FC<AuthGatewayHUDProps> = ({
  user,
  mode = 'login',
  onComplete,
  onClose,
  onSwitchToForm
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('INITIALIZING LABELLENS');
  const [isSuccess, setIsSuccess] = useState(false);
  const [timestamp, setTimestamp] = useState('');
  const [isFlashing, setIsFlashing] = useState(false);
  const [fadeComplete, setFadeComplete] = useState(false);

  const TOTAL_SEGMENTS = 40;

  // Real-time timestamp
  useEffect(() => {
    const updateTime = () => {
      setTimestamp(`TIME: ${new Date().toISOString().split('T')[1].slice(0, -1)}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // WebGL Shader Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = v_texCoord;
    
    vec3 bgColor = vec3(0.039, 0.039, 0.039); // #0A0A0A
    vec3 accentColor = vec3(1.0, 0.83, 0.0); // #FFD400
    
    float d = length(uv - vec2(0.5, 0.55));
    float glow = smoothstep(0.6, 0.0, d) * 0.15;
    
    float particles = 0.0;
    vec2 p_uv = uv * 4.0;
    float n = noise(floor(p_uv) + floor(u_time * 0.5));
    if(n > 0.98) {
        particles = smoothstep(0.0, 1.0, sin(u_time * 2.0 + n * 10.0)) * 0.5;
    }
    
    float scanPos = mod(u_time * 0.2, 1.2) - 0.1;
    float scanLine = smoothstep(0.01, 0.0, abs(uv.y - scanPos)) * 0.1;
    
    vec3 color = bgColor + accentColor * glow + accentColor * particles + accentColor * scanLine;
    
    gl_FragColor = vec4(color, 1.0);
}`;

    function compileShader(type: number, src: string) {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      return shader;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vs);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vertexShader || !fragmentShader) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vertexShader);
    gl.attachShader(prog, fragmentShader);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.clientX;
      mouse.y = window.innerHeight - event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    function syncSize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }
    syncSize();

    function render(t: number) {
      syncSize();
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
      if (uTime) gl!.uniform1f(uTime, t * 0.001);
      if (uRes) gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      if (uMouse) gl!.uniform2f(uMouse, mouse.x, mouse.y);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Sequence Timeline Logic
  const startSequence = () => {
    setProgress(0);
    setIsSuccess(false);
    setIsFlashing(false);
    setFadeComplete(false);

    const states = [
      { p: 0, text: 'ESTABLISHING SECURE CONNECTION' },
      { p: 25, text: 'JWT TOKEN ROTATION & FINGERPRINTING' },
      { p: 50, text: 'AI THREAT MONITORING ACTIVE' },
      { p: 75, text: 'COMPLIANCE GATEWAY PROTECTED' },
      { p: 100, text: 'ACCESS GRANTED' }
    ];

    const duration = 3800; // 3.8s sequence
    const intervalTime = 25;
    const step = 100 / (duration / intervalTime);

    setStatusText(states[0].text);

    let current = 0;
    const interval = setInterval(() => {
      current += step;
      if (current >= 100) current = 100;

      setProgress(current);

      const currentState = [...states].reverse().find((s) => current >= s.p);
      if (currentState) {
        setStatusText(currentState.text);
      }

      if (current >= 100) {
        clearInterval(interval);
        handleCompletion();
      }
    }, intervalTime);

    return () => clearInterval(interval);
  };

  const handleCompletion = () => {
    setIsFlashing(true);

    setTimeout(() => {
      setIsSuccess(true);
      setStatusText(user ? `WELCOME TO LABELLENS, ${user.name}` : 'WELCOME TO LABELLENS');

      setTimeout(() => {
        setFadeComplete(true);
        setTimeout(() => {
          onComplete();
        }, 600);
      }, 1400);
    }, 400);
  };

  useEffect(() => {
    const cleanup = startSequence();
    return cleanup;
  }, []);

  const activeSegmentsCount = Math.floor((progress / 100) * TOTAL_SEGMENTS);
  const displayPercent = Math.floor(progress);
  const formattedPercent = displayPercent < 10 ? `0${displayPercent}%` : `${displayPercent}%`;

  return (
    <div className="fixed inset-0 z-50 bg-[#161309] text-[#eae2cf] overflow-y-auto min-h-screen flex items-center justify-center p-4 sm:p-6 font-mono selection:bg-[#ffd245] selection:text-black">
      {/* Background WebGL Shader Canvas */}
      <div className="fixed inset-0 w-full h-full z-0 block pointer-events-none">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Noise & Scanline overlays */}
      <div className="noise-overlay" />
      <div className="scanline-overlay" />
      <div className="scanline-bar" />
      <div className="fixed inset-0 bg-[#161309]/60 z-10 pointer-events-none" />

      {/* Top action controls */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2 sm:gap-3">
        {onSwitchToForm && (
          <button
            onClick={onSwitchToForm}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-[#ffd245]/30 text-[#ffd245] text-[11px] sm:text-xs font-mono tracking-wider transition-all cursor-pointer backdrop-blur-md"
          >
            Manual Form
          </button>
        )}
        <button
          onClick={startSequence}
          title="Replay sequence"
          className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-md"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 border border-white/10 text-white/70 hover:text-red-400 transition-all cursor-pointer backdrop-blur-md"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Main Container - Optimized proportions */}
      <main className="relative z-20 w-full max-w-xl flex flex-col items-center my-auto py-2">
        {/* Logo Section */}
        <div className="mb-4 sm:mb-6 flex flex-col items-center hud-flicker">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-2 sm:mb-3 relative flex items-center justify-center">
            <img
              alt="LabelLens Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,212,0,0.3)]"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDND0c9avWE2n8H4-2McY6HHbse6HdGzmx_tmtNz9lgzPMg1iozWj-hROGdQdSz6X3wkr5b8nCoQgGFSVWed4zGg4d7m48nj1j0zYouZAac3Sowx_0D1olErpvy0OzSEpVapf1QHPm2qUPX2ir9LL2GrXC9eN3R-yIreWYSk15-er2LCFRlXAeBJlfNnF6pCATUEIyaPUwd1ZOOz22CU-DiAppimzS5t4GcFcdY0j7q-r09jaqRhaw7"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-[#ffd245] tracking-[0.25em] text-[11px] sm:text-xs font-bold opacity-85 uppercase text-center">
            Enterprise Security Gateway
          </h1>
        </div>

        {/* HUD Module - Clean Compact Height */}
        <div
          id="hud-module"
          style={{
            boxShadow: isFlashing
              ? '0 0 40px rgba(255, 212, 0, 0.8)'
              : '0 0 15px rgba(255, 212, 0, 0.2)'
          }}
          className="w-full glass-panel relative p-5 sm:p-7 hud-flicker rounded-2xl transition-all duration-500"
        >
          {/* Tech Corners */}
          <div className="tech-corner tech-corner-tl" />
          <div className="tech-corner tech-corner-tr" />
          <div className="tech-corner tech-corner-bl" />
          <div className="tech-corner tech-corner-br" />

          {/* Top Metadata */}
          <div className="flex justify-between items-center mb-5 sm:mb-7 text-[9px] sm:text-[10px] text-[#d0c6ab] tracking-widest opacity-70">
            <span>✓ Secure Connection</span>
            <span>✓ Encrypted Session</span>
            <span>✓ AI Monitor Active</span>
          </div>

          {/* Central Readout */}
          <div className="flex flex-col items-center justify-center mb-5 sm:mb-7 relative h-20 sm:h-24">
            {/* The Success Animation Container */}
            <AnimatePresence>
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 text-[#ffd245] flex items-center justify-center"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="45"
                      stroke="#FFD400"
                      strokeOpacity="0.2"
                      strokeWidth="2"
                    >
                      <animate
                        attributeName="stroke-dasharray"
                        dur="0.6s"
                        fill="freeze"
                        from="0 283"
                        to="283 0"
                      />
                    </circle>
                    <path
                      d="M30 50 L45 65 L75 35"
                      fill="none"
                      stroke="#FFD400"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="6"
                      strokeDasharray="100"
                      strokeDashoffset="100"
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        begin="0.2s"
                        dur="0.5s"
                        fill="freeze"
                        from="100"
                        to="0"
                      />
                    </path>
                  </svg>
                </motion.div>
              ) : (
                /* Percentage Readout */
                <motion.div
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  className="text-5xl sm:text-6xl font-bold text-[#ffd245] glowing-text tracking-tighter tabular-nums"
                >
                  {formattedPercent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Text */}
          <div className="text-center mb-4 sm:mb-5 h-5 flex items-center justify-center">
            <p className="text-[#ffd245] text-xs sm:text-xs tracking-[0.2em] uppercase transition-all duration-300 font-bold px-2">
              {statusText}
            </p>
          </div>

          {/* Segmented Progress */}
          <div className="flex justify-between items-center gap-0.5 sm:gap-1 w-full h-3 sm:h-3.5 px-1.5 bg-black/40 rounded-lg p-0.5 border border-white/5">
            {Array.from({ length: TOTAL_SEGMENTS }).map((_, index) => {
              const isActive = index < activeSegmentsCount;
              return (
                <div
                  key={index}
                  className={`progress-segment flex-1 h-full rounded-[1px] transition-colors duration-100 ${
                    isActive
                      ? 'active bg-[#ffd245] shadow-[0_0_8px_rgba(255,212,0,0.6)]'
                      : 'bg-[#151515]'
                  }`}
                />
              );
            })}
          </div>

          {/* Bottom Metadata */}
          <div className="flex justify-between items-end mt-5 sm:mt-7 text-[8px] sm:text-[9px] text-[#d0c6ab]/60 font-mono">
            <div className="flex flex-col gap-0.5">
              <span>✓ Compliance Gateway Protected</span>
              <span>NODE: LL-ZERO-TRUST-09</span>
            </div>
            <div className="flex flex-col gap-0.5 text-right">
              <span>
                LATENCY: <span className="text-[#ffd245]/90 font-bold">8ms</span>
              </span>
              <span>{timestamp}</span>
            </div>
          </div>
        </div>

        {/* Quick Access Actions */}
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3"
          >
            <button
              onClick={onComplete}
              className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#ffd245] hover:bg-[#ffe08a] text-black font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(255,212,0,0.4)] flex items-center gap-2 cursor-pointer"
            >
              <span>Enter Metrology Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </motion.div>
        )}
      </main>

      {/* Overlay for transition fade */}
      <div
        className={`fixed inset-0 bg-[#161309] z-50 pointer-events-none transition-opacity duration-700 ${
          fadeComplete ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};
