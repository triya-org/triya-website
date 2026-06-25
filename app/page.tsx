"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProductSchema } from "@/app/components/structured-data";
import { WhatItIs } from "@/components/sections/what-it-is";
import { QueryRoom } from "@/components/sections/query-room";
import { Proof } from "@/components/sections/proof";
import { CloseCTA } from "@/components/sections/close-cta";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { CinematicHero } from "@/components/sections/cinematic-hero";
import { LivingCity } from "@/components/sections/living-city";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { trackRequestDemo, trackWatchVideo } = useAnalytics();

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
      eyebrow: "Triya.AI — Edge AI Surveillance",
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
    return <div className="min-h-screen bg-background" aria-hidden="true" />;
  }

  return (
    <SmoothScroll>
    <div className="flex flex-col">
      <ProductSchema />
      {/* Hero Section */}
      <CinematicHero
        content={t.hero}
        videoLoaded={videoLoaded}
        onCta={() => trackRequestDemo("Hero Section")}
        onWatchVideo={() => {
          trackWatchVideo("Hero Section");
          setShowVideoModal(true);
        }}
      />

      {/* The Living City — scroll-scrubbed clay-world journey (the poetic
          dream: fly through the four industries as atmosphere) */}
      <LivingCity />

      {/* The "sheet": slides up OVER the pinned city (z + opaque bg) and
          carries the rest of the page — analog.io cover pattern */}
      <div className="relative z-20 bg-background">
        {/* What it actually is — the crisp literal anchor that grounds the
            poetry above (retrofit: your cameras → one box → ask anything) */}
        <WhatItIs />

        {/* The Command Room — the product's Scenarios & Alerts, made cinematic.
            Movement 1: a live console demoing four flagship detection scenarios
            firing on real footage. Movement 2: "the standing watch" — the full
            detection library across security/safety/compliance/operations.
            (industries live in the city above; here it's about WHAT Triya
            detects, mirroring the app's scenario grid.) */}
        <QueryRoom />

        {/* Proof — the four hard numbers as editorial evidence */}
        <Proof />

        {/* Close — confident cream invitation, resolves the page to paper */}
        <div className="relative z-30 bg-background">
          <CloseCTA />
        </div>
      </div>

      {/* Video Modal */}
      <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <div className="relative pt-[56.25%]">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
            <iframe
              className="absolute inset-0 w-full h-full"
              src="https://www.youtube.com/embed/S7xTBa93TX8?autoplay=1"
              title="Triya.ai Platform Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </SmoothScroll>
  );
}