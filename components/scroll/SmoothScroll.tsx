"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";

/**
 * Lenis momentum smooth-scroll provider, bridged into GSAP's ScrollTrigger so
 * scroll-scrubbed timelines stay perfectly in sync with the smoothed scroll
 * position (the standard Lenis + GSAP integration).
 *
 * Scoped to the landing page for now (not the whole app) so forms/blog keep
 * native scrolling until the motion system rolls out site-wide (plan P5).
 * Disabled entirely under `prefers-reduced-motion`. RTL-safe (vertical scroll).
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    registerGsap();
    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on("scroll", ScrollTrigger.update);

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [reduced]);

  return <>{children}</>;
}
