"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, TriangleAlert } from "lucide-react";
import { WatchField } from "@/components/three/watch-field/WatchField";
import { ScrambleText } from "@/components/viewport/DetectionViewport";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { LOCK, DRIFT } from "@/lib/motion-grammar";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import {
  CHANNELS,
  SCENARIOS,
  CATEGORY_ORDER,
  type Category,
  type BoundingBox,
  type Scenario,
} from "@/components/sections/query-room.data";

/**
 * THE WATCH FLOOR — the centerpiece, rebuilt to the motion-craft bar of
 * ambient.ai / spot.ai (real looping footage + animated SVG/CSS detection
 * overlays + GSAP/Framer choreography), applied to Triya's 9 real detections.
 *
 * One cinematic surveillance MONITOR plays real /public/videos footage. As each
 * scenario arms, a scan sweep re-targets the camera, a bounding box DRAWS ON
 * (corner brackets stroke in), a label + confidence count up, and an alert TOAST
 * slides into the live log. Switching scenarios is a choreographed re-target
 * (single video src-swap behind a scan mask + box redraw + a sliding active
 * marker), never a hard content swap. Auto-plays a guided loop; pauses on
 * hover/focus; full keyboard radiogroup. Reduced motion → a static armed frame.
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

  const [idx, setIdx] = useState(0);
  const active = monitors[idx];
  const [phase, setPhase] = useState<Phase>(reduced ? "locked" : "scan");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [inView, setInView] = useState(false);
  const [progress, setProgress] = useState(0);

  const alertKey = useRef(0);
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // visibility
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // SCROLL IS THE MOTION: the stage is CSS position:sticky (layout-native, so
  // it's immune to the city's pin above). The active scenario is derived
  // DIRECTLY from the section's scroll position via getBoundingClientRect — no
  // GSAP/ScrollTrigger cached start/end to go stale. As you scroll the runway,
  // the floor sweeps one detection at a time.
  useIsomorphicLayoutEffect(() => {
    if (reduced || !rootRef.current) return;
    const root = rootRef.current;
    const last = monitors.length - 1;
    let raf = 0;

    const update = () => {
      const rect = root.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      const p = runway > 0 ? Math.min(1, Math.max(0, -rect.top / runway)) : 0;
      setProgress(p);
      // /0.92 so the last scenario fully arms a touch before the runway ends
      const i = Math.min(last, Math.floor((p / 0.92) * monitors.length));
      setIdx((prev) => (prev === i ? prev : i));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [reduced, monitors.length]);

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

  // the detection sequence: scan (re-target) → lock (box draws + toast)
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
    }, 850);
    return () => clearTimeout(t);
  }, [idx, inView, reduced, active]);

  // single <video>: keep the prior footage playing through the scan and swap
  // src only at LOCK (no freeze-to-poster during the re-target), play in view
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

  // keyboard radiogroup over the rail
  const railRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onRailKey = (e: React.KeyboardEvent, i: number) => {
    const last = monitors.length - 1;
    let n = i;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") n = i === last ? 0 : i + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = i === 0 ? last : i - 1;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = last;
    else return;
    e.preventDefault();
    setIdx(n);
    railRefs.current[monitors[n].id]?.focus();
  };

  return (
    <section
      id="watch-floor"
      ref={rootRef}
      aria-labelledby="watch-floor-title"
      className={`dark relative bg-ink-900 text-cream-100 ${reduced ? "py-20" : "h-[440vh]"}`}
    >
    <div
      ref={stageRef}
      className={`flex flex-col overflow-hidden ${reduced ? "py-4" : "sticky top-0 h-screen justify-center py-10"}`}
    >
      <div className="absolute inset-0 z-0 opacity-70">
        <WatchField intensity={0.6} />
      </div>

      <div className="container relative z-10">
        {/* header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="t-eyebrow !text-steel-300">Where to apply · The watch floor</p>
            <h2 id="watch-floor-title" className="t-display-2 mt-3 text-cream-50">
              Nine detections, <em className="not-italic text-clay-400">always watching</em>.
            </h2>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-steel-200">
              The real scenarios you switch on per camera — running live on your
              own footage, on-prem. <span className="text-cream-100">Scroll to sweep the floor.</span>
            </p>
          </div>
          <ScrollProgress idx={idx} total={monitors.length} progress={progress} reduced={reduced} />
        </div>

      </div>

      {/* monitor + log + camera wall — full-bleed so the feed reads cinematic, not a widget */}
      <div className="relative z-10 mt-6 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid gap-4 lg:grid-cols-[1.9fr_1fr]">
            <MonitorView
              active={active}
              phase={phase}
              reduced={reduced}
              videoRef={videoRef}
            />
            <AlertLog alerts={alerts} reduced={reduced} />
          </div>

          {/* THE CAMERA WALL — every scenario is a live feed tile; pick any to
              drive the monitor. This is the switcher, as a NOC wall, not a list. */}
          <CameraWall
            monitors={monitors}
            activeId={active.id}
            reduced={reduced}
            railRefs={railRefs}
            onPick={(i) => setIdx(i)}
            onKey={onRailKey}
          />
        </div>
      </div>

      <div className="container relative z-10">
        <div className="mt-5 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-4 sm:flex-row sm:items-center sm:justify-between">
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
    </div>
    </section>
  );
}

