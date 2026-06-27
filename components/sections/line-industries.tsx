"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion, detectWebGL } from "@/lib/reduced-motion";
import { useSectionProgress } from "@/lib/use-section-progress";
import { DRIFT, SNAP } from "@/lib/motion-grammar";
import type { Industry } from "@/components/three/lineart/models";
import type { AnchorReport } from "@/components/three/lineart/LineArtScene";

/**
 * THE SWEEP — four industry districts, one always-watching system.
 *
 * Each section is a dark, near-full-bleed line-art district. As you scroll its
 * sticky runway, the district ASSEMBLES from scattered fragments under a moving
 * scan line and the camera CRANES around it; the instant it settles, Triya
 * CATCHES the one thing that district watches for — a detection reticle snaps in
 * over a real subject (a person/vehicle/crowd silhouette) with an overshoot, a
 * confidence count-up ticks, and a leader line bends out to a parked HUD card.
 * The whole move is driven by ONE scroll-progress value, so the 3D, the overlay
 * and the text never desync. Reverses cleanly on scroll-up.
 *
 * No GSAP pin (the app has a stale-pin issue) — sticky + getBoundingClientRect.
 * Mobile → a static stacked layout; reduced-motion → the assembled final state.
 * Copy harvested verbatim from living-city.tsx's PARKS.
 */

const LineArtScene = dynamic(
  () => import("@/components/three/lineart/LineArtScene").then((m) => m.LineArtScene),
  { ssr: false },
);

const remap = (v: number, a: number, b: number) =>
  Math.max(0, Math.min(1, (v - a) / (b - a)));

type ScanAxis = "v" | "h";
type Subject = "person" | "vehicle" | "crowd";

interface Detection {
  label: string; // primary chip, e.g. "PPE — NO HARD HAT"
  klass: string; // class line, e.g. "PERSON · COMPLIANCE"
  conf?: number; // confidence % (count-up) — omit to show `metric`
  metric?: string; // a non-confidence metric (e.g. headcount)
  provenance: string; // Triya's credibility signature
  cameraId: string;
  subject: Subject;
}

interface Ind {
  id: Industry;
  index: string;
  title: string;
  body: string;
  bullets: string[];
  slug: string;
  flip: boolean; // true → text RIGHT, district LEFT-bleed
  lineColor: string;
  tint: string; // the catch colour (Triya clay)
  scanAxis: ScanAxis;
  crane: [number, number];
  anchor: [number, number, number];
  lift: number; // world-y lift so the silhouette breaks the upper third
  toneTint?: string;
  detection: Detection;
}

const CLAY = "#D97757";

