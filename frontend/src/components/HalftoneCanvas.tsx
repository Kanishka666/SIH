import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface HalftoneCanvasProps {
  className?: string;
}

export const HalftoneCanvas: React.FC<HalftoneCanvasProps> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x0a0a0a, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const width = Math.max(1, parent.clientWidth || 400);
      const height = Math.max(1, parent.clientHeight || 400);
      renderer.setSize(width, height, false);
      const aspect = width / height;
      camera.left = -aspect;
      camera.right = aspect;
      camera.bottom = -1;
      camera.top = 1;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const gridSize = 24;
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    const scales: number[] = [];

    for (let x = -gridSize; x <= gridSize; x++) {
      for (let y = -gridSize; y <= gridSize; y++) {
        positions.push(x * 0.14, y * 0.14, 0);
        scales.push(1);
      }
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.Float32BufferAttribute(scales, 1));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color1: { value: new THREE.Color(0xfbbf24) },
        color2: { value: new THREE.Color(0xffffff) },
        mouse: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        attribute float scale;
        varying vec2 vUv;
        varying float vScale;
        uniform float time;
        uniform vec2 mouse;

        void main() {
          vUv = position.xy;
          float dist = length(position.xy - mouse * 0.5);
          float animatedScale = scale * (sin(dist * 5.0 - time * 2.2) * 0.5 + 0.5);
          vScale = animatedScale;
          gl_PointSize = (animatedScale * 6.5 + 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        varying float vScale;

        void main() {
          vec2 coord = gl_PointCoord - vec2(0.5);
          if (length(coord) > 0.5) discard;
          vec3 finalColor = mix(color2, color1, clamp((vUv.y + 1.0) * 0.5, 0.0, 1.0));
          gl_FragColor = vec4(finalColor, vScale * 0.85);
        }
      `,
      transparent: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      material.uniforms.mouse.value.set(x, y);
    };

    window.addEventListener('mousemove', handlePointerMove);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      material.uniforms.time.value = clock.getElapsedTime();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
};
