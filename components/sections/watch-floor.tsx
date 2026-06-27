"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import { Corners, ScrambleText } from "@/components/viewport/DetectionViewport";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { LOCK, DRIFT } from "@/lib/motion-grammar";
import {
  CHANNELS,
  SCENARIOS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Category,
  type BoundingBox,
  type Scenario,
} from "@/components/sections/query-room.data";

/**
 * THE WATCH FLOOR — the "where to apply" centerpiece, rebuilt as a living
 * control room instead of a tab/select swap.
 *
 *  • The wall is alive on its own: an autonomous scheduler fires real detections
 *    across the feeds (a clay box draws itself, confidence ticks up, a scan
 *    sweeps the tile) and every catch slides into a live ALERT TICKER.
 *  • A guided autoplay focuses each scenario in turn; the chosen feed FLIES OPEN
 *    (shared-element layout morph) into a hero viewport running the full
 *    detection, the wall dimming behind it — then returns to the wall.
 *  • Fully interactive: click any feed or scenario to focus it; hover anywhere
 *    pauses the guided tour so you can explore. Touch-friendly on mobile.
 *  • Reduced motion → a tasteful STATIC control room: several boxes already
 *    drawn, the ticker pre-filled, one feed focused. No sweeps, no auto-fire.
 *
 * Single-decode contract: only the focused flagship feed ever mounts a <video>;
 * every wall tile is a real poster frame with drawn CV overlays (cheap).
 */

const CAT_TINT: Record<Category, string> = {
  security: "hsl(var(--clay-400))",
  compliance: "hsl(var(--clay-300))",
  safety: "hsl(38 70% 56%)",
  operations: "hsl(150 30% 52%)",
};

/** believable per-detection confidence (no Math.random in render → stable SSR) */
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

interface Tile {
  id: string;
  scenario: Scenario;
  cameraId: string;
  location: string;
  timestamp: string;
  poster: string;
  video?: string;
  box: BoundingBox;
  conf: number;
}

function buildTiles(): Tile[] {
  // wall order: grouped by category so the grid reads like the product
  const ordered = CATEGORY_ORDER.flatMap((c) =>
    SCENARIOS.filter((s) => s.category === c),
  );
  return ordered.map((s) => {
    if (s.demoId) {
      const c = CHANNELS.find((x) => x.id === s.demoId)!;
      return {
        id: s.id,
        scenario: s,
        cameraId: c.cameraId,
        location: c.location,
        timestamp: c.timestamp,
        poster: c.poster,
        video: c.video,
        box: c.box,
        conf: CONF[s.id] ?? 95,
      };
    }
    const p = s.preview!;
    return {
      id: s.id,
      scenario: s,
      cameraId: p.cameraId,
      location: p.location,
      timestamp: p.timestamp,
      poster: p.poster,
      box: p.box,
      conf: CONF[s.id] ?? 93,
    };
  });
}

interface Alert {
  key: number;
  name: string;
  cameraId: string;
  location: string;
  conf: number;
  category: Category;
}

