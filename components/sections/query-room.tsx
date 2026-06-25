"use client";

import { useEffect, useMemo, useRef, useState, type ElementType } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import {
  CHANNELS,
  SCENARIOS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  answerToText,
  type Channel,
  type Category,
  type Scenario,
} from "@/components/sections/query-room.data";

/**
 * The Command Room — the product's Scenarios & Alerts, made cinematic.
 *
 * Two movements in one ink band: (1) a live console that DEMOS four flagship
 * detection scenarios firing on real footage — scanline → bounding-box/zone snap
 * → camera-ID/timestamp telemetry → typed alert in Triya's voice → an on-prem
 * stamp; and (2) "the standing watch", a living roster of the full detection
 * library across security / safety / compliance / operations.
 *
 * Craft contract: only the active scenario's <video> is in the DOM; keyboard
 * radiogroup; auto-advance pauses on hover/focus and off-screen; full static
 * fallback under prefers-reduced-motion (poster + pre-resolved box + complete
 * alert + static roster, no scrub, no auto-fire).
 */

type Phase = "query" | "scan" | "answer" | "done";

const HOLD_MS = 5200; // dwell on a resolved alert before auto-advancing

/** category tints — clay stays dominant; safety/operations get rare muted
 *  amber/green accents, matching the product's own scenario taxonomy */
const CAT_TINT: Record<Category, string> = {
  security: "hsl(var(--clay-400))",
  compliance: "hsl(var(--clay-300))",
  safety: "hsl(38 70% 56%)",
  operations: "hsl(150 30% 52%)",
};

