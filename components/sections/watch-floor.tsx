"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, TriangleAlert } from "lucide-react";
import { WatchField } from "@/components/three/watch-field/WatchField";
import { ScrambleText } from "@/components/viewport/DetectionViewport";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { LOCK, DRIFT } from "@/lib/motion-grammar";
import {
  CHANNELS,
  SCENARIOS,
  CATEGORY_ORDER,
  type Category,
  type BoundingBox,
  type Scenario,
} from "@/components/sections/query-room.data";

/**
 * THE WATCH FLOOR — a cinematic camera-feed COVERFLOW of Triya's 9 real
 * detections. corem.ai's "How Teams Use Coram" was the starting point (a
 * horizontal carousel of feeds, centre enlarged, auto-advancing, a floating
 * detection callout) — then rebuilt in Triya's own language so it reads as ours:
 *
 *   • DEPTH  — side cards tilt in 3D (rotateY), recede in scale, focus-blur and
 *     dim by their distance from centre. A true coverflow, not corem's flat row.
 *   • LIVE SENSOR — the centre is a fixed live monitor playing real footage; the
 *     detection ARRIVES on every land: corner brackets draw on, a scan sweep, a
 *     confidence count-up, a connector line drawing to a floating readout, a
 *     category-tinted glow, ambient secondary detections, an on-prem stamp.
 *   • SIGNATURE MOVE — switching scenarios fires a vertical scan-mask wipe across
 *     the feed and a kinetic name scramble. Consistent every time.
 *   • NEVER FROZEN — a WebGL watch-field drifts behind, the feed always plays,
 *     scan lines sweep, the carousel auto-advances (pause on hover/focus/drag).
 *
 * One motion grammar (DRIFT/LOCK from lib/motion-grammar + COVER_SPRING). Driven
 * by auto-advance + click + drag/swipe + a keyboard radiogroup filmstrip — no
 * scroll pin, so it is immune to the Living City's 800% ScrollTrigger pin above.
 * Reduced motion → a static armed frame, a clickable filmstrip, a filled log.
 */

const CAT_TINT: Record<Category, string> = {
  security: "hsl(var(--clay-400))",
  compliance: "hsl(var(--clay-300))",
  safety: "hsl(38 70% 56%)",
  operations: "hsl(150 30% 52%)",
};

const CONF: Record<string, number> = {
  intrusion: 98,
  "no-parking": 95,
  crowd: 93,
  "uniform-compliance": 96,
  labcoat: 94,
  "phone-usage": 89,
  smoking: 92,
  "fire-smoke": 97,
  "active-assurance": 91,
};

// available scenarios reuse the closest real feed (single decode either way)
const FALLBACK_VIDEO: Record<string, string> = {
  smoking: "/videos/manufacturing_hero_1.mp4",
  "fire-smoke": "/videos/manufacturing_hero_1.mp4",
  labcoat: "/videos/manufacturing_hero_1.mp4",
  "phone-usage": "/videos/retail_hero_1.mp4",
  "active-assurance": "/videos/smartcity_hero_1.mp4",
};