export function WatchFloor() {
  const reduced = usePrefersReducedMotion();
  const tiles = useMemo(buildTiles, []);

  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false); // hover/focus holds the guided tour
  const [touched, setTouched] = useState(false); // user took control

  // ambient: which tiles are currently "firing" a box
  const [firing, setFiring] = useState<Set<string>>(new Set());
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const alertKey = useRef(0);
  const [armedCount, setArmedCount] = useState(0);

  // focus: the scenario blown up into the hero viewport (null = wall)
  const [focusId, setFocusId] = useState<string | null>(null);
  const autoCursor = useRef(0);
  const focusIdRef = useRef<string | null>(null);
  const fireTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const focusTile = focusId ? tiles.find((t) => t.id === focusId) ?? null : null;
  useEffect(() => {
    focusIdRef.current = focusId;
  }, [focusId]);

  const fire = useCallback(
    (tile: Tile) => {
      setFiring((prev) => new Set(prev).add(tile.id));
      setAlerts((prev) =>
        [
          {
            key: alertKey.current++,
            name: tile.scenario.name,
            cameraId: tile.cameraId,
            location: tile.location,
            conf: tile.conf,
            category: tile.scenario.category,
          },
          ...prev,
        ].slice(0, 5),
      );
      setArmedCount((n) => n + 1);
      const to = setTimeout(() => {
        setFiring((prev) => {
          const next = new Set(prev);
          next.delete(tile.id);
          return next;
        });
        fireTimers.current.delete(to);
      }, 1600);
      fireTimers.current.add(to);
    },
    [],
  );

  // visibility
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        // close focus when the floor leaves view so its video stops decoding
        if (!e.isIntersecting) setFocusId(null);
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // ─── reduced-motion: paint a static control room once (the WALL, alive) ───
  useEffect(() => {
    if (!reduced) return;
    setFocusId(null);
    setFiring(new Set([tiles[1].id, tiles[3].id, tiles[6].id]));
    setAlerts(
      [tiles[1], tiles[3], tiles[6]].map((t, i) => ({
        key: i,
        name: t.scenario.name,
        cameraId: t.cameraId,
        location: t.location,
        conf: t.conf,
        category: t.scenario.category,
      })),
    );
    setArmedCount(247);
  }, [reduced, tiles]);

  // ─── ambient detection scheduler (irregular cadence) ───
  useEffect(() => {
    if (reduced || !inView) return;
    // pre-arm one feed so the wall reads as live from the very first frame
    // (a focal entry point before the cadence/autoplay take over)
    fire(tiles[0]);
    let tick = 0;
    const id = window.setInterval(() => {
      tick += 1;
      if (tick % 3 === 0) return; // skip ~1/3 for an organic rhythm
      // fire a random tile that isn't the focused one (read focus via ref so
      // the interval isn't torn down / reset on every autoplay focus change)
      const candidates = tiles.filter((t) => t.id !== focusIdRef.current);
      const t = candidates[(tick * 7) % candidates.length];
      if (t) fire(t);
    }, 1500);
    return () => {
      window.clearInterval(id);
      fireTimers.current.forEach(clearTimeout);
      fireTimers.current.clear();
    };
  }, [reduced, inView, tiles, fire]);

  // ─── guided autoplay: ALTERNATE wall↔focus so the alive wall is home ───
  // wall (ambient alerts firing) → fly one scenario open → back to wall → next.
  useEffect(() => {
    if (reduced || !inView || paused || touched) return;
    const id = window.setInterval(() => {
      setFocusId((cur) => {
        if (cur === null) {
          const next = tiles[autoCursor.current % tiles.length].id;
          autoCursor.current += 1;
          return next;
        }
        return null; // return to the wall
      });
    }, 3800);
    return () => window.clearInterval(id);
  }, [reduced, inView, paused, touched, tiles]);

  const onPick = (id: string) => {
    setTouched(true);
    setFocusId((cur) => (cur === id ? null : id));
  };
  const closeFocus = () => {
    setTouched(true);
    setFocusId(null);
  };

  return (
    <section
      id="watch-floor"
      ref={sectionRef}
      aria-labelledby="watch-floor-title"
      className="dark relative overflow-hidden bg-ink-900 py-20 text-cream-100 sm:py-24"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* faint floor grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--steel-200)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--steel-200)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className="container relative z-10">
        {/* header */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="t-eyebrow !text-steel-300">Where to apply · The watch floor</p>
            <h2 id="watch-floor-title" className="t-display-2 mt-3 text-cream-50">
              Nine detections, <em className="not-italic text-clay-400">always on</em>.
            </h2>
            <p className="mt-4 max-w-xl text-[1.05rem] leading-relaxed text-steel-200">
              Triya standing watch across a site. Pick any feed to see the
              detection up close.
            </p>
          </div>
          <LiveStat armed={armedCount} reduced={reduced} />
        </div>

      </div>

      {/* THE FLOOR — full-bleed so the wall commands the frame (breaks out of
          the text container; the section is overflow-hidden so no h-scroll) */}
      <div className="relative z-10 mx-[calc(50%-50vw)] mt-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1680px] gap-4 lg:grid-cols-[1fr_320px]">
          {/* WALL */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {tiles.map((t) => (
              <WallTile
                key={t.id}
                tile={t}
                firing={firing.has(t.id)}
                focused={focusId === t.id}
                reduced={reduced}
                onPick={() => onPick(t.id)}
              />
            ))}
          </div>

          {/* ALERT TICKER */}
          <AlertTicker alerts={alerts} reduced={reduced} />
        </div>
      </div>

      <div className="container relative z-10">

        {/* footer line */}
        <div className="mt-8 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.75rem] text-steel-300">
            {SCENARIOS.filter((s) => s.status === "active").length} armed ·{" "}
            {SCENARIOS.length} ready · runs 24/7 on your own cameras, on-prem
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

      {/* ── FOCUS: the chosen feed flies open over the wall ── */}
      <AnimatePresence>
        {focusTile && (
          <FocusView
            key={focusTile.id}
            tile={focusTile}
            reduced={reduced}
            onClose={closeFocus}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

/* ───────────────────────── wall tile ───────────────────────── */

function WallTile({
  tile,
  firing,
  focused,
  reduced,
  onPick,
}: {
  tile: Tile;
  firing: boolean;
  focused: boolean;
  reduced: boolean;
  onPick: () => void;
}) {
  const isActive = tile.scenario.status === "active";
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`${tile.scenario.name} — ${tile.cameraId}. Open this feed.`}
      className="group relative block aspect-video overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-black text-start transition-colors hover:border-steel-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900"
    >
      {/* the feed (poster); the focused tile's media is morphed away to the hero */}
      <motion.div
        layoutId={`feed-${tile.id}`}
        className="absolute inset-0"
        style={{ opacity: focused ? 0 : 1 }}
        transition={{ layout: { duration: 0.5, ease: DRIFT } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={tile.poster}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </motion.div>

      {/* live CCTV chrome */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/85 via-transparent to-ink-900/20" />
      {!reduced && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, #fff 0 1px, transparent 1px 3px)",
          }}
        />
      )}

      {/* top row: cam id + status dot */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5">
          {isActive && !reduced && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
          )}
          <span
            className={`relative inline-flex h-1.5 w-1.5 rounded-full ${isActive ? "bg-clay-400" : "bg-steel-400"}`}
          />
        </span>
        <span className="font-mono text-[0.5rem] tracking-wider text-steel-200">
          {tile.cameraId.slice(0, 8)}
        </span>
      </div>

      {/* firing box overlay */}
      <AnimatePresence>
        {firing && (
          <DetectionBox key="box" box={tile.box} conf={tile.conf} reduced={reduced} />
        )}
      </AnimatePresence>

      {/* scan sweep on fire */}
      {firing && !reduced && (
        <motion.div
          aria-hidden="true"
          initial={{ top: "-10%" }}
          animate={{ top: "110%" }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-x-0 h-10 -translate-y-1/2"
          style={{
            background:
              "linear-gradient(to bottom, transparent, hsl(var(--steel-200)/0.25), transparent)",
          }}
        />
      )}

      {/* label */}
      <div className="absolute inset-x-2 bottom-2">
        <p className="truncate font-display text-[0.8rem] font-semibold tracking-tight text-cream-50">
          {tile.scenario.name}
        </p>
        <p className="truncate font-mono text-[0.62rem] uppercase tracking-wider text-steel-300">
          {CATEGORY_LABELS[tile.scenario.category]} · {tile.scenario.detects.join(", ")}
        </p>
      </div>
    </button>
  );
}

/* ───────────────────────── detection box ───────────────────────── */

function DetectionBox({
  box,
  conf,
  reduced,
  big,
}: {
  box: BoundingBox;
  conf: number;
  reduced: boolean;
  big?: boolean;
}) {
  const isZone = box.mode === "zone";
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, scale: 1.18 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduced ? undefined : { opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.32, ease: LOCK }}
      className="pointer-events-none absolute"
      style={{
        left: `${box.x}%`,
        top: `${box.y}%`,
        width: `${box.w}%`,
        height: `${box.h}%`,
      }}
    >
      <div
        className={
          isZone
            ? "relative h-full w-full overflow-hidden rounded-[2px] border border-clay-400/70 bg-clay-400/20 shadow-[0_0_18px_-2px_hsl(var(--clay-400)/0.7)]"
            : "relative h-full w-full rounded-[2px] border-2 border-clay-400 shadow-[0_0_16px_-2px_hsl(var(--clay-400)/0.85)]"
        }
      >
        {isZone && (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 55% at 55% 60%, hsl(var(--clay-400)/0.5), transparent 70%)",
            }}
          />
        )}
        <div
          className={`absolute left-0 flex items-center gap-1.5 whitespace-nowrap rounded-[3px] bg-clay-400 px-1.5 py-0.5 ${big ? "-top-7" : "-top-5"}`}
        >
          <span
            className={`font-mono font-semibold uppercase tracking-wider text-ink-900 ${big ? "text-[0.65rem]" : "text-[0.5rem]"}`}
          >
            {box.label}
          </span>
          <span
            className={`font-mono tabular-nums text-ink-900/80 ${big ? "text-[0.6rem]" : "text-[0.5rem]"}`}
          >
            {reduced ? conf : <CountUp to={conf} />}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* count a confidence value up quickly when a detection lands */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(Math.max(0, to - 8));
  useEffect(() => {
    let v = Math.max(0, to - 8);
    const id = window.setInterval(() => {
      v += 1;
      setN(v);
      if (v >= to) window.clearInterval(id);
    }, 28);
    return () => window.clearInterval(id);
  }, [to]);
  return <>{n}</>;
}

