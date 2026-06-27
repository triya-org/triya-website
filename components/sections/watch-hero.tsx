"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Search } from "lucide-react";
import { WatchField } from "@/components/three/watch-field/WatchField";
import { gsap, SplitText, registerGsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { CHANNELS } from "@/components/sections/query-room.data";

interface HeroContent {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  cta1: string;
  cta2: string;
}

/**
 * WatchHero — the dark "Standing Watch" opening. First paint reads cameras +
 * AI + ask in one glance: an ambient feed wall under the living Watch field,
 * a two-tone kinetic headline ("Talk to your cameras."), and the product's own
 * "Ask Triya anything…" command bar, which hands off to the live set-piece.
 *
 * Wow-on-first-paint without blocking LCP: the headline is text, the video is
 * lazy and poster-backed, the field is Canvas2D. Reduced motion → fully static.
 *
 * NOTE: the ambient clip is currently /videos/hero_1.mp4 as a graceful stand-in
 * for the planned Seedance hero loop — drop the new file in at the same path
 * (poster covers any gap) and nothing else changes.
 */
export function WatchHero({
  content,
  videoLoaded,
  onCta,
}: {
  content: HeroContent;
  videoLoaded: boolean;
  onCta?: () => void;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduced = usePrefersReducedMotion();

  // pause the ambient video once the hero scrolls away — honours the page's
  // single-decode contract (the set-piece/deck each decode their own feed)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // pause a touch before the hero fully leaves so the hero clip and the
    // set-piece feed never decode together (single-decode handoff)
    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? v.play().catch(() => {}) : v.pause()),
      { threshold: 0.12 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [videoLoaded]);

  useIsomorphicLayoutEffect(() => {
    if (reduced || !titleRef.current) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const split = new SplitText(titleRef.current, { type: "words,chars" });

      const introActive =
        typeof window !== "undefined" && window.__triyaIntroActive;
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        delay: introActive ? 0 : 0.15,
        paused: !!introActive,
      });
      if (introActive) {
        const play = () => tl.play(0);
        window.addEventListener("triya:intro-done", play, { once: true });
      }

      tl.from(eyebrowRef.current, { y: 18, opacity: 0, duration: 0.5 })
        .from(
          split.chars,
          {
            yPercent: 130,
            opacity: 0,
            rotation: () => gsap.utils.random(-10, 10),
            duration: 0.7,
            ease: "back.out(1.5)",
            stagger: { each: 0.04, from: "random" as const },
          },
          "-=0.25",
        )
        .from(
          highlightRef.current,
          { yPercent: 90, opacity: 0, duration: 0.8, ease: "back.out(1.3)" },
          "-=0.45",
        )
        .from(
          lensRef.current,
          { y: -56, opacity: 0, duration: 0.55, ease: "back.out(2.4)" },
          "-=0.3",
        )
        .from(subRef.current, { y: 24, opacity: 0, duration: 0.7 }, "-=0.45")
        .from(barRef.current, { y: 22, opacity: 0, duration: 0.7 }, "-=0.45")
        .from(
          ctaRef.current,
          { y: 18, opacity: 0, scale: 0.98, duration: 0.55 },
          "-=0.45",
        )
        .from(cueRef.current, { opacity: 0, y: -8, duration: 0.6 }, "-=0.2");

      gsap.to(cueRef.current, {
        y: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: 1.2,
      });
      gsap.to(lensRef.current, {
        scale: 1.08,
        opacity: 0.85,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: 1.7,
        delay: 2.6,
      });

      // scroll-scrubbed exit (drift): content clears within the first 45% so
      // the headline never collides with the navbar; the field parallaxes.
      gsap.to(contentRef.current, {
        yPercent: -10,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "+=45%",
          scrub: true,
        },
      });
      gsap.to(fieldRef.current, {
        yPercent: 12,
        ease: "none",
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      return () => split.revert();
    }, rootRef);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      className="dark relative flex min-h-[100dvh] items-end overflow-hidden bg-ink-900 text-cream-50"
    >
      {/* z0 — ambient feed (Seedance stand-in) + grade */}
      <div className="absolute inset-0 z-0">
        {videoLoaded && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover opacity-70"
            poster="/video-poster.jpg"
            aria-label="Triya AI surveillance platform — live edge analytics across the cameras you already own"
          >
            <source src="/videos/hero_1.mp4" type="video/mp4" />
          </video>
        )}
        {/* warm ink grade, heavier at the base where the type sits */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/70 to-ink-900/55" />
        <div className="absolute inset-0 bg-ink-900/30" />
      </div>

      {/* z1 — the Standing Watch field (signature, Canvas2D) */}
      <div ref={fieldRef} className="absolute inset-0 z-[1]">
        <WatchField intensity={1.05} />
      </div>

      {/* z10 — content, anchored bottom-start (editorial) */}
      <div
        ref={contentRef}
        className="container relative z-10 mx-auto px-4 pb-24 sm:px-6 sm:pb-28"
      >
        <div className="max-w-5xl text-start">
          <p ref={eyebrowRef} className="t-eyebrow mb-5 !text-steel-300">
            {content.eyebrow}
          </p>

          <h1
            data-animated-hero
            className="t-display-1 mb-7 text-cream-50"
            style={{ perspective: "800px" }}
          >
            <span ref={titleRef} className="inline-block">
              {content.title}
            </span>{" "}
            <span ref={highlightRef} className="inline-block text-clay-400">
              {content.titleHighlight.replace(/[.。]\s*$/, "")}
            </span>
            <span
              ref={lensRef}
              className="ms-1.5 inline-block h-[0.16em] w-[0.16em] rounded-full bg-clay-400 align-baseline shadow-[0_0_0.5em_0.05em_hsl(var(--clay-400)/0.7)]"
            />
          </h1>

          {content.subtitle && (
            <p
              ref={subRef}
              className="mb-8 max-w-xl text-lg leading-relaxed text-steel-200 sm:text-xl"
            >
              {content.subtitle}
            </p>
          )}

          {/* the command bar — the product's own surface, as the hero action */}
          <div ref={barRef} className="max-w-xl">
            <CommandBar reduced={reduced} />
          </div>

          <div ref={ctaRef} className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="/contact/"
              onClick={onCta}
              className="btn-tactile inline-flex items-center gap-2 rounded-full bg-clay-400 px-7 py-3.5 text-base font-medium text-ink-900 hover:bg-clay-300"
            >
              {content.cta1} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <a
              href="#talk-to-cameras"
              className="nav-underline inline-flex items-center gap-2 text-base font-medium text-steel-200 hover:text-cream-50"
            >
              See it answer
            </a>
          </div>
        </div>
      </div>

      <div
        ref={cueRef}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-cream-50/55"
        aria-hidden="true"
      >
        <ChevronDown className="h-6 w-6" />
      </div>
    </section>
  );
}

