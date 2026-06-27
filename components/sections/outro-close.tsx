"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WatchField } from "@/components/three/watch-field/WatchField";
import { PerceptionStack } from "@/components/sections/perception-stack";
import { gsap, SplitText, registerGsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

/**
 * The close — the page resolves to the dark watch it opened in, with a giant
 * outro headline (the cinematic "last word"), the hero's clay recording-light
 * returning as the full stop, one decision, and the sovereignty line. Kinetic
 * line reveal on scroll; fully static under reduced motion.
 */
export function OutroClose() {
  const rootRef = useRef<HTMLElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    if (reduced || !headRef.current) return;
    registerGsap();
    const ctx = gsap.context(() => {
      const split = new SplitText(headRef.current, { type: "lines" });
      // Guard: under React StrictMode's double-invoke (and before fonts settle)
      // split.lines can momentarily be empty; gsap.from([]) logs "target null".
      if (!split.lines.length) return () => split.revert();
      gsap.from(split.lines, {
        yPercent: 110,
        opacity: 0,
        duration: 0.9,
        ease: "power4.out",
        stagger: 0.12,
        scrollTrigger: { trigger: rootRef.current, start: "top 70%" },
      });
      return () => split.revert();
    }, rootRef);
    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      className="dark relative overflow-hidden bg-ink-900 py-28 text-cream-50 sm:py-40"
    >
      <div className="absolute inset-0 z-0 opacity-60">
        <WatchField intensity={0.6} />
      </div>

      {/* RESOLVE — the hero's perception stack returns, arriving exploded and
          COLLAPSING back into a single watched frame as the close centres, so
          the page ends on the gesture it opened with. Behind the copy, faint. */}
      <PerceptionStack
        variant="close"
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] hidden h-[78vh] w-[78vw] -translate-x-1/2 -translate-y-1/2 opacity-[0.45] sm:block"
      />
      {/* centre scrim keeps the headline legible over the stack */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[2]"
        style={{ background: "radial-gradient(60% 55% at 50% 48%, hsl(var(--ink-900)/0.82), transparent 80%)" }}
      />

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-clay-400/50 to-transparent" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="t-eyebrow mb-6 !text-steel-300">Start the conversation</p>

          <h2
            ref={headRef}
            className="font-display font-semibold tracking-[-0.035em] text-cream-50"
            style={{ fontSize: "clamp(2.75rem, 8vw, 7rem)", lineHeight: 0.98 }}
          >
            Your cameras already
            <br className="hidden sm:block" /> see everything. Now they can{" "}
            <span className="whitespace-nowrap text-clay-400">
              answer
              <span
                aria-hidden="true"
                className="relative ms-1.5 inline-flex h-[0.13em] w-[0.13em] translate-y-[-0.1em] align-middle"
              >
                {!reduced && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
                )}
                <span className="relative inline-flex h-full w-full rounded-full bg-clay-400" />
              </span>
            </span>
          </h2>

          <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-steel-200">
            Bring one question and the cameras you already own. We’ll show you the
            answer on your own footage — on-prem, in a live session.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact/"
              className="btn-tactile inline-flex items-center gap-2 rounded-full bg-clay-400 px-8 py-4 text-base font-medium text-ink-900 hover:bg-clay-300"
            >
              Request a live demo
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              href="/use-cases/manufacturing/"
              className="nav-underline inline-flex items-center gap-2 px-2 py-2 text-base font-medium text-steel-200 hover:text-cream-50"
            >
              Explore by industry
            </Link>
          </div>

          <p className="t-caption mt-12 !text-steel-300">
            Built in the UAE · ADGM · deployed across the GCC
          </p>
        </div>
      </div>
    </section>
  );
}
