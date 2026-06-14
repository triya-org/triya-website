"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { useCanRender3D, usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";
import { UseCases } from "@/components/sections/use-cases";
import { FRACTIONS, PIN_LENGTH } from "@/components/three/city/fractions";

const CityCanvas = dynamic(
  () => import("@/components/three/city/CityCanvas").then((m) => m.CityCanvas),
  { ssr: false },
);

// English-only (site went English-only on main — bilingual UI removed)

interface Beat {
  eyebrow: string;
  title: string;
  body: string;
}

/* product-story beats (the original living-city deck — prologue, edge
   caption, the chat card and the finale all draw from this record) */
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

/* the one-line edge caption riding Transit 1's close hub pass (spec §5.2 —
   "the most commercially load-bearing line on the page", non-negotiable) */
const EDGE_CAPTION: Record<"en" | "ar", { eyebrow: string; line: string }> = {
  en: {
    eyebrow: "Edge AI",
    line: "Intelligence moves to the edge — your data never leaves your site.",
  },
  ar: {
    eyebrow: "الذكاء الطرفي",
    line: "الذكاء ينتقل إلى الطرف — بياناتك لا تغادر موقعك أبدًا.",
  },
};

/* industry park scrims — ported VERBATIM from the retired journey section
   (one source of truth with use-cases.tsx: same industries + slugs) */
const PARKS: Record<
  "en" | "ar",
  { eyebrow: string; title: string; body: string; bullets: string[]; slug: string }[]