/** the one shared card footprint — cards, spacer and the live monitor all use it */
const CARD_W = "clamp(280px, 56vw, 740px)";
const AUTO_MS = 4400;
const COVER_SPRING = { type: "spring", stiffness: 230, damping: 30, mass: 0.9 } as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** signed shortest distance from `center` to `i` around a ring of `n` (wrap-aware) */
function wrapD(i: number, center: number, n: number) {
  let d = ((i - center) % n + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

interface Monitor {
  id: string;
  scenario: Scenario;
  cameraId: string;
  location: string;
  timestamp: string;
  video: string;
  poster: string;
  box: BoundingBox;
  conf: number;
  detect: string;
  caption: string;
}

function buildMonitors(): Monitor[] {
  const ordered = CATEGORY_ORDER.flatMap((c) =>
    SCENARIOS.filter((s) => s.category === c),
  );
  return ordered.map((s) => {
    const conf = CONF[s.id] ?? 94;
    const detect = s.detects[0] ?? "Object";
    if (s.demoId) {
      const c = CHANNELS.find((x) => x.id === s.demoId)!;
      return {
        id: s.id,
        scenario: s,
        cameraId: c.cameraId,
        location: c.location,
        timestamp: c.timestamp,
        video: c.video,
        poster: c.poster,
        box: c.box,
        conf,
        detect,
        caption: c.verb,
      };
    }
    const p = s.preview!;
    return {
      id: s.id,
      scenario: s,
      cameraId: p.cameraId,
      location: p.location,
      timestamp: p.timestamp,
      video: FALLBACK_VIDEO[s.id] ?? "/videos/triya_monitoring_hero_1.mp4",
      poster: p.poster,
      box: p.box,
      conf,
      detect,
      caption: p.alert,
    };
  });
}

interface Alert {
  key: number;
  name: string;
  location: string;
  time: string;
  conf: number;
  category: Category;
}

type Phase = "scan" | "locked";

export function WatchFloor() {
  const reduced = usePrefersReducedMotion();
  const monitors = useMemo(buildMonitors, []);
  const n = monitors.length;

  const [idx, setIdx] = useState(0);
  const active = monitors[idx];
  const tint = CAT_TINT[active.scenario.category];

  const [phase, setPhase] = useState<Phase>(reduced ? "locked" : "scan");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const alertKey = useRef(0);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const go = (next: number) => setIdx(((next % n) + n) % n);

  // pause auto-advance whenever the user is engaged or the section is off-screen
  const paused = reduced || !inView || hovered || dragging;
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // visibility (pause + gate video)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.25,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // AUTO-ADVANCE — a single rAF accumulator drives both the timing and the
  // progress bar (mutated directly, no per-frame React render). Resets on every
  // idx change so a click/drag restarts the dwell.
  const accRef = useRef(0);
  useEffect(() => {
    accRef.current = 0;
    if (progressRef.current) progressRef.current.style.transform = "scaleY(0)";
  }, [idx]);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let prev: number | null = null;
    const loop = (ts: number) => {
      if (prev == null) prev = ts;
      const dt = ts - prev;
      prev = ts;
      if (!pausedRef.current) accRef.current += dt;
      const p = clamp(accRef.current / AUTO_MS, 0, 1);
      if (progressRef.current) progressRef.current.style.transform = `scaleY(${p})`;
      if (accRef.current >= AUTO_MS) {
        accRef.current = 0;
        setIdx((i) => (i + 1) % n);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, n]);

  // reduced motion: static armed frame + a pre-filled log, no timers
  useEffect(() => {
    if (!reduced) return;
    setPhase("locked");
    setAlerts(
      monitors.slice(0, 3).map((m, i) => ({
        key: i,
        name: m.scenario.name,
        location: m.location,
        time: m.timestamp,
        conf: m.conf,
        category: m.scenario.category,
      })),
    );
  }, [reduced, monitors]);

  // the detection sequence on each land: scan (re-target) → lock (box + toast)
  useEffect(() => {
    if (reduced || !inView) return;
    setPhase("scan");
    const t = setTimeout(() => {
      setPhase("locked");
      setAlerts((prev) =>
        [
          {
            key: alertKey.current++,
            name: active.scenario.name,
            location: active.location,
            time: active.timestamp,
            conf: active.conf,
            category: active.scenario.category,
          },
          ...prev,
        ].slice(0, 5),
      );
    }, 620);
    return () => clearTimeout(t);
  }, [idx, inView, reduced, active]);

  // single <video> in the fixed centre slot: keep the prior footage playing
  // through the scan, swap src only at LOCK (no freeze-to-poster), play in view
  useEffect(() => {
    const v = videoRef.current;
    if (!v || reduced) return;
    const needInitial = !v.getAttribute("data-src");
    if ((phase === "locked" || needInitial) && v.getAttribute("data-src") !== active.video) {
      v.src = active.video;
      v.setAttribute("data-src", active.video);
      v.load();
    }
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [idx, phase, inView, reduced, active]);

  // keyboard radiogroup over the filmstrip
  const railRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onRailKey = (e: React.KeyboardEvent, i: number) => {
    const last = n - 1;
    let m = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") m = i === last ? 0 : i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") m = i === 0 ? last : i - 1;
    else if (e.key === "Home") m = 0;
    else if (e.key === "End") m = last;
    else return;
    e.preventDefault();
    setIdx(m);
    railRefs.current[monitors[m].id]?.focus();
  };

  // drag / swipe on the stage
  const dragX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    dragX.current = e.clientX;
    setDragging(true);
  };
  const endDrag = (e: React.PointerEvent) => {
    if (dragX.current != null) {
      const dx = e.clientX - dragX.current;
      if (dx <= -44) go(idx + 1);
      else if (dx >= 44) go(idx - 1);
    }
    dragX.current = null;
    setDragging(false);
  };

  return (
    <section
      id="watch-floor"
      ref={rootRef}
      aria-labelledby="watch-floor-title"
      className="dark relative overflow-hidden bg-ink-900 py-20 text-cream-100 sm:py-28"
    >
      <div className="absolute inset-0 z-0 opacity-70">
        <WatchField intensity={0.6} />
      </div>

      {/* header + now-watching HUD */}
      <div className="container relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="t-eyebrow !text-steel-300">Where to apply · The watch floor</p>
            <h2 id="watch-floor-title" className="t-display-2 mt-3 text-cream-50">
              Nine detections, <em className="not-italic text-clay-400">always watching</em>.
            </h2>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-steel-200">
              The real scenarios you switch on per camera — running live on your
              own footage, on-prem.{" "}
              <span className="text-cream-100">
                {reduced ? "Pick any feed below." : "Auto-advancing — hover to hold, drag to explore."}
              </span>
            </p>
          </div>
          <NowWatching active={active} idx={idx} total={n} progressRef={progressRef} reduced={reduced} />
        </div>
      </div>

      {/* the coverflow stage — full-bleed so the side feeds run off both edges */}
      <div
        ref={stageRef}
        className="relative z-10 mt-8 w-full touch-pan-y select-none overflow-hidden px-4 sm:px-6"
        style={{ perspective: 1800 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setHovered(true)}
        onBlurCapture={() => setHovered(false)}
        onPointerDown={onPointerDown}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* spacer establishes the stage height from the card footprint */}
        <div aria-hidden="true" className="invisible mx-auto aspect-video" style={{ width: CARD_W }} />

        {/* side / background feeds */}
        {monitors.map((m, i) => {
          const d = wrapD(i, idx, n);
          if (d === 0) return <CoverCard key={m.id} m={m} d={0} reduced={reduced} isCenter onClick={() => {}} />;
          return (
            <CoverCard
              key={m.id}
              m={m}
              d={d}
              reduced={reduced}
              isCenter={false}
              onClick={() => go(i)}
            />
          );
        })}

        {/* the fixed centre live monitor (always dead-centre; content swaps) */}
        <LiveMonitor active={active} phase={phase} reduced={reduced} tint={tint} videoRef={videoRef} />

        {/* prev / next */}
        {!reduced && (
          <>
            <StageArrow side="left" onClick={() => go(idx - 1)} />
            <StageArrow side="right" onClick={() => go(idx + 1)} />
          </>
        )}

        {/* live alert log — floats over the far (blurred) right feed for density,
            kept translucent so the receding coverflow card still reads behind it */}
        <div className="pointer-events-none absolute right-4 top-4 z-[60] hidden w-56 xl:block">
          <AlertLog alerts={alerts} reduced={reduced} />
        </div>
      </div>

      {/* the filmstrip scrubber + footer */}
      <div className="container relative z-10 mt-7">
        <Filmstrip
          monitors={monitors}
          activeId={active.id}
          reduced={reduced}
          railRefs={railRefs}
          onPick={(i) => setIdx(i)}
          onKey={onRailKey}
        />

        <div className="mt-6 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.75rem] text-steel-300">
            Runs 24/7 on the cameras you already own — every frame processed at the edge.
          </p>
          <Link
            href="/contact/"
            className="group inline-flex items-center gap-2 text-sm text-steel-200 transition-colors hover:text-cream-50"
          >
            Don’t see yours? Triya can likely learn it
            <ArrowRight className="h-4 w-4 text-clay-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── now-watching HUD ───────────────────────── */

function NowWatching({
  active,
  idx,
  total,
  progressRef,
  reduced,
}: {
  active: Monitor;
  idx: number;
  total: number;
  progressRef: React.RefObject<HTMLDivElement>;
  reduced: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="text-right">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-steel-300">
          Now watching
        </p>
        <ScrambleText
          value={active.scenario.name}
          reduced={reduced}
          className="font-display text-lg leading-tight text-cream-50"
        />
        <p className="font-display text-sm leading-none">
          <span className="tabular-nums text-clay-400">{String(idx + 1).padStart(2, "0")}</span>
          <span className="text-steel-400"> / {String(total).padStart(2, "0")}</span>
        </p>
      </div>
      {!reduced && (
        <div className="h-12 w-1 overflow-hidden rounded-full bg-ink-700">
          <div
            ref={progressRef}
            className="h-full w-full origin-top rounded-full bg-clay-400"
            style={{ transform: "scaleY(0)" }}
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── coverflow card ───────────────────────── */

function CoverCard({
  m,
  d,
  reduced,
  isCenter,
  onClick,
}: {
  m: Monitor;
  d: number;
  reduced: boolean;
  isCenter: boolean;
  onClick: () => void;
}) {
  const abs = Math.abs(d);
  const x = d * 60 - 50; // % of own width; -50 recentres
  const scale = Math.max(0.52, 1 - 0.24 * abs);
  const rotateY = clamp(-d, -2, 2) * 30;
  const opacity = isCenter ? 1 : clamp(1 - 0.36 * abs, 0, 1);
  const blur = abs === 0 ? 0 : Math.min(2, abs) * 2.6;
  const z = 30 - Math.round(abs * 4);
  // position snaps instantly for hidden cards (|d|>=3) so the wrap-around teleport
  // is invisible; visible cards spring. Opacity always eases.
  const posTrans = reduced ? { duration: 0 } : abs >= 3 ? { duration: 0 } : COVER_SPRING;

  return (
    <motion.button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      onClick={onClick}
      className="cf-card absolute left-1/2 top-1/2 aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black"
      style={{ width: CARD_W, zIndex: z }}
      initial={false}
      animate={{
        x: `${x}%`,
        y: "-50%",
        rotateY,
        scale,
        opacity,
        filter: `blur(${blur}px) saturate(${isCenter ? 1 : 0.7}) brightness(${isCenter ? 1 : 0.62})`,
      }}
      transition={{
        x: posTrans,
        y: posTrans,
        rotateY: posTrans,
        scale: posTrans,
        opacity: { duration: reduced ? 0 : 0.4 },
        filter: { duration: reduced ? 0 : 0.4 },
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-ink-900/35" />
      {!isCenter && abs <= 2 && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-3 pb-2 pt-6">
          <p className="truncate font-display text-[0.8rem] font-medium text-cream-100">
            {m.scenario.name}
          </p>
          <p className="truncate font-mono text-[0.55rem] uppercase tracking-wider text-steel-300">
            {m.detect}
          </p>
        </div>
      )}
    </motion.button>
  );
}

/* ───────────────────────── the live monitor (centre) ───────────────────────── */

function LiveMonitor({
  active,
  phase,
  reduced,
  tint,
  videoRef,
}: {
  active: Monitor;
  phase: Phase;
  reduced: boolean;
  tint: string;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const locked = phase === "locked";
  return (
    <div
      className="cf-card absolute left-1/2 top-1/2 z-[55] aspect-video -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95)]"
      style={{ width: CARD_W }}
    >
      {reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={active.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "saturate(0.96) brightness(1.04) contrast(1.08)" }}
        />
      ) : (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          poster={active.poster}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "saturate(0.96) brightness(1.04) contrast(1.08)" }}
        />
      )}

      {/* cool wash + grade + scanline + vignette */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "hsl(213 32% 14% / 0.16)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 3px)" }}
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 120px 8px rgba(0,0,0,0.45)" }} />

      {!reduced && <SecondaryDetections />}
      <MonitorCorners />

      {/* HUD: cam id + REC */}
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          {!reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-400" />
        </span>
        <ScrambleText value={active.cameraId} reduced={reduced} className="font-mono text-[0.65rem] tracking-wider text-cream-100" />
        <span className="font-mono text-[0.6rem] tracking-wider text-clay-300">REC</span>
      </div>
      {/* HUD: location + time */}
      <div className="absolute right-3 top-3 z-20 text-right">
        <p className="font-mono text-[0.65rem] tracking-wider text-cream-100">{active.timestamp}</p>
        <p className="font-mono text-[0.6rem] tracking-wider text-steel-300">{active.location}</p>
      </div>

      {/* periodic analysing sweep */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-10 h-24 -translate-y-1/2"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--steel-300)/0.22), transparent)" }}
          initial={{ top: "-14%" }}
          animate={{ top: "114%" }}
          transition={{ duration: 3.2, ease: "linear", repeat: Infinity, repeatDelay: 1.3 }}
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-steel-200/80 shadow-[0_0_10px_2px_hsl(var(--steel-300)/0.5)]" />
        </motion.div>
      )}

      {/* SIGNATURE TRANSITION — a vertical scan-mask wipe on every land */}
      {!reduced && <ScanWipe key={active.id} tint={tint} />}

      {/* re-target hint while scanning */}
      {!reduced && phase === "scan" && (
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-steel-200">
          re-targeting
          <Dots />
        </div>
      )}

      {/* the detection box + the floating connector readout draw on when locked */}
      <AnimatePresence mode="wait">
        {locked && (
          <DetectionBox
            key={active.id}
            box={active.box}
            detect={active.detect}
            conf={active.conf}
            tint={tint}
            reduced={reduced}
          />
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        {locked && <ConnectorCallout key={`c-${active.id}`} active={active} tint={tint} reduced={reduced} />}
      </AnimatePresence>

      {/* on-prem stamp */}
      {locked && (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-3 right-3 z-20 select-none rounded-md border border-clay-400/70 bg-black/40 px-2 py-1 backdrop-blur-sm"
        >
          <p className="font-mono text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-clay-300">
            Processed on-prem
          </p>
        </motion.div>
      )}
    </div>
  );
}

function ScanWipe({ tint }: { tint: string }) {
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-30 w-[3px]"
        style={{ background: `linear-gradient(to bottom, transparent, ${tint}, transparent)`, boxShadow: `0 0 26px 7px ${tint}` }}
        initial={{ left: "-4%", opacity: 0.95 }}
        animate={{ left: "104%", opacity: 0.95 }}
        transition={{ duration: 0.62, ease: LOCK }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[29]"
        style={{ background: tint }}
        initial={{ opacity: 0.16 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </>
  );
}

function MonitorCorners() {
  const base = "pointer-events-none absolute z-10 h-6 w-6 border-cream-100/40";
  return (
    <>
      <span className={`${base} left-2 top-2 border-l-2 border-t-2`} />
      <span className={`${base} right-2 top-2 border-r-2 border-t-2`} />
      <span className={`${base} bottom-2 left-2 border-b-2 border-l-2`} />
      <span className={`${base} bottom-2 right-2 border-b-2 border-r-2`} />
    </>
  );
}

/* ───────────────────────── detection box (draws on) ───────────────────────── */

function DetectionBox({
  box,
  detect,
  conf,
  tint,
  reduced,
}: {
  box: BoundingBox;
  detect: string;
  conf: number;
  tint: string;
  reduced: boolean;
}) {
  const zone = box.mode === "zone";
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
      className="pointer-events-none absolute z-[15]"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute -inset-[18%] rounded-[40%]"
        style={{ background: `radial-gradient(50% 50% at 50% 50%, ${tint}, transparent 70%)` }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: zone ? 0.32 : 0.18 }}
        transition={{ delay: reduced ? 0 : 0.34, duration: 0.4 }}
      />
      {zone && (
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-[2px]"
          style={{ background: `radial-gradient(60% 55% at 55% 60%, ${tint}, transparent 72%)`, opacity: 0.45 }}
        />
      )}
      <motion.div
        className="absolute inset-0 rounded-[2px] border"
        style={{ borderColor: tint, opacity: 0.45 }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: reduced ? 0 : 0.32, duration: 0.3 }}
      />
      <BoxCorner pos="tl" tint={tint} reduced={reduced} />
      <BoxCorner pos="tr" tint={tint} reduced={reduced} />
      <BoxCorner pos="bl" tint={tint} reduced={reduced} />
      <BoxCorner pos="br" tint={tint} reduced={reduced} />
      <motion.div
        className="absolute -top-6 left-0 flex items-center gap-1.5 whitespace-nowrap rounded px-1.5 py-0.5"
        style={{ background: tint, boxShadow: `0 0 14px -2px ${tint}` }}
        initial={reduced ? false : { opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.34, duration: 0.25, ease: DRIFT }}
      >
        <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-ink-900">
          {detect}
        </span>
        <span className="font-mono text-[0.6rem] tabular-nums text-ink-900/80">
          {reduced ? (conf / 100).toFixed(2) : <ConfCount to={conf} />}
        </span>
      </motion.div>
    </motion.div>
  );
}

function BoxCorner({
  pos,
  tint,
  reduced,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  tint: string;
  reduced: boolean;
}) {
  const isR = pos.includes("r");
  const isB = pos.includes("b");
  const t = reduced ? { duration: 0 } : { duration: 0.28, ease: LOCK, delay: 0.04 };
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
        transition={{ ...t, delay: reduced ? 0 : 0.1 }}
      />
    </div>
  );
}

/* ── the floating connector readout — a line draws from the box to a HUD panel ── */

function ConnectorCallout({
  active,
  tint,
  reduced,
}: {
  active: Monitor;
  tint: string;
  reduced: boolean;
}) {
  const b = active.box;
  const boxOnLeft = b.x + b.w / 2 < 50;
  // anchor on the box, toward the panel
  const ax = boxOnLeft ? b.x + b.w : b.x;
  const ay = clamp(b.y + 2, 6, 92);
  // panel connection point (and the panel sits from here)
  const px = boxOnLeft ? 66 : 34;
  const py = 14;

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[18]"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
    >
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d={`M ${ax} ${ay} L ${px} ${py}`}
          fill="none"
          stroke={tint}
          strokeWidth={1.3}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: reduced ? 0 : 0.3, duration: 0.42, ease: LOCK }}
        />
        <circle cx={ax} cy={ay} r={1.2} fill={tint} vectorEffect="non-scaling-stroke" />
        <circle cx={px} cy={py} r={1} fill={tint} vectorEffect="non-scaling-stroke" />
      </svg>

      <motion.div
        className="absolute w-[min(48%,16rem)] rounded-lg border bg-ink-900/80 p-2.5 backdrop-blur-md"
        style={{
          left: `${px}%`,
          top: `${py}%`,
          transform: boxOnLeft ? "translate(6px, -4px)" : "translate(calc(-100% - 6px), -4px)",
          borderColor: tint,
          boxShadow: `0 0 30px -12px ${tint}`,
        }}
        initial={reduced ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduced ? 0 : 0.34, duration: 0.3, ease: DRIFT }}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-[0.82rem] font-semibold leading-tight text-cream-50">
            {active.scenario.name}
          </span>
          <span className="shrink-0 font-mono text-[0.62rem] tabular-nums" style={{ color: tint }}>
            {reduced ? (active.conf / 100).toFixed(2) : <ConfCount to={active.conf} />}
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[0.52rem] uppercase tracking-wider text-steel-300">
          {active.detect} · {active.cameraId}
        </p>
        <p className="mt-1.5 line-clamp-2 text-[0.72rem] leading-snug text-steel-200">
          {active.caption}
        </p>
      </motion.div>
    </motion.div>
  );
}

