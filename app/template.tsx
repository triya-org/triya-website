"use client";

import { useRef } from "react";
import { gsap, SplitText, registerGsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

/**
 * Route entrance choreography (v2 — no whole-page ghost fade).
 *
 * The page's H1 rises line-by-line out of an overflow mask (the homepage
 * hero choreographs itself and is excluded via [data-animated-hero]);
 * the rest of the content takes a small y-shift with NO opacity drop, so
 * a mid-flight frame never reads as uniform mush. A clay hairline sweeps
 * the top as the arrival mark. Skipped under prefers-reduced-motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const sweepRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    if (reduced || !ref.current) return;
    registerGsap();
    const ctx = gsap.context(() => {
      const h1 = ref.current!.querySelector<HTMLElement>(
        "h1:not([data-animated-hero])",
      );
      if (h1) {
        const split = new SplitText(h1, {
          type: "lines",
          linesClass: "overflow-hidden",
        });
        // double-wrap: outer line is the mask, inner moves
        const inners = split.lines.map((line) => {
          const inner = document.createElement("span");
          inner.style.display = "block";
          while (line.firstChild) inner.appendChild(line.firstChild);
          line.appendChild(inner);
          return inner;
        });
        gsap.from(inners, {
          yPercent: 110,
          duration: 0.75,
          ease: "power4.out",
          stagger: 0.09,
        });
      }

      // content below: gentle settle, position only — never an opacity ghost
      gsap.from(ref.current, {
        y: 18,
        duration: 0.6,
        ease: "power3.out",
        delay: h1 ? 0.1 : 0,
        clearProps: "transform",
      });

      if (sweepRef.current) {
        gsap.fromTo(
          sweepRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.45,
            ease: "power4.out",
            onComplete: () => {
              gsap.to(sweepRef.current, { opacity: 0, duration: 0.25 });
            },
          },
        );
      }
    });
    return () => ctx.revert();
  }, [reduced]);

  return (
    <>
      <div
        ref={sweepRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-clay-400 rtl:origin-right"
        style={{ transform: "scaleX(0)" }}
      />
      <div ref={ref}>{children}</div>
    </>
  );
}