/* ───────────────────────── scroll progress HUD ───────────────────────── */

function ScrollProgress({
  idx,
  total,
  progress,
  reduced,
}: {
  idx: number;
  total: number;
  progress: number;
  reduced: boolean;
}) {
  return (
    <div className="flex shrink-0 items-center gap-3">
      <div className="text-right">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-steel-300">
          {reduced ? "Scenario" : "Sweeping"}
        </p>
        <p className="font-display text-lg leading-none text-cream-50">
          <span className="tabular-nums text-clay-400">{String(idx + 1).padStart(2, "0")}</span>
          <span className="text-steel-400"> / {String(total).padStart(2, "0")}</span>
        </p>
      </div>
      {!reduced && (
        <div className="h-12 w-1 overflow-hidden rounded-full bg-ink-700">
          <div
            className="w-full rounded-full bg-clay-400"
            style={{ height: `${Math.max(6, progress * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── the monitor ───────────────────────── */

function MonitorView({
  active,
  phase,
  reduced,
  videoRef,
}: {
  active: Monitor;
  phase: Phase;
  reduced: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const locked = phase === "locked";
  const tint = CAT_TINT[active.scenario.category];
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-black shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)]">
      {/* live footage (single element; src swaps on re-target). Cooled +
          desaturated so the category-tinted detection is the only saturated
          colour in the frame (the signal pops, like a real sensor feed). */}
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

      {/* cool wash — a light neutral grade so the footage stays crisp and reads
          as a live feed, not a muddy brown rectangle */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "hsl(213 32% 14% / 0.16)" }}
      />
      {/* grade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />
      {/* CRT scanline texture */}
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 3px)" }}
        />
      )}

      {/* vignette for cinematic depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 120px 8px rgba(0,0,0,0.45)" }}
      />

      {/* ambient secondary detections (steel = passively watching) for density */}
      {!reduced && <SecondaryDetections />}

      <MonitorCorners />

      {/* HUD: cam id + REC */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          {!reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-400" />
        </span>
        <ScrambleText value={active.cameraId} reduced={reduced} className="font-mono text-[0.65rem] tracking-wider text-cream-100" />
        <span className="font-mono text-[0.6rem] tracking-wider text-clay-300">REC</span>
      </div>
      {/* HUD: location + time */}
      <div className="absolute right-3 top-3 text-right">
        <p className="font-mono text-[0.65rem] tracking-wider text-cream-100">{active.timestamp}</p>
        <p className="font-mono text-[0.6rem] tracking-wider text-steel-300">{active.location}</p>
      </div>

      {/* periodic scan sweep — the "analyzing" motif */}
      {!reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-24 -translate-y-1/2"
          style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--steel-300)/0.22), transparent)" }}
          initial={{ top: "-14%" }}
          animate={{ top: "114%" }}
          transition={{ duration: 3.2, ease: "linear", repeat: Infinity, repeatDelay: 1.3 }}
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-steel-200/80 shadow-[0_0_10px_2px_hsl(var(--steel-300)/0.5)]" />
        </motion.div>
      )}

      {/* re-target overlay during scan */}
      {!reduced && phase === "scan" && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-steel-500/10" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-steel-200">
            re-targeting
            <Dots />
          </div>
        </>
      )}

      {/* the detection box draws on when locked (redraws per scenario) */}
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

      {/* on-prem stamp */}
      {locked && (
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-3 right-3 select-none rounded-md border border-clay-400/70 bg-black/40 px-2 py-1 backdrop-blur-sm"
        >
          <p className="font-mono text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-clay-300">
            Processed on-prem
          </p>
        </motion.div>
      )}
    </div>
  );
}

function MonitorCorners() {
  const base = "pointer-events-none absolute h-6 w-6 border-cream-100/40";
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
      className="pointer-events-none absolute"
      style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%` }}
    >
      {/* bloom on the subject (category-tinted) */}
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

      {/* faint full outline fades in behind the corners */}
      <motion.div
        className="absolute inset-0 rounded-[2px] border"
        style={{ borderColor: tint, opacity: 0.45 }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 0.45 }}
        transition={{ delay: reduced ? 0 : 0.32, duration: 0.3 }}
      />

      {/* four corner brackets that DRAW IN */}
      <BoxCorner pos="tl" tint={tint} reduced={reduced} />
      <BoxCorner pos="tr" tint={tint} reduced={reduced} />
      <BoxCorner pos="bl" tint={tint} reduced={reduced} />
      <BoxCorner pos="br" tint={tint} reduced={reduced} />

      {/* label chip + confidence count-up */}
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
        className={`absolute h-[2px] w-full left-0 ${isB ? "bottom-0" : "top-0"}`}
        style={{ ...lineStyle, transformOrigin: isR ? "right" : "left" }}
        initial={reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={t}
      />
      <motion.span
        className={`absolute w-[2px] h-full top-0 ${isR ? "right-0" : "left-0"}`}
        style={{ ...lineStyle, transformOrigin: isB ? "bottom" : "top" }}
        initial={reduced ? false : { scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ ...t, delay: reduced ? 0 : 0.1 }}
      />
    </div>
  );
}

/* ambient secondary detections — steel "watching" callouts that flicker in/out
   so the feed reads busy (multiple things tracked at once), like a real NOC. */
function SecondaryDetections() {
  // first mark stays present (gentle pulse) so a frozen frame always shows
  // ≥2 detections; second flickers in/out for life.
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
          className="pointer-events-none absolute"
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
  const [n, setN] = useState(Math.max(40, to - 16));
  useEffect(() => {
    let v = Math.max(40, to - 16);
    setN(v);
    const id = window.setInterval(() => {
      v += 1;
      setN(v);
      if (v >= to) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [to]);
  return <>{(n / 100).toFixed(2)}</>;
}

/* ───────────────────────── alert log ───────────────────────── */

function AlertLog({ alerts, reduced }: { alerts: Alert[]; reduced: boolean }) {
  return (
    <div className="rounded-2xl border border-[hsl(var(--border))] bg-ink-800/50 p-4">
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

/* ───────────────────────── the camera wall ───────────────────────── */

function CameraWall({
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
    <div className="mt-5">
      <div className="mb-2.5 flex items-center justify-between px-0.5">
        <span className="t-eyebrow !text-steel-300">The camera wall · pick any feed</span>
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-steel-400">
          {monitors.length} cameras
        </span>
      </div>
      <div
        role="radiogroup"
        aria-label="Choose a detection scenario"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9"
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
              className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-black text-start outline-none transition-transform duration-300 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-clay-400"
            >
              {/* feed still — desaturated when idle, lit when active or hovered */}
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
              {/* idle scrim lifts on hover */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-ink-900/40 transition-opacity duration-500 ${on ? "opacity-0" : "opacity-100 group-hover:opacity-30"}`}
              />
              {/* category tint glow on the active feed */}
              {on && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ boxShadow: `inset 0 0 30px -6px ${tint}` }}
                />
              )}

              {/* mini detection bracket, scaled into the tile */}
              <MiniDetection box={m.box} tint={tint} on={on} reduced={reduced} />

              {/* active ring + shared morph marker */}
              {on && (
                <motion.span
                  layoutId="cam-active-ring"
                  className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-clay-400"
                  transition={{ duration: 0.4, ease: DRIFT }}
                />
              )}

              {/* corner HUD: live dot + cam id */}
              <div className="absolute left-1.5 top-1.5 flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  {!reduced && on && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
                  )}
                  <span
                    className={`relative inline-flex h-1.5 w-1.5 rounded-full ${on ? "bg-clay-400" : "bg-steel-400"}`}
                  />
                </span>
                {on && (
                  <span className="font-mono text-[0.5rem] font-semibold tracking-wider text-clay-300">
                    LIVE
                  </span>
                )}
              </div>

              {/* bottom gradient + name */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pb-1.5 pt-5">
                <p
                  className={`truncate font-display text-[0.72rem] font-medium leading-tight tracking-tight ${on ? "text-cream-50" : "text-steel-200 group-hover:text-cream-100"}`}
                >
                  {m.scenario.name}
                </p>
                <p className="truncate font-mono text-[0.5rem] uppercase tracking-wider text-steel-400">
                  {m.scenario.detects[0]}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* a compact corner-bracket detection inside a wall tile */
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
