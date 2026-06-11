"use client";

import { ElementType, useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Render element tag. Defaults to div. */
  as?: ElementType;
  /** Stagger the element's direct children instead of revealing it as one block. */
  stagger?: boolean;
  /** Travel distance in px. */
  y?: number;
  /** ScrollTrigger start, e.g. "top 82%". */
  start?: string;
  /** Per-child stagger seconds (only with `stagger`). */
  staggerEach?: number;
}

/**
 * Scroll-triggered reveal. Wrap a heading/block (one motion) or a grid with
 * `stagger` to cascade its children. Honors prefers-reduced-motion by leaving
 * content visible and skipping animation. GSAP sets the hidden start-state in a
 * layout effect (before paint) to avoid a flash.
 */
export function Reveal({
  children,
  className,
  as,
  stagger = false,
  y = 40,
  start = "top 82%",
  staggerEach = 0.12,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const Tag = (as ?? "div") as ElementType;

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const targets = stagger ? (el.children as unknown as HTMLElement[]) : el;
      gsap.from(targets, {
        y,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: stagger ? staggerEach : 0,
        scrollTrigger: { trigger: el, start },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced, stagger, y, start, staggerEach]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
