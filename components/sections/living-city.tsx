"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { useCanRender3D, usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

const CityCanvas = dynamic(
  () => import("@/components/three/city/CityCanvas").then((m) => m.CityCanvas),
  { ssr: false },
);

interface LivingCityProps {
  language: "en" | "ar";
}

interface Beat {
  eyebrow: string;
  title: string;
  body: string;
}

const BEATS: Record<"en" | "ar", Beat[]> = {
  en: [
    {
      eyebrow: "The Physical World",
      title: "Your cameras already see everything.",
      body: "Thousands of feeds across your sites — watched a fraction of the time. The signal is already there. It just isn't intelligence yet.",
    },
    {
      eyebrow: "Edge AI",
      title: "Intelligence moves to the edge.",
      body: "Triya's edge box plugs into the cameras you already own. Everything is processed on-premise — your data never leaves your site.",
    },
    {
      eyebrow: "In Your Language",
      title: "Just ask.",
      body: "“Show me every delivery truck at gate 3 today.” Triya answers in 30+ languages, Arabic included — and shows you the exact frames.",
    },
    {
      eyebrow: "One Clear Picture",
      title: "From cameras to command.",
      body: "Alerts, search and analytics in one command center — built on the cameras you already own.",
    },
  ],
  ar: [
    {
      eyebrow: "العالم المادي",
      title: "كاميراتك ترى كل شيء بالفعل.",
      body: "آلاف البثوث عبر مواقعك تُشاهد جزءًا يسيرًا من الوقت. الإشارة موجودة بالفعل — لكنها ليست ذكاءً بعد.",
    },
    {
      eyebrow: "الذكاء الطرفي",
      title: "الذكاء ينتقل إلى الطرف.",
      body: "صندوق تريا الطرفي يتصل بالكاميرات التي تملكها بالفعل. تتم المعالجة محليًا بالكامل — بياناتك لا تغادر موقعك أبدًا.",
    },
    {
      eyebrow: "بلغتك",
      title: "فقط اسأل.",
      body: "«أرني كل شاحنات التوصيل عند البوابة ٣ اليوم.» تجيب تريا بأكثر من ٣٠ لغة وفي مقدمتها العربية — وتعرض لك اللقطات نفسها.",
    },
    {
      eyebrow: "صورة واحدة واضحة",
      title: "من الكاميرات إلى القيادة.",
      body: "تنبيهات وبحث وتحليلات في مركز قيادة واحد — مبني على الكاميرات التي تملكها بالفعل.",
    },
  ],
};

/**
 * The Living City — the analog.io-style centerpiece. A pinned, scroll-scrubbed
 * journey through a procedural clay city (see CityScene) with four text beats
 * crossfading at the start edge of the viewport.
 *
 * Fallback: without WebGL / with reduced motion, the four beats render as a
 * clean stacked editorial section (content is never hostage to the 3D).
 */
