"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/scroll/Reveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";

/**
 * Proof — four numbers as a compact, playful BENTO. Each tile pairs a count-up
 * figure with a tiny micro-visualisation that *demonstrates* the claim rather
 * than just stating it:
 *
 *   85%  → a cost bar that fills only 15% (the 85% gap is the saving)
 *   90%  → a comet racing a timeline (hours of scrubbing → seconds)
 *   0    → an open padlock (no lock-in)
 *   100% → a data dot bouncing INSIDE a dashed site boundary (never leaves)
 *
 * Alive without sprawling: a paper grain drifts over the room, each numeral
 * carries a clay sheen, the micro-vizzes loop, and tiles lift + glow under the
 * cursor. Count-ups + viz entrances fire on view (IntersectionObserver, immune
 * to the Living City's GSAP pin). Reduced motion → static, full numbers.
 */

type VizId = "cost" | "speed" | "open" | "onprem";

interface Claim {
  id: VizId;
  value: number;
  unit?: string;
  label: string;
  reason: string;
}

const CLAIMS: Claim[] = [
  {
    id: "cost",
    value: 85,
    unit: "%",
    label: "lower cost to go live",
    reason:
      "Retrofit the cameras you already own — no rip-and-replace, no new hardware fleet to buy and maintain.",
  },
  {
    id: "speed",
    value: 90,
    unit: "%",
    label: "faster investigations",
    reason:
      "Ask in plain language instead of scrubbing footage. The exact frames come back in seconds, not shifts.",
  },
  {
    id: "open",
    value: 0,
    label: "ways we lock you in",
    reason:
      "Standard cameras, exportable data, no proprietary formats. The day we stop earning it, you walk out with everything.",
  },
  {
    id: "onprem",
    value: 100,
    unit: "%",
    label: "processed on your premises",
    reason:
      "Every frame is analysed at the edge. Nothing is sent to a cloud, nothing leaves your site — ever.",
  },
];