/* ───────────────────────── alert ticker ───────────────────────── */

function AlertTicker({ alerts, reduced }: { alerts: Alert[]; reduced: boolean }) {
  return (
    <div className="flex flex-col rounded-xl border border-[hsl(var(--border))] bg-ink-800/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="t-eyebrow !text-clay-300">Live alerts</span>
        <span className="flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-wider text-steel-300">
          <span className="relative flex h-1.5 w-1.5">
            {!reduced && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-clay-400" />
          </span>
          on-prem
        </span>
      </div>
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {alerts.map((a) => (
            <motion.li
              key={a.key}
              layout
              initial={reduced ? false : { opacity: 0, x: 24, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.34, ease: DRIFT }}
              className="rounded-lg border border-[hsl(var(--border))] bg-ink-900/70 px-3 py-2"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: CAT_TINT[a.category] }}
                />
                <span className="truncate font-display text-[0.82rem] font-medium text-cream-50">
                  {a.name}
                </span>
                <span className="ms-auto font-mono text-[0.6rem] tabular-nums text-clay-300">
                  {a.conf}%
                </span>
              </div>
              <p className="mt-0.5 truncate font-mono text-[0.58rem] uppercase tracking-wider text-steel-300">
                {a.cameraId.slice(0, 10)} · {a.location}
              </p>
            </motion.li>
          ))}
        </AnimatePresence>
        {alerts.length === 0 && (
          <li className="rounded-lg border border-dashed border-[hsl(var(--border))] px-3 py-6 text-center font-mono text-[0.65rem] uppercase tracking-wider text-steel-400">
            watching…
          </li>
        )}
      </ul>
    </div>
  );
}

