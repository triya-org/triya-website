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
 * ALIVE, not just revealed (the calm cream room still has to move):
 *   • AMBIENT  — a fine paper grain drifts over the whole room, each numeral
 *     carries a slow clay sheen, and a soft glow breathes behind it. Nothing is
 *     ever frozen even when you sit still. (CSS keyframes, see globals.css.)
 *   • DEPTH    — the monument and its copy parallax against the scroll at
 *     different rates (rect + rAF, NOT a ScrollTrigger pin — robust against the
 *     Living City's 800% pin per the codebase gotcha).
 *   • POINTER  — the monument and copy drift toward/away from the cursor at
 *     different rates, so the row gains a parallax tilt under the pointer.
 *
 * The entrance is GSAP ScrollTrigger (wired into Lenis site-wide) rather than
 * Framer whileInView, which does not fire reliably under this page's smooth
 * scroll. Reduced-motion: everything static — no grain, sheen, glow or parallax.
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
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // POINTER LIFE — broadcast a normalised cursor vector (-1..1) on the section
  // as CSS vars; each row's monument + copy read it at different multipliers for
  // a parallax tilt. Cheap (one listener, vars inherit), and gated on reduced.
  useIsomorphicLayoutEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width - 0.5) * 2;
        const py = ((e.clientY - r.top) / r.height - 0.5) * 2;
        el.style.setProperty("--px", String(Math.max(-1, Math.min(1, px))));
        el.style.setProperty("--py", String(Math.max(-1, Math.min(1, py))));
      });
    };
    const onLeave = () => {
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduced]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-cream-100 py-24 sm:py-32"
      style={{ ["--px" as string]: 0, ["--py" as string]: 0 }}
    >
      {/* AMBIENT — drifting paper grain so the room is never frozen */}
      {!reduced && <div className="proof-grain" aria-hidden="true" />}

      <div className="container relative">
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
  const monumentRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const numRef = useRef<HTMLSpanElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);

  // ENTRANCE — the numeral rises out of its clip band, the rule wipes in.
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

  // DEPTH — scroll parallax derived straight from getBoundingClientRect on a
  // passive scroll + rAF loop (NOT a ScrollTrigger pin: the Living City already
  // pins for 800% and would feed any new pin stale start/end positions). The
  // monument lags the scroll, the copy leads it, so the row gains depth. This
  // sets translateY only; the pointer parallax (CSS-var calc) lives in inline
  // style on the same elements, and CSS transforms compose, so they don't fight.
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    const monument = monumentRef.current;
    const copy = copyRef.current;
    if (!root || !monument || !copy || reduced) return;

    let raf = 0;
    const apply = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // -1 (entering from below) .. 1 (leaving past top), 0 at viewport centre
      const p = Math.max(
        -1,
        Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)),
      );
      monument.style.setProperty("--sy", `${(p * 26).toFixed(2)}px`);
      copy.style.setProperty("--sy", `${(p * -14).toFixed(2)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  // Two transforms, two elements: the OUTER cell carries the scroll parallax
  // (--sy, applied with no CSS transition so it stays locked to the scroll), the
  // INNER wrapper carries the pointer parallax (--px/--py, with the .proof-*
  // transition so it eases as the cursor moves and resets). Splitting them means
  // neither overwrites the other and scroll fidelity isn't smeared by easing.
  const scrollMonument = {
    transform: "translate3d(0, var(--sy, 0px), 0)",
  } as React.CSSProperties;
  const scrollCopy = {
    transform: "translate3d(0, var(--sy, 0px), 0)",
  } as React.CSSProperties;
  const pointerMonument = {
    transform:
      "translate3d(calc(var(--px, 0) * 12px), calc(var(--py, 0) * 9px), 0)",
  } as React.CSSProperties;
  const pointerCopy = {
    transform:
      "translate3d(calc(var(--px, 0) * -5px), calc(var(--py, 0) * -4px), 0)",
  } as React.CSSProperties;

  return (
    <div
      ref={rootRef}
      className="grid grid-cols-1 items-center gap-y-6 border-t border-cream-300 py-12 last:border-b sm:grid-cols-12 sm:gap-x-10 sm:py-16"
    >
      {/* the monument */}
      <div
        ref={monumentRef}
        style={scrollMonument}
        className={[
          "sm:col-span-6",
          flip ? "sm:order-2" : "",
        ].join(" ")}
      >
        <div
          style={pointerMonument}
          className={[
            "proof-monument flex items-end leading-[0.8]",
            flip ? "sm:justify-end" : "",
          ].join(" ")}
        >
          {/* soft glow breathing behind the numeral (ambient) */}
          <div className="proof-glow" aria-hidden="true" />
          <span className="relative z-[1] block overflow-hidden">
            <span
              ref={numRef}
              className="proof-num block font-display font-semibold tracking-[-0.04em]"
              style={{ fontSize: "clamp(4.5rem, 15vw, 11rem)" }}
            >
              {claim.value}
            </span>
          </span>
          {claim.unit && (
            <span className="relative z-[1] overflow-hidden pb-[0.12em]">
              <span
                ref={unitRef}
                className="proof-unit block font-display font-semibold leading-none"
                style={{ fontSize: "clamp(2rem, 5vw, 3.75rem)" }}
              >
                {claim.unit}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* claim + reason */}
      <div
        ref={copyRef}
        style={scrollCopy}
        className={[
          "sm:col-span-6",
          flip ? "sm:order-1 sm:text-right" : "",
        ].join(" ")}
      >
        <div className="proof-copy" style={pointerCopy}>
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
    </div>
  );
}