/* copy harvested verbatim from components/sections/living-city.tsx (PARKS.en) */
const INDUSTRIES: Ind[] = [
  {
    id: "manufacturing",
    index: "01",
    title: "Manufacturing",
    body: "Monitor production lines, ensure worker safety, and prevent equipment theft with 24/7 AI surveillance.",
    bullets: ["Safety compliance monitoring", "Theft prevention"],
    slug: "manufacturing",
    flip: false,
    lineColor: "#D97757",
    tint: CLAY,
    scanAxis: "v",
    crane: [0.34, -0.32],
    anchor: [0.5, 3.2, 0.5],
    lift: 0,
    detection: {
      label: "PPE — NO HARD HAT",
      klass: "PERSON · COMPLIANCE",
      conf: 94,
      provenance: "Assembly Line 3 · 0.3s on-prem",
      cameraId: "MFG-03",
      subject: "person",
    },
  },
  {
    id: "retail",
    index: "02",
    title: "Retail",
    body: "Enhance customer experience, prevent shoplifting, and optimize store operations with intelligent monitoring.",
    bullets: ["Loss prevention", "Queue management"],
    slug: "retail",
    flip: true,
    lineColor: "#E8E0D2",
    tint: CLAY,
    scanAxis: "h",
    crane: [-0.28, 0.18],
    anchor: [2.2, 3.4, 2.4],
    lift: 0,
    toneTint: "radial-gradient(60% 60% at 50% 45%, hsl(var(--clay-500)/0.10), transparent 70%)",
    detection: {
      label: "LOITERING — 4m12s",
      klass: "PERSON · BEHAVIOR",
      conf: 91,
      provenance: "Aisle 7 · dwell timer running",
      cameraId: "RTL-07",
      subject: "person",
    },
  },
  {
    id: "smart-cities",
    index: "03",
    title: "Smart Cities",
    body: "Create safer urban environments with traffic monitoring, crowd management, and incident detection.",
    bullets: ["Traffic analysis", "Incident response"],
    slug: "smart-cities",
    flip: false,
    lineColor: "#A9BCC8",
    tint: CLAY,
    scanAxis: "h",
    crane: [0.46, -0.5],
    anchor: [0, 9.5, 0],
    lift: 0,
    toneTint: "radial-gradient(60% 60% at 50% 45%, hsl(205 30% 50%/0.10), transparent 70%)",
    detection: {
      label: "NO-PARKING — VEHICLE 2m",
      klass: "VEHICLE · ZONE",
      conf: 96,
      provenance: "Junction 14 · plate redacted on-prem",
      cameraId: "JCT-14",
      subject: "vehicle",
    },
  },
  {
    id: "events",
    index: "04",
    title: "Event Management",
    body: "Ensure attendee safety, optimize crowd flow, and enhance event experiences with intelligent surveillance.",
    bullets: ["Real-time queue analytics", "VIP corridor protection"],
    slug: "events",
    flip: true,
    lineColor: "#D97757",
    tint: CLAY,
    scanAxis: "v",
    crane: [-0.34, 0.42],
    anchor: [-3.5, 3.4, 0.5],
    lift: 0,
    detection: {
      label: "CROWD GATHERING — DENSE",
      klass: "PERSON · HEADCOUNT",
      metric: "▲ 1,240",
      provenance: "North stand · headcount rising",
      cameraId: "EVT-22",
      subject: "crowd",
    },
  },
];

/** WebGL capability (ignores reduced-motion, unlike useCanRender3D): the canvas
 *  should still mount under reduced motion so it can paint a static district. */
function useCapable3D(): boolean {
  const [capable, setCapable] = useState(false);
  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    setCapable(detectWebGL() && !conn?.saveData);
  }, []);
  return capable;
}

