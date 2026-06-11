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
 * Scroll-triggered count-up — semantically aware:
 *  - years (4-digit ≥1900) and non-numeric values get a masked rise instead
 *    of spinning from zero (counting a founding year is the canonical crime)
 *  - small targets (<10) count only the last few steps, integer-snapped
 *  - the SSR-rendered value is never stomped before the trigger fires
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

    const ctx = gsap.context(() => {
      if (!match || isYear) {
        gsap.from(el, {
          opacity: 0,
          y: 14,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 85%" },
        });
        return;
      }
      const suffix = match[2];
      const from = target < 10 ? Math.max(0, target - 6) : 0;
      const state = { n: from };
      gsap.to(state, {
        n: target,
        duration: target < 10 ? 0.7 : 1.3,
        ease: "power2.out",
        snap: { n: 1 },
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => {
            el.textContent = `${from}${suffix}`; // set start only when firing
          },
        },
        onUpdate: () => {
          el.textContent = `${Math.round(state.n)}${suffix}`;
        },
      });
    }, el);

    return () => ctx.revert();
  }, [value, reduced]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
