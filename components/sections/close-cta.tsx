"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/scroll/Reveal";

/**
 * The close — a calm, confident cream invitation that resolves the page back to
 * paper (the Living City's "paper gives, paper takes back" language). One line,
 * one primary action. The clay recording-light from the hero returns as the
 * full stop on the headline, closing the loop the page opened with.
 *
 * Not a gradient CTA box with a stat strip (the old pattern) — just type, space,
 * and one decision.
 */
export function CloseCTA() {
  return (
    <section className="relative overflow-hidden bg-cream-50 py-28 sm:py-40">
      <div className="container">
        <Reveal className="mx-auto max-w-4xl text-center">
          <p className="t-eyebrow mb-6">Start the conversation</p>
          <h2 className="t-display-1 text-ink-900">
            Your cameras already see everything.
            <br className="hidden sm:block" /> Now they can{" "}
            <span className="whitespace-nowrap">
              <em>answer</em>
              {/* the recording-light period — hero callback */}
              <span
                aria-hidden="true"
                className="relative ms-2 inline-flex h-[0.16em] w-[0.16em] translate-y-[-0.05em] align-middle"
              >
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-clay-400/70" />
                <span className="relative inline-flex h-full w-full rounded-full bg-clay-400" />
              </span>
            </span>
          </h2>

          <p className="t-lead mx-auto mt-8 max-w-xl">
            Bring one question and the cameras you already own. We’ll show you the
            answer on your own footage — on-prem, in a live session.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact/"
              className="btn-tactile inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground hover:bg-clay-500"
            >
              Request a live demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/use-cases/manufacturing/"
              className="nav-underline inline-flex items-center gap-2 px-2 py-2 text-base font-medium text-ink-700 hover:text-ink-900"
            >
              Explore by industry
            </Link>
          </div>

          {/* the strongest trust signal on the closing screen — visible on every
              breakpoint, not hidden in a corner */}
          <p className="t-caption mt-12 text-ink-500">
            Built in the UAE · ADGM · deployed across the GCC
          </p>
        </Reveal>
      </div>
    </section>
  );
}
