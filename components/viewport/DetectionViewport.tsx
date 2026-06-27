"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { BoundingBox } from "@/components/sections/query-room.data";
import { LOCK, DUR } from "@/lib/motion-grammar";

/**
 * DetectionViewport — the one reusable "instrument" of the Standing Watch spine.
 *
 * scanline (STEEL, watching) → box snap (CLAY, caught) → on-prem stamp. Both the
 * "talk to your cameras" set-piece and the "where to apply" detection deck drive
 * this same surface, so the whole page reads as one product, not two demos.
 *
 * Single-decode contract: at most ONE <video> is mounted (the focused feed);
 * everything else on the page is a poster still. Phase is owned by the parent.
 * Fully static under reduced motion (poster + resolved box, no sweep).
 */

export type ViewportPhase = "idle" | "scan" | "answer" | "done";

export interface ViewportData {
  id: string;
  cameraId: string;
  location: string;
  timestamp: string;
  box: BoundingBox;
  poster: string;
  /** live footage; omit for "available" scenarios shown as a still. */
  video?: string;
}

export function DetectionViewport({
  data,
  phase,
  reduced,
  videoRef,
  className,
  stamp = true,
}: {
  data: ViewportData;
  phase: ViewportPhase;
  reduced: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
  className?: string;
  stamp?: boolean;
}) {
  const showBox = phase === "answer" || phase === "done";
  const showStamp = stamp && phase === "done";

  return (
    <div
      className={[
        "relative aspect-video overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-black shadow-[0_30px_60px_-25px_rgba(0,0,0,0.8)]",
        className ?? "",
      ].join(" ")}
    >
      {/* media — decorative B-roll; meaning is carried by the HUD + answer */}
      {reduced || !data.video ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <video
          key={data.id}
          ref={videoRef}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          poster={data.poster}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={data.video} type="video/mp4" />
        </video>
      )}

      {/* readability + cinematic grade */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/35" />

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
          value={data.cameraId}
          reduced={reduced}
          className="font-mono text-[0.65rem] tracking-wider text-cream-100"
        />
      </div>

      {/* HUD: timestamp + location (top-right) */}
      <div className="absolute right-3 top-3 text-right">
        <p className="font-mono text-[0.65rem] tracking-wider text-cream-100">
          {data.timestamp}
        </p>
        <p className="font-mono text-[0.6rem] tracking-wider text-steel-300">
          {data.location}
        </p>
      </div>

      {/* scanline sweep — STEEL: the system watching, before it catches */}
      {phase === "scan" && !reduced && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-steel-400/[0.05]" />
          <motion.div
            initial={{ top: "-4%" }}
            animate={{ top: "104%" }}
            transition={{ duration: DUR.scan, ease: "easeInOut" }}
            className="pointer-events-none absolute inset-x-0 h-16 -translate-y-1/2"
            style={{
              background:
                "linear-gradient(to bottom, transparent, hsl(var(--steel-300)/0.3), transparent)",
            }}
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-steel-200 shadow-[0_0_12px_2px_hsl(var(--steel-300)/0.7)]" />
          </motion.div>
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 font-mono text-[0.65rem] tracking-wider text-steel-200">
            ANALYZING
            <Dots />
          </div>
        </>
      )}

      {/* bounding box — CLAY: the catch. Snaps in with the lock easing. */}
      {showBox && (
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 1.16 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DUR.lock, ease: LOCK }}
          className="absolute"
          style={{
            left: `${data.box.x}%`,
            top: `${data.box.y}%`,
            width: `${data.box.w}%`,
            height: `${data.box.h}%`,
          }}
        >
          <div
            className={
              data.box.mode === "zone"
                ? "relative h-full w-full overflow-hidden rounded-[3px] border border-clay-400/70 bg-clay-400/20 shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_0_22px_-2px_hsl(var(--clay-400)/0.7)]"
                : "relative h-full w-full rounded-[3px] border-2 border-clay-400 shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_0_18px_-2px_hsl(var(--clay-400)/0.8)]"
            }
          >
            {data.box.mode === "zone" && (
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(60% 55% at 55% 60%, hsl(var(--clay-400)/0.55), transparent 70%)",
                }}
              />
            )}
            <div className="absolute -top-7 left-0 flex items-center gap-2 whitespace-nowrap rounded-md bg-clay-400 px-2 py-1">
              <span className="font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-ink-900">
                {data.box.label}
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
          <p className="font-mono text-[0.5rem] uppercase leading-tight tracking-[0.12em] text-steel-300">
            data never left this site
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ── shared HUD primitives (reused by the set-piece answer card) ── */

export function Corners() {
  const base = "pointer-events-none absolute h-5 w-5 border-cream-100/40";
  return (
    <>
      <span className={`${base} left-2 top-2 border-l-2 border-t-2`} />
      <span className={`${base} right-2 top-2 border-r-2 border-t-2`} />
      <span className={`${base} bottom-2 left-2 border-b-2 border-l-2`} />
      <span className={`${base} bottom-2 right-2 border-b-2 border-r-2`} />
    </>
  );
}

export function Caret() {
  return (
    <span className="ms-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-clay-400 align-baseline" />
  );
}

export function Dots() {
  return (
    <span className="inline-flex gap-0.5">
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
      <span className="h-1 w-1 animate-bounce rounded-full bg-current" />
    </span>
  );
}

const SCRAMBLE_GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";

/** camera-ID readout that "acquires" — scrambles its glyphs then locks on. */
export function ScrambleText({
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