/* ───────────────────────── live stat ───────────────────────── */

function LiveStat({ armed, reduced }: { armed: number; reduced: boolean }) {
  return (
    <div className="flex shrink-0 items-center gap-5 rounded-xl border border-[hsl(var(--border))] bg-ink-800/40 px-5 py-3">
      <div>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-steel-300">
          Caught today
        </p>
        {/* armed already rises naturally as catches land — no CountUp (it would
            re-count from a lower value on every increment and jitter) */}
        <p className="font-display text-2xl font-semibold tabular-nums text-cream-50">
          {armed}
          <span className="ms-1 text-base text-clay-400">+</span>
        </p>
      </div>
      <div className="h-8 w-px bg-[hsl(var(--border))]" />
      <div>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-steel-300">
          Latency
        </p>
        <p className="font-display text-2xl font-semibold tabular-nums text-cream-50">
          0.3<span className="ms-0.5 text-base text-steel-300">s</span>
        </p>
      </div>
    </div>
  );
}

/* ───────────────────────── focus view ───────────────────────── */

function FocusView({
  tile,
  reduced,
  onClose,
}: {
  tile: Tile;
  reduced: boolean;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showBox, setShowBox] = useState(reduced);
  const s = tile.scenario;
  const isActive = s.status === "active";
  const alert =
    s.preview?.alert ??
    "Flagged with the exact frame, camera and time — raised on-prem the instant it fires.";

  // run the detection a beat after the feed flies open
  useEffect(() => {
    if (reduced) return;
    setShowBox(false);
    const t = window.setTimeout(() => setShowBox(true), 700);
    return () => window.clearTimeout(t);
  }, [tile.id, reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.play().catch(() => {});
  }, [tile.id]);

  // Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const detect = s.detects[0]?.toLowerCase() ?? "object";
  const log: [string, string][] = [
    [addSecs(tile.timestamp, 0), "motion in zone"],
    [addSecs(tile.timestamp, 1), `${detect} classified · ${tile.conf}%`],
    [addSecs(tile.timestamp, 2), "alert raised · on-prem"],
  ];

  return (
    <motion.div
      className="fixed inset-0 z-40 overflow-y-auto"
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduced ? undefined : { opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* scrim over everything (labeled button → click anywhere to exit) */}
      <button
        type="button"
        aria-label="Back to all cameras"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-ink-900/85 backdrop-blur-sm"
      />

      {/* centering + scroll wrapper (transparent to clicks except the card) */}
      <div className="pointer-events-none relative flex min-h-full items-center justify-center p-4 sm:p-8">
        <motion.div
          role="group"
          aria-label={`${s.name} — live detection`}
          className="pointer-events-auto relative grid w-full max-w-5xl gap-5 lg:grid-cols-[1.5fr_1fr]"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: DRIFT, delay: 0.05 }}
        >
          {/* close — top-right of the whole card, always reachable */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to all cameras"
            className="absolute right-2 top-2 z-30 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[hsl(var(--border))] bg-ink-900/70 text-steel-200 backdrop-blur-sm transition-colors hover:bg-ink-900 hover:text-cream-50"
          >
            <X className="h-4 w-4" />
          </button>

          {/* the feed — same layoutId as the wall tile → it flies open */}
          <motion.div
            layoutId={`feed-${tile.id}`}
            transition={{ layout: { duration: 0.5, ease: DRIFT } }}
            className="relative aspect-video overflow-hidden rounded-2xl border border-clay-400/40 bg-black shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]"
          >
          {reduced || !tile.video ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tile.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              muted
              loop
              playsInline
              autoPlay
              poster={tile.poster}
              aria-hidden="true"
              tabIndex={-1}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={tile.video} type="video/mp4" />
            </video>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35" />
          <Corners />

          <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              {!reduced && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />}
              <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-400" />
            </span>
            <ScrambleText value={tile.cameraId} reduced={reduced} className="font-mono text-[0.65rem] tracking-wider text-cream-100" />
          </div>
          <div className="absolute right-3 top-3 text-right">
            <p className="font-mono text-[0.6rem] tracking-wider text-steel-200">{tile.location}</p>
          </div>

          {/* scan sweep before the lock */}
          {!reduced && !showBox && (
            <motion.div
              aria-hidden="true"
              initial={{ top: "-8%" }}
              animate={{ top: "108%" }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-x-0 h-16 -translate-y-1/2"
              style={{ background: "linear-gradient(to bottom, transparent, hsl(var(--steel-200)/0.3), transparent)" }}
            >
              <div className="absolute inset-x-0 top-1/2 h-px bg-steel-200 shadow-[0_0_12px_2px_hsl(var(--steel-300)/0.7)]" />
            </motion.div>
          )}

          <AnimatePresence>
            {showBox && <DetectionBox key="b" box={tile.box} conf={tile.conf} reduced={reduced} big />}
          </AnimatePresence>

          <div className="absolute bottom-3 right-3 select-none rounded-md border border-clay-400/70 bg-black/40 px-2 py-1 backdrop-blur-sm">
            <p className="font-mono text-[0.5rem] font-semibold uppercase tracking-[0.14em] text-clay-300">
              Processed on-prem
            </p>
          </div>
        </motion.div>

          {/* detail — a case file, not a tooltip */}
          <div className="flex flex-col rounded-2xl border border-[hsl(var(--border))] bg-ink-800/80 p-5 backdrop-blur-md sm:p-6">
            {/* live readout strip */}
            <div className="flex items-stretch divide-x divide-[hsl(var(--border))] rounded-lg border border-[hsl(var(--border))] bg-ink-900/60 font-mono">
              <div className="flex-1 px-3 py-2">
                <p className="text-[0.5rem] uppercase tracking-[0.16em] text-steel-400">Camera</p>
                <p className="mt-0.5 truncate text-[0.72rem] text-cream-100">{tile.cameraId}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-[0.5rem] uppercase tracking-[0.16em] text-steel-400">Time</p>
                <p className="mt-0.5 text-[0.72rem] tabular-nums text-cream-100">{tile.timestamp}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-[0.5rem] uppercase tracking-[0.16em] text-steel-400">Conf</p>
                <p className="mt-0.5 text-[0.72rem] tabular-nums text-clay-300">
                  {reduced || !showBox ? tile.conf : <CountUp to={tile.conf} />}%
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-steel-200">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: CAT_TINT[s.category] }} />
                {CATEGORY_LABELS[s.category]}
              </span>
              <span className="rounded-full border border-[hsl(var(--border))] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-steel-300">
                Detects {s.detects.join(", ")}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider ${isActive ? "border-clay-400/40 text-clay-300" : "border-[hsl(var(--border))] text-steel-300"}`}
              >
                {isActive ? "● Active" : "○ Available"}
              </span>
            </div>

            <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-cream-50">
              {s.name}
            </h3>
            <p className="mt-2 text-[0.98rem] leading-relaxed text-steel-200">{s.description}</p>

            {/* event log — the catch, reconstructed */}
            <ul className="mt-4 space-y-1.5 border-t border-[hsl(var(--border))] pt-4">
              {log.map(([t, label], i) => (
                <li key={t} className="flex items-center gap-2.5 font-mono text-[0.68rem]">
                  <span className="tabular-nums text-steel-400">{t}</span>
                  <span className={i === log.length - 1 ? "text-clay-300" : "text-steel-200"}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-4 flex items-start gap-2 text-[0.9rem] leading-relaxed text-steel-300">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-clay-400" />
              {alert}
            </p>

            <div className="mt-auto flex items-center justify-between gap-4 pt-5">
              <Link
                href="/contact/"
                className="group inline-flex items-center gap-2 text-sm font-medium text-clay-300 hover:text-clay-200"
              >
                {isActive ? "See it on your cameras" : "Enable on your site"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
              </Link>
              <span className="font-mono text-[0.6rem] uppercase tracking-wider text-steel-400">
                esc to close
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** add seconds to an "HH:MM:SS" clock string (wraps at 24h) */
function addSecs(ts: string, add: number) {
  const [h, m, sec] = ts.split(":").map(Number);
  const total = (h * 3600 + m * 60 + sec + add) % 86400;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
}
