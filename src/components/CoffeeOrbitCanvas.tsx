import React, { useEffect, useRef } from 'react';

interface CoffeeOrbitCanvasProps {
  className?: string;
}

interface OrbitPath {
  side: 'left' | 'right';
  centerXOffset: number; // Ratio of width (-0.15 to +0.15 relative to left/right center)
  radiusX: number;
  radiusY: number;
  rotation: number;
  rotationSpeed: number;
  dashOffset: number;
  color: string;
  glowColor: string;
  opacity: number;
}

interface LuminousNode {
  pathIndex: number;
  angle: number;
  speed: number;
  radiusOffset: number;
  size: number;
  type: 'green' | 'gold';
  pulseSpeed: number;
  pulsePhase: number;
  // Physics offset
  vx: number;
  vy: number;
  dx: number;
  dy: number;
}

interface CoffeeBeanElement {
  side: 'left' | 'right';
  baseXRatio: number;
  baseYRatio: number;
  angle: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  driftSpeed: number;
  driftPhase: number;
  // Mouse reaction
  vx: number;
  vy: number;
  dx: number;
  dy: number;
}

interface DustParticle {
  xRatio: number;
  yRatio: number;
  size: number;
  color: 'green' | 'gold' | 'white';
  alpha: number;
  speedY: number;
  speedX: number;
  phase: number;
}