/** below-md → the static stacked layout */
function useCompact(): boolean {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setCompact(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return compact;
}

export function LineIndustries() {
  return (
    <div className="bg-ink-900">
      {INDUSTRIES.map((ind) => (
        <IndustryRow key={ind.id} ind={ind} />
      ))}
    </div>
  );
}

function IndustryRow({ ind }: { ind: Ind }) {
  const reduced = usePrefersReducedMotion();
  const capable = useCapable3D();
  const compact = useCompact();

  const outerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const reticleWrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const progressRef = useRef(0);
  const caughtRef = useRef(false);
  const stageSizeRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });

  const [near, setNear] = useState(false); // mount the canvas
  const [caught, setCaught] = useState(false); // the detection has fired

  const cardFrac = ind.flip ? { fx: 0.21, fy: 0.62 } : { fx: 0.79, fy: 0.62 };

  // mount canvas when near; track on-screen for frameloop gating
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ioNear = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: "700px 0px",
    });
    ioNear.observe(el);
    return () => ioNear.disconnect();
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      stageSizeRef.current = { w: el.clientWidth, h: el.clientHeight };
    });
    ro.observe(el);
    stageSizeRef.current = { w: el.clientWidth, h: el.clientHeight };
    return () => ro.disconnect();
  }, []);

  // ONE scroll-progress source drives everything (sticky runway, rect+rAF)
  useSectionProgress(outerRef, {
    mode: "pin",
    onUpdate: (p) => {
      progressRef.current = p;

      const sc = scanRef.current;
      if (sc) {
        const t = remap(p, 0.12, 0.62);
        const fade = p < 0.1 ? 0 : p > 0.66 ? Math.max(0, 1 - (p - 0.66) / 0.06) : 1;
        if (ind.scanAxis === "v") sc.style.top = `${t * 100}%`;
        else sc.style.left = `${t * 100}%`;
        sc.style.opacity = String(fade);
      }

      // THE CATCH fires at 0.8; re-arms (hysteresis) only below 0.7
      const want = caughtRef.current ? p >= 0.7 : p >= 0.8;
      if (want !== caughtRef.current) {
        caughtRef.current = want;
        setCaught(want);
      }
    },
  });

  // glue the reticle + leader line to the projected building anchor each frame
  const onAnchor = useCallback(
    (a: AnchorReport) => {
      const wrap = reticleWrapRef.current;
      if (wrap) {
        wrap.style.transform = `translate(${a.x}px, ${a.y}px)`;
        wrap.style.opacity = caughtRef.current && a.on ? "1" : "0";
      }
      const sz = stageSizeRef.current;
      const cx = cardFrac.fx * sz.w;
      const cy = cardFrac.fy * sz.h;
      const line = lineRef.current;
      if (line) {
        const midX = a.x + (cx - a.x) * 0.5;
        line.setAttribute("d", `M ${cx} ${cy} L ${midX} ${cy} L ${midX} ${a.y} L ${a.x} ${a.y}`);
      }
      const dot = dotRef.current;
      if (dot) {
        dot.setAttribute("cx", String(a.x));
        dot.setAttribute("cy", String(a.y));
      }
    },
    [cardFrac.fx, cardFrac.fy],
  );

  const d = ind.detection;
  const show3D = capable && near;

  /* ───────────── mobile: static stacked layout ───────────── */
  if (compact) {
    return (
      <section
        ref={outerRef}
        aria-labelledby={`line-${ind.id}`}
        className="dark relative overflow-hidden border-t border-white/5 bg-ink-900 text-cream-100"
      >
        <div ref={stageRef} className="relative h-[52vh] w-full overflow-hidden">
          {ind.toneTint && <div aria-hidden className="absolute inset-0" style={{ background: ind.toneTint }} />}
          <HudScanlines />
          <div aria-hidden className="absolute inset-0">
            {show3D ? (
              <LineArtScene
                industry={ind.id}
                reduced
                color={ind.lineColor}
                progressRef={progressRef}
                anchorLocal={ind.anchor}
                craneFrom={ind.crane[1]}
                craneTo={ind.crane[1]}
                xBias={0}
                lift={ind.lift}
                onAnchor={() => {}}
              />
            ) : null}
          </div>
          <StageHud cameraId={d.cameraId} reduced compact />
        </div>
        <div className="container py-10">
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.22em] text-clay-400">
            <span style={{ color: ind.tint }}>◣</span>
            {ind.index} / {ind.title}
          </p>
          <h2 id={`line-${ind.id}`} className="t-display-2 text-cream-50">
            {ind.title}
          </h2>
          <p className="t-lead mt-4 max-w-md text-steel-200">{ind.body}</p>
          {/* the detection, surfaced inline on mobile */}
          <div className="mt-6 max-w-md rounded-lg border p-3" style={{ borderColor: `${ind.tint}55` }}>
            <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em]" style={{ color: ind.tint }}>
              {d.label} {d.conf != null ? (d.conf / 100).toFixed(2) : d.metric}
            </span>
            <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-steel-300">{d.klass}</p>
            <p className="mt-1.5 text-[0.8rem] text-steel-200">{d.provenance}</p>
          </div>
          <ul className="mt-5 space-y-2">
            {ind.bullets.map((b) => (
              <li key={b} className="flex items-center text-sm text-steel-300">
                <span className="me-2.5 inline-block h-1.5 w-1.5 rounded-full bg-clay-400" />
                {b}
              </li>
            ))}
          </ul>
          <Link
            href={`/use-cases/${ind.slug}/`}
            className="group mt-7 inline-flex items-center gap-2 text-sm font-medium text-clay-400 hover:text-clay-300"
          >
            Learn more
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    );
  }

  /* ───────────── desktop: the scrubbed sweep + catch ───────────── */
  return (
    <section
      ref={outerRef}
      aria-labelledby={`line-${ind.id}`}
      className="dark relative bg-ink-900 text-cream-100"
      style={{ minHeight: reduced ? "100vh" : "230vh" }}
    >
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden">
        {ind.toneTint && (
          <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: ind.toneTint }} />
        )}
        <HudScanlines />

        {/* the line-art district (full-bleed) */}
        <div aria-hidden className="absolute inset-0">
          {show3D ? (
            <LineArtScene
              industry={ind.id}
              reduced={reduced}
              color={ind.lineColor}
              progressRef={progressRef}
              anchorLocal={ind.anchor}
              craneFrom={ind.crane[0]}
              craneTo={ind.crane[1]}
              xBias={ind.flip ? -1.0 : 1.0}
              lift={ind.lift}
              onAnchor={onAnchor}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-steel-500">
                {ind.title} district
              </span>
            </div>
          )}
        </div>

        {/* legibility scrim behind the copy column */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-10 w-[58%]"
          style={{
            [ind.flip ? "right" : "left"]: 0,
            background: `linear-gradient(${ind.flip ? "270deg" : "90deg"}, hsl(var(--ink-900)/0.92), hsl(var(--ink-900)/0.55) 55%, transparent)`,
          }}
        />

        {/* the scan line leading the assembly (blade + trailing glow) */}
        {!reduced && (
          <div
            ref={scanRef}
            aria-hidden
            className="pointer-events-none absolute z-10"
            style={
              ind.scanAxis === "v"
                ? {
                    left: 0,
                    right: 0,
                    top: "0%",
                    height: "140px",
                    transform: "translateY(-50%)",
                    opacity: 0,
                    background: `linear-gradient(to bottom, transparent, ${ind.tint}26, transparent)`,
                  }
                : {
                    top: 0,
                    bottom: 0,
                    left: "0%",
                    width: "140px",
                    transform: "translateX(-50%)",
                    opacity: 0,
                    background: `linear-gradient(to right, transparent, ${ind.tint}26, transparent)`,
                  }
            }
          >
            <div
              className="absolute"
              style={
                ind.scanAxis === "v"
                  ? { left: 0, right: 0, top: "50%", height: "2px", background: ind.tint, boxShadow: `0 0 22px 3px ${ind.tint}` }
                  : { top: 0, bottom: 0, left: "50%", width: "2px", background: ind.tint, boxShadow: `0 0 22px 3px ${ind.tint}` }
              }
            />
          </div>
        )}

        {/* viewfinder HUD */}
        <StageHud cameraId={d.cameraId} reduced={reduced} />

        {/* THE CATCH — leader line + reticle + parked card */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          style={{ opacity: caught ? 1 : 0, transition: "opacity .25s ease", filter: `drop-shadow(0 0 4px ${ind.tint}aa)` }}
        >
          <path
            ref={lineRef}
            fill="none"
            stroke={ind.tint}
            strokeWidth={1.6}
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: caught ? 0 : 1,
              transition: "stroke-dashoffset .5s cubic-bezier(.22,1,.36,1)",
            }}
          />
          <circle ref={dotRef} r={3.5} fill={ind.tint} />
        </svg>

        {/* reticle (positioned each frame onto the building anchor) */}
        <div
          ref={reticleWrapRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-30"
          style={{ opacity: 0, transition: "opacity .2s ease", willChange: "transform" }}
        >
          {(caught || reduced) && <Reticle tint={ind.tint} d={d} reduced={reduced} />}
        </div>

        {/* parked HUD card on the bleed rail */}
        <CalloutCard ind={ind} d={d} caught={caught || reduced} cardFrac={cardFrac} reduced={reduced} />

        {/* the copy column, composited over the district */}
        <div className="container relative z-40 flex h-full items-center">
          <div className={`max-w-[30rem] ${ind.flip ? "ml-auto text-right" : ""}`}>
            <motion.div
              initial={reduced ? false : "hidden"}
              whileInView={reduced ? undefined : "show"}
              viewport={{ once: true, amount: 0.4 }}
              variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            >
              <motion.p
                variants={REVEAL}
                className={`mb-4 inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-clay-400 ${
                  ind.flip ? "flex-row-reverse" : ""
                }`}
              >
                <span className="leading-none" style={{ color: ind.tint }}>◣</span>
                {ind.index} / {ind.title}
              </motion.p>
              <motion.h2 variants={REVEAL} id={`line-${ind.id}`} className="t-display-2 text-cream-50">
                {ind.title}
              </motion.h2>
              <motion.p variants={REVEAL} className={`t-lead mt-5 max-w-md text-steel-200 ${ind.flip ? "ml-auto" : ""}`}>
                {ind.body}
              </motion.p>
              <motion.ul variants={REVEAL} className={`mt-6 space-y-2 ${ind.flip ? "flex flex-col items-end" : ""}`}>
                {ind.bullets.map((b) => (
                  <li key={b} className={`flex items-center text-sm text-steel-300 ${ind.flip ? "flex-row-reverse" : ""}`}>
                    <span className={`inline-block h-1.5 w-1.5 rounded-full bg-clay-400 ${ind.flip ? "ms-2.5" : "me-2.5"}`} />
                    {b}
                  </li>
                ))}
              </motion.ul>
              <motion.div variants={REVEAL}>
                <Link
                  href={`/use-cases/${ind.slug}/`}
                  className={`group mt-8 inline-flex items-center gap-2 text-sm font-medium text-clay-400 hover:text-clay-300 ${
                    ind.flip ? "flex-row-reverse" : ""
                  }`}
                >
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

const REVEAL = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: DRIFT } },
};

