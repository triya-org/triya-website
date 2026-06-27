"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { usePrefersReducedMotion, useCanRender3D } from "@/lib/reduced-motion";
import type { Industry } from "@/components/three/lineart/models";

/**
 * LINE-ART INDUSTRIES — an experimental replacement for the Living City.
 *
 * Four stacked sections (Manufacturing, Retail, Smart Cities, Events), each with
 * a minimalist line-art ("silhouette") 3D model — Scale.com style, re-skinned in
 * Triya's ink-on-cream palette — that assembles from an exploded state on scroll
 * and slowly rotates. Copy is harvested verbatim from living-city.tsx's PARKS.
 *
 * No pinning (the app has stale-pin issues); each canvas is lazy-mounted only
 * when its section nears the viewport and pauses under reduced motion.
 */

const LineArtScene = dynamic(
  () => import("@/components/three/lineart/LineArtScene").then((m) => m.LineArtScene),
  { ssr: false },
);

const LINE_COLOR = "#211F1B"; // warm ink, on the cream ground

interface Ind {
  id: Industry;
  index: string;
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  slug: string;
}

/* copy harvested verbatim from components/sections/living-city.tsx (PARKS.en) */
const INDUSTRIES: Ind[] = [
  {
    id: "manufacturing",
    index: "01",
    eyebrow: "01 / Manufacturing",
    title: "Manufacturing",
    body: "Monitor production lines, ensure worker safety, and prevent equipment theft with 24/7 AI surveillance.",
    bullets: ["Safety compliance monitoring", "Theft prevention"],
    slug: "manufacturing",
  },
  {
    id: "retail",
    index: "02",
    eyebrow: "02 / Retail",
    title: "Retail",
    body: "Enhance customer experience, prevent shoplifting, and optimize store operations with intelligent monitoring.",
    bullets: ["Loss prevention", "Queue management"],
    slug: "retail",
  },
  {
    id: "smart-cities",
    index: "03",
    eyebrow: "03 / Smart Cities",
    title: "Smart Cities",
    body: "Create safer urban environments with traffic monitoring, crowd management, and incident detection.",
    bullets: ["Traffic analysis", "Incident response"],
    slug: "smart-cities",
  },
  {
    id: "events",
    index: "04",
    eyebrow: "04 / Events",
    title: "Event Management",
    body: "Ensure attendee safety, optimize crowd flow, and enhance event experiences with intelligent surveillance.",
    bullets: ["Real-time queue analytics", "VIP corridor protection"],
    slug: "events",
  },
];

export function LineIndustries() {
  return (
    <div className="bg-cream-100">
      {INDUSTRIES.map((ind, i) => (
        <IndustryRow key={ind.id} ind={ind} flip={i % 2 === 1} />
      ))}
    </div>
  );
}

function IndustryRow({ ind, flip }: { ind: Ind; flip: boolean }) {
  const reduced = usePrefersReducedMotion();
  const canRender3D = useCanRender3D();
  const ref = useRef<HTMLElement>(null);
  const [near, setNear] = useState(false); // mount the canvas
  const [inView, setInView] = useState(false); // assemble + animate

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ioNear = new IntersectionObserver(([e]) => setNear(e.isIntersecting), {
      rootMargin: "400px 0px",
    });
    const ioIn = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.3,
    });
    ioNear.observe(el);
    ioIn.observe(el);
    return () => {
      ioNear.disconnect();
      ioIn.disconnect();
    };
  }, []);

  const show3D = canRender3D && near;

  return (
    <section
      ref={ref}
      aria-labelledby={`line-${ind.id}`}
      className="relative flex min-h-[86vh] items-center overflow-hidden border-t border-cream-300 py-16 sm:py-20"
    >
      {/* faint warm vignette so the line-art floats on a clean ground */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(70% 60% at 50% 45%, hsl(var(--cream-50)), transparent 80%)" }}
      />

      <div className="container relative">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          {/* the line-art model */}
          <div className={flip ? "lg:order-2" : ""}>
            <div className="relative mx-auto aspect-square w-full max-w-[34rem]">
              {show3D ? (
                <LineArtScene industry={ind.id} inView={inView} reduced={reduced} color={LINE_COLOR} />
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-ink-300">
                    {ind.title}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* the copy */}
          <div className={flip ? "lg:order-1" : ""}>
            <p className="t-eyebrow mb-4 text-clay-600">{ind.eyebrow}</p>
            <h2 id={`line-${ind.id}`} className="t-display-2 text-ink-900">
              {ind.title}
            </h2>
            <p className="t-lead mt-5 max-w-md">{ind.body}</p>
            <ul className="mt-6 space-y-2">
              {ind.bullets.map((b) => (
                <li key={b} className="flex items-center text-sm text-ink-500">
                  <span className="me-2.5 inline-block h-1.5 w-1.5 rounded-full bg-clay-400" />
                  {b}
                </li>
              ))}
            </ul>
            <Link
              href={`/use-cases/${ind.slug}/`}
              className="group mt-8 inline-flex items-center gap-2 text-sm font-medium text-clay-600 hover:text-clay-500"
            >
              Learn more
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
