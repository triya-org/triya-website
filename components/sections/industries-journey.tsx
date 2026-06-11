"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { useCanRender3D, usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { UseCases } from "@/components/sections/use-cases";
import { FRACTIONS } from "@/components/three/journey/JourneyScene";

const JourneyCanvas = dynamic(
  () => import("@/components/three/journey/JourneyCanvas").then((m) => m.JourneyCanvas),
  { ssr: false },
);

interface IndustriesJourneyProps {
  language: "en" | "ar";
}

/* copy: one source of truth with use-cases.tsx (same industries + slugs) */
const PARKS: Record<"en" | "ar", { eyebrow: string; title: string; body: string; bullets: string[]; slug: string }[]> = {
  en: [
    {
      eyebrow: "01 / Manufacturing",
      title: "Manufacturing",
      body: "Monitor production lines, ensure worker safety, and prevent equipment theft with 24/7 AI surveillance.",
      bullets: ["Safety compliance monitoring", "Theft prevention"],
      slug: "manufacturing",
    },
    {
      eyebrow: "02 / Retail",
      title: "Retail",
      body: "Enhance customer experience, prevent shoplifting, and optimize store operations with intelligent monitoring.",
      bullets: ["Loss prevention", "Queue management"],
      slug: "retail",
    },
    {
      eyebrow: "03 / Smart Cities",
      title: "Smart Cities",
      body: "Create safer urban environments with traffic monitoring, crowd management, and incident detection.",
      bullets: ["Traffic analysis", "Incident response"],
      slug: "smart-cities",
    },
    {
      eyebrow: "04 / Events",
      title: "Event Management",
      body: "Ensure attendee safety, optimize crowd flow, and enhance event experiences with intelligent surveillance.",
      bullets: ["Real-time queue analytics", "VIP corridor protection"],
      slug: "events",
    },
  ],
  ar: [
    {
      eyebrow: "٠١ / التصنيع",
      title: "التصنيع",
      body: "راقب خطوط الإنتاج، واضمن سلامة العمال، وامنع سرقة المعدات بمراقبة ذكية على مدار الساعة.",
      bullets: ["مراقبة الامتثال للسلامة", "منع السرقة"],
      slug: "manufacturing",
    },
    {
      eyebrow: "٠٢ / التجزئة",
      title: "التجزئة",
      body: "حسّن تجربة العملاء، وامنع السرقة، وحسّن عمليات المتجر بالمراقبة الذكية.",
      bullets: ["منع الخسائر", "إدارة الطوابير"],
      slug: "retail",
    },
    {
      eyebrow: "٠٣ / المدن الذكية",
      title: "المدن الذكية",
      body: "بيئات حضرية أكثر أمانًا مع مراقبة المرور وإدارة الحشود وكشف الحوادث.",
      bullets: ["تحليل المرور", "الاستجابة للحوادث"],
      slug: "smart-cities",
    },
    {
      eyebrow: "٠٤ / الفعاليات",
      title: "إدارة الفعاليات",
      body: "سلامة الحضور، وتدفق الحشود، وتجارب فعاليات أفضل بمراقبة ذكية.",
      bullets: ["تحليلات الطوابير الفورية", "حماية ممر كبار الشخصيات"],
      slug: "events",
    },
  ],
};

const CRUMBS: Record<"en" | "ar", string[]> = {
  en: ["02 / Retail →", "03 / Smart Cities →", "04 / Events →"],
  ar: ["٠٢ / التجزئة ←", "٠٣ / المدن الذكية ←", "٠٤ / الفعاليات ←"],
};

/**
 * The Industries Journey — "The Turntable". One clay maquette re-dresses
 * itself through the four industries as the user scrolls (600% pin).
 * Mobile / reduced-motion / no-WebGL renders the classic <UseCases> cards.
 */