/* ───────────────────────── the reticle (the catch) ───────────────────────── */

function Reticle({ tint, d, reduced }: { tint: string; d: Detection; reduced: boolean }) {
  return (
    <motion.div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ width: 150, height: 120 }}
      initial={reduced ? false : { opacity: 0, scale: 1.14 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.42, ease: SNAP }}
    >
      {/* soft acquisition glow */}
      <div
        className="absolute -inset-[20%] rounded-[42%]"
        style={{ background: `radial-gradient(50% 50% at 50% 50%, ${tint}, transparent 70%)`, opacity: 0.16 }}
      />
      {/* the subject Triya caught — gives the brackets something to lock onto */}
      <SubjectGlyph kind={d.subject} tint={tint} reduced={reduced} />
      <div className="absolute inset-0 rounded-[2px] border" style={{ borderColor: tint, opacity: 0.5 }} />
      <BoxCorner pos="tl" tint={tint} reduced={reduced} />
      <BoxCorner pos="tr" tint={tint} reduced={reduced} />
      <BoxCorner pos="bl" tint={tint} reduced={reduced} />
      <BoxCorner pos="br" tint={tint} reduced={reduced} />
      {/* label chip on the top edge — the confidence number is the hero */}
      <motion.div
        className="absolute -top-7 left-0 flex items-stretch overflow-hidden rounded shadow-[0_0_18px_-2px_rgba(0,0,0,0.6)]"
        style={{ background: tint }}
        initial={reduced ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.28, duration: 0.25, ease: DRIFT }}
      >
        <span className="whitespace-nowrap px-1.5 py-0.5 font-mono text-[0.62rem] font-semibold uppercase tracking-wider text-ink-900">
          {d.label}
        </span>
        <span className="flex items-center bg-ink-900/85 px-1.5 font-mono text-[0.68rem] font-bold tabular-nums text-cream-50">
          {d.conf != null ? (reduced ? (d.conf / 100).toFixed(2) : <ConfCount to={d.conf} />) : d.metric}
        </span>
      </motion.div>
    </motion.div>
  );
}

