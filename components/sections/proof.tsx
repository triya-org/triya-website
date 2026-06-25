"use client";

import { CountUp } from "@/components/scroll/CountUp";
import { Reveal } from "@/components/scroll/Reveal";

/**
 * Proof — the four hard numbers, but set as editorial evidence rather than a
 * centered four-up stat strip. Each claim is a full row: an oversized clay
 * numeral, the claim, and the *reason* it's true (a buyer should be able to
 * repeat one to their boss). Rows alternate alignment for an asymmetric,
 * magazine-spread rhythm; hairline dividers between. CountUp is reduced-motion
 * safe and settles on the true value; widths are reserved so nothing shifts.
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

        <div className="mt-16 sm:mt-20">
          {CLAIMS.map((c, i) => {
            const flip = i % 2 === 1;
            return (
              <Reveal
                key={c.claim}
                y={32}
                start="top 86%"
                className="border-t border-cream-300 py-10 last:border-b sm:py-12"
              >
                <div
                  className={[
                    "grid items-baseline gap-x-8 gap-y-3 sm:grid-cols-12",
                    flip ? "sm:text-right" : "",
                  ].join(" ")}
                >
                  {/* numeral */}
                  <div
                    className={[
                      "flex items-baseline sm:col-span-5",
                      flip ? "sm:order-2 sm:justify-end" : "",
                    ].join(" ")}
                  >
                    {/* clay-500 (not clay-400) clears large-text contrast on the
                        cream surface — the system already darkens clay for type
                        on paper (eyebrows use clay-600) */}
                    <span className="font-display text-[clamp(3.5rem,11vw,7.5rem)] font-semibold leading-[0.85] tracking-tight text-clay-500">
                      <CountUp value={c.value} />
                    </span>
                    {c.unit && (
                      <span className="ms-1 font-display text-[clamp(1.75rem,4vw,3rem)] font-semibold leading-none text-clay-500/80">
                        {c.unit}
                      </span>
                    )}
                  </div>

                  {/* claim + reason */}
                  <div
                    className={[
                      "sm:col-span-7",
                      flip ? "sm:order-1 sm:pe-8" : "sm:ps-8",
                    ].join(" ")}
                  >
                    <h3 className="font-display text-xl font-semibold tracking-tight text-ink-900 sm:text-2xl">
                      {c.claim}
                    </h3>
                    <p
                      className={[
                        "mt-2 max-w-md text-[0.975rem] leading-relaxed text-ink-700",
                        flip ? "sm:ms-auto" : "",
                      ].join(" ")}
                    >
                      {c.reason}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
