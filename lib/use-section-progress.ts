"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { usePrefersReducedMotion } from "./reduced-motion";

type Mode = "through" | "pin" | "exit";

interface Options {
  /**
   * "through" — 0 when the element top reaches the viewport bottom, 1 when its
   *   bottom reaches the viewport top (word-fill, parallax-on-pass).
   * "pin" — 0..1 across a sticky element's scroll runway (rect.height - vh).
   */
  mode?: Mode;
  /**
   * Per-frame callback with the latest progress. When supplied the hook does
   * NOT setState (mutate refs/styles here to avoid re-rendering heavy trees);
   * when omitted the hook returns progress as React state.
   */
  onUpdate?: (p: number) => void;
  /** value used under prefers-reduced-motion (default 1 = "fully revealed") */
  reducedValue?: number;
}

/**
 * Scroll progress of an element through the viewport, derived DIRECTLY from
 * getBoundingClientRect on a passive scroll + rAF loop.
 *
 * Deliberately NOT GSAP ScrollTrigger: the Living City pins for 800% and leaves
 * ScrollTrigger's cached start/end stale, so any other ScrollTrigger silently
 * freezes. Reading the rect every frame is immune to that. (Same pattern the
 * Watch Floor and Proof already use — centralised here.)
 */
export function useSectionProgress(
  ref: RefObject<HTMLElement>,
  { mode = "through", onUpdate, reducedValue = 1 }: Options = {},
) {
  const reduced = usePrefersReducedMotion();
  const [p, setP] = useState(0);
  const last = useRef(-1);
  // keep the latest callback without re-subscribing the scroll listener
  const cb = useRef(onUpdate);
  cb.current = onUpdate;

  useEffect(() => {
    if (reduced) {
      if (cb.current) cb.current(reducedValue);
      else setP(reducedValue);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;

    const calc = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      let v: number;
      if (mode === "pin") {
        const runway = r.height - vh;
        v = runway > 0 ? -r.top / runway : 0;
      } else if (mode === "exit") {
        // viewport-relative scroll distance past the element's top: 0 while the
        // element top is at/below the viewport top, → 1 after ~one viewport of
        // scroll. (Hero stack: assembled at the top, explodes as you scroll.)
        v = -r.top / vh;
      } else {
        v = (vh - r.top) / (vh + r.height);
      }
      v = Math.max(0, Math.min(1, v));
      if (Math.abs(v - last.current) < 0.0015) return;
      last.current = v;
      if (cb.current) cb.current(v);
      else setP(v);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(calc);
    };

    calc();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [ref, mode, reduced, reducedValue]);

  return p;
}
