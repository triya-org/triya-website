"use client";

import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProductSchema } from "@/app/components/structured-data";
import { WhatItIs } from "@/components/sections/what-it-is";
import { TalkToCameras } from "@/components/sections/talk-to-cameras";
import { WatchFloor } from "@/components/sections/watch-floor";
import { Proof } from "@/components/sections/proof";
import { OutroClose } from "@/components/sections/outro-close";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { WatchHero } from "@/components/sections/watch-hero";
// LivingCity is disabled while testing the line-art version — re-enable by
// swapping <LineIndustries /> back to <LivingCity /> below. (kept imported so
// re-enabling is a one-line change)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LivingCity } from "@/components/sections/living-city";
import { LineIndustries } from "@/components/sections/line-industries";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { trackRequestDemo } = useAnalytics();

  useEffect(() => {
    setMounted(true);
    // Lazy load video when user is likely to see it
    const loadVideo = () => {
      setVideoLoaded(true);
    };

    // Load video after initial render
    const timer = setTimeout(loadVideo, 100);

    return () => clearTimeout(timer);
  }, []);

  const content = {
    /* Hero copy: global-first headline (design direction: positioning is
       worldwide, NOT GCC-only) with UAE/GCC proof carried in the subline.
       The SEO <title> keeps "UAE's Leading Edge AI Surveillance Platform"
       via seo-config — search is unaffected. (English-only per main.) */
    hero: {
      eyebrow: "Sovereign edge AI · Standing watch",
      title: "Talk to",
      titleHighlight: "your cameras.",
      subtitle: "Triya turns the CCTV you already own into sovereign, on-prem AI — ask anything, in 30+ languages. Built in the UAE, deployed across the GCC.",
      cta1: "Request Demo",
      cta2: "Watch Video"
    },
    trust: "Trusted by leading organizations across the GCC"
  };

  const t = content;

  // Before client mount, reserve a full viewport of cream instead of
  // returning null — an empty <main className="flex-1"> collapsed and let
  // the footer ride up under the navbar (the "bottom of the page" flash on
  // load/reload). The placeholder matches the page background, so it reads
  // as a clean loading screen and the preloader curtain (also cream) covers
  // it seamlessly on first visit.
  if (!mounted) {
    // dark to match the new Standing Watch hero (no cream flash on reload)
    return <div className="min-h-screen bg-ink-900" aria-hidden="true" />;
  }

  return (
    <SmoothScroll>
    <div className="flex flex-col">
      <ProductSchema />
      {/* Hero — the dark "Standing Watch" opening: command bar + living field */}
      <WatchHero
        content={t.hero}
        videoLoaded={videoLoaded}
        onCta={() => trackRequestDemo("Hero Section")}
      />

      {/* LIGHT ROOM 1 — the plain truth in the light: keep your cameras, add one
          box, talk to all of them (the deliberate bright beat after the dark hero) */}
      <WhatItIs />

      {/* WHERE IT'S DEPLOYED — EXPERIMENT: the line-art industry sections are
          shown IN PLACE OF the Living City while we test the silhouette look.
          The Living City is only disabled, fully intact — to restore it, comment
          out <LineIndustries /> and uncomment <LivingCity />. */}
      {/* <LivingCity /> — disabled while testing the line-art version */}
      <LineIndustries />

      {/* The dark "Standing Watch" sheet: slides up OVER the pinned city
          (z + opaque dark bg) and carries the rest of the page. */}
      <div className="relative z-20 bg-ink-900">
        {/* THE SET-PIECE — talk to your cameras: query → scan → lock → answer */}
        <TalkToCameras />

        {/* WHERE TO APPLY — the Watch Floor: a live control room where the real
            detections fire autonomously and any feed flies open on demand */}
        <WatchFloor />

        {/* LIGHT ROOM 2 — the four numbers as bright editorial monuments */}
        <Proof />

        {/* Close — the page resolves to the dark watch it opened in */}
        <div className="relative z-30">
          <OutroClose />
        </div>
      </div>
    </div>
    </SmoothScroll>
  );
}