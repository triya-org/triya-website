"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { WatchField } from "@/components/three/watch-field/WatchField";
import { Caret } from "@/components/viewport/DetectionViewport";
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
 * THE WATCH FLOOR — a calm, cinematic camera-feed COVERFLOW of Triya's 9 real
 * detections. corem.ai's carousel was the starting point, kept deliberately
 * uncluttered: one enlarged live feed in the centre, the neighbouring feeds
 * receding in 3D either side, and a clean caption below that explains the
 * scenario in plain third-person. No alert log, no feed-tile wall — just the
 * footage and the one thing it's watching for.
 *
 *   • DEPTH      — side cards tilt (rotateY), recede in scale + focus-blur.
 *   • DETECTION  — on each landing a scan-mask wipes the feed and the detection
 *     draws on (corner brackets, a confidence count-up, a category glow).
 *   • EXPLAINED  — the scenario name + a one-line description slide in beneath.
 *   • NEVER FROZEN — the feed always plays, a scan line sweeps, a watch-field
 *     drifts behind; auto-advances (pause on hover/focus/drag).
 *
 * Driven by auto-advance + click + drag/swipe + a keyboard radiogroup of dots —
 * no scroll pin (immune to the Living City's GSAP pin). Reduced motion → a
 * static armed frame, clickable dots, no auto-advance.
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

/** the one connected readout shown beside the detection box, per scenario */
const CALLOUT: Record<string, string> = {
  intrusion: "No clearance · Zone restricted",
  "no-parking": "Idle 3m 12s · No-park zone",
  crowd: "4.1 / m² · Above threshold",
  "uniform-compliance": "Sustained 40s · Press bay",
  labcoat: "Clean zone · PPE required",
  "phone-usage": "2m 10s · Work zone",
  smoking: "No-smoking zone · Confirmed",
  "fire-smoke": "Auto-validated · Bay 2",
  "active-assurance": "Empty 6m · Expected staffed",
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
const CARD_W = "clamp(280px, 56vw, 760px)";
const AUTO_MS = 4600;
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
  callout: string;
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
        callout: CALLOUT[s.id] ?? "",
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
      callout: CALLOUT[s.id] ?? "",
    };
  });
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
  const [inView, setInView] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const go = (next: number) => setIdx(((next % n) + n) % n);

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

  // AUTO-ADVANCE — one rAF accumulator drives the timing and the active dot's
  // fill (mutated directly, no per-frame render). Resets on every idx change.
  const accRef = useRef(0);
  useEffect(() => {
    accRef.current = 0;
    if (progressRef.current) progressRef.current.style.transform = "scaleX(0)";
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
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
      if (accRef.current >= AUTO_MS) {
        accRef.current = 0;
        setIdx((i) => (i + 1) % n);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced, n]);

  // the detection sequence on each land: while "scan", the centre live overlay
  // is faded out so the clicked card visibly TRAVELS to centre (springs, grows,
  // de-blurs); at "lock" the overlay boots back up (fade-in + scan wipe + the
  // detection draws on). 620ms ≈ the cover spring's settle time.
  useEffect(() => {
    if (reduced || !inView) return;
    setPhase("scan");
    const t = setTimeout(() => setPhase("locked"), 620);
    return () => clearTimeout(t);
  }, [idx, inView, reduced]);

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

  // keyboard radiogroup over the dots
  const dotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const onDotKey = (e: React.KeyboardEvent, i: number) => {
    const last = n - 1;
    let m = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") m = i === last ? 0 : i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") m = i === 0 ? last : i - 1;
    else if (e.key === "Home") m = 0;
    else if (e.key === "End") m = last;
    else return;
    e.preventDefault();
    setIdx(m);
    dotRefs.current[m]?.focus();
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
      aria-labelledby="watch-floor-title"
      className="dark relative overflow-hidden bg-ink-900 py-20 text-cream-100 sm:py-28"
    >
      <div className="absolute inset-0 z-0 opacity-60">
        <WatchField intensity={0.5} />
      </div>

      {/* header */}
      <div className="container relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="t-eyebrow !text-steel-300">Where to apply · The watch floor</p>
          <h2 id="watch-floor-title" className="t-display-2 mt-3 text-cream-50">
            Every detection, <em className="not-italic text-clay-400">always watching</em>.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[1.05rem] leading-relaxed text-steel-200">
            The real scenarios you switch on per camera — each running live on
            your own footage, on-prem.
          </p>
        </div>
      </div>

      {/* the coverflow stage — full-bleed so the side feeds run off both edges */}
      <div
        ref={stageRef}
        className="relative z-10 mt-12 w-full touch-pan-y select-none overflow-hidden px-4 sm:px-6"
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
        <div aria-hidden="true" className="invisible mx-auto aspect-[16/7.8]" style={{ width: CARD_W }} />

        {monitors.map((m, i) => {
          const d = wrapD(i, idx, n);
          if (d === 0) return <CoverCard key={m.id} m={m} d={0} reduced={reduced} isCenter onClick={() => {}} />;
          return (
            <CoverCard key={m.id} m={m} d={d} reduced={reduced} isCenter={false} onClick={() => go(i)} />
          );
        })}

        <LiveMonitor active={active} phase={phase} reduced={reduced} tint={tint} videoRef={videoRef} />

        {!reduced && (
          <>
            <StageArrow side="left" onClick={() => go(idx - 1)} />
            <StageArrow side="right" onClick={() => go(idx + 1)} />
          </>
        )}
      </div>

      {/* caption — explains the scenario in plain third-person; changes with a
          clean slide so a switch always reads as a deliberate move */}
      <div className="container relative z-10 mt-8">
        <div className="mx-auto max-w-xl text-center">
          <div className="min-h-[7.5rem]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8, transition: { duration: 0.2 } }}
                transition={{ duration: 0.34, ease: DRIFT }}
              >
                <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-steel-400">
                  <span style={{ color: tint }}>{active.detect}</span> ·{" "}
                  {active.scenario.category} ·{" "}
                  <span className="tabular-nums">{String(idx + 1).padStart(2, "0")}</span>
                  <span className="text-steel-500"> / {String(n).padStart(2, "0")}</span>
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-cream-50 sm:text-[1.85rem]">
                  {active.scenario.name}
                </h3>
                {/* the description TYPES in — Triya reading out what it sees */}
                <Typewriter
                  key={active.id}
                  text={active.caption}
                  reduced={reduced}
                  className="mx-auto mt-2 block max-w-md text-[1rem] leading-relaxed text-steel-200"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <Dots
            monitors={monitors}
            idx={idx}
            reduced={reduced}
            progressRef={progressRef}
            dotRefs={dotRefs}
            onPick={(i) => setIdx(i)}
            onKey={onDotKey}
          />
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
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
  const posTrans = reduced ? { duration: 0 } : abs >= 3 ? { duration: 0 } : COVER_SPRING;

  return (
    <motion.button
      type="button"
      aria-hidden="true"
      tabIndex={-1}
      onClick={onClick}
      className="cf-card absolute left-1/2 top-1/2 aspect-[16/7.8] overflow-hidden rounded-2xl border border-white/10 bg-black"
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
      <img src={m.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top" />
      {/* side cards get a scrim; the centre card stays clean so it reads bright
          as it travels in before the live overlay boots up over it */}
      {!isCenter && <div aria-hidden="true" className="absolute inset-0 bg-ink-900/35" />}
    </motion.button>
  );
}

/* ───────────────────────── typewriter ───────────────────────── */

/** Types `text` out character by character on mount / text change (Triya
 *  reading out what it sees). Reduced motion → the full line, instantly. */
function Typewriter({
  text,
  reduced,
  className,
}: {
  text: string;
  reduced: boolean;
  className?: string;
}) {
  const [shown, setShown] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) {
      setShown(text.length);
      return;
    }
    setShown(0);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [text, reduced]);

  return (
    <span className={className}>
      {text.slice(0, shown)}
      {!reduced && shown < text.length && <Caret />}
    </span>
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
    // outer = centring only (plain div; framer must not clobber the translate);
    // inner motion.div fades out during "scan" so the travelling card shows,
    // and boots back in at "lock".
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-[55] -translate-x-1/2 -translate-y-1/2"
      style={{ width: CARD_W }}
    >
    <motion.div
      className="cf-card relative aspect-[16/7.8] w-full overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_40px_90px_-40px_rgba(0,0,0,0.95)]"
      initial={false}
      animate={{ opacity: reduced || locked ? 1 : 0 }}
      transition={{ duration: locked ? 0.34 : 0.18, ease: DRIFT }}
    >
      {/* poster always sits under the video so a src-swap never flashes black */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={active.poster}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover object-top"
        style={{ filter: "saturate(0.96) brightness(1.06) contrast(1.05)" }}
      />
      {!reduced && (
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          poster={active.poster}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover object-top"
          style={{ filter: "saturate(0.96) brightness(1.06) contrast(1.05)" }}
        />
      )}

      {/* light, even grade so the feed reads crisp (not a muddy rectangle) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/15" />
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 3px)" }}
        />
      )}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 0 0 110px 6px rgba(0,0,0,0.4)" }} />

      {/* SIGNATURE — a vertical scan-mask wipe on every land */}
      {!reduced && <ScanWipe key={active.id} tint={tint} />}

      {/* the detection draws on when locked: the box + one connected readout.
          All other HUD chrome is intentionally gone — the footage is already a
          camera, so the detection is the only thing on the glass. */}
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
      {locked && active.callout && (
        <DetectionCallout
          key={active.id + "-callout"}
          box={active.box}
          text={active.callout}
          tint={tint}
          reduced={reduced}
        />
      )}
    </motion.div>
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
        initial={{ left: "-4%", opacity: 0.9 }}
        animate={{ left: "104%", opacity: 0.9 }}
        transition={{ duration: 0.66, ease: LOCK }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[29]"
        style={{ background: tint }}
        initial={{ opacity: 0.14 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </>
  );
}

/* ───────────────────────── detection callout (connected readout) ───────────────────────── */

/** A single corem-style data chip connected to the detection box by a thin line
 *  that draws on. Sits on whichever side of the box has more room. */
function DetectionCallout({
  box,
  text,
  tint,
  reduced,
}: {
  box: BoundingBox;
  text: string;
  tint: string;
  reduced: boolean;
}) {
  const cx = box.x + box.w / 2;
  const onRight = cx < 52; // chip extends right when the box sits left-of-centre
  const anchorX = onRight ? box.x + box.w : box.x; // box edge the line leaves from
  const anchorY = clamp(box.y + box.h * 0.28, 6, 88);
  const lineW = 7; // % of card width
  const farX = onRight ? anchorX + lineW : anchorX - lineW; // chip-side end of the line

  const draw = reduced ? { duration: 0 } : { duration: 0.32, ease: LOCK, delay: 0.42 };
  const chipIn = reduced ? { duration: 0 } : { duration: 0.3, ease: DRIFT, delay: 0.6 };

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[18]">
      {/* connector line */}
      <motion.div
        className="absolute h-px"
        style={{
          top: `${anchorY}%`,
          left: `${onRight ? anchorX : farX}%`,
          width: `${lineW}%`,
          background: tint,
          boxShadow: `0 0 8px -1px ${tint}`,
          transformOrigin: onRight ? "left" : "right",
        }}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={draw}
      />
      {/* node dot on the box edge */}
      <motion.span
        className="absolute h-1.5 w-1.5 rounded-full"
        style={{ top: `${anchorY}%`, left: `${anchorX}%`, marginLeft: -3, marginTop: -3, background: tint, boxShadow: `0 0 8px 0 ${tint}` }}
        initial={reduced ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={draw}
      />
      {/* the data chip */}
      <motion.div
        className="absolute flex items-center gap-1.5 whitespace-nowrap rounded-md border border-white/15 bg-ink-900/85 px-2 py-1 backdrop-blur-sm"
        style={onRight ? { top: `${anchorY}%`, left: `${farX}%` } : { top: `${anchorY}%`, right: `${100 - farX}%` }}
        initial={reduced ? false : { opacity: 0, x: onRight ? -6 : 6, y: "-50%" }}
        animate={{ opacity: 1, x: 0, y: "-50%" }}
        transition={chipIn}
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tint }} />
        <span className="font-mono text-[0.62rem] leading-none tracking-wide text-cream-100">
          {text}
        </span>
      </motion.div>
    </div>
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
        animate={{ opacity: zone ? 0.3 : 0.16 }}
        transition={{ delay: reduced ? 0 : 0.34, duration: 0.4 }}
      />
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

/* ───────────────────────── dots (nav + dwell progress) ───────────────────────── */

function Dots({
  monitors,
  idx,
  reduced,
  progressRef,
  dotRefs,
  onPick,
  onKey,
}: {
  monitors: Monitor[];
  idx: number;
  reduced: boolean;
  progressRef: React.RefObject<HTMLDivElement>;
  dotRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  onPick: (i: number) => void;
  onKey: (e: React.KeyboardEvent, i: number) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose a detection scenario"
      className="mt-7 flex items-center justify-center gap-2"
    >
      {monitors.map((m, i) => {
        const on = i === idx;
        return (
          <button
            key={m.id}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            role="radio"
            aria-checked={on}
            aria-label={`${m.scenario.name} — detects ${m.scenario.detects.join(", ")}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onPick(i)}
            onKeyDown={(e) => onKey(e, i)}
            className="group relative grid h-5 place-items-center outline-none"
          >
            {on ? (
              // active: a clay pill that fills with the auto-advance dwell
              <span className="relative h-1.5 w-7 overflow-hidden rounded-full bg-clay-400/30 ring-2 ring-transparent transition group-focus-visible:ring-clay-400/60">
                {reduced ? (
                  <span className="absolute inset-0 bg-clay-400" />
                ) : (
                  <span
                    ref={progressRef}
                    className="absolute inset-0 origin-left bg-clay-400"
                    style={{ transform: "scaleX(0)" }}
                  />
                )}
              </span>
            ) : (
              <span className="h-1.5 w-1.5 rounded-full bg-steel-500 transition group-hover:bg-steel-300 group-focus-visible:bg-steel-200" />
            )}
          </button>
        );
      })}
    </div>
  );
}
