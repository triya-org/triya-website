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
import type { AnchorReport, DistrictConfig } from "@/components/three/lineart/LineArtSwitcher";

/**
 * THE WATCH FLOOR (industries) — ONE pinned, scroll-driven switcher.
 *
 * The four districts (Manufacturing → Retail → Smart Cities → Events) used to be
 * four full-bleed sections you scrolled past. They're now collapsed into a single
 * scene that PINS in the viewport (CSS sticky + getBoundingClientRect, like the
 * Watch Floor — no GSAP pin). Scroll selects the active industry across four
 * zones of the runway; on each change a scan-wipe swaps the line-art (old erases
 * ahead of the sweep, new draws on behind it) and the name + body + bullets TYPE
 * in (fired once on land, not scrubbed per character). HUD + index update to match.
 *
 * Reduced motion / mobile → a static stacked layout (instant, fully legible).
 * Copy harvested verbatim from living-city.tsx's PARKS.
 */

const LineArtSwitcher = dynamic(
  () => import("@/components/three/lineart/LineArtSwitcher").then((m) => m.LineArtSwitcher),
  { ssr: false },
);
const LineArtScene = dynamic(
  () => import("@/components/three/lineart/LineArtScene").then((m) => m.LineArtScene),
  { ssr: false },
);

type Subject = "person" | "vehicle" | "crowd";

interface Detection {
  label: string;
  klass: string;
  conf?: number;
  metric?: string;
  provenance: string;
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
  lineColor: string;
  tint: string;
  anchor: [number, number, number];
  fitScale?: number;
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
    lineColor: "#D97757",
    tint: CLAY,
    anchor: [0.5, 3.2, 0.5],
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
    lineColor: "#E8E0D2",
    tint: CLAY,
    anchor: [2.2, 3.4, 2.4],
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
    lineColor: "#A9BCC8",
    tint: CLAY,
    anchor: [3, 0.5, 6.5],
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
    lineColor: "#D97757",
    tint: CLAY,
    anchor: [-2.0, 2.6, -0.3],
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

const N = INDUSTRIES.length;
const CONFIGS: DistrictConfig[] = INDUSTRIES.map((i) => ({
  id: i.id,
  color: i.lineColor,
  fitScale: i.fitScale ?? 1,
  anchor: i.anchor,
}));

/** WebGL capability (ignores reduced-motion) */
function useCapable3D(): boolean {
  const [capable, setCapable] = useState(false);
  useEffect(() => {
    const conn = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
    setCapable(detectWebGL() && !conn?.saveData);
  }, []);
  return capable;
}

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
  const reduced = usePrefersReducedMotion();
  const compact = useCompact();
  if (reduced || compact) return <StaticStack reduced={reduced} />;
  return <PinnedSwitcher />;
}

/* ───────────────────────── the pinned switcher (desktop) ───────────────────────── */

