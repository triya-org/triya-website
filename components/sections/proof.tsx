"use client";

import { useRef } from "react";
import { gsap, registerGsap } from "@/lib/gsap";
import { Reveal } from "@/components/scroll/Reveal";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { useIsomorphicLayoutEffect } from "@/lib/use-isomorphic-layout-effect";

/**
 * Proof — the four numbers as editorial *monuments*, not a stat strip and not a
 * CountUp ticker (the most templated motion in the SaaS playbook). Each numeral
 * is oversized type-as-image that rises out of a clipped band on scroll — like
 * a figure being printed/stamped onto the page — with a clay rule that wipes in
 * under the claim. The reason copy (the real differentiator) is promoted.
 *
 * Motion is GSAP ScrollTrigger (wired into Lenis site-wide) rather than Framer
 * whileInView, which does not fire reliably under this page's smooth-scroll.
 * Reduced-motion: everything static, no rise, no wipe.
 */

interface Claim {
  value: string;
  unit?: string;
  claim: string;
  reason: string;
}

const CLAIMS: Claim[] = [
  {
    value: "85",
    unit: "%",
    claim: "lower cost to go live",
    reason:
      "Triya retrofits the cameras you already own. No rip-and-replace, no new hardware fleet to buy, install and maintain.",
  },
  {
    value: "90",
    unit: "%",
    claim: "faster investigations",
    reason:
      "Ask a question in plain language instead of scrubbing hours of footage. The exact frames come back in seconds, not shifts.",
  },
  {
    value: "0",
    claim: "ways we lock you in",
    reason:
      "Open by design — standard cameras, exportable data, no proprietary formats. The day Triya stops earning its place, you walk out with everything, your footage included.",
  },
  {
    value: "100",
    unit: "%",
    claim: "processed on your premises",
    reason:
      "Every frame is analysed at the edge. Nothing is sent to a cloud, nothing leaves your site. Sovereignty isn’t a setting — it’s the architecture.",
  },
];

export function Proof() {
  return (
    <section className="relative overflow-hidden bg-cream-100 py-24 sm:py-32">
      <div className="container">
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow mb-4">The proof</p>
          <h2 className="t-display-2 text-ink-900">
            Four numbers, and why each is true.
          </h2>
          <p className="t-lead mt-6">
            Not slogans — the measurable consequences of running intelligence on
            the cameras you already own, on the premises you already control.
          </p>
        </Reveal>

        <div className="mt-16 sm:mt-24">
          {CLAIMS.map((c, i) => (
            <ProofRow key={c.claim} claim={c} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProofRow({ claim, flip }: { claim: Claim; flip: boolean }) {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    registerGsap();

    const ctx = gsap.context(() => {
      gsap.set([numRef.current, unitRef.current], { yPercent: 115 });
      gsap.set(ruleRef.current, { scaleX: 0 });

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 80%" },
      });
      tl.to(numRef.current, { yPercent: 0, duration: 0.95, ease: "power4.out" })
        .to(
          unitRef.current,
          { yPercent: 0, duration: 0.95, ease: "power4.out" },
          0.08,
        )
        .to(
          ruleRef.current,
          { scaleX: 1, duration: 0.7, ease: "power3.out" },
          0.25,
        );
    }, root);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div
      ref={rootRef}
      className="grid grid-cols-1 items-center gap-y-6 border-t border-cream-300 py-12 last:border-b sm:grid-cols-12 sm:gap-x-10 sm:py-16"
    >
      {/* the monument */}
      <div
        className={[
          "flex items-end leading-[0.8] sm:col-span-6",
          flip ? "sm:order-2 sm:justify-end" : "",
        ].join(" ")}
      >
        <span className="block overflow-hidden">
          <span
            ref={numRef}
            className="block font-display font-semibold tracking-[-0.04em] text-clay-500"
            style={{ fontSize: "clamp(4.5rem, 15vw, 11rem)" }}
          >
            {claim.value}
          </span>
        </span>
        {claim.unit && (
          <span className="overflow-hidden pb-[0.12em]">
            <span
              ref={unitRef}
              className="block font-display font-semibold leading-none text-clay-500/75"
              style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
            >
              {claim.unit}
            </span>
          </span>
        )}
      </div>

      {/* claim + reason */}
      <div
        className={["sm:col-span-6", flip ? "sm:order-1 sm:text-right" : ""].join(" ")}
      >
        <h3 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[1.75rem]">
          {claim.claim}
        </h3>
        <div
          ref={ruleRef}
          className={[
            "mt-3 h-[3px] w-16 rounded-full bg-clay-400",
            flip ? "sm:ms-auto" : "",
          ].join(" ")}
          style={{ transformOrigin: flip ? "right" : "left" }}
        />
        <p
          className={[
            "mt-5 max-w-md text-[1.05rem] leading-relaxed text-ink-700",
            flip ? "sm:ms-auto" : "",
          ].join(" ")}
        >
          {claim.reason}
        </p>
      </div>
    </div>
  );
}