function SubjectGlyph({ kind, tint, reduced }: { kind: Subject; tint: string; reduced: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: "62%", height: "70%", color: tint }}
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: reduced ? 0 : 0.18, duration: 0.3 }}
      fill="none"
      stroke="currentColor"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "person" && (
        <>
          <circle cx="50" cy="24" r="12" />
          <path d="M30 92 V64 a20 20 0 0 1 40 0 V92" />
        </>
      )}
      {kind === "vehicle" && (
        <>
          <path d="M14 64 L24 44 a8 8 0 0 1 7-4 h38 a8 8 0 0 1 7 4 l10 20 v12 H14 Z" />
          <circle cx="32" cy="78" r="8" />
          <circle cx="68" cy="78" r="8" />
        </>
      )}
      {kind === "crowd" && (
        <>
          <circle cx="30" cy="30" r="9" />
          <path d="M14 84 V64 a16 16 0 0 1 32 0 V84" />
          <circle cx="70" cy="30" r="9" />
          <path d="M54 84 V64 a16 16 0 0 1 32 0 V84" />
        </>
      )}
    </motion.svg>
  );
}

function BoxCorner({ pos, tint, reduced }: { pos: "tl" | "tr" | "bl" | "br"; tint: string; reduced: boolean }) {
  const isR = pos.includes("r");
  const isB = pos.includes("b");
  const t = reduced ? { duration: 0 } : { duration: 0.28, ease: [0.16, 1, 0.3, 1] as const, delay: 0.06 };
  const lineStyle = { background: tint, boxShadow: `0 0 8px -1px ${tint}` };
  return (
    <div className={`absolute h-4 w-4 ${isB ? "bottom-0" : "top-0"} ${isR ? "right-0" : "left-0"}`}>
      <motion.span
        className={`absolute left-0 h-[2px] w-full ${isB ? "bottom-0" : "top-0"}`}
        style={{ ...lineStyle, transformOrigin: isR ? "right" : "left" }}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={t}
      />
      <motion.span
        className={`absolute top-0 h-full w-[2px] ${isR ? "right-0" : "left-0"}`}
        style={{ ...lineStyle, transformOrigin: isB ? "bottom" : "top" }}
        initial={reduced ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...t, delay: reduced ? 0 : 0.12 }}
      />
    </div>
  );
}

