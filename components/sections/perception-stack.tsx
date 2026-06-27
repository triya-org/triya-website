"use client";

import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useSectionProgress } from "@/lib/use-section-progress";

/**
 * THE PERCEPTION STACK — Triya's "how the edge AI sees" signature, adapted from
 * Scale's exploded layer stack into our world. A camera frame is decomposed into
 * four translucent planes stacked in Z:
 *
 *   raw feed → detections → wireframe/segmentation → on-prem data plane
 *
 * In 3D the planes SEPARATE and parallax as you scroll, then reassemble — pure
 * CSS 3D transforms (perspective + translateZ + a scrubbed yaw), driven by a
 * single rAF that blends scroll progress + a smoothed pointer tilt + a slow idle
 * drift (so it's never frozen). No WebGL: CSS 3D gives the exact stacked-plane
 * parallax at a fraction of the weight and integrates with the rect-based scroll
 * progress (immune to the Living City's GSAP pin).
 *
 *   variant "hero"  — assembled at the top, EXPLODES as you scroll away.
 *   variant "close" — arrives exploded, COLLAPSES back into one watched frame
 *                     as the closing section centres (resolves the hero gesture).
 *
 * Reduced motion → a tasteful static exploded still, no rAF, no pointer.
 */

// per-plane depth / fan offsets (back → front), multiplied by `explode`
const PLANES = [
  { dz: -120, dx: -30, dy: 16 }, // raw feed (deepest)
  { dz: -40, dx: -10, dy: 6 }, // detections
  { dz: 46, dx: 14, dy: -8 }, // wireframe / segmentation
  { dz: 130, dx: 34, dy: -18 }, // on-prem data plane (frontmost)
] as const;