> = {
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

/* breadcrumbs: the dive's "01" + one per transit */
const CRUMBS: Record<"en" | "ar", string[]> = {
  en: ["01 / Manufacturing →", "02 / Retail →", "03 / Smart Cities →", "04 / Events →"],
  ar: ["٠١ / التصنيع ←", "٠٢ / التجزئة ←", "٠٣ / المدن الذكية ←", "٠٤ / الفعاليات ←"],
};

/**
 * The Living City — ONE unified world (spec /tmp/unified-city-spec.md).
 * The city below the hero now carries all four industries: a single 800%
 * pinned camera journey — gaze → dive → Manufacturing → Retail → Smart
 * Cities → Events → closed-loop finale — replacing both the old 450% city
 * section and the retired Turntable journey. ONE canvas on the page.
 *
 * Fallback (mobile / reduced-motion / no-WebGL): BOTH content decks —
 * the four product beats AND the classic UseCases cards (spec §5.4).
 */
export function LivingCity() {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const productCardRef = useRef<HTMLDivElement>(null);
  const prologueRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const finaleRef = useRef<HTMLDivElement>(null);
  const parkRefs = useRef<(HTMLDivElement | null)[]>([]);
  const crumbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const progressRef = useRef(0);
  const entryRef = useRef(0);
  const coveredRef = useRef(false);
  const canRender3D = useCanRender3D();
  const reduced = usePrefersReducedMotion();
  const beats = BEATS.en;
  const parks = PARKS.en;
  const crumbs = CRUMBS.en;
  const caption = EDGE_CAPTION.en;

  // pause the 3D render loop ONLY when the section's whole scroll range is
  // off-screen — keeps the canvas rendering through the entry/exit develop
  // (fixes the "plain cream section when scrolling up to hero" freeze)
  useEffect(() => {
    if (!canRender3D || reduced || !rootRef.current) return;
    const el = rootRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        coveredRef.current = !entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canRender3D, reduced]);

  useIsomorphicLayoutEffect(() => {
    if (!canRender3D || reduced || !rootRef.current) return;
    registerGsap();

    const ctx = gsap.context(() => {
      const hidden = (el: HTMLElement | null, y = 36) =>
        el && gsap.set(el, { opacity: 0, y });
      hidden(prologueRef.current);
      hidden(captionRef.current, 20);
      hidden(finaleRef.current);
      parkRefs.current.forEach((el) => hidden(el));
      crumbRefs.current.forEach((el) => el && gsap.set(el, { opacity: 0 }));
      if (productCardRef.current)
        gsap.set(productCardRef.current, { opacity: 0, y: 48, rotate: 1.5 });

      // ENTRY (pre-pin): unchanged contract — the city develops out of
      // paper as the section slides in under the hero (fog veil + bloom
      // + camera pre-roll all ride entryRef)
      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top bottom",
        end: "top top",
        scrub: true,
        onUpdate: (self) => {
          entryRef.current = self.progress;
        },
      });

      // ONE master timeline (duration normalized to 1) — the 800% pin
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: rootRef.current,
          start: "top top",
          end: PIN_LENGTH,
          pin: stageRef.current,
          scrub: true,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
          // NOTE: render-loop gating is NOT driven by pin.isActive — the pin
          // is inactive during the visible pre-pin ENTRY zone too, so gating
          // on it froze the canvas mid reverse-develop and showed a flat-cream
          // section when scrolling up to the hero. Visibility is now driven by
          // an IntersectionObserver on rootRef (below).
        },
      });

      /* All ramps are SNAPPY (≤1.5% of the pin): a user can park anywhere,
         so copy must be fully-on or fully-off, never half-faded. */

      // prologue — rides the gaze beat at god view; OUT completes before the
      // dive boundary (0.05) so the dive starts copy-clean and no 5%-grid
      // park ever catches it mid-fade (panel finding)
      if (prologueRef.current) {
        tl.to(prologueRef.current, { opacity: 1, y: 0, duration: 0.008 }, 0.002);
        tl.to(prologueRef.current, { opacity: 0, y: -26, duration: 0.012 }, 0.034);
      }

      // dive crumb "01 / Manufacturing →"
      if (crumbRefs.current[0]) {
        tl.to(crumbRefs.current[0], { opacity: 1, duration: 0.008 }, 0.115);
        tl.to(crumbRefs.current[0], { opacity: 0, duration: 0.008 }, 0.135);
      }

      // four industry parks — ramps tucked hard against the window edges so
      // the natural park points (hold settles, 5% grid) are always fully-on
      FRACTIONS.parks.forEach(([a, b], i) => {
        const el = parkRefs.current[i];
        if (!el) return;
        tl.to(el, { opacity: 1, y: 0, duration: 0.008 }, a + 0.002);
        // out band [b-0.042, b-0.032]: clears EVERY 5% grid point (0.65 and
        // 0.85 sat inside the previous [b-0.036, b-0.024] band)
        tl.to(el, { opacity: 0, y: -26, duration: 0.01 }, b - 0.042);
      });

      // transit crumbs (02/03/04)
      FRACTIONS.transits.forEach(([a, b], i) => {
        const el = crumbRefs.current[i + 1];
        if (!el) return;
        tl.to(el, { opacity: 1, duration: 0.008 }, a + 0.008);
        tl.to(el, { opacity: 0, duration: 0.008 }, b - 0.016);
      });

      // T1 edge caption at the close hub pass (non-negotiable line)
      if (captionRef.current) {
        tl.to(captionRef.current, { opacity: 1, y: 0, duration: 0.01 }, 0.292);
        tl.to(captionRef.current, { opacity: 0, y: -16, duration: 0.01 }, 0.325);
      }

      // SC park extra: the REAL chat card answering in-frame (spec §5.2)
      if (productCardRef.current) {
        tl.to(
          productCardRef.current,
          { opacity: 1, y: 0, rotate: 0, duration: 0.012 },
          0.575,
        ).to(productCardRef.current, { opacity: 0, y: -36, duration: 0.012 }, 0.665);
      }

      // finale — in at 0.895 and HOLDS through the cover (never bows out)
      if (finaleRef.current) {
        tl.to(finaleRef.current, { opacity: 1, y: 0, duration: 0.012 }, 0.895);
      }

      tl.set({}, {}, 1); // sentinel: lock total duration to exactly 1

      return () => tl.scrollTrigger?.kill();
    }, rootRef);

    return () => ctx.revert();
  }, [canRender3D, reduced]);

  /* ---------- fallback: BOTH content decks, no 3D (spec §5.4) ---------- */
  if (!canRender3D || reduced) {
    return (
      <>
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
                      alt="The Triya assistant answering a question about cameras"
                      className="block w-full"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
        <UseCases />
      </>
    );
  }

  return (
    // -mb-[100vh]: the sheet after this section slides up OVER the pinned
    // city during its final viewport of scroll (analog.io cover pattern) —
    // the finale frame is covered mid-breath, alive, never faded
    <div ref={rootRef} data-section="living-city" className="relative -mb-[100vh]">
      <div
        ref={stageRef}
        className="relative h-screen w-full overflow-hidden bg-cream-50"
      >
        {/* THE city — one canvas on the page, carrying all four industries */}
        <div className="absolute inset-0">
          <CityCanvas
            progressRef={progressRef}
            entryRef={entryRef}
            coveredRef={coveredRef}
            dir={1}
          />
        </div>

        {/* top feather REMOVED (r3): it stacked on the hero's own bottom-0
            to-cream-50 gradient + the city entry fog veil, producing a fat
            ~150–200px milky band across the hero→city handoff. The hero
            gradient + a higher veil floor cover the seam without it. */}

        {/* SC park proof: the real Triya assistant answering, question and
            in-world result pins in the SAME frame (the CFO screenshot) */}
        <div
          ref={productCardRef}
          className="pointer-events-none absolute top-1/2 end-8 z-10 hidden w-[520px] -translate-y-1/2 opacity-0 lg:block xl:end-16 xl:w-[580px]"
          aria-hidden="true"
        >
          {/* r3: enlarged (460→520/520→580) + a solid cream backing panel so
              the chat body copy is legible at 1:1 and does not read as a small
              dark card competing with the bright neon tower behind it */}
          <div className="overflow-hidden rounded-2xl bg-cream-50 p-2 shadow-xl ring-1 ring-ink-900/15">
            {/* slight desaturation quiets the product UI's blue next to the
                clay detection ring — the screenshot stays authentic */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/product/triya-ai-chat.png"
              alt=""
              className="block w-full rounded-xl saturate-[0.82]"
            />
          </div>
          {/* r3: caption given the same legibility pill as the breadcrumbs —
              it sat as light text over the dark night city (low-contrast seam) */}
          <p className="mt-3 text-center">
            <span className="t-caption inline-block rounded-full bg-cream-50/90 px-4 py-1.5 text-ink-700 shadow-sm">
              Triya — the actual assistant
            </span>
          </p>
        </div>

        {/* copy column — prologue, parks, finale share the start-edge slot */}
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center">
          <div className="container">
            <div className="relative max-w-xl">
              {/* prologue (gaze) */}
              <div
                ref={prologueRef}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0"
              >
                <div className="-m-8 rounded-3xl bg-gradient-to-r from-cream-50/[0.97] via-cream-50/90 to-cream-50/40 p-8 rtl:bg-gradient-to-l">
                  <p className="t-eyebrow mb-3">{beats[0].eyebrow}</p>
                  <h2 className="t-display-2 mb-4 text-ink-900">{beats[0].title}</h2>
                  <p className="t-lead">{beats[0].body}</p>
                </div>
              </div>

              {/* industry parks */}
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
                      Learn more
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}

              {/* finale — holds while the cover slides over the lit city */}
              <div
                ref={finaleRef}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 opacity-0"
              >
                <div className="-m-8 rounded-3xl bg-gradient-to-r from-cream-50/[0.97] via-cream-50/90 to-cream-50/40 p-8 rtl:bg-gradient-to-l">
                  <p className="t-eyebrow mb-3">{beats[3].eyebrow}</p>
                  <h2 className="t-display-2 mb-4 text-ink-900">{beats[3].title}</h2>
                  <p className="t-lead">{beats[3].body}</p>
                </div>
              </div>

              {/* breadcrumbs (dive + transits) */}
              {crumbs.map((c, i) => (
                <div
                  key={c}
                  ref={(el) => {
                    crumbRefs.current[i] = el;
                  }}
                  className="absolute -top-40 start-0 opacity-0"
                >
                  {/* pill backing: bare eyebrows vanished against pale roads
                      and dusk facades (panel finding) */}
                  <span className="t-eyebrow inline-block rounded-full bg-cream-50/90 px-4 py-2 text-ink-700 shadow-sm">
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* T1 edge caption — one line at the close hub pass */}
        <div
          ref={captionRef}
          className="pointer-events-none absolute inset-x-0 bottom-16 z-10 flex justify-center opacity-0"
        >
          <div className="rounded-full bg-cream-50/90 px-6 py-3 shadow-sm">
            <p className="text-sm text-ink-700">
              <span className="t-eyebrow me-3 text-clay-600">{caption.eyebrow}</span>
              {caption.line}
            </p>
          </div>
        </div>
      </div>
      {/* (scroll runway comes from GSAP pin spacing — no manual spacer) */}
    </div>
  );
}
