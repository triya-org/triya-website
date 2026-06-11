"use client";

import { useRef, useState } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

declare global {
  interface Window {
    __triyaIntroActive?: boolean;
  }
}

/**
 * First-visit loading animation — "the camera wakes up".
 *
 * The clay lens-dot is the continuous protagonist: it blinks into focus
 * DEAD CENTER, then travels to its slot in the wordmark while the TRIYA
 * letters drop in around it, winks once as a recording light, and the
 * curtain lifts. The curtain START dispatches `triya:intro-done`, which
 * the hero listens for — its per-char entrance plays AS the curtain
 * clears (the payoff is never hidden).
 *
 * ~1.7s, once per session, skipped under prefers-reduced-motion.
 */
export function Preloader() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const travelDotRef = useRef<HTMLSpanElement>(null);
  const slotDotRef = useRef<HTMLSpanElement>(null);
  const charRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [show, setShow] = useState<boolean | null>(null);

  useIsomorphicLayoutEffect(() => {
    const seen =
      typeof window !== "undefined" && sessionStorage.getItem("triya-intro");
    if (seen || reduced) {
      setShow(false);
      return;
    }
    window.__triyaIntroActive = true;
    setShow(true);
  }, [reduced]);

  useIsomorphicLayoutEffect(() => {
    if (!show || !rootRef.current) return;
    registerGsap();
    sessionStorage.setItem("triya-intro", "1");
    document.documentElement.style.overflow = "hidden";

    const chars = charRefs.current.filter(Boolean);
    const ctx = gsap.context(() => {
      // dot travel: from viewport center to its slot in the wordmark
      const slot = slotDotRef.current!.getBoundingClientRect();
      const dx = slot.left + slot.width / 2 - window.innerWidth / 2;
      const dy = slot.top + slot.height / 2 - window.innerHeight / 2;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          document.documentElement.style.overflow = "";
          window.__triyaIntroActive = false;
          setShow(false);
        },
      });

      // 1. lens blinks into focus — center stage (0–0.42s)
      tl.fromTo(
        travelDotRef.current,
        { scale: 0 },
        { scale: 1, duration: 0.2, ease: "back.out(2.2)" },
      )
        .to(travelDotRef.current, { scale: 0.55, duration: 0.1, ease: "power2.inOut" })
        .to(travelDotRef.current, { scale: 1, duration: 0.12, ease: "back.out(3)" })
        // 2. dot claims its place in the name while the letters drop around it
        .to(
          travelDotRef.current,
          { x: dx, y: dy, duration: 0.4, ease: "power3.inOut" },
          "+=0.02",
        )
        .from(
          chars,
          {
            yPercent: 125,
            rotation: () => gsap.utils.random(-8, 8),
            opacity: 0,
            duration: 0.5,
            ease: "back.out(1.5)",
            stagger: { each: 0.045, from: "random" },
          },
          "<+0.08",
        )
        // 3. recording wink (single, readable)
        .to(travelDotRef.current, { scale: 1.3, duration: 0.11, yoyo: true, repeat: 1 }, "+=0.08")
        // 4. curtain lifts — and the hero starts its entrance NOW
        .add(() => {
          window.dispatchEvent(new CustomEvent("triya:intro-done"));
        })
        .to(rootRef.current, { yPercent: -100, duration: 0.55, ease: "power4.inOut" });
    }, rootRef);

    return () => {
      document.documentElement.style.overflow = "";
      window.__triyaIntroActive = false;
      ctx.revert();
    };
  }, [show]);

  if (!show) return null;

  const letters = "TRIYA".split("");

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] bg-cream-50"
      aria-hidden="true"
    >
      {/* wordmark (slot dot is invisible — it only marks the destination) */}
      <div className="flex h-full items-center justify-center">
        <div className="flex items-end gap-1 overflow-hidden px-6 py-6">
          {letters.map((ch, i) => (
            <span
              key={i}
              ref={(el) => {
                charRefs.current[i] = el;
              }}
              className="font-display text-7xl font-semibold tracking-tight text-ink-900 sm:text-8xl"
            >
              {ch}
            </span>
          ))}
          <span
            ref={slotDotRef}
            className="mb-3 ml-2 inline-block h-5 w-5 rounded-full opacity-0 sm:mb-4 sm:h-6 sm:w-6"
          />
        </div>
      </div>
      {/* the travelling lens — starts dead center, ends in the wordmark */}
      <span
        ref={travelDotRef}
        className="absolute left-1/2 top-1/2 -ml-2.5 -mt-2.5 inline-block h-5 w-5 rounded-full bg-clay-400 sm:-ml-3 sm:-mt-3 sm:h-6 sm:w-6"
      />
    </div>
  );
}