export function Proof() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden bg-cream-100 py-20 sm:py-28">
      {!reduced && <div className="proof-grain" aria-hidden="true" />}

      <div className="container relative">
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow mb-4">The proof</p>
          <h2 className="t-display-2 text-ink-900">
            Four numbers, and why each is true.
          </h2>
          <p className="t-lead mt-6">
            Not slogans — the measurable consequences of running intelligence on
            the cameras you already own, on the premises you already control.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5">
          {CLAIMS.map((c) => (
            <ProofTile key={c.id} claim={c} reduced={reduced} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── a single tile ───────────────────────── */

function ProofTile({ claim, reduced }: { claim: Claim; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const n = useCountUp(claim.value, inView, reduced);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    e.currentTarget.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className="proof-tile group relative overflow-hidden rounded-2xl border border-cream-300 bg-cream-50 p-6 sm:p-7"
    >
      <div className="proof-tile-sheen" aria-hidden="true" />

      {/* micro-viz */}
      <div className="relative mb-6 h-16">
        <Viz id={claim.id} inView={inView} reduced={reduced} />
      </div>

      {/* the figure */}
      <div className="flex items-end leading-[0.85]">
        <span
          className="proof-num font-display font-semibold tracking-[-0.03em]"
          style={{ fontSize: "clamp(2.75rem, 6vw, 4.5rem)" }}
        >
          {n}
        </span>
        {claim.unit && (
          <span
            className="proof-unit ms-0.5 pb-[0.18em] font-display font-semibold leading-none"
            style={{ fontSize: "clamp(1.25rem, 2.4vw, 2rem)" }}
          >
            {claim.unit}
          </span>
        )}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-ink-900">
        {claim.label}
      </h3>
      <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-ink-600">
        {claim.reason}
      </p>
    </div>
  );
}

/** count from 0 → target on view (eased); reduced motion shows the target. */
function useCountUp(target: number, inView: boolean, reduced: boolean) {
  const [n, setN] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) {
      setN(target);
      return;
    }
    if (!inView || target === 0) {
      setN(0);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const dur = 1150;
    const tick = (ts: number) => {
      if (start == null) start = ts;
      const p = Math.min(1, (ts - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, reduced]);
  return n;
}

/* ───────────────────────── micro-visualisations ───────────────────────── */

function Viz({ id, inView, reduced }: { id: VizId; inView: boolean; reduced: boolean }) {
  if (id === "cost") return <CostViz inView={inView} />;
  if (id === "speed") return <SpeedViz reduced={reduced} />;
  if (id === "open") return <OpenViz inView={inView} reduced={reduced} />;
  return <OnPremViz reduced={reduced} />;
}

/* 85% — a cost bar where Triya fills only 15%; the gap is the saving */
function CostViz({ inView }: { inView: boolean }) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-2">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-cream-300">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-clay-400 transition-[width] duration-[1100ms] ease-out"
          style={{ width: inView ? "15%" : "0%" }}
        />
      </div>
      <div className="flex justify-between font-mono text-[0.55rem] uppercase tracking-[0.12em]">
        <span className="font-semibold text-clay-600">Triya · 15%</span>
        <span className="text-ink-400">rip &amp; replace · 100%</span>
      </div>
    </div>
  );
}

/* 90% — a comet racing a timeline: hours of scrubbing → seconds */
function SpeedViz({ reduced }: { reduced: boolean }) {
  return (
    <div className="flex h-full w-full items-center gap-3">
      <div className="relative h-px flex-1 bg-cream-300">
        {[15, 35, 55, 75].map((x) => (
          <span key={x} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-cream-400" style={{ left: `${x}%` }} />
        ))}
        <span
          className="absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-clay-400 shadow-[0_0_10px_2px_hsl(var(--clay-400)/0.7)]"
          style={{ animation: reduced ? "none" : "proofComet 2.6s cubic-bezier(0.5,0,0.2,1) infinite", left: reduced ? "92%" : undefined }}
        />
      </div>
      <span className="shrink-0 rounded-full border border-clay-400/50 px-2 py-0.5 font-mono text-[0.55rem] font-semibold uppercase tracking-wider text-clay-600">
        0.3s
      </span>
    </div>
  );
}

/* 0 — an open padlock: no lock-in */
function OpenViz({ inView, reduced }: { inView: boolean; reduced: boolean }) {
  return (
    <div className="flex h-full w-full items-center" style={{ animation: reduced ? "none" : "proofBob 3.4s ease-in-out infinite" }}>
      <svg viewBox="0 0 48 44" className="h-14 w-14" fill="none" aria-hidden="true">
        {/* shackle — swings OPEN on view (hinged at the left post) */}
        <path
          d="M16 22 V15 a8 8 0 0 1 16 0 V17"
          stroke="hsl(var(--clay-500))"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{
            transformOrigin: "16px 22px",
            transform: inView || reduced ? "rotate(-32deg)" : "rotate(0deg)",
            transition: "transform 700ms cubic-bezier(0.16,1,0.3,1) 200ms",
          }}
        />
        {/* body */}
        <rect x="11" y="22" width="26" height="18" rx="4" fill="hsl(var(--clay-400))" />
        <circle cx="24" cy="29" r="2.4" fill="hsl(var(--cream-50))" />
        <rect x="22.8" y="30" width="2.4" height="5" rx="1.2" fill="hsl(var(--cream-50))" />
      </svg>
      <span className="ms-1 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-ink-400">
        open by design
      </span>
    </div>
  );
}

/* 100% — a data dot bouncing INSIDE the site boundary; it never leaves */
function OnPremViz({ reduced }: { reduced: boolean }) {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 rounded-lg border border-dashed border-cream-400" />
      <span
        className="absolute h-2.5 w-2.5 rounded-full bg-clay-400 shadow-[0_0_10px_2px_hsl(var(--clay-400)/0.6)]"
        style={{ animation: reduced ? "none" : "proofBounce 5s ease-in-out infinite", left: "42%", top: "40%" }}
      />
      <span className="absolute bottom-1.5 right-2 font-mono text-[0.5rem] uppercase tracking-[0.12em] text-ink-400">
        the edge · on-prem
      </span>
    </div>
  );
}
