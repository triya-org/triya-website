"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Globe, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProductShowcase } from "@/components/sections/product-showcase";
import { UseCases } from "@/components/sections/use-cases";
import { CTASection } from "@/components/sections/cta-section";
import { HowItWorks } from "@/components/sections/how-it-works";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { fadeInUp, fadeIn, staggerChildren } from "@/lib/motion-variants";

export default function Home() {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [mounted, setMounted] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const { trackRequestDemo, trackWatchVideo } = useAnalytics();

  useEffect(() => {
    setMounted(true);
    // Check for saved language preference
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
  };

  const content = {
    en: {
      hero: {
        title: "Transform any camera into a",
        titleHighlight: "privacy-first, AI-powered security & analytics solution",
        subtitle: "",
        cta1: "Request Demo",
        cta2: "Watch Video",
        metric1: "99%",
        metric1Label: "Arabic Accuracy",
        metric2: "<500ms",
        metric2Label: "Detection Latency",
        metric3: "90%",
        metric3Label: "Cost Reduction"
      },
      trust: "Trusted by leading organizations across the GCC"
    },
    ar: {
      hero: {
        title: "حوّل أي كاميرا إلى",
        titleHighlight: "حل أمني وتحليلي مدعوم بالذكاء الاصطناعي مع الحفاظ على الخصوصية",
        subtitle: "",
        cta1: "طلب عرض توضيحي",
        cta2: "شاهد الفيديو",
        metric1: "99%",
        metric1Label: "دقة اللغة العربية",
        metric2: "<500ms",
        metric2Label: "زمن الكشف",
        metric3: "90%",
        metric3Label: "تخفيض التكلفة"
      },
      trust: "موثوق من قبل المؤسسات الرائدة في دول مجلس التعاون الخليجي"
    }
  };

  const t = content[language];

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col">
      {/* Language Toggle */}
      <div className="fixed top-20 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleLanguage}
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          {language === "en" ? "العربية" : "English"}
        </Button>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-[100dvh] md:h-[75vh] flex items-center justify-center overflow-hidden py-20 md:py-0">
        {/* Video Background Container */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            poster="/video-poster.jpg"
          >
            <source src="/videos/hero_1.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        {/* Content */}
        <div className="container relative z-10 mx-auto px-4 sm:px-6 text-center">
          <motion.div 
            className="mx-auto max-w-4xl"
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
          >
            <motion.h1 
              className="mb-4 sm:mb-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white"
              variants={fadeInUp}
            >
              {t.hero.title}{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </motion.h1>
            
            {t.hero.subtitle && (
              <motion.p 
                className="mx-auto mb-6 sm:mb-8 max-w-2xl text-lg sm:text-xl text-gray-200"
                variants={fadeInUp}
              >
                {t.hero.subtitle}
              </motion.p>
            )}
            
            <motion.div 
              className="flex items-center justify-center"
              variants={fadeInUp}
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90" 
                asChild
                onClick={() => trackRequestDemo('Hero Section')}
              >
                <Link href="/contact">
                  {t.hero.cta1} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              {/* <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto gap-2 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
                onClick={() => {
                  trackWatchVideo('Hero Section');
                  setShowVideoModal(true);
                }}
              >
                <Play className="h-4 w-4" /> {t.hero.cta2}
              </Button> */}
            </motion.div>
            
            <motion.div 
              className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8"
              variants={fadeInUp}
            >
              {[
                { value: t.hero.metric1, label: t.hero.metric1Label },
                { value: t.hero.metric2, label: t.hero.metric2Label },
                { value: t.hero.metric3, label: t.hero.metric3Label },
              ].map((metric, index) => (
                <motion.div 
                  key={index}
                  className="text-center"
                  variants={fadeInUp}
                  custom={index}
                >
                  <h3 className="text-3xl sm:text-4xl font-bold text-yellow-400">{metric.value}</h3>
                  <p className="mt-2 text-sm sm:text-base text-gray-300">{metric.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
      
      {/* Trust Section - Hidden for now */}
      {/* <section className="bg-background py-12 sm:py-16">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground">
            {t.trust}
          </p>
        </div>
      </section> */}

      {/* Product Showcase */}
      <ProductShowcase language={language} />

      {/* How It Works */}
      <HowItWorks language={language} />

      {/* Use Cases */}
      <UseCases language={language} />

      {/* CTA Section */}
      <CTASection language={language} />

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
  );
}