export function QueryRoom() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "query");
  const [queryShown, setQueryShown] = useState(0);
  const [answerShown, setAnswerShown] = useState(0);
  const [paused, setPaused] = useState(false); // hover/focus → hold auto-advance
  const [inView, setInView] = useState(false);
  const [booted, setBooted] = useState(reduced); // "power on" latch (first view)

  const sectionRef = useRef<HTMLElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const radioRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const ch = CHANNELS[active];

  // flatten the answer into per-char cells (with emphasis) for the typewriter
  const answerCells = useMemo(() => {
    const cells: { c: string; em: boolean }[] = [];
    ch.answer.forEach((seg) => {
      for (const c of seg.t) cells.push({ c, em: !!seg.em });
    });
    return cells;
  }, [ch]);

  // observe visibility — don't animate or auto-advance off-screen, and pause
  // the single video element when the room isn't on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting) setBooted(true); // latches: the room boots once
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the resolve sequence — re-runs whenever the channel changes
  useEffect(() => {
    if (reduced) {
      setQueryShown(ch.query.length);
      setAnswerShown(answerCells.length);
      setPhase("done");
      return;
    }
    if (!inView) return; // wait until the room is on screen to begin

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    (async () => {
      setQueryShown(0);
      setAnswerShown(0);
      setPhase("query");
      await sleep(420);
      if (cancelled) return;

      for (let i = 1; i <= ch.query.length; i++) {
        setQueryShown(i);
        await sleep(24);
        if (cancelled) return;
      }
      await sleep(460);
      if (cancelled) return;

      setPhase("scan");
      await sleep(1180); // scanline sweep
      if (cancelled) return;

      setPhase("answer"); // bounding box snaps in here
      await sleep(520);
      if (cancelled) return;

      for (let i = 1; i <= answerCells.length; i++) {
        setAnswerShown(i);
        await sleep(15);
        if (cancelled) return;
      }
      setPhase("done");
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [active, reduced, inView, ch, answerCells.length]);

  // auto-advance — only while resolved, on-screen, and not under the pointer.
  // Cleanly re-arms when `paused` flips, so hover holds and release resumes.
  useEffect(() => {
    if (reduced || phase !== "done" || paused || !inView) return;
    const t = setTimeout(
      () => setActive((a) => (a + 1) % CHANNELS.length),
      HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [phase, paused, inView, reduced, active]);

  // pause/resume the active video with visibility
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [inView, active]);

  // roving-tabindex keyboard nav for the channel radiogroup
  const onRadioKey = (e: React.KeyboardEvent, i: number) => {
    const last = CHANNELS.length - 1;
    let next = i;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = i === last ? 0 : i + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = i === 0 ? last : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(next);
    radioRefs.current[next]?.focus();
  };

  // jump from a wall row to its live demo in the console above
  const demoScenario = (demoId: string) => {
    const idx = CHANNELS.findIndex((c) => c.id === demoId);
    if (idx < 0) return;
    setActive(idx);
    consoleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="query-room-title"
      className="dark relative overflow-hidden bg-ink-900 py-24 text-cream-100 sm:py-32"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* faint engineering grid — paper-under-glass ruling (horizontal datum
          lines only). Boots on (fades in left-untouched) when the room enters. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-[1100ms] ease-out"
        style={{
          opacity: booted ? 0.05 : 0,
          backgroundImage:
            "linear-gradient(hsl(var(--cream-100)) 1px, transparent 1px)",
          backgroundSize: "100% 40px",
        }}
      />

      {/* cinematic seams — the ink room emerges from paper at the top and
          dissolves back into paper at the bottom (the city's "paper" language) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-36"
        style={{ background: "linear-gradient(to bottom, hsl(var(--cream-50)), transparent)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
        style={{ background: "linear-gradient(to top, hsl(var(--cream-100)), transparent)" }}
      />

      {/* one-shot "power on" scan that sweeps the room when it first enters */}
      {booted && !reduced && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-20 h-44"
          initial={{ top: "-16%", opacity: 1 }}
          animate={{ top: "112%", opacity: [1, 1, 0] }}
          transition={{ duration: 1.05, ease: "easeInOut" }}
          style={{
            background:
              "linear-gradient(to bottom, transparent, hsl(var(--clay-400)/0.16), transparent)",
          }}
        >
          <div className="absolute inset-x-0 top-1/2 h-px bg-clay-400/80 shadow-[0_0_18px_3px_hsl(var(--clay-400)/0.6)]" />
        </motion.div>
      )}

      <div className="container relative z-10">
        {/* header — develops in as the room boots */}
        <motion.div
          className="max-w-2xl"
          initial={false}
          animate={{ opacity: booted ? 1 : 0, y: booted ? 0 : 16 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        >
          <p className="t-eyebrow !text-clay-300">Scenarios &amp; Alerts · Always-on detection</p>
          <h2
            id="query-room-title"
            className="t-display-2 mt-4 text-cream-50"
          >
            See what it <em className="not-italic text-clay-400">catches</em>.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-300">
            Switch on a detection and Triya watches your own footage around the
            clock — flagging the exact moment it fires, on-premise. Here are four
            of them, live.
          </p>
        </motion.div>

        {/* console */}
        <div ref={consoleRef} className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* ── channel index (radiogroup) ── */}
          <div
            role="radiogroup"
            aria-label="Choose a detection scenario"
            className="flex gap-3 overflow-x-auto pb-2 lg:col-span-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0"
          >
            {CHANNELS.map((c, i) => {
              const on = i === active;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    radioRefs.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onRadioKey(e, i)}
                  className={[
                    "group relative shrink-0 rounded-xl border px-4 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900 lg:shrink lg:rounded-none lg:border-0 lg:border-s-2 lg:px-5 lg:py-4",
                    on
                      ? "border-clay-400 bg-ink-800 lg:bg-transparent"
                      : "border-[hsl(var(--border))] hover:bg-ink-800/60 lg:border-[hsl(var(--border))]/40 lg:hover:border-ink-300",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={[
                        "font-mono text-xs tracking-[0.2em]",
                        on ? "text-clay-300" : "text-ink-300",
                      ].join(" ")}
                    >
                      {c.index}
                    </span>
                    <span
                      className={[
                        "font-display text-base font-semibold tracking-tight",
                        on ? "text-cream-50" : "text-ink-300 group-hover:text-cream-100",
                      ].join(" ")}
                    >
                      {c.label}
                    </span>
                  </div>
                  <p
                    className={[
                      "mt-1 hidden text-sm leading-snug lg:block",
                      on ? "text-cream-100" : "text-ink-300",
                    ].join(" ")}
                  >
                    {c.verb}
                  </p>
                  <span className="mt-2 hidden items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-ink-300 lg:inline-flex">
                    <span
                      className="inline-block h-1.5 w-1.5 rounded-full"
                      style={{ background: CAT_TINT[c.category] }}
                    />
                    {CATEGORY_LABELS[c.category]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── footage viewport ── */}
          <div className="lg:col-span-5">
            <Viewport
              ch={ch}
              phase={phase}
              reduced={reduced}
              videoRef={videoRef}
            />
          </div>

          {/* ── conversation rail ── */}
          <div className="lg:col-span-4">
            <Conversation
              ch={ch}
              phase={phase}
              reduced={reduced}
              queryShown={queryShown}
              answerCells={answerCells}
              answerShown={answerShown}
              active={active}
              onPick={setActive}
            />
          </div>
        </div>

        {/* ── movement 2: the standing watch — the full detection library ── */}
        <DetectionWall reduced={reduced} inView={inView} onDemo={demoScenario} />
      </div>
    </section>
  );
}

/* ──────────────────── the standing watch (detection wall) ──────────────────── */

function DetectionWall({
  reduced,
  inView,
  onDemo,
}: {
  reduced: boolean;
  inView: boolean;
  onDemo: (demoId: string) => void;
}) {
  // one active scenario "fires" in the periphery at a slow, irregular cadence —
  // the wall catching something while you read it. Off when off-screen/reduced.
  const [firingId, setFiringId] = useState<string | null>(null);
  const activeIds = useMemo(
    () => SCENARIOS.filter((s) => s.status === "active").map((s) => s.id),
    [],
  );

  useEffect(() => {
    if (reduced || !inView || activeIds.length === 0) return;
    let tick = 0;
    const id = setInterval(() => {
      tick += 1;
      // skip ~1 in 3 ticks so the cadence reads irregular, not metronomic
      if (tick % 3 === 0) return;
      const pick = activeIds[Math.floor(Math.random() * activeIds.length)];
      setFiringId(pick);
      setTimeout(() => setFiringId((cur) => (cur === pick ? null : cur)), 750);
    }, 1900);
    return () => clearInterval(id);
  }, [reduced, inView, activeIds]);

  return (
    <div className="mt-20 sm:mt-28">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <p className="t-eyebrow !text-clay-300">The standing watch</p>
          <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight text-cream-50 sm:text-3xl">
            Everything it can watch for.
          </h3>
          <p className="mt-3 text-ink-300">
            Pre-built detections across four fronts. Switch one on and it runs
            24/7 on your own footage — alerting the moment it fires.
          </p>
        </div>
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-500">
          {SCENARIOS.filter((s) => s.status === "active").length} armed ·{" "}
          {SCENARIOS.length} ready
        </p>
      </div>

      {/* category lanes */}
      <div className="mt-10 grid gap-x-10 gap-y-10 border-t border-[hsl(var(--border))] pt-10 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORY_ORDER.map((cat) => {
          const items = SCENARIOS.filter((s) => s.category === cat);
          return (
            <div key={cat}>
              <div className="mb-4 flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: CAT_TINT[cat] }}
                />
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink-300">
                  {CATEGORY_LABELS[cat]}
                </span>
              </div>
              <ul className="space-y-px">
                {items.map((s) => (
                  <ScenarioRow
                    key={s.id}
                    s={s}
                    reduced={reduced}
                    firing={firingId === s.id}
                    onDemo={onDemo}
                  />
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* the manifest is still being written + a soft bridge */}
      <div className="mt-8 flex flex-col gap-4 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-[0.75rem] text-ink-500">
          + more on the watch every release
          {!reduced && <span className="ms-1 inline-block animate-pulse">▌</span>}
        </p>
        <Link
          href="/contact/"
          className="group inline-flex items-center gap-2 text-sm text-ink-300 transition-colors hover:text-cream-50"
        >
          Don’t see yours? Triya can likely learn it
          <ArrowRight className="h-4 w-4 text-clay-400 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

function ScenarioRow({
  s,
  reduced,
  firing,
  onDemo,
}: {
  s: Scenario;
  reduced: boolean;
  firing: boolean;
  onDemo: (demoId: string) => void;
}) {
  const isActive = s.status === "active";
  const interactive = !!s.demoId;
  const Tag: ElementType = interactive ? "button" : "div";

  return (
    <li className="relative">
      <Tag
        {...(interactive
          ? {
              onClick: () => onDemo(s.demoId!),
              type: "button" as const,
              "aria-label": `Demo the ${s.name} scenario`,
            }
          : {})}
        className={[
          "group relative block w-full border-b border-[hsl(var(--border))]/40 py-3 text-start transition-colors",
          interactive
            ? "cursor-pointer hover:border-clay-400/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-clay-400"
            : "",
        ].join(" ")}
      >
        {/* the firing sweep — a clay underline that wipes the row */}
        {firing && !reduced && (
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0, opacity: 0.9 }}
            animate={{ scaleX: 1, opacity: 0 }}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="absolute inset-x-0 bottom-0 h-px origin-left bg-clay-400"
          />
        )}
        <div className="flex items-center gap-2.5">
          {/* status dot */}
          <span className="relative flex h-2 w-2 shrink-0">
            {isActive && !reduced && (
              <span
                className={[
                  "absolute inline-flex h-full w-full rounded-full bg-clay-400",
                  firing ? "animate-ping" : "opacity-0",
                ].join(" ")}
              />
            )}
            <span
              className={[
                "relative inline-flex h-2 w-2 rounded-full",
                isActive ? "bg-clay-400" : "border border-ink-300",
              ].join(" ")}
            />
          </span>
          <span
            className={[
              "font-display text-[0.98rem] font-medium tracking-tight",
              isActive ? "text-cream-50" : "text-ink-300 group-hover:text-cream-100",
            ].join(" ")}
          >
            {s.name}
          </span>
          {interactive && (
            <span className="ms-auto font-mono text-[0.55rem] uppercase tracking-wider text-clay-300 opacity-0 transition-opacity group-hover:opacity-100">
              demo →
            </span>
          )}
        </div>
        <p className="mt-1 ps-[18px] text-[0.8rem] leading-snug text-ink-500">
          {s.description}
        </p>
        <p className="mt-1.5 ps-[18px] font-mono text-[0.6rem] uppercase tracking-[0.12em] text-ink-300">
          {isActive ? "● Active" : "○ Available"} · Detects {s.detects.join(", ")}
        </p>
      </Tag>
    </li>
  );
}

/* ────────────────────────── viewport ────────────────────────── */

function Viewport({
  ch,
  phase,
  reduced,
  videoRef,
}: {
  ch: Channel;
  phase: Phase;
  reduced: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  const showBox = phase === "answer" || phase === "done";
  const showStamp = phase === "done";

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-black shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)]">
      {/* media — only the active channel is ever mounted */}
      {/* media is decorative B-roll — the meaning is carried by the HUD readout
          and the conversation rail, so it's hidden from assistive tech */}
      {reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ch.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          key={ch.id}
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={ch.poster}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={ch.video} type="video/mp4" />
        </video>
      )}

      {/* readability + cinematic grade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35" />

      {/* HUD frame: corner ticks */}
      <Corners />

      {/* HUD: camera id + REC (top-left) */}
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/45 px-2.5 py-1.5 backdrop-blur-sm">
        <span className="relative flex h-2 w-2">
          {!reduced && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-clay-400" />
        </span>
        <ScrambleText
          value={ch.cameraId}
          reduced={reduced}
          className="font-mono text-[0.65rem] tracking-wider text-cream-100"
        />
      </div>

      {/* HUD: timestamp + location (top-right) */}
      <div className="absolute right-3 top-3 text-right">
        <p className="font-mono text-[0.65rem] tracking-wider text-cream-100">
          {ch.timestamp}
        </p>
        <p className="font-mono text-[0.6rem] tracking-wider text-ink-300">
          {ch.location}
        </p>
      </div>

      {/* scanline sweep (analysis) */}
      {phase === "scan" && !reduced && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-clay-400/[0.06]" />
          <motion.div
            initial={{ top: "-4%" }}
            animate={{ top: "104%" }}
            transition={{ duration: 1.15, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-x-0 h-16 -translate-y-1/2"
            style={{
              background:
                "linear-gradient(to bottom, transparent, hsl(var(--clay-400)/0.28), transparent)",
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-clay-400 shadow-[0_0_12px_2px_hsl(var(--clay-400)/0.7)]" />
          </motion.div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[0.65rem] tracking-wider text-clay-300">
            ANALYZING
            <Dots />
          </div>
        </>
      )}

      {/* bounding box — snaps onto the subject when the frame resolves */}
      {showBox && (
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 1.16 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 440, damping: 26 }}
          className="absolute"
          style={{
            left: `${ch.box.x}%`,
            top: `${ch.box.y}%`,
            width: `${ch.box.w}%`,
            height: `${ch.box.h}%`,
          }}
        >
          <div
            className={
              ch.box.mode === "zone"
                ? "relative h-full w-full overflow-hidden rounded-[3px] border border-clay-400/70 bg-clay-400/20 shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_0_22px_-2px_hsl(var(--clay-400)/0.7)]"
                : "relative h-full w-full rounded-[3px] border-2 border-clay-400 shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_0_18px_-2px_hsl(var(--clay-400)/0.8)]"
            }
          >
            {/* density zones get a hot core; detection boxes stay hollow */}
            {ch.box.mode === "zone" && (
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 55% at 55% 60%, hsl(var(--clay-400)/0.55), transparent 70%)",
                }}
              />
            )}
            {/* label chip — no decimal confidence; Triya speaks its certainty in
                plain language in the answer, not as a model readout */}
            <div className="absolute -top-7 left-0 flex items-center gap-2 whitespace-nowrap rounded-md bg-clay-400 px-2 py-1">
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-ink-900">
                {ch.box.label}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* sovereignty stamp — the differentiator made physical */}
      {showStamp && (
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 1.35, rotate: -16 }}
          animate={{ opacity: 1, scale: 1, rotate: -7 }}
          transition={{ type: "spring", stiffness: 320, damping: 18, delay: reduced ? 0 : 0.1 }}
          className="absolute bottom-3 right-3 select-none rounded-md border border-clay-400/70 bg-black/40 px-2.5 py-1.5 backdrop-blur-sm"
        >
          <p className="font-mono text-[0.55rem] font-semibold uppercase leading-tight tracking-[0.15em] text-clay-300">
            Processed on-prem
          </p>
          <p className="font-mono text-[0.5rem] uppercase leading-tight tracking-[0.12em] text-ink-300">
            data never left this site
          </p>
        </motion.div>
      )}
    </div>
  );
}

function Corners() {
  const base =
    "pointer-events-none absolute h-5 w-5 border-cream-100/40";
  return (
    <>
      <span className={`${base} left-2 top-2 border-l-2 border-t-2`} />
      <span className={`${base} right-2 top-2 border-r-2 border-t-2`} />
      <span className={`${base} bottom-2 left-2 border-b-2 border-l-2`} />
      <span className={`${base} bottom-2 right-2 border-b-2 border-r-2`} />
    </>
  );
}

/* ──────────────────────── conversation rail ──────────────────────── */

function Conversation({
  ch,
  phase,
  reduced,
  queryShown,
  answerCells,
  answerShown,
  active,
  onPick,
}: {
  ch: Channel;
  phase: Phase;
  reduced: boolean;
  queryShown: number;
  answerCells: { c: string; em: boolean }[];
  answerShown: number;
  active: number;
  onPick: (i: number) => void;
}) {
  const typingQuery = !reduced && phase === "query";
  const typingAnswer = !reduced && phase === "answer";
  const answered = phase === "done";

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[hsl(var(--border))] bg-ink-800/60 p-5 sm:p-6">
      {/* you */}
      <div className="mb-5">
        <p className="t-eyebrow mb-2 !text-ink-300">You</p>
        <div className="rounded-xl rounded-tl-sm bg-ink-900 px-4 py-3 text-[0.95rem] leading-relaxed text-cream-100">
          {reduced ? ch.query : ch.query.slice(0, queryShown)}
          {typingQuery && <Caret />}
        </div>
      </div>

      {/* triya */}
      <div className="flex-1">
        <p className="t-eyebrow mb-2 !text-clay-300">Triya</p>

        {/* scanning indicator before the answer lands */}
        {!reduced && phase === "scan" && (
          <div className="flex items-center gap-2 rounded-xl rounded-tl-sm bg-ink-900 px-4 py-3 font-mono text-[0.8rem] text-ink-300">
            scanning {ch.cameraId}
            <Dots />
          </div>
        )}

        {(reduced || phase === "answer" || phase === "done") && (
          <div className="min-h-[6.5rem] rounded-xl rounded-tl-sm bg-ink-900 px-4 py-3 text-[0.95rem] leading-relaxed text-cream-100">
            {reduced ? (
              <RenderFull cells={answerCells} fallback={answerToText(ch.answer)} />
            ) : (
              <>
                {answerCells.slice(0, answerShown).map((cell, i) => (
                  <span
                    key={i}
                    className={cell.em ? "font-semibold text-clay-300" : undefined}
                  >
                    {cell.c}
                  </span>
                ))}
                {typingAnswer && <Caret />}
              </>
            )}
          </div>
        )}
      </div>

      {/* telemetry chips */}
      <div
        className={[
          "mt-5 flex flex-wrap items-center gap-2 border-t border-[hsl(var(--border))] pt-4 transition-opacity duration-300",
          answered || reduced ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-hidden={!(answered || reduced)}
      >
        <Chip>● {ch.matchChip}</Chip>
        <Chip>{ch.latency} on-prem</Chip>
        <Chip muted>{ch.location}</Chip>
      </div>

      {/* ask it yourself — the visitor picks a question and fires the engine */}
      <div className="mt-5 border-t border-[hsl(var(--border))] pt-4">
        <p className="t-eyebrow mb-3 !text-ink-300">Ask it yourself</p>
        <div className="flex flex-wrap gap-2">
          {CHANNELS.map((c, i) => {
            const on = i === active;
            return (
              <button
                key={c.id}
                onClick={() => onPick(i)}
                aria-pressed={on}
                className={[
                  "rounded-full border px-3 py-1.5 text-start text-[0.8rem] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-800",
                  on
                    ? "border-clay-400 bg-clay-400/15 text-clay-200"
                    : "border-[hsl(var(--border))] text-ink-300 hover:border-ink-300 hover:text-cream-100",
                ].join(" ")}
              >
                {c.chip}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RenderFull({
  cells,
  fallback,
}: {
  cells: { c: string; em: boolean }[];
  fallback: string;
}) {
  if (!cells.length) return <>{fallback}</>;
  return (
    <>
      {cells.map((cell, i) => (
        <span key={i} className={cell.em ? "font-semibold text-clay-300" : undefined}>
          {cell.c}
        </span>
      ))}
    </>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={[
        "rounded-full border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider",
        muted
          ? "border-[hsl(var(--border))] text-ink-300"
          : "border-clay-400/40 text-clay-300",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function Caret() {
  return (
    <span className="ms-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-clay-400 align-baseline" />
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

const SCRAMBLE_GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

/** camera-ID readout that "acquires" — scrambles its glyphs then locks on
 *  channel switch, the way a real surveillance feed feels like it's tuning in */
function ScrambleText({
  value,
  reduced,
  className,
}: {
  value: string;
  reduced: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const steps = 11;
    let frame = 0;
    const id = setInterval(() => {
      frame += 1;
      const settled = Math.floor((frame / steps) * value.length);
      setDisplay(
        value
          .split("")
          .map((c, i) => {
            if (c === "-" || c === " ") return c;
            return i < settled
              ? c
              : SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
          })
          .join(""),
      );
      if (frame >= steps) {
        clearInterval(id);
        setDisplay(value);
      }
    }, 38);
    return () => clearInterval(id);
  }, [value, reduced]);

  return <span className={className}>{display}</span>;
}
