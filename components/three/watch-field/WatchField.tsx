"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * The Standing Watch field — the signature background of the dark spine.
 *
 * A sparse, calm computer-vision surface: a coordinate grid of faint tick
 * marks, a few breathing steel reticles, a slow scan line, and drifting
 * timecode — the visual language of a camera HUD, rendered as connective
 * tissue so every dark section reads as one continuous "inside the system".
 *
 * Deliberately CHEAP — Canvas2D, not a second WebGL context (the Living City
 * already owns the GPU budget). Steel is the resting/"watching" colour; clay
 * (the signal) appears only where the pointer rests or when the field
 * momentarily "catches" a node — keeping the orange flare rare and meaningful.
 *
 * Performance: DPR-aware, throttled to ~30fps, paused when off-screen, fully
 * static (one painted frame, no loop, no pointer) under prefers-reduced-motion.
 */

interface WatchFieldProps {
  className?: string;
  /** grid spacing in CSS px (larger = sparser). */
  spacing?: number;
  /** overall opacity multiplier of the whole field. */
  intensity?: number;
}

const STEEL = "150, 161, 178"; // --steel-300 rgb-ish
const STEEL_DIM = "76, 88, 107"; // --steel-500
const SIGNAL = "217, 119, 87"; // clay-400 #D97757

export function WatchField({
  className,
  spacing = 66,
  intensity = 1,
}: WatchFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let last = 0;
    const FRAME_MS = 1000 / 30;

    // pointer (CSS px, -1 when absent)
    const pointer = { x: -1, y: -1, active: false };
    // an autonomous "catch": a node the field locks onto every few seconds
    let catchNode = { gx: -1, gy: -1, born: -9999 };
    let t0 = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = (label: number) => {
      // a stable, human-looking timecode that ticks with the clock
      const s = Math.floor(label) % 60;
      const m = Math.floor(label / 60) % 60;
      const hh = (14 + Math.floor(label / 3600)) % 24;
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${pad(hh)}:${pad(m)}:${pad(s)}`;
    };

    const draw = (now: number) => {
      const time = (now - t0) / 1000; // seconds since start
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.font =
        "10px ui-monospace, 'JetBrains Mono', SFMono-Regular, Menlo, monospace";

      const cols = Math.ceil(w / spacing) + 1;
      const rows = Math.ceil(h / spacing) + 1;

      // gentle global drift so the field breathes rather than sits dead
      const driftY = reduced ? 0 : Math.sin(time * 0.12) * 4;
      const driftX = reduced ? 0 : Math.cos(time * 0.09) * 4;

      // 1) coordinate tick marks
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * spacing + driftX;
          const y = j * spacing + driftY;
          // base faint cross
          let a = 0.14;
          let rgb = STEEL_DIM;
          // pointer spotlight — marks near the cursor brighten and warm up
          if (pointer.active) {
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const d = Math.hypot(dx, dy);
            if (d < 150) {
              const f = 1 - d / 150;
              a = 0.14 + f * 0.5;
              if (d < 60) rgb = SIGNAL;
            }
          }
          ctx.strokeStyle = `rgba(${rgb}, ${a * intensity})`;
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.moveTo(x, y - 3);
          ctx.lineTo(x, y + 3);
          ctx.stroke();
        }
      }

      // 2) a few breathing reticle brackets, seeded deterministically
      const reticles = 4;
      for (let r = 0; r < reticles; r++) {
        const gx = ((r * 7 + 2) % cols) * spacing + driftX;
        const gy = ((r * 5 + 1) % rows) * spacing + driftY;
        const breathe = reduced ? 0.22 : 0.16 + 0.16 * (0.5 + 0.5 * Math.sin(time * 0.7 + r));
        bracket(ctx, gx, gy, 16, `rgba(${STEEL}, ${breathe * intensity})`);
      }

      // 3) slow scan line drifting down the field
      if (!reduced) {
        const sy = ((time * 26) % (h + 120)) - 60;
        const grad = ctx.createLinearGradient(0, sy - 40, 0, sy + 40);
        grad.addColorStop(0, `rgba(${STEEL}, 0)`);
        grad.addColorStop(0.5, `rgba(${STEEL}, ${0.05 * intensity})`);
        grad.addColorStop(1, `rgba(${STEEL}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, sy - 40, w, 80);
        ctx.strokeStyle = `rgba(${STEEL}, ${0.12 * intensity})`;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
        ctx.stroke();
      }

      // 4) sparse drifting timecode readouts
      const labels = 3;
      for (let l = 0; l < labels; l++) {
        const lx = ((l * 0.37 + 0.12) * w + (reduced ? 0 : time * (6 + l * 3))) % (w + 80) - 40;
        const ly = ((l * 0.31 + 0.2) * h) % h;
        ctx.fillStyle = `rgba(${STEEL_DIM}, ${0.4 * intensity})`;
        ctx.fillText(`CAM-${(l + 4).toString().padStart(2, "0")}  ${tick(time + l * 137)}`, lx, ly);
      }

      // 5) the autonomous "catch" — every ~7s the field locks a clay reticle
      if (!reduced) {
        if (time - catchNode.born > 7 + (catchNode.gx % 3)) {
          catchNode = {
            gx: Math.floor(2 + ((time * 13) % (cols - 4))),
            gy: Math.floor(2 + ((time * 7) % (rows - 4))),
            born: time,
          };
        }
        const age = time - catchNode.born;
        if (age < 1.6) {
          const f = 1 - age / 1.6;
          const cx = catchNode.gx * spacing + driftX;
          const cy = catchNode.gy * spacing + driftY;
          bracket(ctx, cx, cy, 20 - f * 6, `rgba(${SIGNAL}, ${0.55 * f * intensity})`);
        }
      }

      // pointer reticle — the cursor is itself a detector
      if (pointer.active) {
        bracket(ctx, pointer.x, pointer.y, 22, `rgba(${SIGNAL}, ${0.5 * intensity})`);
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      if (now - last >= FRAME_MS) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running) return;
      running = true;
      t0 = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();

    // reduced motion: paint one calm frame and stop.
    if (reduced) {
      draw(performance.now());
      const ro = new ResizeObserver(() => {
        resize();
        draw(performance.now());
      });
      ro.observe(canvas);
      return () => ro.disconnect();
    }

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(canvas);

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
      pointer.x = -1;
      pointer.y = -1;
    };
    // listen on window so the spotlight tracks across the whole section
    window.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced, spacing, intensity]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}

function bracket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  stroke: string,
) {
  const arm = s * 0.4;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  // four L-shaped corners around (x,y)
  // top-left
  ctx.moveTo(x - s, y - s + arm);
  ctx.lineTo(x - s, y - s);
  ctx.lineTo(x - s + arm, y - s);
  // top-right
  ctx.moveTo(x + s - arm, y - s);
  ctx.lineTo(x + s, y - s);
  ctx.lineTo(x + s, y - s + arm);
  // bottom-right
  ctx.moveTo(x + s, y + s - arm);
  ctx.lineTo(x + s, y + s);
  ctx.lineTo(x + s - arm, y + s);
  // bottom-left
  ctx.moveTo(x - s + arm, y + s);
  ctx.lineTo(x - s, y + s);
  ctx.lineTo(x - s, y + s - arm);
  ctx.stroke();
}
