"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Play } from "lucide-react";
import { HeroFabric } from "@/components/three/HeroFabric";
import { gsap, SplitText, registerGsap } from "@/lib/gsap";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

interface HeroContent {
  eyebrow: string;
  title: string;
  titleHighlight: string;
  subtitle: string;
  cta1: string;
  cta2: string;
}

interface CinematicHeroProps {
  language: "en" | "ar";
  content: HeroContent;
  videoLoaded: boolean;
  onCta?: () => void;
  onWatchVideo?: () => void;
}

/**
 * Editorial cinematic hero (analog.io-style): full-bleed video, giant
 * General Sans display headline anchored bottom-start, mono eyebrow, clay
 * accent, Watch-Video pill anchored bottom-end. GSAP orchestrated entrance
 * (SplitText kinetic headline) + scroll-scrubbed parallax exit.
 *
 * i18n/a11y: Arabic reveals word-by-word (char-splitting breaks joining);
 * logical properties (text-start / inset-inline) keep RTL mirrored;
 * prefers-reduced-motion renders everything static.
 */
export function CinematicHero({
  language,
  content,
  videoLoaded,
  onCta,
  onWatchVideo,
}: CinematicHeroProps) {
  const rootRef = useRef<HTMLElement>(null);
  const eyebrowRef = useRef<HTMLParagraphElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const lensRef = useRef<HTMLSpanElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const watchRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fabricRef = useRef<HTMLDivElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    if (reduced || !titleRef.current) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const isArabic = language === "ar";
      // Only the plain title is char-split (gradient/clay highlight animates
      // as a block; Arabic always word-level).
      const split = new SplitText(titleRef.current, {
        type: isArabic ? "words" : "words,chars",
      });
      const titleTargets = isArabic ? split.words : split.chars;

      // If the first-visit preloader is running, hold the entrance and play
      // it the moment the curtain starts lifting (triya:intro-done) — the
      // signature char-drop must never finish hidden under the curtain.
      const introActive =
        typeof window !== "undefined" && window.__triyaIntroActive;
      const tl = gsap.timeline({
        defaults: { ease: "power4.out" },
        delay: introActive ? 0 : 0.15,
        paused: !!introActive,
      });
      if (introActive) {
        const play = () => tl.play(0.0);
        window.addEventListener("triya:intro-done", play, { once: true });
      }

      tl.from(eyebrowRef.current, { y: 18, opacity: 0, duration: 0.5 })
        // gsap.com-style per-char drop: scrambled order, playful overshoot,
        // a touch of per-char rotation (editorial dose, not chaos)
        .from(
          titleTargets,
          {
            yPercent: 130,
            opacity: 0,
            rotation: isArabic ? 0 : () => gsap.utils.random(-10, 10),
            duration: 0.7,
            ease: "back.out(1.5)",
            stagger: isArabic ? 0.07 : { each: 0.04, from: "random" as const },
          },
          "-=0.25",
        )
        .from(
          highlightRef.current,
          { yPercent: 90, opacity: 0, duration: 0.8, ease: "back.out(1.3)" },
          "-=0.45",
        )
        // the recording light: drops in (same easing family as the chars —
        // bounce.out was the one cartoon ease in a calm-premium phrase)
        .from(
          lensRef.current,
          { y: -56, opacity: 0, duration: 0.55, ease: "back.out(2.4)" },
          "-=0.3",
        )
        .from(subRef.current, { y: 24, opacity: 0, duration: 0.7 }, "-=0.45")
        .from(
          ctaRef.current,
          { y: 20, opacity: 0, scale: 0.97, duration: 0.6 },
          "-=0.4",
        )
        .from(watchRef.current, { opacity: 0, scale: 0.9, duration: 0.5 }, "-=0.35")
        .from(cueRef.current, { opacity: 0, y: -8, duration: 0.6 }, "-=0.2");

      gsap.to(cueRef.current, {
        y: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: 1.2,
      });

      // recording-light idle pulse — slow and quiet (it lives next to
      // display type forever; notification-badge amplitude would grate)
      gsap.to(lensRef.current, {
        scale: 1.08,
        opacity: 0.85,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        duration: 1.7,
        delay: 2.6,
      });

      // Scroll-scrubbed exit: content fades out COMPLETELY within the first
      // 45% of the leave so the headline never collides with the navbar.
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
      gsap.to(fabricRef.current, {
        yPercent: 10,
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
  }, [language, reduced]);

  return (
    <section
      ref={rootRef}
      className="relative min-h-[100dvh] flex items-end overflow-hidden"
    >
      {/* Video background */}
      <div className="absolute inset-0 z-0">
        {videoLoaded && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            poster="/video-poster.jpg"
            aria-label="Triya AI surveillance platform in action - showcasing real-time video analytics and edge AI security monitoring"
          >
            <source src="/videos/hero_1.mp4" type="video/mp4" />
          </video>
        )}
        {/* Warm ink gradient, heavier at the base where the type sits */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/40 to-ink-900/25" />
      </div>

      {/* Living Fabric — clay point cloud (progressive enhancement) */}
      <div ref={fabricRef} className="absolute inset-0 z-[1]">
        <HeroFabric />
      </div>

      {/* Content — editorial: anchored to the bottom-start like analog.io */}
      <div
        ref={contentRef}
        className="container relative z-10 mx-auto px-4 sm:px-6 pb-24 sm:pb-28"
      >
        <div className="max-w-5xl text-start">
          <p ref={eyebrowRef} className="t-eyebrow mb-5 !text-clay-300">
            {content.eyebrow}
          </p>

          <h1
            data-animated-hero
            className="t-display-1 mb-6 text-cream-50"
            style={{ perspective: "800px" }}
          >
            <span ref={titleRef} className="inline-block">
              {content.title}
            </span>{" "}
            <span ref={highlightRef} className="inline-block text-clay-400">
              {content.titleHighlight.replace(/[.。]\s*$/, "")}
            </span>
            {/* the recording light — stands in for the full stop */}
            <span
              ref={lensRef}
              className="ms-3 inline-block h-[0.16em] w-[0.16em] rounded-full bg-clay-400 align-baseline"
            />
          </h1>

          {content.subtitle && (
            <p
              ref={subRef}
              className="mb-8 max-w-xl text-lg sm:text-xl leading-relaxed text-cream-200"
            >
              {content.subtitle}
            </p>
          )}

          <div ref={ctaRef} className="flex items-center gap-4">
            <Link
              href="/contact/"
              onClick={onCta}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground transition-colors hover:bg-clay-500"
            >
              {content.cta1} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* Watch Video pill — bottom-end, analog.io style */}
      <div
        ref={watchRef}
        className="absolute bottom-24 end-6 sm:end-10 z-10 hidden sm:block"
      >
        <button
          onClick={onWatchVideo}
          className="inline-flex items-center gap-2 rounded-full border border-cream-50/30 bg-cream-50/10 px-6 py-3 text-sm font-medium text-cream-50 backdrop-blur-sm transition-colors hover:bg-cream-50/20"
        >
          <Play className="h-3.5 w-3.5" /> {content.cta2}
        </button>
      </div>

      {/* bottom feather into the page — mirrors the city section's top
          gradient so every hero state (especially dark slides) melts into
          #FAF9F5 instead of hard-cutting at the section boundary */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-24 bg-gradient-to-b from-transparent to-cream-50" />

      {/* Scroll cue */}
      <div
        ref={cueRef}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-cream-50/60"
        aria-hidden="true"
      >
        <ChevronDown className="h-6 w-6" />
      </div>
    </section>
  );
}