export function IndustriesJourney({ language }: IndustriesJourneyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const parkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const crumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const entryRef = useRef(0);
  const coveredRef = useRef(false);
  const canRender3D = useCanRender3D();
  const reduced = usePrefersReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const parks = PARKS[language];
  const crumbs = CRUMBS[language];

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 767px)").matches);
  }, []);

  const use3D = canRender3D && !reduced && !isMobile;

  useIsomorphicLayoutEffect(() => {
    if (!use3D || !rootRef.current) return;
    registerGsap();

    const ctx = gsap.context(() => {
      parkRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0, y: 36 }));
      crumbRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));

      // pre-pin entry: maquette develops out of paper as the section slides in
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top bottom",
        end: "top top",
        scrub: true,
        onUpdate: (self) => {
          entryRef.current = self.progress;
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: "+=600%",
          pin: stageRef.current,
          scrub: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
          onToggle: (self) => {
            coveredRef.current = !self.isActive;
          },
        },
      });

      // park scrims: in/out hard-snapped to park windows (park-anywhere safe)
      FRACTIONS.parks.forEach(([a, b], i) => {
        const el = parkRefs.current[i];
        if (!el) return;
        tl.to(el, { opacity: 1, y: 0, duration: 0.012 }, a + 0.009);
        if (i < 3) tl.to(el, { opacity: 0, y: -26, duration: 0.012 }, b - 0.027);
        // scrim 4 holds through exit
      });
      // turn breadcrumbs
      FRACTIONS.turns.forEach(([a, b], i) => {
        const el = crumbRefs.current[i];
        if (!el) return;
        tl.to(el, { opacity: 1, duration: 0.01 }, a + 0.01);
        tl.to(el, { opacity: 0, duration: 0.01 }, b - 0.02);
      });
      tl.set({}, {}, 1); // sentinel: lock duration to exactly 1

      return () => tl.scrollTrigger?.kill();
    }, rootRef);

    return () => ctx.revert();
  }, [use3D, language]);

  /* ---------- fallback: the classic cards, byte-for-byte ---------- */
  if (!use3D) {
    return <UseCases language={language} />;
  }

  return (
    // -mb-[100vh]: the CTA section slides OVER the pinned stage at the end
    // (the house analog.io cover exit)
    <div ref={rootRef} data-section="industries-journey" className="relative -mb-[100vh]">
      <div ref={stageRef} className="relative h-screen w-full overflow-hidden bg-cream-50">
        <div className="absolute inset-0">
          <JourneyCanvas
            progressRef={progressRef}
            entryRef={entryRef}
            coveredRef={coveredRef}
            dir={language === "ar" ? -1 : 1}
          />
        </div>

        {/* top feather into the page */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-24 bg-gradient-to-b from-cream-50 to-transparent" />

        {/* park scrims — left column, paper gradient, snappy ramps */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center">
          <div className="container">
            <div className="relative max-w-xl">
              {parks.map((park, i) => (
                <div
                  key={park.slug}
                  ref={(el) => {
                    parkRefs.current[i] = el;
                  }}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0"
                >
                  <div className="-m-8 rounded-3xl bg-gradient-to-r from-cream-50/[0.97] via-cream-50/90 to-cream-50/40 p-8 rtl:bg-gradient-to-l">
                    <p className="t-eyebrow mb-3">{park.eyebrow}</p>
                    <h2 className="t-display-2 mb-4 text-ink-900">{park.title}</h2>
                    <p className="t-lead mb-4">{park.body}</p>
                    <ul className="mb-5 space-y-1.5">
                      {park.bullets.map((b) => (
                        <li key={b} className="flex items-center text-sm text-ink-500">
                          <span className="me-2 inline-block h-1.5 w-1.5 rounded-full bg-clay-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={`/use-cases/${park.slug}/`}
                      className="pointer-events-auto inline-flex items-center gap-2 text-sm font-medium text-clay-600 hover:text-clay-500"
                    >
                      {language === "ar" ? "اعرف المزيد" : "Learn more"}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* turn breadcrumbs */}
              {crumbs.map((c, i) => (
                <div
                  key={c}
                  ref={(el) => {
                    crumbRefs.current[i] = el;
                  }}
                  className="t-eyebrow absolute -top-40 start-0 text-ink-500 opacity-0"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* (runway provided by GSAP pin spacing) */}
    </div>
  );
}
