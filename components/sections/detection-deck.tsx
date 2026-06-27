"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  DetectionViewport,
  type ViewportData,
  type ViewportPhase,
} from "@/components/viewport/DetectionViewport";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import {
  CHANNELS,
  SCENARIOS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Category,
  type Scenario,
} from "@/components/sections/query-room.data";

/**
 * Where to apply — the full detection library as a switchable showcase, so a
 * buyer can browse Triya's REAL scenarios (the product's Scenarios & Alerts)
 * and instantly feel "this applies to my site". Picking a scenario drives the
 * same DetectionViewport instrument as the set-piece: a quick steel scan settles
 * into a clay lock, and the detail panel names the category, what it detects and
 * how the alert actually behaves. Flagships play live footage; available
 * detections show a faithful still preview. Only one video decodes at a time.
 */

type Phase = "scan" | "done";

const CAT_TINT: Record<Category, string> = {
  security: "hsl(var(--clay-400))",
  compliance: "hsl(var(--clay-300))",
  safety: "hsl(38 70% 56%)",
  operations: "hsl(150 30% 52%)",
};

function resolve(s: Scenario): {
  vp: ViewportData;
  alert: string;
  live: boolean;
} {
  if (s.demoId) {
    const c = CHANNELS.find((x) => x.id === s.demoId)!;
    return {
      vp: {
        id: c.id,
        cameraId: c.cameraId,
        location: c.location,
        timestamp: c.timestamp,
        box: c.box,
        poster: c.poster,
        video: c.video,
      },
      alert: "Flagged with the exact frame, camera and time — raised on-prem the instant it fires.",
      live: true,
    };
  }
  const p = s.preview!;
  return {
    vp: {
      id: s.id,
      cameraId: p.cameraId,
      location: p.location,
      timestamp: p.timestamp,
      box: p.box,
      poster: p.poster,
    },
    alert: p.alert,
    live: false,
  };
}

export function DetectionDeck() {
  const reduced = usePrefersReducedMotion();
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const [phase, setPhase] = useState<Phase>(reduced ? "done" : "scan");
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const radioRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [inView, setInView] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === activeId)!;
  const { vp, alert, live } = resolve(scenario);
  const isActive = scenario.status === "active";

  // flat DOM-order list of scenario ids for roving-tabindex keyboard nav
  const order = CATEGORY_ORDER.flatMap((cat) =>
    SCENARIOS.filter((s) => s.category === cat).map((s) => s.id),
  );
  const onRadioKey = (e: React.KeyboardEvent, id: string) => {
    const i = order.indexOf(id);
    const last = order.length - 1;
    let next = i;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = i === last ? 0 : i + 1;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = i === 0 ? last : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    const nextId = order[next];
    setActiveId(nextId);
    radioRefs.current[nextId]?.focus();
  };

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // quick scan → lock whenever the selection changes
  useEffect(() => {
    if (reduced) {
      setPhase("done");
      return;
    }
    setPhase("scan");
    const t = setTimeout(() => setPhase("done"), 900);
    return () => clearTimeout(t);
  }, [activeId, reduced]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView) v.play().catch(() => {});
    else v.pause();
  }, [inView, activeId]);

  const vpPhase: ViewportPhase = phase === "scan" ? "scan" : "done";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="deck-title"
      className="dark relative overflow-hidden bg-ink-900 py-24 text-cream-100 sm:py-32"
    >
      {/* hairline grid datum, like the product's scenario screen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--steel-200)) 1px, transparent 1px)",
          backgroundSize: "100% 44px",
        }}
      />

      <div className="container relative z-10">
        <div className="max-w-2xl">
          <p className="t-eyebrow !text-steel-300">Where to apply · Scenarios &amp; Alerts</p>
          <h2 id="deck-title" className="t-display-2 mt-4 text-cream-50">
            Switch on what you need to <em className="not-italic text-clay-400">watch for</em>.
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-steel-200">
            These are Triya’s real detections — the same ones you enable per site
            in the app. Pick one and see exactly what it catches, what it detects,
            and how it alerts.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* selector — category lanes */}
          <div
            role="radiogroup"
            aria-label="Choose a detection scenario"
            className="order-2 lg:order-1 lg:col-span-5"
          >
            {CATEGORY_ORDER.map((cat) => {
              const items = SCENARIOS.filter((s) => s.category === cat);
              return (
                <div key={cat} className="mb-7 last:mb-0">
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: CAT_TINT[cat] }}
                    />
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-steel-300">
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((s) => {
                      const on = s.id === activeId;
                      return (
                        <button
                          key={s.id}
                          ref={(el) => {
                            radioRefs.current[s.id] = el;
                          }}
                          role="radio"
                          aria-checked={on}
                          aria-label={`${s.name} — ${s.status === "active" ? "active" : "available"}`}
                          tabIndex={on ? 0 : -1}
                          onClick={() => setActiveId(s.id)}
                          onKeyDown={(e) => onRadioKey(e, s.id)}
                          className={[
                            "group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900",
                            on
                              ? "border-clay-400 bg-ink-800"
                              : "border-[hsl(var(--border))]/50 hover:border-steel-400 hover:bg-ink-800/50",
                          ].join(" ")}
                        >
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span
                              className={[
                                "relative inline-flex h-2 w-2 rounded-full",
                                s.status === "active" ? "bg-clay-400" : "border border-steel-400",
                              ].join(" ")}
                            />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={[
                                "block font-display text-[0.98rem] font-medium tracking-tight",
                                on ? "text-cream-50" : "text-steel-200 group-hover:text-cream-100",
                              ].join(" ")}
                            >
                              {s.name}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-wider text-steel-300">
                            {s.status === "active" ? "● Active" : "○ Available"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* stage */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <div className="lg:sticky lg:top-24">
              <DetectionViewport
                key={scenario.id}
                data={vp}
                phase={vpPhase}
                reduced={reduced}
                videoRef={live ? videoRef : undefined}
                stamp
              />

              <div className="mt-5 rounded-2xl border border-[hsl(var(--border))] bg-ink-800/50 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-steel-200"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: CAT_TINT[scenario.category] }}
                    />
                    {CATEGORY_LABELS[scenario.category]}
                  </span>
                  <span className="rounded-full border border-[hsl(var(--border))] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider text-steel-300">
                    Detects {scenario.detects.join(", ")}
                  </span>
                  <span
                    className={[
                      "rounded-full border px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-wider",
                      isActive
                        ? "border-clay-400/40 text-clay-300"
                        : "border-[hsl(var(--border))] text-steel-300",
                    ].join(" ")}
                  >
                    {isActive ? "● Active" : "○ Available"}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-cream-50">
                  {scenario.name}
                </h3>
                <p className="mt-2 text-[1.02rem] leading-relaxed text-steel-200">
                  {scenario.description}
                </p>
                <p className="mt-3 flex items-start gap-2 text-[0.95rem] leading-relaxed text-steel-300">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-clay-400" />
                  {alert}
                </p>

                <Link
                  href="/contact/"
                  className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-clay-300 hover:text-clay-200"
                >
                  {isActive ? "See this running on your cameras" : "Enable this on your site"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[hsl(var(--border))] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[0.75rem] text-steel-300">
            {SCENARIOS.filter((s) => s.status === "active").length} armed ·{" "}
            {SCENARIOS.length} ready · more on the watch every release
          </p>
          <Link
            href="/contact/"
            className="group inline-flex items-center gap-2 text-sm text-steel-200 transition-colors hover:text-cream-50"
          >
            Don’t see yours? Triya can likely learn it
            <ArrowRight className="h-4 w-4 text-clay-400 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </section>
  );
}