/**
 * The hero command bar — a teaser of the real "Ask Triya anything…" surface.
 * It cycles example queries as a typewriter placeholder; submitting (or the
 * arrow) glides down to the live set-piece, where the question is actually run.
 */
function CommandBar({ reduced }: { reduced: boolean }) {
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState("Ask Triya anything…");
  const [focused, setFocused] = useState(false);

  // cycle the placeholder through real example queries (typewriter)
  useEffect(() => {
    if (reduced || focused || value) {
      setPlaceholder("Ask Triya anything…");
      return;
    }
    let cancelled = false;
    const examples = CHANNELS.map((c) => c.chip);
    let ci = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const sleep = (ms: number) =>
      new Promise<void>((r) => timers.push(setTimeout(r, ms)));

    (async () => {
      // hold the literal prompt first
      await sleep(1400);
      while (!cancelled) {
        const q = examples[ci % examples.length];
        for (let i = 1; i <= q.length; i++) {
          if (cancelled) return;
          setPlaceholder(q.slice(0, i));
          await sleep(34);
        }
        await sleep(1600);
        for (let i = q.length; i >= 0; i--) {
          if (cancelled) return;
          setPlaceholder(q.slice(0, i) || "Ask Triya anything…");
          await sleep(16);
        }
        await sleep(400);
        ci += 1;
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [reduced, focused, value]);

  const go = () => {
    document
      .getElementById("talk-to-cameras")
      ?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
      className="group flex items-center gap-3 rounded-2xl border border-steel-500/60 bg-ink-900/70 px-4 py-3.5 backdrop-blur-md transition-colors focus-within:border-clay-400/70 hover:border-steel-400"
      style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 18px 40px -24px rgba(0,0,0,0.9)" }}
    >
      <Search className="h-5 w-5 shrink-0 text-steel-300" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        aria-label="Ask Triya anything about your cameras"
        className="min-w-0 flex-1 bg-transparent text-base text-cream-50 placeholder:text-steel-200 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Run this question on the live demo below"
        className="btn-tactile inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay-400 text-ink-900 hover:bg-clay-300"
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
      </button>
    </form>
  );
}