/* ambient secondary detections — steel "watching" callouts that flicker for life */
function SecondaryDetections() {
  const marks = [
    { x: 64, y: 16, w: 14, h: 27, label: "Person 0.86", keyframes: [0.55, 0.85, 0.55], times: [0, 0.5, 1], repeatDelay: 0, d: 0 },
    { x: 8, y: 58, w: 17, h: 30, label: "Motion 0.71", keyframes: [0, 0.85, 0.85, 0], times: [0, 0.18, 0.7, 1], repeatDelay: 2.6, d: 1.6 },
  ];
  return (
    <>
      {marks.map((m) => (
        <motion.div
          key={m.label}
          aria-hidden="true"
          className="pointer-events-none absolute z-[12]"
          style={{ left: `${m.x}%`, top: `${m.y}%`, width: `${m.w}%`, height: `${m.h}%` }}
          animate={{ opacity: m.keyframes }}
          transition={{ duration: 3.4, times: m.times, repeat: Infinity, repeatDelay: m.repeatDelay, delay: m.d }}
        >
          <div className="absolute inset-0 rounded-[2px] border border-steel-300/70" />
          <span className="absolute -top-4 left-0 whitespace-nowrap rounded-sm bg-steel-500/80 px-1 py-px font-mono text-[0.5rem] uppercase tracking-wider text-cream-100">
            {m.label}
          </span>
        </motion.div>
      ))}
    </>
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

/* ───────────────────────── stage arrows ───────────────────────── */

function StageArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous scenario" : "Next scenario"}
      onClick={onClick}
      className={`group absolute top-1/2 z-[70] grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-ink-900/60 text-cream-100 backdrop-blur-md transition-colors hover:border-clay-400/70 hover:bg-ink-800/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 ${
        side === "left" ? "left-3 sm:left-6" : "right-3 sm:right-6"
      }`}
    >
      <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
    </button>
  );
}