const BASE_YAW = -15; // resting 3D tilt even when assembled
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function PerceptionStack({
  variant = "hero",
  className,
}: {
  variant?: "hero" | "close";
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const planeRefs = useRef<(HTMLDivElement | null)[]>([]);

  const rawProg = useRef(0);
  const ptrTarget = useRef({ x: 0, y: 0 });
  const ptr = useRef({ x: 0, y: 0 });
  const inView = useRef(false);

  // scroll progress (rect-based, city-pin-safe). hero uses "exit" (0 at top,
  // grows as it leaves); close uses "through" and is inverted in the loop.
  useSectionProgress(wrapRef, {
    mode: variant === "close" ? "through" : "exit",
    reducedValue: variant === "close" ? 0.5 : 0.6,
    onUpdate: (p) => {
      rawProg.current = p;
    },
  });

  // pointer tilt (skipped under reduced motion)
  useEffect(() => {
    if (reduced) return;
    const onMove = (e: PointerEvent) => {
      ptrTarget.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduced]);

  // visibility gate so the rAF only runs while the stack is on screen
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => (inView.current = e.isIntersecting), {
      threshold: 0.05,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the single animation loop
  useEffect(() => {
    if (reduced) {
      // static exploded still
      const explode = 0.62;
      if (stageRef.current) {
        stageRef.current.style.transform = `rotateX(-4deg) rotateY(${BASE_YAW - 16}deg)`;
      }
      planeRefs.current.forEach((pl, i) => {
        if (!pl) return;
        const P = PLANES[i];
        pl.style.transform = `translate3d(${P.dx * explode}px, ${P.dy * explode}px, ${P.dz * explode}px)`;
      });
      return;
    }

    let raf = 0;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (!inView.current) return;

      // smooth the pointer
      ptr.current.x = lerp(ptr.current.x, ptrTarget.current.x, 0.07);
      ptr.current.y = lerp(ptr.current.y, ptrTarget.current.y, 0.07);

      const p = rawProg.current;
      // hero: always reads as a layered stack (base separation), deepening as
      // you scroll. close: starts exploded, collapses fully to one frame.
      const explode =
        variant === "close"
          ? Math.max(0, Math.min(1, 1 - (p - 0.12) / 0.42)) // exploded → collapsed
          : 0.4 + 0.6 * Math.max(0, Math.min(1, p * 1.7)); // base 0.4 → full

      // idle drift so it breathes even with no scroll/pointer
      const idleY = Math.sin(ts / 2200) * 2.4;
      const idleX = Math.cos(ts / 2600) * 1.4;

      const yaw = BASE_YAW + ptr.current.x * 11 + explode * 18 + idleY;
      const pitch = -ptr.current.y * 7 - explode * 3 + idleX;

      if (stageRef.current) {
        stageRef.current.style.transform = `rotateX(${pitch.toFixed(2)}deg) rotateY(${yaw.toFixed(2)}deg)`;
      }
      planeRefs.current.forEach((pl, i) => {
        if (!pl) return;
        const P = PLANES[i];
        pl.style.transform = `translate3d(${(P.dx * explode).toFixed(1)}px, ${(P.dy * explode).toFixed(1)}px, ${(P.dz * explode).toFixed(1)}px)`;
        // deepest layers dim a touch as they recede
        if (i === 0) pl.style.opacity = String(1 - explode * 0.25);
      });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, variant]);

  const setPlane = (i: number) => (el: HTMLDivElement | null) => {
    planeRefs.current[i] = el;
  };

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      <div
        className="relative h-full w-full"
        style={{ perspective: "1300px", perspectiveOrigin: "60% 45%" }}
      >
        <div
          ref={stageRef}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          {/* every plane shares one frame footprint, centred in the stage */}
          {/* 1 — RAW FEED */}
          <Plane innerRef={setPlane(0)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/scenarios/manufacturing.jpg"
              alt=""
              className="h-full w-full object-cover"
              style={{ filter: "saturate(0.9) brightness(1.02) contrast(1.06)" }}
            />
            <div className="absolute inset-0 bg-ink-900/20" />
            <span className="absolute bottom-2 left-3 font-mono text-[0.55rem] uppercase tracking-wider text-cream-100/70">
              raw feed
            </span>
          </Plane>

          {/* 2 — DETECTIONS */}
          <Plane innerRef={setPlane(1)} glass>
            <DetectionLayer />
            <PlaneTag>detections</PlaneTag>
          </Plane>

          {/* 3 — WIREFRAME / SEGMENTATION */}
          <Plane innerRef={setPlane(2)} glass>
            <WireframeLayer />
            <PlaneTag>segmentation</PlaneTag>
          </Plane>

          {/* 4 — ON-PREM DATA PLANE */}
          <Plane innerRef={setPlane(3)} glass>
            <DataLayer />
            <PlaneTag>on-prem</PlaneTag>
          </Plane>
        </div>
      </div>
    </div>
  );
}

/* a single translucent frame in the stack */
const Plane = ({
  children,
  glass,
  innerRef,
}: {
  children: React.ReactNode;
  glass?: boolean;
  innerRef: (el: HTMLDivElement | null) => void;
}) => (
  <div
    ref={innerRef}
    className={[
      "absolute left-1/2 top-1/2 aspect-video w-[78%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border",
      glass ? "border-steel-300/25 bg-ink-900/10 backdrop-blur-[1px]" : "border-cream-100/15",
    ].join(" ")}
    style={{ willChange: "transform", boxShadow: "0 30px 60px -40px rgba(0,0,0,0.9)" }}
  >
    {children}
  </div>
);

function PlaneTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-2 top-2 rounded bg-ink-900/50 px-1.5 py-0.5 font-mono text-[0.5rem] uppercase tracking-[0.14em] text-steel-200 backdrop-blur-sm">
      {children}
    </span>
  );
}

/* the detection plane — clay bounding boxes + labels */
function DetectionLayer() {
  const boxes = [
    { x: 14, y: 12, w: 30, h: 78, label: "PERSON 0.98" },
    { x: 58, y: 40, w: 30, h: 40, label: "FORKLIFT 0.91" },
  ];
  return (
    <>
      {boxes.map((b) => (
        <div
          key={b.label}
          className="absolute"
          style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
        >
          <div className="absolute inset-0 rounded-[2px] border border-clay-400/70" />
          {(["tl", "tr", "bl", "br"] as const).map((c) => {
            const r = c.includes("r");
            const bo = c.includes("b");
            return (
              <span
                key={c}
                className={`absolute h-2.5 w-2.5 border-clay-400 ${bo ? "bottom-0 border-b-2" : "top-0 border-t-2"} ${r ? "right-0 border-r-2" : "left-0 border-l-2"}`}
              />
            );
          })}
          <span className="absolute -top-4 left-0 whitespace-nowrap rounded-sm bg-clay-400 px-1 py-px font-mono text-[0.5rem] font-semibold uppercase tracking-wider text-ink-900">
            {b.label}
          </span>
        </div>
      ))}
    </>
  );
}

/* the wireframe / segmentation plane — steel contours + scan grid */
function WireframeLayer() {
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="none" className="h-full w-full">
      <defs>
        <pattern id="ps-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M10 0H0V10" fill="none" stroke="hsl(var(--steel-300))" strokeOpacity="0.18" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="160" height="90" fill="url(#ps-grid)" />
      {/* a rough person segmentation contour */}
      <path
        d="M34 14 q8 -4 14 0 q4 6 0 12 q10 6 8 22 q-1 14 -4 30 M30 26 q-6 8 -4 22 M52 26 q6 8 4 22"
        fill="none"
        stroke="hsl(var(--steel-200))"
        strokeOpacity="0.7"
        strokeWidth="0.6"
        vectorEffect="non-scaling-stroke"
      />
      {/* forklift blob contour */}
      <path
        d="M96 40 h40 v32 h-40 z M96 56 h40 M120 40 v32"
        fill="none"
        stroke="hsl(var(--steel-300))"
        strokeOpacity="0.55"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
      />
      {/* annotation callout lines */}
      <path d="M48 18 L120 8" stroke="hsl(var(--steel-300))" strokeOpacity="0.5" strokeWidth="0.4" strokeDasharray="1 2" vectorEffect="non-scaling-stroke" />
      <circle cx="120" cy="8" r="1.1" fill="hsl(var(--steel-200))" />
    </svg>
  );
}

/* the on-prem data plane — glass HUD readout */
function DataLayer() {
  return (
    <>
      <div className="absolute left-3 top-3 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-clay-400" />
        <span className="font-mono text-[0.55rem] uppercase tracking-wider text-cream-100">
          CAM-01 · REC
        </span>
      </div>
      <div className="absolute right-3 top-3 font-mono text-[0.55rem] tracking-wider text-cream-100/80">
        14:22:07
      </div>
      {/* corner brackets */}
      {(["tl", "tr", "bl", "br"] as const).map((c) => {
        const r = c.includes("r");
        const b = c.includes("b");
        return (
          <span
            key={c}
            className={`absolute h-4 w-4 border-cream-100/40 ${b ? "bottom-2 border-b-2" : "top-2 border-t-2"} ${r ? "right-2 border-r-2" : "left-2 border-l-2"}`}
          />
        );
      })}
      <div className="absolute bottom-3 right-3 rounded-md border border-clay-400/60 bg-ink-900/40 px-2 py-1 backdrop-blur-sm">
        <p className="font-mono text-[0.48rem] font-semibold uppercase tracking-[0.14em] text-clay-300">
          Processed on-prem
        </p>
      </div>
    </>
  );
}