function ConfCount({ to }: { to: number }) {
  const [v, setV] = useState(Math.max(40, to - 16));
  useEffect(() => {
    let x = Math.max(40, to - 16);
    setV(x);
    const id = window.setInterval(() => {
      x += 1;
      setV(x);
      if (x >= to) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [to]);
  return <>{(v / 100).toFixed(2)}</>;
}

/* ───────────────────────── parked callout card ───────────────────────── */

function CalloutCard({
  ind,
  d,
  caught,
  cardFrac,
  reduced,
}: {
  ind: Ind;
  d: Detection;
  caught: boolean;
  cardFrac: { fx: number; fy: number };
  reduced: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-30 w-[16.5rem] rounded-lg border bg-ink-900/65 p-3 backdrop-blur-md"
      style={{
        borderColor: `${ind.tint}55`,
        top: `${cardFrac.fy * 100}%`,
        [ind.flip ? "left" : "right"]: "2.75rem",
        transform: "translateY(-50%)",
      }}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={caught ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ delay: reduced ? 0 : 0.34, duration: 0.4, ease: DRIFT }}
    >
      {/* label muted here so only the on-district chip stays hot (one focal point) */}
      <span className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-cream-100">{d.label}</span>
      <p className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em] text-steel-400">{d.klass}</p>
      <div className="mt-2 h-px w-full bg-cream-100/10" />
      <p className="mt-2 text-[0.78rem] leading-snug text-steel-200">{d.provenance}</p>
      <div className="mt-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-clay-400" />
        <span className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-clay-300">Processed on-prem</span>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── stage HUD ───────────────────────── */

function HudScanlines() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 4px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--steel-300)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--steel-300)) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </>
  );
}

function StageHud({ cameraId, reduced, compact = false }: { cameraId: string; reduced: boolean; compact?: boolean }) {
  const top = compact ? "top-4" : "top-[4.5rem]";
  const topInset = compact ? "top-4" : "top-[4.7rem]";
  const recLeft = compact ? "left-4" : "left-[5.5rem]";
  const clockRight = compact ? "right-4" : "right-[5.5rem]";
  return (
    <>
      {(["tl", "tr", "bl", "br"] as const).map((pos) => {
        const isR = pos.includes("r");
        const isB = pos.includes("b");
        return (
          <span
            key={pos}
            aria-hidden
            className={`pointer-events-none absolute z-20 h-7 w-7 border-cream-100/25 ${isB ? "bottom-6" : top} ${
              isR ? "right-6 border-r-2" : "left-6 border-l-2"
            } ${isB ? "border-b-2" : "border-t-2"}`}
          />
        );
      })}
      <div className={`pointer-events-none absolute z-20 flex items-center gap-2 ${recLeft} ${topInset}`}>
        <span className="relative flex h-2 w-2">
          {!reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-400" />
        </span>
        <span className="font-mono text-[0.65rem] tracking-wider text-cream-100">{cameraId}</span>
        <span className="font-mono text-[0.6rem] tracking-wider text-clay-300">REC</span>
      </div>
      <div className={`pointer-events-none absolute z-20 ${clockRight} ${topInset}`}>
        <Clock reduced={reduced} />
      </div>
    </>
  );
}

function Clock({ reduced }: { reduced: boolean }) {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const fmt = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      setT(`${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`);
    };
    fmt();
    if (reduced) return;
    const id = window.setInterval(fmt, 1000);
    return () => window.clearInterval(id);
  }, [reduced]);
  return <span className="font-mono text-[0.65rem] tracking-wider text-cream-100 tabular-nums">{t}</span>;
}
