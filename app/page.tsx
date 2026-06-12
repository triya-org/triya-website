"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProductShowcase } from "@/components/sections/product-showcase";
import { CTASection } from "@/components/sections/cta-section";
import { ProductSchema } from "@/app/components/structured-data";
import { HowItWorks } from "@/components/sections/how-it-works";
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
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [mounted, setMounted] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { trackRequestDemo, trackWatchVideo } = useAnalytics();

  useEffect(() => {
    setMounted(true);
    // Check for saved language preference
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
      // every other page re-applies dir after the toggle's reload — the
      // homepage never did, so rtl: variants silently stayed LTR here
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
    
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
       via seo-config — search is unaffected. */
    en: {
      hero: {
        eyebrow: "Triya.AI — Edge AI Surveillance",
        title: "Talk to",
        titleHighlight: "your cameras.",
        subtitle: "Triya turns the CCTV you already own into sovereign, on-prem AI — ask anything, in 30+ languages. Built in the UAE, deployed across the GCC.",
        cta1: "Request Demo",
        cta2: "Watch Video"
      },
      trust: "Trusted by leading organizations across the GCC"
    },
    ar: {
      hero: {
        eyebrow: "تريا — المراقبة بالذكاء الاصطناعي",
        title: "تحدّث إلى",
        titleHighlight: "كاميراتك.",
        subtitle: "تريا تحوّل كاميرات المراقبة التي تملكها إلى ذكاء اصطناعي سيادي يعمل محليًا — اسأل بلغتك، بأكثر من ٣٠ لغة. صُنعت في الإمارات وتعمل في دول الخليج.",
        cta1: "طلب عرض توضيحي",
        cta2: "شاهد الفيديو"
      },
      trust: "موثوق من قبل المؤسسات الرائدة في دول مجلس التعاون الخليجي"
    }
  };

  const t = content[language];

  if (!mounted) {
    return null;
  }

  return (
    <SmoothScroll>
    <div className="flex flex-col">
      <ProductSchema />
      {/* (language toggle lives in the navbar — the old floating pill was a duplicate) */}

      {/* Hero Section */}
      <CinematicHero
        language={language}
        content={t.hero}
        videoLoaded={videoLoaded}
        onCta={() => trackRequestDemo("Hero Section")}
        onWatchVideo={() => {
          trackWatchVideo("Hero Section");
          setShowVideoModal(true);
        }}
      />

      {/* The Living City — scroll-scrubbed clay-world journey */}
      <LivingCity language={language} />
      
      {/* Trust Section - Hidden for now */}
      {/* <section className="bg-background py-12 sm:py-16">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            {t.trust}
          </p>
        </div>
      </section> */}

      {/* The "sheet": slides up OVER the pinned city (z + opaque bg) and
          carries the rest of the page — analog.io cover pattern */}
      <div className="relative z-20 bg-background">
        {/* Product Showcase */}
        <ProductShowcase language={language} />

        {/* How It Works */}
        <HowItWorks language={language} />

        {/* (industries now live INSIDE the Living City above — the four
            park beats of the unified 800% journey) */}

        {/* CTA Section */}
        <div className="relative z-30 bg-background">
          <CTASection language={language} />
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