export const CoffeeOrbitCanvas: React.FC<CoffeeOrbitCanvasProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        drawStaticFrame();
      }
    };
    mediaQuery.addEventListener?.('change', handleMotionChange);

    // Pointer state with smooth exponential lerping
    const pointer = {
      targetX: 0.5,
      targetY: 0.5,
      currentX: 0.5,
      currentY: 0.5,
      pixelX: 0,
      pixelY: 0,
      targetAuraAlpha: 0,
      currentAuraAlpha: 0,
      isHovered: false,
      lastActiveTime: performance.now(),
    };

    let paths: OrbitPath[] = [];
    let nodes: LuminousNode[] = [];
    let beans: CoffeeBeanElement[] = [];
    let dust: DustParticle[] = [];

    const initEntities = (w: number, h: number) => {
      const isMobile = w < 768;
      const isTablet = w >= 768 && w < 1024;
      const baseScale = Math.min(w, h);

      // 1. Split Orbital Paths (Left Emerald Green, Right Warm Champagne Gold)
      paths = [
        // Left Green Orbits
        {
          side: 'left',
          centerXOffset: -0.15,
          radiusX: Math.max(160, baseScale * 0.38),
          radiusY: Math.max(220, baseScale * 0.52),
          rotation: -0.28,
          rotationSpeed: 0.00010,
          dashOffset: 0,
          color: 'rgba(16, 185, 129, 0.45)',
          glowColor: 'rgba(16, 185, 129, 0.12)',
          opacity: 0.7,
        },
        {
          side: 'left',
          centerXOffset: -0.10,
          radiusX: Math.max(230, baseScale * 0.52),
          radiusY: Math.max(300, baseScale * 0.68),
          rotation: -0.18,
          rotationSpeed: -0.00008,
          dashOffset: 0,
          color: 'rgba(5, 150, 105, 0.35)',
          glowColor: 'rgba(16, 185, 129, 0.08)',
          opacity: 0.6,
        },
        {
          side: 'left',
          centerXOffset: -0.20,
          radiusX: Math.max(300, baseScale * 0.66),
          radiusY: Math.max(380, baseScale * 0.85),
          rotation: -0.38,
          rotationSpeed: 0.00006,
          dashOffset: 0,
          color: 'rgba(52, 211, 153, 0.28)',
          glowColor: 'rgba(52, 211, 153, 0.06)',
          opacity: 0.5,
        },

        // Right Golden Orbits
        {
          side: 'right',
          centerXOffset: 0.15,
          radiusX: Math.max(170, baseScale * 0.40),
          radiusY: Math.max(230, baseScale * 0.54),
          rotation: 0.26,
          rotationSpeed: -0.00010,
          dashOffset: 0,
          color: 'rgba(245, 158, 11, 0.48)',
          glowColor: 'rgba(245, 158, 11, 0.14)',
          opacity: 0.75,
        },
        {
          side: 'right',
          centerXOffset: 0.10,
          radiusX: Math.max(240, baseScale * 0.54),
          radiusY: Math.max(310, baseScale * 0.70),
          rotation: 0.16,
          rotationSpeed: 0.00008,
          dashOffset: 0,
          color: 'rgba(217, 119, 6, 0.38)',
          glowColor: 'rgba(245, 158, 11, 0.09)',
          opacity: 0.65,
        },
        {
          side: 'right',
          centerXOffset: 0.20,
          radiusX: Math.max(310, baseScale * 0.68),
          radiusY: Math.max(390, baseScale * 0.88),
          rotation: 0.35,
          rotationSpeed: -0.00005,
          dashOffset: 0,
          color: 'rgba(251, 191, 36, 0.30)',
          glowColor: 'rgba(251, 191, 36, 0.07)',
          opacity: 0.5,
        },
      ];

      // 2. Luminous Spherical Nodes / Glowing Beads
      nodes = [
        // Left Green Nodes
        { pathIndex: 0, angle: 1.2, speed: 0.00015, radiusOffset: 0, size: 4.2, type: 'green', pulseSpeed: 0.002, pulsePhase: 0.2, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 0, angle: 3.8, speed: 0.00018, radiusOffset: 2, size: 3.2, type: 'green', pulseSpeed: 0.0018, pulsePhase: 1.5, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 1, angle: 2.1, speed: -0.00012, radiusOffset: -3, size: 5.0, type: 'green', pulseSpeed: 0.0022, pulsePhase: 2.8, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 1, angle: 4.9, speed: -0.00016, radiusOffset: 4, size: 3.5, type: 'green', pulseSpeed: 0.0015, pulsePhase: 4.1, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 2, angle: 0.8, speed: 0.00009, radiusOffset: 0, size: 3.8, type: 'green', pulseSpeed: 0.002, pulsePhase: 5.0, vx: 0, vy: 0, dx: 0, dy: 0 },

        // Right Golden Nodes
        { pathIndex: 3, angle: 5.1, speed: -0.00015, radiusOffset: 0, size: 4.5, type: 'gold', pulseSpeed: 0.002, pulsePhase: 0.6, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 3, angle: 2.4, speed: -0.00017, radiusOffset: -2, size: 3.2, type: 'gold', pulseSpeed: 0.0019, pulsePhase: 2.1, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 4, angle: 4.2, speed: 0.00012, radiusOffset: 3, size: 4.8, type: 'gold', pulseSpeed: 0.0023, pulsePhase: 3.4, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 4, angle: 1.1, speed: 0.00014, radiusOffset: -4, size: 3.4, type: 'gold', pulseSpeed: 0.0017, pulsePhase: 4.7, vx: 0, vy: 0, dx: 0, dy: 0 },
        { pathIndex: 5, angle: 5.8, speed: -0.00009, radiusOffset: 0, size: 4.0, type: 'gold', pulseSpeed: 0.0021, pulsePhase: 5.6, vx: 0, vy: 0, dx: 0, dy: 0 },
      ];

      // 3. Realistic Roasted Coffee Beans (Positioned along orbital wings exactly matching reference)
      beans = [
        // Left Side Beans
        { side: 'left', baseXRatio: 0.08, baseYRatio: 0.25, angle: -0.6, size: 10, rotation: -0.4, rotSpeed: 0.0001, driftSpeed: 0.0008, driftPhase: 0.2, vx: 0, vy: 0, dx: 0, dy: 0 },
        { side: 'left', baseXRatio: 0.23, baseYRatio: 0.13, angle: 0.4, size: 9, rotation: 0.7, rotSpeed: -0.00012, driftSpeed: 0.0007, driftPhase: 1.4, vx: 0, vy: 0, dx: 0, dy: 0 },
        { side: 'left', baseXRatio: 0.22, baseYRatio: 0.40, angle: -0.2, size: 8.5, rotation: -0.3, rotSpeed: 0.00009, driftSpeed: 0.0009, driftPhase: 2.6, vx: 0, vy: 0, dx: 0, dy: 0 },
        { side: 'left', baseXRatio: 0.18, baseYRatio: 0.54, angle: 0.5, size: 9.5, rotation: 0.6, rotSpeed: -0.00011, driftSpeed: 0.0008, driftPhase: 3.8, vx: 0, vy: 0, dx: 0, dy: 0 },
        { side: 'left', baseXRatio: 0.10, baseYRatio: 0.80, angle: -0.7, size: 10.5, rotation: -0.8, rotSpeed: 0.00013, driftSpeed: 0.0007, driftPhase: 5.1, vx: 0, vy: 0, dx: 0, dy: 0 },

        // Right Side Beans
        { side: 'right', baseXRatio: 0.81, baseYRatio: 0.21, angle: 0.5, size: 9.5, rotation: 0.5, rotSpeed: 0.00011, driftSpeed: 0.0008, driftPhase: 0.9, vx: 0, vy: 0, dx: 0, dy: 0 },
        { side: 'right', baseXRatio: 0.91, baseYRatio: 0.26, angle: -0.4, size: 10, rotation: -0.5, rotSpeed: -0.00010, driftSpeed: 0.0007, driftPhase: 2.1, vx: 0, vy: 0, dx: 0, dy: 0 },
        { side: 'right', baseXRatio: 0.77, baseYRatio: 0.68, angle: 0.6, size: 8.5, rotation: 0.8, rotSpeed: 0.00012, driftSpeed: 0.0009, driftPhase: 3.3, vx: 0, vy: 0, dx: 0, dy: 0 },
        { side: 'right', baseXRatio: 0.90, baseYRatio: 0.72, angle: -0.6, size: 10.5, rotation: -0.7, rotSpeed: -0.00014, driftSpeed: 0.0008, driftPhase: 4.5, vx: 0, vy: 0, dx: 0, dy: 0 },
      ];

      // 4. Stardust Particles / Ambient Glistening Dust
      const dustCount = isMobile ? 35 : isTablet ? 70 : 120;
      dust = [];
      for (let i = 0; i < dustCount; i++) {
        const isLeft = i % 2 === 0;
        dust.push({
          xRatio: isLeft ? 0.05 + Math.random() * 0.35 : 0.60 + Math.random() * 0.35,
          yRatio: 0.05 + Math.random() * 0.90,
          size: 0.8 + Math.random() * 1.6,
          color: isLeft ? (Math.random() > 0.3 ? 'green' : 'white') : (Math.random() > 0.3 ? 'gold' : 'white'),
          alpha: 0.2 + Math.random() * 0.6,
          speedY: (Math.random() - 0.5) * 0.0002,
          speedX: (Math.random() - 0.5) * 0.0002,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const handleResize = () => {
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      initEntities(width, height);

      if (prefersReducedMotion) {
        drawStaticFrame();
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    handleResize();

    // Mouse & Touch interaction
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      } else {
        return;
      }

      const nx = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const ny = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));

      pointer.targetX = nx;
      pointer.targetY = ny;
      pointer.targetAuraAlpha = 1.0;
      pointer.isHovered = true;
      pointer.lastActiveTime = performance.now();
    };

    const handlePointerLeave = () => {
      pointer.isHovered = false;
      pointer.targetAuraAlpha = 0;
      pointer.targetX = 0.5;
      pointer.targetY = 0.5;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', handlePointerLeave);

    // Render Realistic 3D Coffee Bean
    const drawRealisticCoffeeBean = (x: number, y: number, size: number, rotation: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Bean drop shadow
      ctx.beginPath();
      ctx.ellipse(1, 2, size * 1.45, size * 0.95, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      ctx.fill();

      // Main Outer Bean Body with warm roasted gradient
      const beanGrad = ctx.createRadialGradient(-size * 0.3, -size * 0.3, size * 0.2, 0, 0, size * 1.5);
      beanGrad.addColorStop(0, '#8c4823'); // Warm roasted highlight
      beanGrad.addColorStop(0.5, '#5c2d12'); // Rich coffee brown
      beanGrad.addColorStop(1, '#2e1306'); // Deep dark chocolate rim

      ctx.beginPath();
      ctx.ellipse(0, 0, size * 1.4, size * 0.9, 0, 0, Math.PI * 2);
      ctx.fillStyle = beanGrad;
      ctx.fill();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#220c03';
      ctx.stroke();

      // Specular 3D light reflection on upper lobe
      ctx.beginPath();
      ctx.ellipse(-size * 0.45, -size * 0.35, size * 0.55, size * 0.25, -0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fill();

      // Center Crevice / Curving Split Seam
      ctx.beginPath();
      ctx.moveTo(-size * 1.1, 0);
      ctx.bezierCurveTo(-size * 0.4, size * 0.45, size * 0.4, -size * 0.45, size * 1.1, 0);
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#180702'; // Deep shadow crevice
      ctx.stroke();

      // Delicate warm light seam inside the crevice
      ctx.beginPath();
      ctx.moveTo(-size * 0.9, 0);
      ctx.bezierCurveTo(-size * 0.3, size * 0.35, size * 0.3, -size * 0.35, size * 0.9, 0);
      ctx.lineWidth = 0.7;
      ctx.strokeStyle = 'rgba(254, 243, 199, 0.75)'; // Warm roasted cream line
      ctx.stroke();

      ctx.restore();
    };

    // Render Luminous Spherical Node with Halo Rings
    const drawLuminousNode = (x: number, y: number, size: number, type: 'green' | 'gold', pulse: number) => {
      ctx.save();
      const currentSize = size * (0.9 + pulse * 0.15);

      // 1. Outer Glow Aura
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, currentSize * 4.5);
      if (type === 'green') {
        glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.35)');
        glowGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.12)');
        glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.38)');
        glowGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.14)');
        glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
      }
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(x, y, currentSize * 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Translucent Concentric Glow Ring
      ctx.beginPath();
      ctx.arc(x, y, currentSize * 2.2, 0, Math.PI * 2);
      ctx.strokeStyle = type === 'green' ? 'rgba(52, 211, 153, 0.45)' : 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 3. Solid Luminous Sphere Core with 3D gradient
      const sphereGrad = ctx.createRadialGradient(
        x - currentSize * 0.3,
        y - currentSize * 0.3,
        currentSize * 0.1,
        x,
        y,
        currentSize
      );
      if (type === 'green') {
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.3, '#34d399');
        sphereGrad.addColorStop(0.8, '#059669');
        sphereGrad.addColorStop(1, '#064e3b');
      } else {
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.3, '#fbbf24');
        sphereGrad.addColorStop(0.8, '#d97706');
        sphereGrad.addColorStop(1, '#78350f');
      }
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(x, y, currentSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Static frame for reduced motion
    const drawStaticFrame = () => {
      if (!ctx || width === 0 || height === 0) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Left Green Ambient Glow
      const leftGlow = ctx.createRadialGradient(width * 0.2, height * 0.5, 20, width * 0.2, height * 0.5, width * 0.4);
      leftGlow.addColorStop(0, 'rgba(16, 185, 129, 0.09)');
      leftGlow.addColorStop(0.6, 'rgba(16, 185, 129, 0.02)');
      leftGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, width, height);

      // Right Gold Ambient Glow
      const rightGlow = ctx.createRadialGradient(width * 0.8, height * 0.5, 20, width * 0.8, height * 0.5, width * 0.4);
      rightGlow.addColorStop(0, 'rgba(245, 158, 11, 0.08)');
      rightGlow.addColorStop(0.6, 'rgba(245, 158, 11, 0.02)');
      rightGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, width, height);

      // Static paths
      paths.forEach((p) => {
        const cx = width * (p.side === 'left' ? 0.25 + p.centerXOffset : 0.75 + p.centerXOffset);
        const cy = height * 0.5;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.restore();
      });

      // Static beans
      beans.forEach((b) => {
        const bx = width * b.baseXRatio;
        const by = height * b.baseYRatio;
        drawRealisticCoffeeBean(bx, by, b.size, b.rotation);
      });

      ctx.restore();
    };

    // Main 60fps Animation Loop
    let lastTime = performance.now();

    const render = (now: number) => {
      if (!isVisible || prefersReducedMotion) {
        return;
      }

      const deltaTime = Math.min(now - lastTime, 40);
      lastTime = now;

      // Smooth pointer lerp
      const lerpFactor = 0.05;
      const timeSinceActive = now - pointer.lastActiveTime;

      if (!pointer.isHovered || timeSinceActive > 3000) {
        const autoTime = now * 0.0006;
        pointer.targetX = 0.5 + Math.sin(autoTime) * 0.10 + Math.cos(autoTime * 0.6) * 0.05;
        pointer.targetY = 0.5 + Math.cos(autoTime * 0.75) * 0.08 + Math.sin(autoTime * 0.4) * 0.04;
        pointer.targetAuraAlpha = 0.35;
      }

      pointer.currentX += (pointer.targetX - pointer.currentX) * lerpFactor;
      pointer.currentY += (pointer.targetY - pointer.currentY) * lerpFactor;
      pointer.currentAuraAlpha += (pointer.targetAuraAlpha - pointer.currentAuraAlpha) * lerpFactor;

      pointer.pixelX = pointer.currentX * width;
      pointer.pixelY = pointer.currentY * height;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const parallaxX = (pointer.currentX - 0.5) * 28;
      const parallaxY = (pointer.currentY - 0.5) * 24;

      // 1. Ambient Left Green & Right Gold Radiant Glows
      const leftGlow = ctx.createRadialGradient(
        width * 0.22 + parallaxX * 0.5,
        height * 0.48 + parallaxY * 0.5,
        30,
        width * 0.22 + parallaxX * 0.5,
        height * 0.48 + parallaxY * 0.5,
        Math.max(width, height) * 0.45
      );
      leftGlow.addColorStop(0, 'rgba(16, 185, 129, 0.095)');
      leftGlow.addColorStop(0.4, 'rgba(16, 185, 129, 0.035)');
      leftGlow.addColorStop(0.8, 'rgba(16, 185, 129, 0.008)');
      leftGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
      ctx.fillStyle = leftGlow;
      ctx.fillRect(0, 0, width, height);

      const rightGlow = ctx.createRadialGradient(
        width * 0.78 + parallaxX * 0.5,
        height * 0.52 + parallaxY * 0.5,
        30,
        width * 0.78 + parallaxX * 0.5,
        height * 0.52 + parallaxY * 0.5,
        Math.max(width, height) * 0.45
      );
      rightGlow.addColorStop(0, 'rgba(245, 158, 11, 0.085)');
      rightGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.030)');
      rightGlow.addColorStop(0.8, 'rgba(245, 158, 11, 0.008)');
      rightGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
      ctx.fillStyle = rightGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Cursor Spotlight Aura
      if (pointer.currentAuraAlpha > 0.01) {
        const aura = ctx.createRadialGradient(
          pointer.pixelX,
          pointer.pixelY,
          5,
          pointer.pixelX,
          pointer.pixelY,
          180
        );
        aura.addColorStop(0, `rgba(16, 185, 129, ${0.06 * pointer.currentAuraAlpha})`);
        aura.addColorStop(0.4, `rgba(245, 158, 11, ${0.03 * pointer.currentAuraAlpha})`);
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = aura;
        ctx.fillRect(0, 0, width, height);
      }

      // 3. Render Orbital Curves
      paths.forEach((p) => {
        p.rotation += p.rotationSpeed * (deltaTime / 16);
        p.dashOffset -= 0.15 * (deltaTime / 16);

        const cx = width * (p.side === 'left' ? 0.25 + p.centerXOffset : 0.75 + p.centerXOffset) + parallaxX * (p.side === 'left' ? 0.7 : 0.9);
        const cy = height * 0.5 + parallaxY * (p.side === 'left' ? 0.7 : 0.9);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(p.rotation);

        // Soft outer glow stroke
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.glowColor;
        ctx.lineWidth = 3.5;
        ctx.stroke();

        // Crisp thin inner line
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.restore();
      });

      // 4. Render Luminous Nodes / Beads
      const attractionRadius = 160;
      const attractionRadiusSq = attractionRadius * attractionRadius;

      nodes.forEach((n) => {
        const p = paths[n.pathIndex];
        if (!p) return;

        n.angle += n.speed * (deltaTime / 16);

        const rx = p.radiusX + n.radiusOffset;
        const ry = p.radiusY + n.radiusOffset;

        const cosRot = Math.cos(p.rotation);
        const sinRot = Math.sin(p.rotation);
        const cosA = Math.cos(n.angle);
        const sinA = Math.sin(n.angle);

        const xBase = rx * cosA;
        const yBase = ry * sinA;

        const pathCenterX = width * (p.side === 'left' ? 0.25 + p.centerXOffset : 0.75 + p.centerXOffset) + parallaxX * (p.side === 'left' ? 0.7 : 0.9);
        const pathCenterY = height * 0.5 + parallaxY * (p.side === 'left' ? 0.7 : 0.9);

        const worldX = pathCenterX + (xBase * cosRot - yBase * sinRot);
        const worldY = pathCenterY + (xBase * sinRot + yBase * cosRot);

        // Mouse attraction
        const distDx = worldX + n.dx - pointer.pixelX;
        const distDy = worldY + n.dy - pointer.pixelY;
        const distSq = distDx * distDx + distDy * distDy;

        if (distSq < attractionRadiusSq && pointer.currentAuraAlpha > 0.1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / attractionRadius) * 18 * pointer.currentAuraAlpha;
          const targetDx = -(distDx / (dist || 1)) * force;
          const targetDy = -(distDy / (dist || 1)) * force;
          n.vx += (targetDx - n.dx) * 0.08;
          n.vy += (targetDy - n.dy) * 0.08;
        } else {
          n.vx += (0 - n.dx) * 0.05;
          n.vy += (0 - n.dy) * 0.05;
        }

        n.vx *= 0.85;
        n.vy *= 0.85;
        n.dx += n.vx;
        n.dy += n.vy;

        const pulse = Math.sin(now * n.pulseSpeed + n.pulsePhase);
        drawLuminousNode(worldX + n.dx, worldY + n.dy, n.size, n.type, pulse);
      });

      // 5. Render Realistic Coffee Beans
      beans.forEach((b) => {
        b.rotation += b.rotSpeed * (deltaTime / 16);
        const drift = Math.sin(now * b.driftSpeed + b.driftPhase) * 4;

        const bx = width * b.baseXRatio + parallaxX * (b.side === 'left' ? 0.85 : 1.1) + b.dx;
        const by = height * b.baseYRatio + parallaxY * (b.side === 'left' ? 0.85 : 1.1) + drift + b.dy;

        // Subtle mouse repulsion/wobble for beans
        const distDx = bx - pointer.pixelX;
        const distDy = by - pointer.pixelY;
        const distSq = distDx * distDx + distDy * distDy;

        if (distSq < 150 * 150 && pointer.currentAuraAlpha > 0.1) {
          const dist = Math.sqrt(distSq);
          const force = (1 - dist / 150) * 14 * pointer.currentAuraAlpha;
          const targetDx = (distDx / (dist || 1)) * force;
          const targetDy = (distDy / (dist || 1)) * force;
          b.vx += (targetDx - b.dx) * 0.07;
          b.vy += (targetDy - b.dy) * 0.07;
        } else {
          b.vx += (0 - b.dx) * 0.05;
          b.vy += (0 - b.dy) * 0.05;
        }

        b.vx *= 0.85;
        b.vy *= 0.85;
        b.dx += b.vx;
        b.dy += b.vy;

        drawRealisticCoffeeBean(bx, by, b.size, b.rotation);
      });

      // 6. Render Stardust Particles
      dust.forEach((d) => {
        d.xRatio += d.speedX * (deltaTime / 16);
        d.yRatio += d.speedY * (deltaTime / 16);

        if (d.xRatio < 0) d.xRatio = 1;
        if (d.xRatio > 1) d.xRatio = 0;
        if (d.yRatio < 0) d.yRatio = 1;
        if (d.yRatio > 1) d.yRatio = 0;

        const dx = width * d.xRatio + parallaxX * 0.4;
        const dy = height * d.yRatio + parallaxY * 0.4;

        const twinkle = Math.sin(now * 0.002 + d.phase) * 0.35 + 0.65;
        const finalAlpha = d.alpha * twinkle;

        ctx.beginPath();
        ctx.arc(dx, dy, d.size, 0, Math.PI * 2);

        if (d.color === 'green') {
          ctx.fillStyle = `rgba(16, 185, 129, ${finalAlpha})`;
        } else if (d.color === 'gold') {
          ctx.fillStyle = `rgba(251, 191, 36, ${finalAlpha})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${finalAlpha * 0.85})`;
        }
        ctx.fill();
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    // IntersectionObserver
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && !prefersReducedMotion) {
            cancelAnimationFrame(animationFrameId);
            lastTime = performance.now();
            animationFrameId = requestAnimationFrame(render);
          } else {
            cancelAnimationFrame(animationFrameId);
          }
        });
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(container);

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      mediaQuery.removeEventListener?.('change', handleMotionChange);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      document.removeEventListener('mouseleave', handlePointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block pointer-events-none"
      />
    </div>
  );
};