function PinnedSwitcher() {
  const capable = useCapable3D();

  const outerRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const reticleWrapRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGCircleElement>(null);

  const progressRef = useRef(0);
  const activeRef = useRef(0);
  const wipeRef = useRef(0);
  const stageSizeRef = useRef<{ w: number; h: number }>({ w: 1, h: 1 });
  const showDetectRef = useRef(false);

  const [near, setNear] = useState(false);
  const [entered, setEntered] = useState(false);
  const [active, setActive] = useState(0);
  const [pair, setPair] = useState({ from: -1, to: 0 });
  // starts "wiping" at wipe=0 (district hidden) so nothing flashes before the
  // entrance wipe actually runs (which only starts once `entered`)
  const [wiping, setWiping] = useState(true);
  const [showDetect, setShowDetect] = useState(false);

  const cardFrac = { fx: 0.79, fy: 0.62 };

  // mount early + latch (never despawn); flag entered when the stage fills view
  useEffect(() => {
    const outer = outerRef.current;
    const stage = stageRef.current;
    if (!outer || !stage) return;
    const ioNear = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: "1100px 0px" },
    );
    const ioEnter = new IntersectionObserver(([e]) => setEntered(e.isIntersecting), {
      threshold: 0.55,
    });
    ioNear.observe(outer);
    ioEnter.observe(stage);
    return () => {
      ioNear.disconnect();
      ioEnter.disconnect();
    };
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

  // scroll progress → active zone (4 zones across the pinned runway)
  useSectionProgress(outerRef, {
    mode: "pin",
    onUpdate: (p) => {
      progressRef.current = p;
      const idx = Math.min(N - 1, Math.max(0, Math.floor(p * N)));
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActive(idx);
      }
    },
  });

  // on land (active change, once entered) → scan-wipe + type-in (fired once)
  useEffect(() => {
    if (!entered) return;
    setPair((prev) => ({ from: prev.to, to: active }));
    setWiping(true);
    setShowDetect(false);
    showDetectRef.current = false;
    wipeRef.current = 0;
    if (scanRef.current) scanRef.current.style.opacity = "1";

    let raf = 0;
    let start: number | null = null;
    const DUR = 0.78; // seconds — fast + identical every time
    const step = (ts: number) => {
      if (start == null) start = ts;
      const t = Math.min(1, (ts - start) / 1000 / DUR);
      wipeRef.current = t;
      if (scanRef.current) {
        scanRef.current.style.left = `${t * 100}%`;
        scanRef.current.style.opacity = t < 1 ? "1" : "0";
      }
      if (t < 1) raf = requestAnimationFrame(step);
      else {
        setWiping(false);
        setShowDetect(true);
        showDetectRef.current = true;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [active, entered]);

  // glue the reticle + leader line to the projected anchor (only once landed)
  const onAnchor = useCallback((a: AnchorReport) => {
    const wrap = reticleWrapRef.current;
    if (wrap) {
      wrap.style.transform = `translate(${a.x}px, ${a.y}px)`;
      wrap.style.opacity = showDetectRef.current && a.on ? "1" : "0";
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
  }, []);

  const ind = INDUSTRIES[active];
  const d = ind.detection;
  const show3D = capable && near;

  return (
    <section
      aria-label="Where Triya is deployed"
      ref={outerRef}
      className="dark relative bg-ink-900 text-cream-100"
      style={{ minHeight: "460vh" }}
    >
      <div ref={stageRef} className="sticky top-0 h-screen overflow-hidden">
        <HudScanlines />

        {/* the single line-art district (full-bleed) — swaps via scan-wipe */}
        <div aria-hidden className="absolute inset-0">
          {show3D ? (
            <LineArtSwitcher
              configs={CONFIGS}
              toIndex={pair.to}
              fromIndex={pair.from}
              wiping={wiping}
              wipeRef={wipeRef}
              reduced={false}
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

        {/* legibility scrim behind the copy column (left) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-[58%]"
          style={{
            background:
              "linear-gradient(90deg, hsl(var(--ink-900)/0.92), hsl(var(--ink-900)/0.55) 55%, transparent)",
          }}
        />

        {/* the scan-wipe blade (sweeps L→R in sync with the model wipe) */}
        <div
          ref={scanRef}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-20"
          style={{ left: "0%", width: "150px", transform: "translateX(-50%)", opacity: 0 }}
        >
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to right, transparent, ${CLAY}28, transparent)` }}
          />
          <div
            className="absolute inset-y-0 left-1/2 w-[2px]"
            style={{ background: CLAY, boxShadow: `0 0 24px 3px ${CLAY}` }}
          />
        </div>

        {/* viewfinder HUD (cam id + clock update per industry) */}
        <StageHud cameraId={d.cameraId} reduced={false} />

        {/* detection leader line + reticle + parked card (after land) */}
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
          style={{ opacity: showDetect ? 1 : 0, transition: "opacity .25s ease", filter: `drop-shadow(0 0 4px ${CLAY}aa)` }}
        >
          <path
            ref={lineRef}
            fill="none"
            stroke={CLAY}
            strokeWidth={1.6}
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: showDetect ? 0 : 1,
              transition: "stroke-dashoffset .5s cubic-bezier(.22,1,.36,1)",
            }}
          />
          <circle ref={dotRef} r={3.5} fill={CLAY} />
        </svg>
        <div
          ref={reticleWrapRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-30"
          style={{ opacity: 0, transition: "opacity .2s ease", willChange: "transform" }}
        >
          {showDetect && <Reticle key={ind.id} tint={CLAY} d={d} reduced={false} />}
        </div>
        <CalloutCard key={`card-${ind.id}`} d={d} caught={showDetect} cardFrac={cardFrac} reduced={false} />

        {/* the copy column — types in on each land */}
        <div className="container relative z-40 flex h-full items-center">
          <div className="max-w-[30rem]">
            <TypedBlock ind={ind} ready={entered} runKey={active} />
            <ProgressTicks active={active} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── typed copy block ───────────────────────── */

function TypedBlock({ ind, ready, runKey }: { ind: Ind; ready: boolean; runKey: number }) {
  const [nameN, setNameN] = useState(0);
  const [bodyN, setBodyN] = useState(0);
  const [bulletsN, setBulletsN] = useState(0);
  const [phase, setPhase] = useState<"idle" | "name" | "body" | "done">("idle");

  useEffect(() => {
    if (!ready) return;
    const timers: number[] = [];
    setNameN(0);
    setBodyN(0);
    setBulletsN(0);
    setPhase("idle");

    const START = 340; // begin as the sweep passes centre
    const NAME_MS = 34;
    const BODY_MS = 13;
    const BULLET_MS = 150;
    const title = ind.title;
    const body = ind.body;

    const begin = window.setTimeout(() => {
      setPhase("name");
      let i = 0;
      const nameInt = window.setInterval(() => {
        i += 1;
        setNameN(i);
        if (i >= title.length) {
          window.clearInterval(nameInt);
          setPhase("body");
          let j = 0;
          const bodyInt = window.setInterval(() => {
            j += 1;
            setBodyN(j);
            if (j >= body.length) {
              window.clearInterval(bodyInt);
              setPhase("done");
              ind.bullets.forEach((_, k) => {
                timers.push(window.setTimeout(() => setBulletsN(k + 1), k * BULLET_MS));
              });
            }
          }, BODY_MS);
          timers.push(bodyInt);
        }
      }, NAME_MS);
      timers.push(nameInt);
    }, START);
    timers.push(begin);

    return () =>
      timers.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, ready]);

  return (
    <div>
      <p className="mb-4 inline-flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-clay-400">
        <span className="leading-none" style={{ color: CLAY }}>◣</span>
        {ind.index} / {ind.title}
      </p>
      <h2 className="t-display-2 min-h-[1.1em] text-cream-50">
        {ind.title.slice(0, nameN)}
        {phase === "name" && <Caret />}
      </h2>
      <p className="t-lead mt-5 min-h-[4.5rem] max-w-md text-steel-200">
        {ind.body.slice(0, bodyN)}
        {phase === "body" && <Caret />}
      </p>
      <ul className="mt-6 space-y-2">
        {ind.bullets.map((b, k) => (
          <li
            key={b}
            className="flex items-center text-sm text-steel-300 transition-all duration-300"
            style={{ opacity: k < bulletsN ? 1 : 0, transform: k < bulletsN ? "none" : "translateY(6px)" }}
          >
            <span className="me-2.5 inline-block h-1.5 w-1.5 rounded-full bg-clay-400" />
            {b}
          </li>
        ))}
      </ul>
      <div style={{ opacity: bulletsN >= ind.bullets.length ? 1 : 0, transition: "opacity .4s ease" }}>
        <Link
          href={`/use-cases/${ind.slug}/`}
          className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-clay-400 hover:text-clay-300"
        >
          Learn more
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </Link>
      </div>
    </div>
  );
}

function Caret() {
  return (
    <span
      aria-hidden
      className="ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] animate-pulse"
      style={{ background: CLAY }}
    />
  );
}

/* ───────────────────────── progress ticks ───────────────────────── */

function ProgressTicks({ active }: { active: number }) {
  return (
    <div className="mt-10 flex items-center gap-2.5">
      {INDUSTRIES.map((ind, i) => (
        <div key={ind.id} className="flex items-center gap-2.5">
          <span
            className="h-[3px] rounded-full transition-all duration-500"
            style={{
              width: i === active ? 40 : 18,
              background: i <= active ? CLAY : "hsl(var(--steel-500))",
              opacity: i === active ? 1 : 0.5,
            }}
          />
        </div>
      ))}
      <span className="ml-1 font-mono text-[0.7rem] tabular-nums text-steel-400">
        {String(active + 1).padStart(2, "0")}
        <span className="text-steel-600"> / {String(N).padStart(2, "0")}</span>
      </span>
    </div>
  );
}

/* ───────────────────────── static stack (reduced / mobile) ───────────────────────── */

function StaticStack({ reduced }: { reduced: boolean }) {
  return (
    <div className="bg-ink-900">
      {INDUSTRIES.map((ind) => (
        <StaticCard key={ind.id} ind={ind} reduced={reduced} />
      ))}
    </div>
  );
}

function StaticCard({ ind, reduced }: { ind: Ind; reduced: boolean }) {
  const capable = useCapable3D();
  const ref = useRef<HTMLElement>(null);
  const progressRef = useRef(1);
  const enteredRef = useRef(true);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setNear(true);
      },
      { rootMargin: "500px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const d = ind.detection;
  const show3D = capable && near;

  return (
    <section
      ref={ref}
      aria-labelledby={`line-${ind.id}`}
      className="dark relative overflow-hidden border-t border-white/5 bg-ink-900 text-cream-100"
    >
      <div className="relative h-[50vh] w-full overflow-hidden">
        <HudScanlines />
        <div aria-hidden className="absolute inset-0">
          {show3D ? (
            <LineArtScene
              industry={ind.id}
              reduced
              color={ind.lineColor}
              progressRef={progressRef}
              enteredRef={enteredRef}
              anchorLocal={ind.anchor}
              craneFrom={0.4}
              craneTo={0.4}
              xBias={0}
              lift={0}
              fitScale={ind.fitScale ?? 1}
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
      <div
        className="absolute -inset-[20%] rounded-[42%]"
        style={{ background: `radial-gradient(50% 50% at 50% 50%, ${tint}, transparent 70%)`, opacity: 0.16 }}
      />
      <SubjectGlyph kind={d.subject} tint={tint} reduced={reduced} />
      <div className="absolute inset-0 rounded-[2px] border" style={{ borderColor: tint, opacity: 0.5 }} />
      <BoxCorner pos="tl" tint={tint} reduced={reduced} />
      <BoxCorner pos="tr" tint={tint} reduced={reduced} />
      <BoxCorner pos="bl" tint={tint} reduced={reduced} />
      <BoxCorner pos="br" tint={tint} reduced={reduced} />
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
  d,
  caught,
  cardFrac,
  reduced,
}: {
  d: Detection;
  caught: boolean;
  cardFrac: { fx: number; fy: number };
  reduced: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-30 w-[16.5rem] rounded-lg border bg-ink-900/65 p-3 backdrop-blur-md"
      style={{ borderColor: `${CLAY}55`, top: `${cardFrac.fy * 100}%`, right: "2.75rem", transform: "translateY(-50%)" }}
      initial={reduced ? false : { opacity: 0, y: 8 }}
      animate={caught ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{ delay: reduced ? 0 : 0.34, duration: 0.4, ease: DRIFT }}
    >
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