/* ───────────────────────── alert log ───────────────────────── */

function AlertLog({ alerts, reduced }: { alerts: Alert[]; reduced: boolean }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-ink-900/45 p-4 backdrop-blur-md">
      <div className="mb-3 flex items-center justify-between">
        <span className="t-eyebrow !text-clay-300">Live alerts</span>
        <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-steel-300">
          <span className="relative flex h-1.5 w-1.5">
            {!reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay-400" />
          </span>
          on-prem
        </span>
      </div>
      <ul className="flex min-h-[8.5rem] flex-col gap-2">
        <AnimatePresence initial={false}>
          {alerts.map((a) => (
            <motion.li
              key={a.key}
              layout
              initial={reduced ? false : { opacity: 0, x: 28, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.18 } }}
              transition={{ duration: 0.34, ease: DRIFT }}
              className="flex items-start gap-2 rounded-lg border border-[hsl(var(--border))] bg-ink-900/70 px-3 py-2"
            >
              <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: CAT_TINT[a.category] }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-display text-[0.82rem] font-medium text-cream-50">{a.name}</span>
                  <span className="ms-auto font-mono text-[0.6rem] tabular-nums text-clay-300">{a.conf}%</span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[0.58rem] uppercase tracking-wider text-steel-300">
                  {a.location} · {a.time}
                </p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/* ───────────────────────── filmstrip scrubber ───────────────────────── */

function Filmstrip({
  monitors,
  activeId,
  reduced,
  railRefs,
  onPick,
  onKey,
}: {
  monitors: Monitor[];
  activeId: string;
  reduced: boolean;
  railRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  onPick: (i: number) => void;
  onKey: (e: React.KeyboardEvent, i: number) => void;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <span className="t-eyebrow !text-steel-300">The camera wall · pick any feed</span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-steel-400">
          {monitors.length} cameras
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label="Choose a detection scenario"
        className="flex gap-2.5 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {monitors.map((m, i) => {
          const on = m.id === activeId;
          const tint = CAT_TINT[m.scenario.category];
          return (
            <button
              key={m.id}
              ref={(el) => {
                railRefs.current[m.id] = el;
              }}
              role="radio"
              aria-checked={on}
              aria-label={`${m.scenario.name} — detects ${m.scenario.detects.join(", ")}`}
              tabIndex={on ? 0 : -1}
              onClick={() => onPick(i)}
              onKeyDown={(e) => onKey(e, i)}
              className="group relative aspect-[4/3] w-[7.5rem] shrink-0 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-black text-start outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-clay-400 sm:w-[8.5rem]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.poster}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
                style={{
                  filter: on
                    ? "saturate(1) brightness(0.92) contrast(1.05)"
                    : "saturate(0.4) brightness(0.5) contrast(1.04)",
                }}
              />
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-ink-900/40 transition-opacity duration-500 ${on ? "opacity-0" : "opacity-100 group-hover:opacity-30"}`}
              />
              {on && (
                <div aria-hidden="true" className="absolute inset-0" style={{ boxShadow: `inset 0 0 30px -6px ${tint}` }} />
              )}
              <MiniDetection box={m.box} tint={tint} on={on} reduced={reduced} />
              {on && (
                <motion.span
                  layoutId="cf-active-ring"
                  className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-clay-400"
                  transition={{ duration: 0.4, ease: DRIFT }}
                />
              )}
              <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  {!reduced && on && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
                  )}
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${on ? "bg-clay-400" : "bg-steel-400"}`} />
                </span>
                {on && <span className="font-mono text-[0.5rem] font-semibold tracking-wider text-clay-300">LIVE</span>}
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pb-1.5 pt-5">
                <p
                  className={`truncate font-display text-[0.7rem] font-medium leading-tight tracking-tight ${on ? "text-cream-50" : "text-steel-200 group-hover:text-cream-100"}`}
                >
                  {m.scenario.name}
                </p>
                <p className="truncate font-mono text-[0.5rem] uppercase tracking-wider text-steel-400">
                  {m.detect}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniDetection({
  box,
  tint,
  on,
  reduced,
}: {
  box: BoundingBox;
  tint: string;
  on: boolean;
  reduced: boolean;
}) {
  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
      animate={reduced ? { opacity: on ? 0.95 : 0.5 } : { opacity: on ? [0.7, 1, 0.7] : 0.45 }}
      transition={reduced ? { duration: 0 } : { duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
    >
      {(["tl", "tr", "bl", "br"] as const).map((c) => {
        const isR = c.includes("r");
        const isB = c.includes("b");
        return (
          <span
            key={c}
            className={`absolute h-2 w-2 ${isB ? "bottom-0 border-b" : "top-0 border-t"} ${isR ? "right-0 border-r" : "left-0 border-l"}`}
            style={{ borderColor: tint, borderWidth: on ? 1.5 : 1 }}
          />
        );
      })}
    </motion.div>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-0.5">
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
    </span>
  );
}
