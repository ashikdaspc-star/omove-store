import React, { useEffect, useRef } from 'react';

interface CoffeeOrbitCanvasProps {
  className?: string;
}

interface OrbitalPath {
  id: number;
  side: 'left' | 'right' | 'center';
  centerOffsetX: number;
  centerOffsetY: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  glowColor: string;
  lineWidth: number;
}

type ParticleType =
  | 'green-node'
  | 'gold-node'
  | 'amber-node'
  | 'rose-node'
  | 'dot'
  | 'bean'
  | 'sparkle'
  | 'ember';

interface OrbitParticle {
  pathIndex: number;
  progress: number;
  speed: number;
  size: number;
  type: ParticleType;
  pulsePhase: number;
  pulseSpeed: number;
  beanRotation: number;
  beanRotSpeed: number;
  tumblePhase: number;
  tumbleSpeed: number;
  roastType: 'dark' | 'medium' | 'gold';
  magnetX: number;
  magnetY: number;
}

interface FloatingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  type: 'stardust' | 'sparkle' | 'ember' | 'floating-bean';
  color: string;
  pulsePhase: number;
  pulseSpeed: number;
  rotation: number;
  rotSpeed: number;
  tumblePhase: number;
  tumbleSpeed: number;
  depth: number;
  roastType: 'dark' | 'medium' | 'gold';
  wobbleSpeed: number;
  wobbleAmp: number;
  magnetX: number;
  magnetY: number;
}

interface CursorSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  isGreen: boolean;
  alpha: number;
  decay: number;
  rotation: number;
  rotSpeed: number;
}

