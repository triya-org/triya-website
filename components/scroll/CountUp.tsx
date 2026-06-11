"use client";

import { useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

interface CountUpProps {
  /** Final display string, e.g. "85%", "24/7", "15+". */
  value: string;
  className?: string;
}

/**
 * Viewport-triggered count-up — semantically aware:
 *  - years (4-digit ≥1900) and non-numeric values get a soft rise instead
 *    of spinning from zero
 *  - numbers count the last stretch only (never from 0 for big values)
 * Trigger is a plain IntersectionObserver: immune to ScrollTrigger refresh
 * ordering and StrictMode remounts (which left stats frozen at 0).
 */
export function CountUp({ value, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    registerGsap();

    const match = value.match(/^(\d+)(.*)$/);
    const target = match ? parseInt(match[1], 10) : NaN;
    const isYear = match ? match[1].length === 4 && target >= 1900 : false;
    let tween: gsap.core.Tween | null = null;

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        if (!match || isYear) {
          tween = gsap.from(el, { opacity: 0, y: 14, duration: 0.6, ease: "power3.out" });
          return;
        }
        const suffix = match[2];
        const from = Math.max(0, target - Math.min(target, Math.max(6, Math.round(target * 0.4))));
        const state = { n: from };
        el.textContent = `${from}${suffix}`;
        tween = gsap.to(state, {
          n: target,
          duration: target < 10 ? 0.7 : 1.2,
          ease: "power2.out",
          snap: { n: 1 },
          onUpdate: () => {
            el.textContent = `${Math.round(state.n)}${suffix}`;
          },
        });
      },
      { threshold: 0.5 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      tween?.kill();
      el.textContent = value; // always settle on the true value
    };
  }, [value, reduced]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
