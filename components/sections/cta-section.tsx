"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";
import Link from "next/link";

interface CTASectionProps {
  language: "en" | "ar";
}

export function CTASection({ language }: CTASectionProps) {
  const content = {
    en: {
      title: "Ready to transform your security?",
      subtitle: "Join leading organizations using Triya.ai for intelligent surveillance",
      cta1: "Schedule Demo",
      cta2: "Contact Sales",
      stat1: "90%",
      stat1Label: "Cost Reduction",
      stat2: "24/7",
      stat2Label: "Monitoring",
      stat3: "5min",
      stat3Label: "Setup Time"
    },
    ar: {
      title: "مستعد لتحويل أمانك؟",
      subtitle: "انضم إلى المؤسسات الرائدة التي تستخدم Triya.ai للمراقبة الذكية",
      cta1: "جدولة عرض توضيحي",
      cta2: "اتصل بالمبيعات",
      stat1: "90%",
      stat1Label: "تخفيض التكلفة",
      stat2: "24/7",
      stat2Label: "مراقبة",
      stat3: "5 دقائق",
      stat3Label: "وقت الإعداد"
    }
  };

  const t = content[language];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-background" />
      <div className="absolute inset-0 bg-grid-slate-200/[0.03] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      
      <div className="container relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            {t.title}
          </h2>
          <p className="mb-10 text-xl text-muted-foreground">
            {t.subtitle}
          </p>

          {/* Stats */}
          <div className="mb-10 grid grid-cols-3 gap-8 md:gap-16">
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">{t.stat1}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.stat1Label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">{t.stat2}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.stat2Label}</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary md:text-4xl">{t.stat3}</div>
              <div className="mt-1 text-sm text-muted-foreground">{t.stat3Label}</div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href="/contact">
                <Calendar className="h-5 w-5" />
                {t.cta1}
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
              <Link href="/contact">
                {t.cta2}
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}