export function LivingCity({ language }: LivingCityProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const productCardRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const entryRef = useRef(0);
  const canRender3D = useCanRender3D();
  const reduced = usePrefersReducedMotion();
  const beats = BEATS[language];

  useIsomorphicLayoutEffect(() => {
    if (!canRender3D || reduced || !rootRef.current) return;
    registerGsap();

    const ctx = gsap.context(() => {
      // hidden start state for every beat
      beatRefs.current.forEach((el) => {
        if (el) gsap.set(el, { opacity: 0, y: 36 });
      });

      // ENTRY (pre-pin): as the section slides in under the hero, the city
      // "develops out of paper" — entryRef drives the fog veil in CityScene,
      // and the canvas settles from a gentle over-scale.
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top bottom",
        end: "top top",
        scrub: true,
        onUpdate: (self) => {
          entryRef.current = self.progress;
        },
      });
      gsap.fromTo(
        canvasWrapRef.current,
        { scale: 1.05 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        },
      );

      // ONE master timeline (duration normalized to 1) drives the pin, the
      // 3D camera (progressRef) and all four text beats — positions below are
      // absolute fractions of the 450% runway. The final 10% is the EXIT:
      // paper swallows the city, the constellation remains.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "+=450%",
          pin: stageRef.current,
          scrub: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });

      const q = 1 / beats.length;
      beatRefs.current.forEach((el, i) => {
        if (!el) return;
        const a = i * q;
        // SNAPPY ramps (≤10% of a beat) — a user can park the scroll at any
        // position, so beats must be fully-on or fully-off, never half-faded
        // and illegible over the city.
        tl.to(el, { opacity: 1, y: 0, duration: q * 0.1 }, a + q * 0.06);
        // the last beat stays visible through the exit — it anchors the
        // closing constellation image ("From cameras to command.")
        if (i < beats.length - 1) {
          tl.to(el, { opacity: 0, y: -28, duration: q * 0.1 }, a + q * 0.84);
        }
      });
      // beat-3 product card: the REAL Triya chat answering — rides the same
      // timeline window as the query beat
      if (productCardRef.current) {
        gsap.set(productCardRef.current, { opacity: 0, y: 48, rotate: 1.5 });
        tl.to(
          productCardRef.current,
          { opacity: 1, y: 0, rotate: 0, duration: 0.035 },
          0.56,
        ).to(
          productCardRef.current,
          { opacity: 0, y: -36, duration: 0.03 },
          0.71,
        );
      }

      tl.set({}, {}, 1); // sentinel: lock total duration to exactly 1

      return () => tl.scrollTrigger?.kill();
    }, rootRef);

    return () => ctx.revert();
  }, [canRender3D, reduced, language, beats.length]);

  /* ---------- fallback: stacked editorial beats, no 3D ---------- */
  if (!canRender3D || reduced) {
    return (
      <section className="bg-cream-100 py-24">
        <div className="container space-y-20">
          {beats.map((b, i) => (
            <div key={i} className="max-w-2xl">
              <p className="t-eyebrow mb-3">{b.eyebrow}</p>
              <h2 className="t-display-2 mb-4">{b.title}</h2>
              <p className="t-lead">{b.body}</p>
              {i === 2 && (
                <div className="mt-8 overflow-hidden rounded-xl border border-ink-900/15 shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/product/triya-ai-chat.png"
                    alt={
                      language === "ar"
                        ? "مساعد تريا يجيب عن سؤال حول الكاميرات"
                        : "The Triya assistant answering a question about cameras"
                    }
                    className="block w-full"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    // -mb-[100vh]: the content AFTER this section slides up OVER the pinned
    // city during its final viewport of scroll (analog.io cover pattern) —
    // the city is hidden behind the page, never faded out
    <div ref={rootRef} data-section="living-city" className="relative -mb-[100vh]">
      {/* stage bg matches the scene's paper color so whiteout frames are
          seam-free against the page */}
      <div
        ref={stageRef}
        className="relative h-screen w-full overflow-hidden bg-cream-50"
      >
        {/* 3D city (wrapper carries the entry settle-scale) */}
        <div ref={canvasWrapRef} className="absolute inset-0">
          <CityCanvas progressRef={progressRef} entryRef={entryRef} />
        </div>

        {/* top feather only — the bottom edge is covered by the next section
            sliding over the city (no seam to hide) */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24 bg-gradient-to-b from-cream-50 to-transparent" />

        {/* beat-3 product proof: the real Triya assistant answering */}
        <div
          ref={productCardRef}
          className="pointer-events-none absolute top-1/2 end-8 z-10 hidden w-[460px] -translate-y-1/2 opacity-0 lg:block xl:end-16 xl:w-[520px]"
          aria-hidden="true"
        >
          <div className="overflow-hidden rounded-xl border border-ink-900/15 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/product/triya-ai-chat.png"
              alt=""
              className="block w-full"
            />
          </div>
          <p className="t-caption mt-3 text-center">
            {language === "ar" ? "تريا — المساعد الفعلي" : "Triya — the actual assistant"}
          </p>
        </div>

        {/* text beats — anchored to the start edge like analog.io */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center">
          <div className="container">
            <div className="relative max-w-xl">
              {beats.map((b, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    beatRefs.current[i] = el;
                  }}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0"
                >
                  {/* solid paper scrim so copy stays legible over the city */}
                  <div className="-m-8 rounded-3xl bg-gradient-to-r from-cream-50/[0.97] via-cream-50/90 to-cream-50/40 rtl:bg-gradient-to-l p-8">
                    <p className="t-eyebrow mb-3">{b.eyebrow}</p>
                    <h2 className="t-display-2 mb-4 text-ink-900">{b.title}</h2>
                    <p className="t-lead">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* (scroll runway comes from GSAP pin spacing — no manual spacer) */}
    </div>
  );
}