// Pre-rendered offscreen sprite cache for 60-144fps GPU accelerated rendering
interface SpriteCache {
  beans: Record<'dark' | 'medium' | 'gold', HTMLCanvasElement>;
  nodes: Record<'green-node' | 'gold-node' | 'amber-node' | 'rose-node', HTMLCanvasElement>;
  sparkleGreen: HTMLCanvasElement;
  sparkleGold: HTMLCanvasElement;
  ember: HTMLCanvasElement;
  cursorAura: HTMLCanvasElement;
  cursorCore: HTMLCanvasElement;
  bgGlow: HTMLCanvasElement;
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
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        drawStaticFrame();
      }
    };
    mediaQuery.addEventListener?.('change', handleMotionChange);

    // Pointer Tracking State with responsive lerping
    const pointer = {
      targetNormX: 0,
      targetNormY: 0,
      targetPixelX: width * 0.5,
      targetPixelY: height * 0.5,
      targetGlowAlpha: 0,

      smoothNormX: 0,
      smoothNormY: 0,
      smoothPixelX: width * 0.5,
      smoothPixelY: height * 0.5,
      smoothGlowAlpha: 0,

      isInside: false,
      lastEmitX: width * 0.5,
      lastEmitY: height * 0.5,
    };

    let paths: OrbitalPath[] = [];
    let particles: OrbitParticle[] = [];
    let floatingParticles: FloatingParticle[] = [];
    let cursorSparks: CursorSpark[] = [];
    let spriteCache: SpriteCache | null = null;

    // =========================================================================
    // OFFSCREEN SPRITE GENERATION (Executed once on init/resize)
    // =========================================================================
    const generateSprites = (w: number, h: number): SpriteCache => {
      const createOffscreen = (sizeW: number, sizeH: number) => {
        const c = document.createElement('canvas');
        c.width = Math.ceil(sizeW * dpr);
        c.height = Math.ceil(sizeH * dpr);
        const sCtx = c.getContext('2d');
        if (sCtx) {
          sCtx.scale(dpr, dpr);
        }
        return { canvas: c, ctx: sCtx! };
      };

      // 1. Pre-render Coffee Beans (Dark, Medium, Gold)
      const renderBeanSprite = (roast: 'dark' | 'medium' | 'gold'): HTMLCanvasElement => {
        const { canvas: c, ctx: sCtx } = createOffscreen(48, 48);
        const size = 15;
        const cx = 24;
        const cy = 24;

        sCtx.save();
        sCtx.translate(cx, cy);

        // Soft ambient drop shadow
        sCtx.beginPath();
        sCtx.ellipse(0.8, 1.4, size * 1.28, size * 0.84, 0, 0, Math.PI * 2);
        sCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        sCtx.fill();

        // 3D Body Radial Gradient
        const beanGrad = sCtx.createRadialGradient(-size * 0.35, -size * 0.35, size * 0.12, 0, 0, size * 1.30);
        if (roast === 'dark') {
          beanGrad.addColorStop(0, '#662f13');
          beanGrad.addColorStop(0.55, '#3b1706');
          beanGrad.addColorStop(1, '#1e0a02');
        } else if (roast === 'gold') {
          beanGrad.addColorStop(0, '#9c5620');
          beanGrad.addColorStop(0.55, '#6b3510');
          beanGrad.addColorStop(1, '#3b1804');
        } else {
          beanGrad.addColorStop(0, '#7f3f1a');
          beanGrad.addColorStop(0.55, '#4f240b');
          beanGrad.addColorStop(1, '#260e03');
        }

        sCtx.beginPath();
        sCtx.ellipse(0, 0, size * 1.26, size * 0.82, 0, 0, Math.PI * 2);
        sCtx.fillStyle = beanGrad;
        sCtx.fill();

        // Shoulder Specular Highlight
        sCtx.beginPath();
        sCtx.ellipse(-size * 0.22, -size * 0.28, size * 0.55, size * 0.24, -0.3, 0, Math.PI * 2);
        sCtx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        sCtx.fill();

        // Deep Center Fissure
        sCtx.beginPath();
        sCtx.moveTo(-size * 0.96, 0);
        sCtx.bezierCurveTo(-size * 0.32, size * 0.38, size * 0.32, -size * 0.38, size * 0.96, 0);
        sCtx.lineWidth = 1.1;
        sCtx.strokeStyle = '#120401';
        sCtx.stroke();

        // Crema Golden Lip Highlight
        sCtx.beginPath();
        sCtx.moveTo(-size * 0.78, 0.1);
        sCtx.bezierCurveTo(-size * 0.24, size * 0.28, size * 0.24, -size * 0.28, size * 0.78, 0.1);
        sCtx.lineWidth = 0.55;
        sCtx.strokeStyle = 'rgba(254, 240, 199, 0.80)';
        sCtx.stroke();

        sCtx.restore();
        return c;
      };

      // 2. Pre-render Luminous Nodes
      const renderNodeSprite = (type: 'green-node' | 'gold-node' | 'amber-node' | 'rose-node'): HTMLCanvasElement => {
        const { canvas: c, ctx: sCtx } = createOffscreen(56, 56);
        const cx = 28;
        const cy = 28;
        const size = 6.5;

        sCtx.save();

        // Outer Aura Glow
        const glowGrad = sCtx.createRadialGradient(cx, cy, 0, cx, cy, 26);
        if (type === 'green-node') {
          glowGrad.addColorStop(0, 'rgba(16, 185, 129, 0.40)');
          glowGrad.addColorStop(0.45, 'rgba(16, 185, 129, 0.10)');
          glowGrad.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else if (type === 'rose-node') {
          glowGrad.addColorStop(0, 'rgba(244, 63, 94, 0.38)');
          glowGrad.addColorStop(0.45, 'rgba(244, 63, 94, 0.09)');
          glowGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
        } else {
          glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.42)');
          glowGrad.addColorStop(0.45, 'rgba(245, 158, 11, 0.11)');
          glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
        }
        sCtx.fillStyle = glowGrad;
        sCtx.beginPath();
        sCtx.arc(cx, cy, 26, 0, Math.PI * 2);
        sCtx.fill();

        // Resonance Halo Ring
        sCtx.beginPath();
        sCtx.arc(cx, cy, 12, 0, Math.PI * 2);
        sCtx.strokeStyle =
          type === 'green-node'
            ? 'rgba(52, 211, 153, 0.45)'
            : type === 'rose-node'
            ? 'rgba(251, 113, 133, 0.45)'
            : 'rgba(251, 191, 36, 0.50)';
        sCtx.lineWidth = 1.0;
        sCtx.stroke();

        // Core Sphere
        const sphereGrad = sCtx.createRadialGradient(cx - 2, cy - 2, 0.5, cx, cy, size);
        if (type === 'green-node') {
          sphereGrad.addColorStop(0, '#ffffff');
          sphereGrad.addColorStop(0.3, '#34d399');
          sphereGrad.addColorStop(0.8, '#059669');
          sphereGrad.addColorStop(1, '#064e3b');
        } else if (type === 'rose-node') {
          sphereGrad.addColorStop(0, '#ffffff');
          sphereGrad.addColorStop(0.3, '#fb7185');
          sphereGrad.addColorStop(0.8, '#e11d48');
          sphereGrad.addColorStop(1, '#881337');
        } else {
          sphereGrad.addColorStop(0, '#ffffff');
          sphereGrad.addColorStop(0.3, '#fbbf24');
          sphereGrad.addColorStop(0.8, '#d97706');
          sphereGrad.addColorStop(1, '#78350f');
        }
        sCtx.fillStyle = sphereGrad;
        sCtx.beginPath();
        sCtx.arc(cx, cy, size, 0, Math.PI * 2);
        sCtx.fill();

        sCtx.restore();
        return c;
      };

      // 3. Pre-render 4-Point Diamond Sparkles
      const renderSparkleSprite = (isGreen: boolean): HTMLCanvasElement => {
        const { canvas: c, ctx: sCtx } = createOffscreen(40, 40);
        const cx = 20;
        const cy = 20;
        const flareLength = 15;
        const flareWidth = 3.6;
        const color = isGreen ? 'rgba(52, 211, 153, 0.95)' : 'rgba(251, 191, 36, 0.95)';

        sCtx.save();
        sCtx.translate(cx, cy);

        // Soft Center Glow
        const haloGrad = sCtx.createRadialGradient(0, 0, 0, 0, 0, 18);
        haloGrad.addColorStop(0, color);
        haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        sCtx.fillStyle = haloGrad;
        sCtx.beginPath();
        sCtx.arc(0, 0, 18, 0, Math.PI * 2);
        sCtx.fill();

        // 4-Point Diamond Flare
        sCtx.fillStyle = color;

        sCtx.beginPath();
        sCtx.moveTo(0, -flareLength);
        sCtx.lineTo(flareWidth, 0);
        sCtx.lineTo(0, flareLength);
        sCtx.lineTo(-flareWidth, 0);
        sCtx.closePath();
        sCtx.fill();

        sCtx.beginPath();
        sCtx.moveTo(-flareLength, 0);
        sCtx.lineTo(0, flareWidth);
        sCtx.lineTo(flareLength, 0);
        sCtx.lineTo(0, -flareWidth);
        sCtx.closePath();
        sCtx.fill();

        // White core
        sCtx.beginPath();
        sCtx.arc(0, 0, 2.2, 0, Math.PI * 2);
        sCtx.fillStyle = '#ffffff';
        sCtx.fill();

        sCtx.restore();
        return c;
      };

      // 4. Pre-render Aroma Ember Sprite
      const renderEmberSprite = (): HTMLCanvasElement => {
        const { canvas: c, ctx: sCtx } = createOffscreen(32, 32);
        const cx = 16;
        const cy = 16;

        sCtx.save();
        const aura = sCtx.createRadialGradient(cx, cy, 0, cx, cy, 14);
        aura.addColorStop(0, 'rgba(245, 158, 11, 0.50)');
        aura.addColorStop(0.5, 'rgba(217, 119, 6, 0.16)');
        aura.addColorStop(1, 'rgba(245, 158, 11, 0)');
        sCtx.fillStyle = aura;
        sCtx.beginPath();
        sCtx.arc(cx, cy, 14, 0, Math.PI * 2);
        sCtx.fill();

        sCtx.beginPath();
        sCtx.arc(cx, cy, 3.5, 0, Math.PI * 2);
        sCtx.fillStyle = '#fef08a';
        sCtx.fill();

        sCtx.restore();
        return c;
      };

      // 5. Pre-render Compact, Refined Cursor Aura Sprite (160x160)
      const renderCursorAura = (): HTMLCanvasElement => {
        const { canvas: c, ctx: sCtx } = createOffscreen(160, 160);
        const cx = 80;
        const cy = 80;

        sCtx.save();
        const broadAura = sCtx.createRadialGradient(cx, cy, 0, cx, cy, 80);
        broadAura.addColorStop(0, 'rgba(16, 185, 129, 0.14)');
        broadAura.addColorStop(0.35, 'rgba(245, 158, 11, 0.06)');
        broadAura.addColorStop(0.70, 'rgba(52, 211, 153, 0.02)');
        broadAura.addColorStop(1, 'rgba(16, 185, 129, 0)');
        sCtx.fillStyle = broadAura;
        sCtx.fillRect(0, 0, 160, 160);
        sCtx.restore();
        return c;
      };

      // 6. Pre-render Compact Cursor Core Spotlight (64x64)
      const renderCursorCore = (): HTMLCanvasElement => {
        const { canvas: c, ctx: sCtx } = createOffscreen(64, 64);
        const cx = 32;
        const cy = 32;

        sCtx.save();
        const coreHalo = sCtx.createRadialGradient(cx, cy, 0, cx, cy, 32);
        coreHalo.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        coreHalo.addColorStop(0.40, 'rgba(16, 185, 129, 0.14)');
        coreHalo.addColorStop(0.75, 'rgba(245, 158, 11, 0.05)');
        coreHalo.addColorStop(1, 'rgba(245, 158, 11, 0)');
        sCtx.fillStyle = coreHalo;
        sCtx.beginPath();
        sCtx.arc(cx, cy, 32, 0, Math.PI * 2);
        sCtx.fill();
        sCtx.restore();
        return c;
      };

      // 7. Pre-render Background Ambient Glow Canvas
      const renderBgGlow = (bgW: number, bgH: number): HTMLCanvasElement => {
        const halfW = Math.ceil(bgW * 0.5);
        const halfH = Math.ceil(bgH * 0.5);
        const c = document.createElement('canvas');
        c.width = halfW;
        c.height = halfH;
        const sCtx = c.getContext('2d');
        if (!sCtx) return c;

        const cx = halfW * 0.5;
        const cy = halfH * 0.5;

        // Left Glow
        const leftGlow = sCtx.createRadialGradient(
          cx - halfW * 0.18,
          cy,
          20,
          cx - halfW * 0.18,
          cy,
          Math.max(halfW, halfH) * 0.50
        );
        leftGlow.addColorStop(0, 'rgba(16, 185, 129, 0.065)');
        leftGlow.addColorStop(0.4, 'rgba(16, 185, 129, 0.018)');
        leftGlow.addColorStop(0.8, 'rgba(16, 185, 129, 0.002)');
        leftGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
        sCtx.fillStyle = leftGlow;
        sCtx.fillRect(0, 0, halfW, halfH);

        // Right Glow
        const rightGlow = sCtx.createRadialGradient(
          cx + halfW * 0.18,
          cy,
          20,
          cx + halfW * 0.18,
          cy,
          Math.max(halfW, halfH) * 0.50
        );
        rightGlow.addColorStop(0, 'rgba(245, 158, 11, 0.060)');
        rightGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.016)');
        rightGlow.addColorStop(0.8, 'rgba(245, 158, 11, 0.002)');
        rightGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
        sCtx.fillStyle = rightGlow;
        sCtx.fillRect(0, 0, halfW, halfH);

        return c;
      };

      return {
        beans: {
          dark: renderBeanSprite('dark'),
          medium: renderBeanSprite('medium'),
          gold: renderBeanSprite('gold'),
        },
        nodes: {
          'green-node': renderNodeSprite('green-node'),
          'gold-node': renderNodeSprite('gold-node'),
          'amber-node': renderNodeSprite('amber-node'),
          'rose-node': renderNodeSprite('rose-node'),
        },
        sparkleGreen: renderSparkleSprite(true),
        sparkleGold: renderSparkleSprite(false),
        ember: renderEmberSprite(),
        cursorAura: renderCursorAura(),
        cursorCore: renderCursorCore(),
        bgGlow: renderBgGlow(w, h),
      };
    };

    const initEntities = (w: number, h: number) => {
      const isMobile = w < 768;
      const baseScale = Math.min(w, h);

      // Orbital Paths
      if (isMobile) {
        paths = [
          { id: 0, side: 'left', centerOffsetX: -w * 0.08, centerOffsetY: -5, radiusX: 160, radiusY: 115, rotation: -0.25, rotationSpeed: 0.00010, color: 'rgba(16, 185, 129, 0.22)', glowColor: 'rgba(16, 185, 129, 0.04)', lineWidth: 0.85 },
          { id: 1, side: 'left', centerOffsetX: -w * 0.12, centerOffsetY: 10, radiusX: 230, radiusY: 165, rotation: -0.15, rotationSpeed: -0.00008, color: 'rgba(5, 150, 105, 0.18)', glowColor: 'rgba(16, 185, 129, 0.03)', lineWidth: 0.80 },
          { id: 2, side: 'left', centerOffsetX: -w * 0.15, centerOffsetY: 20, radiusX: 300, radiusY: 215, rotation: -0.32, rotationSpeed: 0.00006, color: 'rgba(52, 211, 153, 0.15)', glowColor: 'rgba(52, 211, 153, 0.025)', lineWidth: 0.75 },

          { id: 3, side: 'right', centerOffsetX: w * 0.08, centerOffsetY: 5, radiusX: 170, radiusY: 120, rotation: 0.22, rotationSpeed: -0.00010, color: 'rgba(245, 158, 11, 0.24)', glowColor: 'rgba(245, 158, 11, 0.04)', lineWidth: 0.85 },
          { id: 4, side: 'right', centerOffsetX: w * 0.12, centerOffsetY: -10, radiusX: 240, radiusY: 175, rotation: 0.14, rotationSpeed: 0.00008, color: 'rgba(217, 119, 6, 0.19)', glowColor: 'rgba(245, 158, 11, 0.03)', lineWidth: 0.80 },
          { id: 5, side: 'right', centerOffsetX: w * 0.15, centerOffsetY: -18, radiusX: 310, radiusY: 225, rotation: 0.28, rotationSpeed: -0.00006, color: 'rgba(251, 191, 36, 0.15)', glowColor: 'rgba(251, 191, 36, 0.025)', lineWidth: 0.75 },

          { id: 6, side: 'center', centerOffsetX: 0, centerOffsetY: -20, radiusX: 280, radiusY: 195, rotation: 0.06, rotationSpeed: 0.00005, color: 'rgba(202, 138, 4, 0.15)', glowColor: 'rgba(202, 138, 4, 0.02)', lineWidth: 0.75 },
          { id: 7, side: 'center', centerOffsetX: 0, centerOffsetY: 20, radiusX: 350, radiusY: 250, rotation: -0.05, rotationSpeed: -0.00004, color: 'rgba(16, 185, 129, 0.14)', glowColor: 'rgba(16, 185, 129, 0.02)', lineWidth: 0.75 },
        ];
      } else {
        paths = [
          { id: 0, side: 'left', centerOffsetX: -w * 0.05, centerOffsetY: -10, radiusX: Math.max(220, baseScale * 0.32), radiusY: Math.max(145, baseScale * 0.21), rotation: -0.26, rotationSpeed: 0.000095, color: 'rgba(16, 185, 129, 0.24)', glowColor: 'rgba(16, 185, 129, 0.045)', lineWidth: 0.90 },
          { id: 1, side: 'left', centerOffsetX: -w * 0.09, centerOffsetY: 15, radiusX: Math.max(310, baseScale * 0.44), radiusY: Math.max(200, baseScale * 0.29), rotation: -0.17, rotationSpeed: -0.000075, color: 'rgba(5, 150, 105, 0.20)', glowColor: 'rgba(16, 185, 129, 0.035)', lineWidth: 0.85 },
          { id: 2, side: 'left', centerOffsetX: -w * 0.13, centerOffsetY: -20, radiusX: Math.max(420, baseScale * 0.59), radiusY: Math.max(265, baseScale * 0.37), rotation: -0.34, rotationSpeed: 0.000055, color: 'rgba(52, 211, 153, 0.17)', glowColor: 'rgba(52, 211, 153, 0.030)', lineWidth: 0.80 },
          { id: 3, side: 'left', centerOffsetX: -w * 0.17, centerOffsetY: 25, radiusX: Math.max(530, baseScale * 0.74), radiusY: Math.max(330, baseScale * 0.46), rotation: -0.11, rotationSpeed: -0.000045, color: 'rgba(16, 185, 129, 0.14)', glowColor: 'rgba(16, 185, 129, 0.022)', lineWidth: 0.75 },
          { id: 4, side: 'left', centerOffsetX: -w * 0.21, centerOffsetY: -15, radiusX: Math.max(640, baseScale * 0.88), radiusY: Math.max(395, baseScale * 0.54), rotation: -0.22, rotationSpeed: 0.000035, color: 'rgba(5, 150, 105, 0.11)', glowColor: 'rgba(5, 150, 105, 0.018)', lineWidth: 0.70 },

          { id: 5, side: 'right', centerOffsetX: w * 0.05, centerOffsetY: 10, radiusX: Math.max(230, baseScale * 0.33), radiusY: Math.max(150, baseScale * 0.22), rotation: 0.25, rotationSpeed: -0.000095, color: 'rgba(245, 158, 11, 0.26)', glowColor: 'rgba(245, 158, 11, 0.050)', lineWidth: 0.90 },
          { id: 6, side: 'right', centerOffsetX: w * 0.09, centerOffsetY: -15, radiusX: Math.max(320, baseScale * 0.45), radiusY: Math.max(205, baseScale * 0.30), rotation: 0.15, rotationSpeed: 0.000075, color: 'rgba(217, 119, 6, 0.21)', glowColor: 'rgba(245, 158, 11, 0.038)', lineWidth: 0.85 },
          { id: 7, side: 'right', centerOffsetX: w * 0.13, centerOffsetY: 20, radiusX: Math.max(430, baseScale * 0.60), radiusY: Math.max(270, baseScale * 0.38), rotation: 0.31, rotationSpeed: -0.000055, color: 'rgba(251, 191, 36, 0.18)', glowColor: 'rgba(251, 191, 36, 0.030)', lineWidth: 0.80 },
          { id: 8, side: 'right', centerOffsetX: w * 0.17, centerOffsetY: -25, radiusX: Math.max(540, baseScale * 0.75), radiusY: Math.max(335, baseScale * 0.47), rotation: 0.09, rotationSpeed: 0.000045, color: 'rgba(245, 158, 11, 0.14)', glowColor: 'rgba(245, 158, 11, 0.022)', lineWidth: 0.75 },
          { id: 9, side: 'right', centerOffsetX: w * 0.21, centerOffsetY: 15, radiusX: Math.max(650, baseScale * 0.89), radiusY: Math.max(400, baseScale * 0.55), rotation: 0.21, rotationSpeed: -0.000035, color: 'rgba(217, 119, 6, 0.11)', glowColor: 'rgba(217, 119, 6, 0.018)', lineWidth: 0.70 },

          { id: 10, side: 'center', centerOffsetX: 0, centerOffsetY: -35, radiusX: Math.max(390, baseScale * 0.55), radiusY: Math.max(240, baseScale * 0.34), rotation: 0.05, rotationSpeed: 0.000040, color: 'rgba(202, 138, 4, 0.16)', glowColor: 'rgba(202, 138, 4, 0.025)', lineWidth: 0.75 },
          { id: 11, side: 'center', centerOffsetX: 0, centerOffsetY: 35, radiusX: Math.max(450, baseScale * 0.62), radiusY: Math.max(280, baseScale * 0.39), rotation: -0.05, rotationSpeed: -0.000040, color: 'rgba(16, 185, 129, 0.15)', glowColor: 'rgba(16, 185, 129, 0.025)', lineWidth: 0.75 },
          { id: 12, side: 'center', centerOffsetX: 0, centerOffsetY: 0, radiusX: Math.max(580, baseScale * 0.80), radiusY: Math.max(360, baseScale * 0.50), rotation: 0.12, rotationSpeed: 0.000028, color: 'rgba(245, 158, 11, 0.12)', glowColor: 'rgba(245, 158, 11, 0.018)', lineWidth: 0.70 },
          { id: 13, side: 'center', centerOffsetX: 0, centerOffsetY: 0, radiusX: Math.max(720, baseScale * 0.98), radiusY: Math.max(450, baseScale * 0.62), rotation: -0.10, rotationSpeed: -0.000025, color: 'rgba(52, 211, 153, 0.11)', glowColor: 'rgba(52, 211, 153, 0.015)', lineWidth: 0.70 },
        ];
      }

      const numPaths = paths.length;
      const getPathSafe = (idx: number) => idx % numPaths;

      // Orbital Particles
      particles = [
        // Coffee Beans
        { pathIndex: getPathSafe(0), progress: 0.15, speed: 0.000024, size: 5.8, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.3, beanRotSpeed: 0.00008, tumblePhase: 0.2, tumbleSpeed: 0.0009, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(0), progress: 0.68, speed: -0.000022, size: 4.8, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.5, beanRotSpeed: -0.00007, tumblePhase: 1.4, tumbleSpeed: 0.0008, roastType: 'dark', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(1), progress: 0.38, speed: 0.000020, size: 6.2, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.6, beanRotSpeed: 0.00006, tumblePhase: 2.8, tumbleSpeed: 0.0007, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(1), progress: 0.88, speed: -0.000018, size: 4.5, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.8, beanRotSpeed: -0.00008, tumblePhase: 0.5, tumbleSpeed: 0.0010, roastType: 'dark', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(2), progress: 0.22, speed: 0.000017, size: 6.8, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 1.1, beanRotSpeed: 0.00007, tumblePhase: 3.2, tumbleSpeed: 0.0006, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(2), progress: 0.72, speed: -0.000019, size: 5.2, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.8, beanRotSpeed: -0.00006, tumblePhase: 1.8, tumbleSpeed: 0.0008, roastType: 'dark', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(3), progress: 0.45, speed: 0.000015, size: 7.2, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.4, beanRotSpeed: 0.00009, tumblePhase: 4.1, tumbleSpeed: 0.0007, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(4), progress: 0.12, speed: -0.000013, size: 5.6, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.7, beanRotSpeed: -0.00005, tumblePhase: 2.1, tumbleSpeed: 0.0005, roastType: 'gold', magnetX: 0, magnetY: 0 },

        { pathIndex: getPathSafe(5), progress: 0.28, speed: -0.000025, size: 5.5, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.4, beanRotSpeed: 0.00008, tumblePhase: 0.9, tumbleSpeed: 0.0009, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(5), progress: 0.78, speed: 0.000022, size: 4.6, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.5, beanRotSpeed: -0.00007, tumblePhase: 2.3, tumbleSpeed: 0.0008, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(6), progress: 0.18, speed: 0.000019, size: 6.4, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.9, beanRotSpeed: 0.00007, tumblePhase: 3.5, tumbleSpeed: 0.0007, roastType: 'dark', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(6), progress: 0.65, speed: -0.000017, size: 5.0, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.7, beanRotSpeed: -0.00006, tumblePhase: 1.1, tumbleSpeed: 0.0009, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(7), progress: 0.35, speed: -0.000016, size: 6.6, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.6, beanRotSpeed: 0.00008, tumblePhase: 4.8, tumbleSpeed: 0.0006, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(7), progress: 0.85, speed: 0.000018, size: 4.9, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -1.0, beanRotSpeed: -0.00007, tumblePhase: 0.7, tumbleSpeed: 0.0008, roastType: 'dark', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(8), progress: 0.52, speed: 0.000014, size: 7.0, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.3, beanRotSpeed: 0.00006, tumblePhase: 2.7, tumbleSpeed: 0.0005, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(9), progress: 0.25, speed: -0.000013, size: 5.8, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.6, beanRotSpeed: -0.00005, tumblePhase: 1.5, tumbleSpeed: 0.0006, roastType: 'dark', magnetX: 0, magnetY: 0 },

        { pathIndex: getPathSafe(10), progress: 0.10, speed: 0.000018, size: 6.0, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 0.8, beanRotSpeed: 0.00007, tumblePhase: 3.0, tumbleSpeed: 0.0008, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(10), progress: 0.60, speed: -0.000016, size: 5.3, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.4, beanRotSpeed: -0.00006, tumblePhase: 0.3, tumbleSpeed: 0.0007, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(11), progress: 0.40, speed: 0.000015, size: 6.5, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: 1.2, beanRotSpeed: 0.00008, tumblePhase: 2.0, tumbleSpeed: 0.0006, roastType: 'dark', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(12), progress: 0.75, speed: -0.000014, size: 5.7, type: 'bean', pulsePhase: 0, pulseSpeed: 0, beanRotation: -0.9, beanRotSpeed: -0.00007, tumblePhase: 4.5, tumbleSpeed: 0.0005, roastType: 'gold', magnetX: 0, magnetY: 0 },

        // Glowing Nodes
        { pathIndex: getPathSafe(0), progress: 0.35, speed: 0.000032, size: 3.4, type: 'green-node', pulsePhase: 0.2, pulseSpeed: 0.0022, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(1), progress: 0.60, speed: -0.000028, size: 3.8, type: 'green-node', pulsePhase: 2.4, pulseSpeed: 0.0018, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(2), progress: 0.08, speed: 0.000026, size: 3.2, type: 'green-node', pulsePhase: 4.1, pulseSpeed: 0.0020, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(3), progress: 0.82, speed: -0.000022, size: 3.6, type: 'green-node', pulsePhase: 1.5, pulseSpeed: 0.0019, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },

        { pathIndex: getPathSafe(5), progress: 0.50, speed: -0.000032, size: 3.4, type: 'gold-node', pulsePhase: 1.1, pulseSpeed: 0.0022, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(6), progress: 0.90, speed: 0.000028, size: 3.8, type: 'gold-node', pulsePhase: 3.6, pulseSpeed: 0.0018, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(7), progress: 0.12, speed: -0.000025, size: 3.2, type: 'amber-node', pulsePhase: 0.8, pulseSpeed: 0.0020, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(8), progress: 0.70, speed: 0.000022, size: 3.6, type: 'gold-node', pulsePhase: 2.9, pulseSpeed: 0.0019, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },

        { pathIndex: getPathSafe(10), progress: 0.85, speed: 0.000026, size: 3.6, type: 'rose-node', pulsePhase: 1.8, pulseSpeed: 0.0021, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(11), progress: 0.15, speed: -0.000024, size: 3.4, type: 'amber-node', pulsePhase: 3.2, pulseSpeed: 0.0019, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },

        // Sparkles
        { pathIndex: getPathSafe(0), progress: 0.82, speed: 0.000028, size: 4.2, type: 'sparkle', pulsePhase: 0.4, pulseSpeed: 0.0030, beanRotation: 0.1, beanRotSpeed: 0.00015, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(1), progress: 0.14, speed: -0.000025, size: 4.6, type: 'sparkle', pulsePhase: 1.8, pulseSpeed: 0.0028, beanRotation: 0.4, beanRotSpeed: -0.00012, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(2), progress: 0.50, speed: 0.000022, size: 4.0, type: 'sparkle', pulsePhase: 3.1, pulseSpeed: 0.0032, beanRotation: 0.7, beanRotSpeed: 0.00014, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(3), progress: 0.95, speed: -0.000020, size: 4.4, type: 'sparkle', pulsePhase: 4.6, pulseSpeed: 0.0029, beanRotation: -0.2, beanRotSpeed: -0.00016, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(5), progress: 0.05, speed: -0.000028, size: 4.2, type: 'sparkle', pulsePhase: 0.9, pulseSpeed: 0.0031, beanRotation: 0.3, beanRotSpeed: 0.00013, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(6), progress: 0.42, speed: 0.000025, size: 4.6, type: 'sparkle', pulsePhase: 2.2, pulseSpeed: 0.0027, beanRotation: -0.5, beanRotSpeed: -0.00015, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(7), progress: 0.60, speed: -0.000022, size: 4.0, type: 'sparkle', pulsePhase: 3.8, pulseSpeed: 0.0033, beanRotation: 0.8, beanRotSpeed: 0.00012, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(8), progress: 0.20, speed: 0.000020, size: 4.4, type: 'sparkle', pulsePhase: 5.0, pulseSpeed: 0.0030, beanRotation: -0.3, beanRotSpeed: -0.00014, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(10), progress: 0.35, speed: 0.000024, size: 4.4, type: 'sparkle', pulsePhase: 1.2, pulseSpeed: 0.0028, beanRotation: 0.6, beanRotSpeed: 0.00015, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(11), progress: 0.70, speed: -0.000023, size: 4.2, type: 'sparkle', pulsePhase: 2.7, pulseSpeed: 0.0032, beanRotation: -0.7, beanRotSpeed: -0.00013, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(12), progress: 0.25, speed: 0.000018, size: 4.6, type: 'sparkle', pulsePhase: 4.3, pulseSpeed: 0.0029, beanRotation: 0.2, beanRotSpeed: 0.00014, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(13), progress: 0.55, speed: -0.000017, size: 4.0, type: 'sparkle', pulsePhase: 0.7, pulseSpeed: 0.0031, beanRotation: -0.4, beanRotSpeed: -0.00015, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },

        // Embers
        { pathIndex: getPathSafe(0), progress: 0.48, speed: 0.000026, size: 2.6, type: 'ember', pulsePhase: 0.6, pulseSpeed: 0.0025, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(1), progress: 0.95, speed: -0.000022, size: 2.8, type: 'ember', pulsePhase: 1.9, pulseSpeed: 0.0023, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(2), progress: 0.35, speed: 0.000020, size: 2.4, type: 'ember', pulsePhase: 3.4, pulseSpeed: 0.0026, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(4), progress: 0.65, speed: -0.000018, size: 2.9, type: 'ember', pulsePhase: 4.8, pulseSpeed: 0.0022, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(5), progress: 0.40, speed: -0.000026, size: 2.6, type: 'ember', pulsePhase: 1.3, pulseSpeed: 0.0025, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(6), progress: 0.08, speed: 0.000022, size: 2.8, type: 'ember', pulsePhase: 2.6, pulseSpeed: 0.0024, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(7), progress: 0.50, speed: -0.000020, size: 2.4, type: 'ember', pulsePhase: 4.0, pulseSpeed: 0.0027, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(9), progress: 0.80, speed: 0.000018, size: 2.9, type: 'ember', pulsePhase: 5.3, pulseSpeed: 0.0022, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(10), progress: 0.48, speed: 0.000021, size: 2.7, type: 'ember', pulsePhase: 0.2, pulseSpeed: 0.0025, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(11), progress: 0.90, speed: -0.000019, size: 2.5, type: 'ember', pulsePhase: 1.7, pulseSpeed: 0.0024, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(12), progress: 0.15, speed: 0.000016, size: 2.8, type: 'ember', pulsePhase: 3.1, pulseSpeed: 0.0026, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(13), progress: 0.85, speed: -0.000015, size: 2.6, type: 'ember', pulsePhase: 4.5, pulseSpeed: 0.0023, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },

        // Dots
        { pathIndex: getPathSafe(0), progress: 0.25, speed: 0.000025, size: 1.8, type: 'dot', pulsePhase: 0.8, pulseSpeed: 0.0016, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(0), progress: 0.75, speed: -0.000021, size: 1.6, type: 'dot', pulsePhase: 2.2, pulseSpeed: 0.0015, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(1), progress: 0.45, speed: 0.000019, size: 1.9, type: 'dot', pulsePhase: 3.7, pulseSpeed: 0.0017, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(2), progress: 0.88, speed: -0.000018, size: 1.5, type: 'dot', pulsePhase: 1.1, pulseSpeed: 0.0014, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(3), progress: 0.30, speed: 0.000016, size: 2.0, type: 'dot', pulsePhase: 4.4, pulseSpeed: 0.0018, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(4), progress: 0.78, speed: -0.000014, size: 1.7, type: 'dot', pulsePhase: 2.8, pulseSpeed: 0.0015, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },

        { pathIndex: getPathSafe(5), progress: 0.15, speed: -0.000025, size: 1.8, type: 'dot', pulsePhase: 1.4, pulseSpeed: 0.0016, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(5), progress: 0.85, speed: 0.000021, size: 1.6, type: 'dot', pulsePhase: 3.0, pulseSpeed: 0.0015, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(6), progress: 0.55, speed: -0.000019, size: 1.9, type: 'dot', pulsePhase: 4.9, pulseSpeed: 0.0017, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(7), progress: 0.05, speed: 0.000018, size: 1.5, type: 'dot', pulsePhase: 0.5, pulseSpeed: 0.0014, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(8), progress: 0.62, speed: -0.000016, size: 2.0, type: 'dot', pulsePhase: 2.1, pulseSpeed: 0.0018, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(9), progress: 0.38, speed: 0.000014, size: 1.7, type: 'dot', pulsePhase: 3.9, pulseSpeed: 0.0015, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },

        { pathIndex: getPathSafe(10), progress: 0.22, speed: 0.000020, size: 1.8, type: 'dot', pulsePhase: 1.7, pulseSpeed: 0.0016, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(11), progress: 0.68, speed: -0.000018, size: 1.6, type: 'dot', pulsePhase: 3.3, pulseSpeed: 0.0015, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(12), progress: 0.45, speed: 0.000015, size: 1.7, type: 'dot', pulsePhase: 5.1, pulseSpeed: 0.0016, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'gold', magnetX: 0, magnetY: 0 },
        { pathIndex: getPathSafe(13), progress: 0.92, speed: -0.000014, size: 1.6, type: 'dot', pulsePhase: 0.9, pulseSpeed: 0.0015, beanRotation: 0, beanRotSpeed: 0, tumblePhase: 0, tumbleSpeed: 0, roastType: 'medium', magnetX: 0, magnetY: 0 },
      ];

      // Floating Ambient Particles
      const numFloating = isMobile ? 24 : 45;
      floatingParticles = [];

      for (let i = 0; i < numFloating; i++) {
        const isFloatingBean = i < (isMobile ? 3 : 6);
        const isSparkle = !isFloatingBean && i % 4 === 0;
        const isEmber = !isFloatingBean && !isSparkle && i % 3 === 0;

        const type = isFloatingBean
          ? 'floating-bean'
          : isSparkle
          ? 'sparkle'
          : isEmber
          ? 'ember'
          : 'stardust';

        const randX = Math.random() * w;
        const randY = Math.random() * h;
        const depth = 0.3 + Math.random() * 0.7;

        let color = 'rgba(255, 255, 255, 0.5)';
        if (randX < w * 0.45) {
          color = i % 2 === 0 ? 'rgba(16, 185, 129, 0.55)' : 'rgba(52, 211, 153, 0.50)';
        } else if (randX > w * 0.55) {
          color = i % 2 === 0 ? 'rgba(245, 158, 11, 0.58)' : 'rgba(251, 191, 36, 0.52)';
        } else {
          color = 'rgba(254, 243, 199, 0.65)';
        }

        const roastTypes: Array<'dark' | 'medium' | 'gold'> = ['dark', 'medium', 'gold'];
        const roastType = roastTypes[i % 3];

        floatingParticles.push({
          x: randX,
          y: randY,
          vx: (Math.random() - 0.5) * 0.08 * depth,
          vy: (Math.random() - 0.5) * 0.08 * depth,
          size: isFloatingBean
            ? 4.8 + Math.random() * 2.6
            : isSparkle
            ? 3.2 + Math.random() * 2.0
            : 1.2 + Math.random() * 1.8,
          type,
          color,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.0012 + Math.random() * 0.0020,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.00015,
          tumblePhase: Math.random() * Math.PI * 2,
          tumbleSpeed: 0.0004 + Math.random() * 0.0006,
          depth,
          roastType,
          wobbleSpeed: 0.0008 + Math.random() * 0.0012,
          wobbleAmp: 6 + Math.random() * 14,
          magnetX: 0,
          magnetY: 0,
        });
      }
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      if (canvas) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }

      spriteCache = generateSprites(width, height);
      initEntities(width, height);

      if (prefersReducedMotion) {
        drawStaticFrame();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const handlePointerMove = (e: PointerEvent) => {
      const clientX = e.clientX;
      const clientY = e.clientY;

      pointer.targetNormX = clientX / window.innerWidth - 0.5;
      pointer.targetNormY = clientY / window.innerHeight - 0.5;
      pointer.targetPixelX = clientX;
      pointer.targetPixelY = clientY;
      pointer.targetGlowAlpha = 1.0;
      pointer.isInside = true;

      // Spawn interactive cursor trail sparks on motion
      const distFromLast = Math.hypot(clientX - pointer.lastEmitX, clientY - pointer.lastEmitY);
      if (distFromLast > 12 && cursorSparks.length < 28) {
        pointer.lastEmitX = clientX;
        pointer.lastEmitY = clientY;
        const isGreen = clientX < window.innerWidth * 0.5;

        cursorSparks.push({
          x: clientX + (Math.random() - 0.5) * 5,
          y: clientY + (Math.random() - 0.5) * 5,
          vx: (Math.random() - 0.5) * 1.4,
          vy: (Math.random() - 0.5) * 1.4 - 0.3,
          size: 1.8 + Math.random() * 1.8,
          isGreen,
          alpha: 0.90,
          decay: 0.028 + Math.random() * 0.016,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.08,
        });
      }
    };

    const handlePointerLeave = () => {
      pointer.isInside = false;
      pointer.targetNormX = 0;
      pointer.targetNormY = 0;
      pointer.targetGlowAlpha = 0;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('blur', handlePointerLeave);

    // Static frame for reduced motion
    const drawStaticFrame = () => {
      if (!ctx || !spriteCache) return;
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // Draw background glow sprite
      ctx.drawImage(spriteCache.bgGlow, 0, 0, width, height);

      const centerX = width * 0.5;
      const centerY = height * 0.5;

      paths.forEach((p) => {
        ctx.save();
        ctx.translate(centerX + p.centerOffsetX, centerY + p.centerOffsetY);
        ctx.rotate(p.rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth;
        ctx.stroke();
        ctx.restore();
      });

      ctx.restore();
    };

    // Main 60-144fps GPU-Optimized Animation Loop
    let lastTime = performance.now();

    // Reusable fixed array for proximity constellation search (Zero garbage collection)
    const closestArray = [
      { x: 0, y: 0, dist: 9999, isLeft: true },
      { x: 0, y: 0, dist: 9999, isLeft: true },
      { x: 0, y: 0, dist: 9999, isLeft: true },
      { x: 0, y: 0, dist: 9999, isLeft: true },
    ];

    const render = (now: number) => {
      if (!isVisible || prefersReducedMotion || !spriteCache) {
        return;
      }

      const elapsed = now - lastTime;
      const deltaTime = Math.min(elapsed, 33);
      const dt = deltaTime / 16.667;
      lastTime = now;

      // Pointer Exponential Lerp
      pointer.smoothNormX += (pointer.targetNormX - pointer.smoothNormX) * (0.09 * dt);
      pointer.smoothNormY += (pointer.targetNormY - pointer.smoothNormY) * (0.09 * dt);
      pointer.smoothPixelX += (pointer.targetPixelX - pointer.smoothPixelX) * (0.14 * dt);
      pointer.smoothPixelY += (pointer.targetPixelY - pointer.smoothPixelY) * (0.14 * dt);
      pointer.smoothGlowAlpha += (pointer.targetGlowAlpha - pointer.smoothGlowAlpha) * (0.10 * dt);

      const baseX = width * 0.5;
      const baseY = height * 0.5;

      const layer1_GlowX = baseX + pointer.smoothNormX * 18;
      const layer1_GlowY = baseY + pointer.smoothNormY * 14;

      const layer2_OrbitX = baseX + pointer.smoothNormX * 36;
      const layer2_OrbitY = baseY + pointer.smoothNormY * 26;

      const layer3_ParticleX = baseX + pointer.smoothNormX * 52;
      const layer3_ParticleY = baseY + pointer.smoothNormY * 38;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      // LAYER 1: GPU Blit Background Ambient Atmosphere
      const bgShiftX = (layer1_GlowX - baseX) * 0.5;
      const bgShiftY = (layer1_GlowY - baseY) * 0.5;
      ctx.drawImage(spriteCache.bgGlow, bgShiftX, bgShiftY, width, height);

      // COMPACT CURSOR GLOW & REFINED RIPPLE RING (Scaled down & subtle)
      const gAlpha = pointer.smoothGlowAlpha;
      const cx = pointer.smoothPixelX;
      const cy = pointer.smoothPixelY;

      if (gAlpha > 0.02) {
        ctx.save();
        ctx.globalAlpha = gAlpha;

        // Compact Broad Aura (80px radius -> 160px drawn)
        ctx.drawImage(spriteCache.cursorAura, cx - 80, cy - 80, 160, 160);

        // Compact Core Spotlight (32px radius -> 64px drawn)
        ctx.drawImage(spriteCache.cursorCore, cx - 32, cy - 32, 64, 64);

        // Subtle, Compact Concentric Harmonic Ripples (Max 42px radius)
        const ripplePhase1 = (now * 0.0016) % 1;
        const rippleR1 = 12 + ripplePhase1 * 30;
        const rippleAlpha1 = (1 - ripplePhase1) * 0.22 * gAlpha;
        ctx.beginPath();
        ctx.arc(cx, cy, rippleR1, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(52, 211, 153, ${rippleAlpha1})`;
        ctx.lineWidth = 0.85;
        ctx.stroke();

        const ripplePhase2 = (now * 0.0016 + 0.5) % 1;
        const rippleR2 = 12 + ripplePhase2 * 30;
        const rippleAlpha2 = (1 - ripplePhase2) * 0.16 * gAlpha;
        ctx.beginPath();
        ctx.arc(cx, cy, rippleR2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(251, 191, 36, ${rippleAlpha2})`;
        ctx.lineWidth = 0.75;
        ctx.stroke();

        ctx.restore();
      }

      // RENDER CURSOR SPARK TRAILS
      for (let i = cursorSparks.length - 1; i >= 0; i--) {
        const sp = cursorSparks[i];
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.rotation += sp.rotSpeed * dt;
        sp.alpha -= sp.decay * dt;

        if (sp.alpha <= 0.01) {
          cursorSparks[i] = cursorSparks[cursorSparks.length - 1];
          cursorSparks.pop();
          continue;
        }

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rotation);
        ctx.globalAlpha = sp.alpha;

        const sprite = sp.isGreen ? spriteCache.sparkleGreen : spriteCache.sparkleGold;
        const drawSize = sp.size * 3.4;
        ctx.drawImage(sprite, -drawSize * 0.5, -drawSize * 0.5, drawSize, drawSize);

        ctx.restore();
      }

      // LAYER 1.5: Free-Floating Ambient Background Particles
      const cursorRadius = 320;

      for (let i = 0; i < floatingParticles.length; i++) {
        const fp = floatingParticles[i];
        fp.x += fp.vx * dt;
        fp.y += fp.vy * dt;

        const wobbleX = Math.sin(now * fp.wobbleSpeed + fp.pulsePhase) * fp.wobbleAmp * 0.025;
        const wobbleY = Math.cos(now * fp.wobbleSpeed + fp.pulsePhase) * fp.wobbleAmp * 0.025;
        fp.x += wobbleX;
        fp.y += wobbleY;

        const margin = 60;
        if (fp.x < -margin) fp.x = width + margin;
        if (fp.x > width + margin) fp.x = -margin;
        if (fp.y < -margin) fp.y = height + margin;
        if (fp.y > height + margin) fp.y = -margin;

        const baseWorldX = fp.x + pointer.smoothNormX * 45 * fp.depth;
        const baseWorldY = fp.y + pointer.smoothNormY * 30 * fp.depth;

        // Interactive Magnetic Physics
        const fDistDx = cx - baseWorldX;
        const fDistDy = cy - baseWorldY;
        const fDist = Math.hypot(fDistDx, fDistDy);

        if (fDist < cursorRadius && gAlpha > 0.05) {
          const fForceRatio = Math.pow(1 - fDist / cursorRadius, 1.4);
          const fForce = fForceRatio * 32 * fp.depth * gAlpha;
          const targetFMagX = (fDistDx / (fDist || 1)) * fForce;
          const targetFMagY = (fDistDy / (fDist || 1)) * fForce;

          fp.magnetX += (targetFMagX - fp.magnetX) * (0.14 * dt);
          fp.magnetY += (targetFMagY - fp.magnetY) * (0.14 * dt);
        } else {
          fp.magnetX += (0 - fp.magnetX) * (0.06 * dt);
          fp.magnetY += (0 - fp.magnetY) * (0.06 * dt);
        }

        const finalX = baseWorldX + fp.magnetX;
        const finalY = baseWorldY + fp.magnetY;

        if (fp.type === 'floating-bean') {
          fp.rotation += fp.rotSpeed * dt;
          fp.tumblePhase += fp.tumbleSpeed * dt;

          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.rotate(fp.rotation);
          const tumbleScaleY = 0.78 + Math.cos(fp.tumblePhase) * 0.22;
          ctx.scale(1.0, tumbleScaleY);
          ctx.globalAlpha = 0.85 * fp.depth;

          const beanSprite = spriteCache.beans[fp.roastType];
          const bSize = fp.size * 3.4;
          ctx.drawImage(beanSprite, -bSize * 0.5, -bSize * 0.5, bSize, bSize);
          ctx.restore();
        } else if (fp.type === 'sparkle') {
          const twinkle = Math.sin(now * fp.pulseSpeed + fp.pulsePhase) * 0.4 + 0.6;
          fp.rotation += fp.rotSpeed * dt;

          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.rotate(fp.rotation);
          ctx.globalAlpha = twinkle * fp.depth;

          const sparkleSprite = fp.x < width * 0.5 ? spriteCache.sparkleGreen : spriteCache.sparkleGold;
          const spSize = fp.size * 3.6;
          ctx.drawImage(sparkleSprite, -spSize * 0.5, -spSize * 0.5, spSize, spSize);
          ctx.restore();
        } else if (fp.type === 'ember') {
          const pulse = Math.sin(now * fp.pulseSpeed + fp.pulsePhase) * 0.25 + 0.85;
          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.globalAlpha = pulse * fp.depth;

          const embSize = fp.size * 4.0;
          ctx.drawImage(spriteCache.ember, -embSize * 0.5, -embSize * 0.5, embSize, embSize);
          ctx.restore();
        } else {
          // Stardust dot
          const twinkle = Math.sin(now * fp.pulseSpeed + fp.pulsePhase) * 0.35 + 0.65;
          ctx.beginPath();
          ctx.arc(finalX, finalY, fp.size, 0, Math.PI * 2);
          ctx.fillStyle = fp.color.replace(/[\d\.]+\)$/, `${0.45 * twinkle * fp.depth})`);
          ctx.fill();
        }
      }

      // LAYER 2: Render Orbital Paths
      for (let i = 0; i < paths.length; i++) {
        const p = paths[i];
        p.rotation += p.rotationSpeed * dt;

        const curveCenterX = layer2_OrbitX + p.centerOffsetX;
        const curveCenterY = layer2_OrbitY + p.centerOffsetY;

        ctx.save();
        ctx.translate(curveCenterX, curveCenterY);
        ctx.rotate(p.rotation);

        // Soft outer glow line
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.glowColor;
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Crisp hairline
        ctx.beginPath();
        ctx.ellipse(0, 0, p.radiusX, p.radiusY, 0, 0, Math.PI * 2);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth;
        ctx.stroke();

        ctx.restore();
      }

      // Reset closest tracking array (No array allocation)
      for (let k = 0; k < 4; k++) {
        closestArray[k].dist = 9999;
      }

      // LAYER 3: Render Orbital Coffee Beans & Luminous Particles
      for (let i = 0; i < particles.length; i++) {
        const pt = particles[i];
        const p = paths[pt.pathIndex];
        if (!p) continue;

        pt.progress = (pt.progress + pt.speed * dt) % 1;
        if (pt.progress < 0) pt.progress += 1;

        const angle = pt.progress * Math.PI * 2;
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);

        const cosRot = Math.cos(p.rotation);
        const sinRot = Math.sin(p.rotation);

        const xBase = p.radiusX * cosAngle;
        const yBase = p.radiusY * sinAngle;

        const curveCenterX = layer3_ParticleX + p.centerOffsetX;
        const curveCenterY = layer3_ParticleY + p.centerOffsetY;

        const baseWorldX = curveCenterX + (xBase * cosRot - yBase * sinRot);
        const baseWorldY = curveCenterY + (xBase * sinRot + yBase * cosRot);

        // Magnetic Attraction & Swirl Physics
        const distDx = cx - baseWorldX;
        const distDy = cy - baseWorldY;
        const dist = Math.hypot(distDx, distDy);

        if (dist < cursorRadius && gAlpha > 0.05) {
          const forceRatio = Math.pow(1 - dist / cursorRadius, 1.35);
          const baseForce = (pt.type === 'bean' ? 50 : 70) * forceRatio * gAlpha;

          const swirlFactor = (1 - dist / cursorRadius) * 12 * gAlpha;
          const swirlX = (-distDy / (dist || 1)) * swirlFactor;
          const swirlY = (distDx / (dist || 1)) * swirlFactor;

          const targetMagX = (distDx / (dist || 1)) * baseForce + swirlX;
          const targetMagY = (distDy / (dist || 1)) * baseForce + swirlY;

          pt.magnetX += (targetMagX - pt.magnetX) * (0.16 * dt);
          pt.magnetY += (targetMagY - pt.magnetY) * (0.16 * dt);
        } else {
          pt.magnetX += (0 - pt.magnetX) * (0.07 * dt);
          pt.magnetY += (0 - pt.magnetY) * (0.07 * dt);
        }

        const finalX = baseWorldX + pt.magnetX;
        const finalY = baseWorldY + pt.magnetY;

        // Maintain top 4 closest for constellation beams without array allocation
        if (dist < 180 && gAlpha > 0.1) {
          for (let k = 0; k < 4; k++) {
            if (dist < closestArray[k].dist) {
              for (let m = 3; m > k; m--) {
                closestArray[m].x = closestArray[m - 1].x;
                closestArray[m].y = closestArray[m - 1].y;
                closestArray[m].dist = closestArray[m - 1].dist;
                closestArray[m].isLeft = closestArray[m - 1].isLeft;
              }
              closestArray[k].x = finalX;
              closestArray[k].y = finalY;
              closestArray[k].dist = dist;
              closestArray[k].isLeft = p.side === 'left';
              break;
            }
          }
        }

        // Fast Sprite Drawing
        if (pt.type === 'bean') {
          pt.beanRotation += pt.beanRotSpeed * dt;
          pt.tumblePhase += pt.tumbleSpeed * dt;

          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.rotate(pt.beanRotation);
          const tumbleScaleY = 0.78 + Math.cos(pt.tumblePhase) * 0.22;
          ctx.scale(1.0, tumbleScaleY);

          const beanSprite = spriteCache.beans[pt.roastType];
          const bSize = pt.size * 3.4;
          ctx.drawImage(beanSprite, -bSize * 0.5, -bSize * 0.5, bSize, bSize);
          ctx.restore();
        } else if (
          pt.type === 'green-node' ||
          pt.type === 'gold-node' ||
          pt.type === 'amber-node' ||
          pt.type === 'rose-node'
        ) {
          const pulse = Math.sin(now * pt.pulseSpeed + pt.pulsePhase) * 0.12 + 0.94;
          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.globalAlpha = pulse;

          const nodeSprite = spriteCache.nodes[pt.type];
          const nSize = pt.size * 5.6;
          ctx.drawImage(nodeSprite, -nSize * 0.5, -nSize * 0.5, nSize, nSize);
          ctx.restore();
        } else if (pt.type === 'sparkle') {
          const twinkle = Math.sin(now * pt.pulseSpeed + pt.pulsePhase) * 0.35 + 0.65;
          pt.beanRotation += pt.beanRotSpeed * dt;

          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.rotate(pt.beanRotation);
          ctx.globalAlpha = twinkle;

          const sparkleSprite = p.side === 'left' ? spriteCache.sparkleGreen : spriteCache.sparkleGold;
          const sSize = pt.size * 3.6;
          ctx.drawImage(sparkleSprite, -sSize * 0.5, -sSize * 0.5, sSize, sSize);
          ctx.restore();
        } else if (pt.type === 'ember') {
          const pulse = Math.sin(now * pt.pulseSpeed + pt.pulsePhase) * 0.25 + 0.85;

          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.globalAlpha = pulse;

          const eSize = pt.size * 4.2;
          ctx.drawImage(spriteCache.ember, -eSize * 0.5, -eSize * 0.5, eSize, eSize);
          ctx.restore();
        } else {
          // Dot
          const twinkle = Math.sin(now * pt.pulseSpeed + pt.pulsePhase) * 0.35 + 0.65;
          ctx.beginPath();
          ctx.arc(finalX, finalY, pt.size, 0, Math.PI * 2);
          if (p.side === 'left') {
            ctx.fillStyle = `rgba(16, 185, 129, ${0.55 * twinkle})`;
          } else if (p.side === 'right') {
            ctx.fillStyle = `rgba(245, 158, 11, ${0.58 * twinkle})`;
          } else {
            ctx.fillStyle = `rgba(254, 240, 199, ${0.75 * twinkle})`;
          }
          ctx.fill();
        }
      }

      // Constellation Proximity Beams (Compact 180px threshold)
      if (gAlpha > 0.08) {
        for (let k = 0; k < 4; k++) {
          const cp = closestArray[k];
          if (cp.dist > 180) break;

          const linkRatio = Math.pow(1 - cp.dist / 180, 1.2);
          const linkAlpha = linkRatio * 0.28 * gAlpha;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cp.x, cp.y);
          ctx.strokeStyle = cp.isLeft
            ? `rgba(52, 211, 153, ${linkAlpha})`
            : `rgba(251, 191, 36, ${linkAlpha})`;
          ctx.lineWidth = 0.9 * linkRatio;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(cp.x, cp.y, 1.5 * linkRatio, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${linkAlpha * 1.4})`;
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    // IntersectionObserver to pause rendering when off-screen
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
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('blur', handlePointerLeave);
      mediaQuery.removeEventListener?.('change', handleMotionChange);
      intersectionObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 w-full h-full pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
      />
    </div>
  );
};
