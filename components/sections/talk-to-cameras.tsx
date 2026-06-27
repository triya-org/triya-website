"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { WatchField } from "@/components/three/watch-field/WatchField";
import {
  DetectionViewport,
  Caret,
  Dots,
  type ViewportPhase,
} from "@/components/viewport/DetectionViewport";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { DRIFT } from "@/lib/motion-grammar";
import { CHANNELS, answerToText } from "@/components/sections/query-room.data";

/**
 * Talk to your cameras — THE set-piece. The product's promise, performed.
 *
 * A query types into the "Ask Triya anything…" bar; the feed wall is swept by a
 * steel scan (watching); the matching camera LOCKS with a clay box (caught);
 * the answer composes in Triya's voice with camera-ID, timecode and an on-prem
 * stamp. It auto-cycles the four flagship detections and a visitor can fire any
 * of them. Single video decodes at a time; pauses off-screen and on hover.
 *
 * Reduced motion: everything resolves instantly to the answered state.
 */

type Phase = "query" | "scan" | "answer" | "done";
const HOLD_MS = 5600;

const VIEWPORT_PHASE: Record<Phase, ViewportPhase> = {
  query: "idle",
  scan: "scan",
  answer: "answer",
  done: "done",
};

export function TalkToCameras() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "query");
  const [queryShown, setQueryShown] = useState(0);
  const [answerShown, setAnswerShown] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const ch = CHANNELS[active];

  const answerCells = useMemo(() => {
    const cells: { c: string; em: boolean }[] = [];
    ch.answer.forEach((seg) => {
      for (const c of seg.t) cells.push({ c, em: !!seg.em });
    });
    return cells;
  }, [ch]);

  // only run / auto-advance while on screen
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // the ask → scan → lock → answer sequence; re-runs on channel change
  useEffect(() => {
    if (reduced) {
      setQueryShown(ch.query.length);
      setAnswerShown(answerCells.length);
      setPhase("done");
      return;
    }
    if (!inView) return;

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
      await sleep(440);
      if (cancelled) return;
      setPhase("scan");
      await sleep(1180);
      if (cancelled) return;
      setPhase("answer");
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

  // auto-advance through the flagships
  useEffect(() => {
    if (reduced || phase !== "done" || paused || !inView) return;
    const t = setTimeout(
      () => setActive((a) => (a + 1) % CHANNELS.length),
      HOLD_MS,
    );
    return () => clearTimeout(t);
  }, [phase, paused, inView, reduced, active]);

  // single video element follows visibility
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [inView, active]);

  const onTileKey = (e: React.KeyboardEvent, i: number) => {
    const last = CHANNELS.length - 1;
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = i === last ? 0 : i + 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = i === 0 ? last : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(next);
    tileRefs.current[next]?.focus();
  };

  const typingQuery = !reduced && phase === "query";
  const scanning = phase === "scan";
  const answered = phase === "done";

  return (
    <section
      id="talk-to-cameras"
      ref={sectionRef}
      aria-labelledby="talk-title"
      className="dark relative overflow-hidden bg-ink-900 py-24 text-cream-100 sm:py-32"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="absolute inset-0 z-0 opacity-70">
        <WatchField intensity={0.7} />
      </div>

      <div className="container relative z-10">
        {/* header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="t-eyebrow !text-steel-300">The set-piece · Ask, and it answers</p>
          <h2 id="talk-title" className="t-display-2 mt-4 text-cream-50">
            Talk to your cameras.{" "}
            <span className="text-steel-300">In plain language.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-steel-200">
            Ask a real question and watch Triya search your own footage, lock onto
            the moment it matters, and answer — on-premise, in a breath.
          </p>
        </div>

        {/* the command bar — the query types itself in */}
        <div className="mx-auto mt-10 max-w-2xl">
          <div
            className="flex items-center gap-3 rounded-2xl border border-steel-500/60 bg-ink-900/70 px-4 py-4 backdrop-blur-md transition-colors"
            style={{
              borderColor: scanning ? "hsl(var(--steel-300)/0.7)" : undefined,
              boxShadow: "0 18px 44px -26px rgba(0,0,0,0.9)",
            }}
          >
            <Search className="h-5 w-5 shrink-0 text-steel-300" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-start text-base text-cream-50 sm:text-lg">
              {/* the typewriter must not spam SR on every keystroke; the
                  meaningful output is announced from the answer card below */}
              <span aria-hidden={typingQuery}>
                {reduced ? ch.query : ch.query.slice(0, queryShown)}
              </span>
              {typingQuery && <Caret />}
              {scanning && (
                <span className="ms-2 inline-flex items-center gap-1.5 align-middle font-mono text-xs uppercase tracking-wider text-steel-300">
                  searching <Dots />
                </span>
              )}
            </div>
            <span
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-steel-500/60 px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-steel-300 sm:inline-flex"
              aria-hidden="true"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-clay-400" /> Online
            </span>
          </div>
        </div>

        {/* stage: viewport + answer */}
        <div className="mx-auto mt-8 grid max-w-6xl items-stretch gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <DetectionViewport
              data={{
                id: ch.id,
                cameraId: ch.cameraId,
                location: ch.location,
                timestamp: ch.timestamp,
                box: ch.box,
                poster: ch.poster,
                video: ch.video,
              }}
              phase={VIEWPORT_PHASE[phase]}
              reduced={reduced}
              videoRef={videoRef}
              className="h-full"
            />
          </div>

          <div className="lg:col-span-5">
            <div className="flex h-full flex-col rounded-2xl border border-[hsl(var(--border))] bg-ink-800/60 p-5 sm:p-6">
              <p className="t-eyebrow mb-2 !text-clay-300">Triya</p>

              {!reduced && phase === "scan" && (
                <div className="flex items-center gap-2 rounded-xl rounded-tl-sm bg-ink-900 px-4 py-3 font-mono text-[0.8rem] text-steel-300">
                  scanning {ch.cameraId} <Dots />
                </div>
              )}

              {/* one clean announcement of the resolved answer (the visible
                  typewriter is decorative and aria-hidden) */}
              <p className="sr-only" aria-live="polite">
                {reduced || phase === "done" ? answerToText(ch.answer) : ""}
              </p>

              {(reduced || phase === "answer" || phase === "done") && (
                <div
                  aria-hidden="true"
                  className="min-h-[7rem] rounded-xl rounded-tl-sm bg-ink-900 px-4 py-3 text-[0.98rem] leading-relaxed text-cream-100"
                >
                  {reduced ? (
                    <span>{answerToText(ch.answer)}</span>
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
                      {phase === "answer" && <Caret />}
                    </>
                  )}
                </div>
              )}

              {/* telemetry */}
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

              <div className="mt-auto" />
              <p className="mt-5 border-t border-[hsl(var(--border))] pt-4 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-steel-300">
                Detects {ch.detects.join(", ")} · {ch.category}
              </p>
            </div>
          </div>
        </div>

        {/* the feed wall — pick any camera to ask it */}
        <div className="mx-auto mt-10 max-w-6xl">
          <p className="t-eyebrow mb-3 !text-steel-300">Or ask another camera</p>
          <div
            role="radiogroup"
            aria-label="Choose a camera and question to run"
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {CHANNELS.map((c, i) => {
              const on = i === active;
              return (
                <button
                  key={c.id}
                  ref={(el) => {
                    tileRefs.current[i] = el;
                  }}
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => onTileKey(e, i)}
                  className={[
                    "group relative overflow-hidden rounded-xl border text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
                    on
                      ? "border-clay-400"
                      : "border-[hsl(var(--border))] hover:border-steel-400",
                  ].join(" ")}
                >
                  {/* poster still — the "wall" stays cheap; only the focused feed decodes */}
                  <div className="relative aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.poster}
                      alt=""
                      aria-hidden="true"
                      className={[
                        "absolute inset-0 h-full w-full object-cover transition-all duration-500",
                        on ? "" : "opacity-40 grayscale group-hover:opacity-70",
                        scanning && !on ? "opacity-25" : "",
                      ].join(" ")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 to-transparent" />
                    {/* the active tile shows a clay lock corner once caught */}
                    {on && answered && !reduced && (
                      <motion.span
                        aria-hidden="true"
                        initial={{ opacity: 0, scale: 1.2 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.35, ease: DRIFT }}
                        className="absolute right-2 top-2 h-3 w-3 border-r-2 border-t-2 border-clay-400"
                      />
                    )}
                    <span className="absolute left-2 top-2 font-mono text-[0.55rem] uppercase tracking-wider text-steel-200">
                      {c.index}
                    </span>
                  </div>
                  <div className="bg-ink-900/80 px-3 py-2.5">
                    <span
                      className={[
                        "block font-display text-sm font-semibold tracking-tight",
                        on ? "text-cream-50" : "text-steel-200 group-hover:text-cream-100",
                      ].join(" ")}
                    >
                      {c.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[0.78rem] text-steel-300">
                      “{c.chip}”
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Chip({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={[
        "rounded-full border px-2.5 py-1 font-mono text-[0.65rem] tracking-wider",
        muted
          ? "border-[hsl(var(--border))] text-steel-300"
          : "border-clay-400/40 text-clay-300",
      ].join(" ")}
    >
      {children}
    </span>
  );
}
