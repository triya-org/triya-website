"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/scroll/Reveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useSectionProgress } from "@/lib/use-section-progress";

/**
 * "What it actually is" — the crisp literal anchor that grounds the poetic
 * Living City above it.
 *
 * The hero of the section is a rendered centerpiece of the *one box you add*:
 * your existing camera feeds stream IN on clay wires (as travelling data
 * packets), the Triya edge box processes them on-premise (status LED alive),
 * and a single answer flows OUT to a chat bubble. It visualises the product
 * claim directly — pure SVG/CSS, no heavy assets, static-export safe, and
 * fully static under prefers-reduced-motion. The three steps sit beside it as
 * a legend, not as the whole show (the old thin three-column row read as
 * filler).
 */

interface Step {
  kicker: string;
  title: string;
  body: string;
  glyph: React.ReactNode;
  emphasis?: boolean;
}

const CameraGlyph = (
  <svg viewBox="0 0 48 48" fill="none" className="h-5 w-5" aria-hidden="true">
    <rect x="6" y="16" width="24" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
    <path d="M30 21l10-5v16l-10-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <circle cx="15" cy="24" r="3" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const EdgeGlyph = (
  <svg viewBox="0 0 48 48" fill="none" className="h-5 w-5" aria-hidden="true">
    <rect x="10" y="14" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="32" cy="20" r="1.6" fill="currentColor" />
    <path d="M16 28h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 38v2M22 38v2M30 38v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const AskGlyph = (
  <svg viewBox="0 0 48 48" fill="none" className="h-5 w-5" aria-hidden="true">
    <path d="M8 12h32v20H22l-9 8v-8H8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path d="M16 20h16M16 25h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const STEPS: Step[] = [
  {
    kicker: "You already own",
    title: "The cameras",
    body: "Every feed across every site you already paid for. Nothing ripped out, nothing replaced.",
    glyph: CameraGlyph,
  },
  {
    kicker: "You add one thing",
    title: "The Triya edge box",
    body: "It plugs into those cameras and runs the AI on-premise — every frame processed at the edge, your data never leaving the site.",
    glyph: EdgeGlyph,
    emphasis: true,
  },
  {
    kicker: "You simply",
    title: "Ask anything",
    body: "“Show me every delivery truck at gate 3 today.” Plain language in, the exact frames back. That’s the whole product.",
    glyph: AskGlyph,
  },
];

export function WhatItIs() {
  return (
    <section className="relative bg-cream-50 py-24 sm:py-32">
      <div className="container">
        <div className="max-w-3xl">
          <Reveal>
            <p className="t-eyebrow mb-4">What it is</p>
          </Reveal>
          {/* SIGNATURE — the statement fills word-by-word from dim→bright as the
              section scrolls through centre (Scale's scrubbed word reveal, in
              Triya's clay). The emphasis phrase lands in clay. */}
          <WordFill
            className="t-display-2 text-ink-900"
            segments={[
              { t: "Keep every camera you own." },
              { t: "Add one box.", br: true },
              { t: "Talk to all of them.", em: true },
            ]}
          />
          <Reveal>
            <p className="t-lead mt-6 max-w-2xl">
              Triya isn’t another camera system to buy and install. It’s the
              intelligence layer for the one you already run — a single on-prem
              box that turns thousands of passive feeds into something you can
              question in your own words.
            </p>
          </Reveal>
        </div>

        {/* centerpiece + legend */}
        <div className="mt-14 grid items-center gap-10 sm:mt-16 lg:grid-cols-12 lg:gap-12">
          {/* the rendered edge-box scene */}
          <Reveal y={28} className="lg:col-span-7">
            <DeviceStage />
          </Reveal>

          {/* the three steps as a legend */}
          <Reveal stagger staggerEach={0.14} className="space-y-5 lg:col-span-5">
            {STEPS.map((s) => (
              <div
                key={s.title}
                className={[
                  "rounded-2xl border p-5 transition-colors",
                  s.emphasis
                    ? "border-clay-300 bg-clay-100/40"
                    : "border-cream-300 bg-cream-50",
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={[
                      "grid h-9 w-9 shrink-0 place-items-center rounded-lg",
                      s.emphasis ? "bg-ink-900 text-clay-300" : "bg-cream-100 text-ink-700",
                    ].join(" ")}
                  >
                    {s.glyph}
                  </span>
                  <div>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-500">
                      {s.kicker}
                    </p>
                    <h3 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                      {s.title}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-700">
                  {s.body}
                </p>
              </div>
            ))}
          </Reveal>
        </div>

        {/* the one-line payoff + retrofit proof */}
        <Reveal
          y={24}
          start="top 90%"
          className="mt-14 flex flex-col gap-6 border-t border-cream-300 pt-8 sm:mt-16 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="max-w-xl text-lg text-ink-700">
            Because it’s a retrofit, not a rip-and-replace, most sites go live for
            about <span className="font-semibold text-clay-600">85% less</span>{" "}
            than tearing out and re-buying hardware.
          </p>
          <Link
            href="/contact/"
            className="btn-tactile inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-ink-900 px-6 py-3 text-sm font-medium text-ink-900 hover:bg-ink-900 hover:text-cream-50 sm:self-auto"
          >
            See it on your cameras
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── word-fill headline ───────────────────────── */

interface FillSeg {
  t: string;
  /** force a line break AFTER this segment */
  br?: boolean;
  /** the payoff phrase — fills to clay instead of ink */
  em?: boolean;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/**
 * The statement reveals word-by-word as the section travels through the
 * viewport: each word brightens from a dim wash to full ink (or clay for the
 * payoff), left to right, scrubbed by scroll. Reduced motion → fully lit.
 */
function WordFill({
  segments,
  className,
}: {
  segments: FillSeg[];
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = usePrefersReducedMotion();
  const p = useSectionProgress(ref, { mode: "through", reducedValue: 1 });

  // flatten segments → words, each carrying its em flag and whether a break
  // follows the segment it ends.
  const words = useMemo(() => {
    const out: { t: string; em: boolean; brAfter: boolean }[] = [];
    segments.forEach((seg) => {
      const parts = seg.t.split(" ").filter(Boolean);
      parts.forEach((w, i) =>
        out.push({ t: w, em: !!seg.em, brAfter: !!seg.br && i === parts.length - 1 }),
      );
    });
    return out;
  }, [segments]);

  // confine the fill to the middle of the pass so it reads as a deliberate
  // sweep, not a slow crawl across the whole scroll range.
  const local = clamp01((p - 0.1) / 0.5);
  const N = words.length;

  return (
    <h2 ref={ref} className={className}>
      {words.map((w, i) => {
        // each word fills over ~1/N of `local`, with a little overlap (+1.6)
        const f = reduced ? 1 : clamp01(local * (N + 1.6) - i);
        return (
          <span key={i}>
            <span
              style={{
                opacity: 0.18 + 0.82 * f,
                color: w.em ? "hsl(var(--clay-500))" : undefined,
                transition: "opacity 140ms linear",
              }}
            >
              {w.t}
            </span>
            {w.brAfter ? <br className="hidden sm:block" /> : " "}
          </span>
        );
      })}
    </h2>
  );
}

/* ───────────────────────── the edge-box scene ───────────────────────── */

function DeviceStage() {
  const reduced = usePrefersReducedMotion();

  // the three feed wires (camera → box) and the answer wire (box → bubble).
  // each `d` is shared by the drawn <path> and the travelling packet's motion.
  const feeds = [
    "M92,92 C190,92 180,190 262,176",
    "M92,190 C185,190 205,190 262,190",
    "M92,288 C190,288 180,190 262,204",
  ];
  const out = "M418,190 C448,190 462,190 486,190";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-cream-300 bg-cream-100/70 p-2 shadow-[0_24px_60px_-30px_rgba(31,30,27,0.35)]">
      {/* faint paper ruling for editorial texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--cream-300)) 0.7px, transparent 0.7px)",
          backgroundSize: "22px 22px",
        }}
      />
      <svg
        viewBox="0 0 620 380"
        className="relative block w-full"
        role="img"
        aria-label="Your existing cameras feed into a single on-prem Triya edge box, which answers your questions"
      >
        <defs>
          <linearGradient id="boxFill" x1="0" y1="0" x2="0.25" y2="1">
            <stop offset="0" stopColor="hsl(var(--ink-700))" />
            <stop offset="0.55" stopColor="hsl(var(--ink-800))" />
            <stop offset="1" stopColor="hsl(var(--ink-900))" />
          </linearGradient>
          <linearGradient id="boxSide" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="hsl(var(--ink-900))" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <radialGradient id="boxShadow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="hsl(var(--ink-900))" stopOpacity="0.22" />
            <stop offset="1" stopColor="hsl(var(--ink-900))" stopOpacity="0" />
          </radialGradient>
          <clipPath id="boxClip">
            <rect x="262" y="144" width="156" height="92" rx="16" />
          </clipPath>
        </defs>

        {/* ── feed wires ── */}
        {feeds.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="hsl(var(--clay-300))"
            strokeWidth="1.5"
            strokeOpacity="0.55"
            strokeDasharray="2 5"
            strokeLinecap="round"
          />
        ))}
        <path
          d={out}
          fill="none"
          stroke="hsl(var(--clay-300))"
          strokeWidth="1.5"
          strokeOpacity="0.55"
          strokeDasharray="2 5"
          strokeLinecap="round"
        />

        {/* ── cameras (input) ── */}
        {[92, 190, 288].map((cy, i) => (
          <Camera key={i} y={cy} />
        ))}
        <text
          x="56"
          y="346"
          textAnchor="middle"
          className="font-mono"
          fontSize="11"
          letterSpacing="1.5"
          fill="hsl(var(--ink-500))"
        >
          YOUR FEEDS
        </text>

        {/* ── answer bubble (output) ── */}
        <g>
          <rect x="486" y="156" width="120" height="68" rx="12" fill="hsl(var(--cream-50))" stroke="hsl(var(--cream-300))" />
          <path d="M486,184 l-10,6 l10,6 z" fill="hsl(var(--cream-50))" />
          <rect x="500" y="174" width="74" height="6" rx="3" fill="hsl(var(--cream-300))" />
          <rect x="500" y="188" width="52" height="6" rx="3" fill="hsl(var(--cream-300))" />
          <circle cx="566" cy="205" r="7" fill="hsl(var(--clay-400))" />
          <path d="M562.5,205 l2.5,2.5 l4.5,-5" fill="none" stroke="hsl(var(--cream-50))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* ── the box (a real on-prem appliance, not a flowchart node) ── */}
        {/* raking ground shadow — offset down-right, soft radial */}
        <ellipse cx="356" cy="250" rx="118" ry="20" fill="url(#boxShadow)" />
        {/* extruded side/thickness — reads as a physical object with depth */}
        <rect x="266" y="150" width="156" height="92" rx="16" fill="url(#boxSide)" />
        {/* the face */}
        <rect x="262" y="144" width="156" height="92" rx="16" fill="url(#boxFill)" stroke="hsl(var(--ink-700))" />
        {/* top sheen */}
        <rect x="262" y="144" width="156" height="34" rx="16" fill="hsl(var(--cream-50))" opacity="0.05" />
        {/* a single specular glint drifting across the top face (premium, calm) */}
        {!reduced && (
          <g clipPath="url(#boxClip)">
            <rect x="-40" y="144" width="34" height="92" fill="hsl(var(--cream-50))" opacity="0.07" transform="skewX(-18)">
              <animate attributeName="x" values="250;470" dur="4.8s" begin="1.2s" repeatCount="indefinite" />
            </rect>
          </g>
        )}
        {/* wordmark */}
        <text x="340" y="190" textAnchor="middle" className="font-mono" fontSize="17" letterSpacing="4" fill="hsl(var(--cream-100))">
          TRIYA
        </text>
        <rect x="312" y="200" width="56" height="2" rx="1" fill="hsl(var(--clay-400))" opacity="0.8" />
        {/* on-prem caption */}
        <text x="340" y="222" textAnchor="middle" className="font-mono" fontSize="9" letterSpacing="2" fill="hsl(var(--ink-300))">
          EDGE · ON-PREM
        </text>
        {/* status LED */}
        <circle cx="400" cy="160" r="3.5" fill="hsl(var(--clay-400))">
          {!reduced && (
            <animate attributeName="opacity" values="1;0.35;1" dur="1.8s" repeatCount="indefinite" />
          )}
        </circle>

        {/* ── travelling data packets (motion only) ── */}
        {!reduced && (
          <>
            {feeds.map((d, i) => (
              <circle key={i} r="3.6" fill="hsl(var(--clay-400))">
                <animateMotion dur="2.6s" begin={`${i * 0.55}s`} repeatCount="indefinite" path={d} />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.12;0.85;1" dur="2.6s" begin={`${i * 0.55}s`} repeatCount="indefinite" />
              </circle>
            ))}
            <circle r="3.6" fill="hsl(var(--clay-400))">
              <animateMotion dur="1.7s" begin="1s" repeatCount="indefinite" path={out} />
              <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.8;1" dur="1.7s" begin="1s" repeatCount="indefinite" />
            </circle>
          </>
        )}

        {/* static packets so the reduced-motion view still reads as "flowing" */}
        {reduced &&
          feeds.map((_, i) => {
            const pts = [
              [180, 132],
              [180, 190],
              [180, 248],
            ][i];
            return <circle key={i} cx={pts[0]} cy={pts[1]} r="3.6" fill="hsl(var(--clay-400))" />;
          })}
      </svg>
    </div>
  );
}

function Camera({ y }: { y: number }) {
  return (
    <g transform={`translate(40 ${y - 16})`}>
      <rect x="0" y="0" width="44" height="32" rx="6" fill="hsl(var(--cream-50))" stroke="hsl(var(--cream-400))" />
      <circle cx="14" cy="16" r="6" fill="none" stroke="hsl(var(--ink-500))" strokeWidth="2" />
      <circle cx="14" cy="16" r="2" fill="hsl(var(--ink-500))" />
      <rect x="30" y="11" width="9" height="10" rx="2" fill="hsl(var(--cream-200))" />
    </g>
  );
}
