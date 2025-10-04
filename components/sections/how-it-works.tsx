"use client";

import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Camera, Cpu, Brain, Monitor } from "lucide-react";

interface HowItWorksProps {
  language: "en" | "ar";
}

export function HowItWorks({ language }: HowItWorksProps) {
  const content = {
    en: {
      title: "How It Works",
      subtitle: "Triya AI turns any CCTV camera into an on-prem, natural language conversation system, security & insight engine",
      steps: [
        {
          icon: Camera,
          title: "Camera Feed",
          description: "Connect existing cameras from any vendor. No need to replace your current CCTV or IP camera infrastructure.",
          number: "01"
        },
        {
          icon: Cpu,
          title: "Triya AI Edge Box",
          description: "Deploy our edge computing box at your location for local AI processing with complete data sovereignty.",
          number: "02"
        },
        {
          icon: Brain,
          title: "Triya AI Agents",
          description: "Advanced AI agents process video feeds with full Arabic language support and multi-language capabilities.",
          number: "03"
        },
        {
          icon: Monitor,
          title: "Use TriyaAI",
          description: "Seamlessly integrate with your existing command center for monitoring and real-time insights.",
          number: "04"
        }
      ]
    },
    ar: {
      title: "كيف يعمل",
      subtitle: "Triya AI تحول أي كاميرا CCTV إلى نظام محادثة باللغة الطبيعية محلي، ومحرك أمان ورؤى",
      steps: [
        {
          icon: Camera,
          title: "تغذية الكاميرا",
          description: "ربط الكاميرات الموجودة من أي مورد. لا حاجة لاستبدال البنية التحتية الحالية للكاميرات.",
          number: "01"
        },
        {
          icon: Cpu,
          title: "صندوق Triya AI الطرفي",
          description: "نشر صندوق الحوسبة الطرفية في موقعك للمعالجة المحلية مع السيادة الكاملة على البيانات.",
          number: "02"
        },
        {
          icon: Brain,
          title: "وكلاء Triya AI",
          description: "وكلاء ذكاء اصطناعي متقدمون يعالجون موجزات الفيديو مع دعم كامل للغة العربية وقدرات متعددة اللغات.",
          number: "03"
        },
        {
          icon: Monitor,
          title: "استخدام TriyaAI",
          description: "التكامل السلس مع مركز القيادة الموجود لديك للمراقبة والرؤى في الوقت الفعلي.",
          number: "04"
        }
      ]
    }
  };

  const t = content[language];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">{t.title}</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {/* Diagram */}
        <div className="mb-16 flex justify-center">
          <Image
            src="/how_it_works.png"
            alt="How Triya AI Works"
            width={1200}
            height={400}
            className="w-full max-w-5xl h-auto"
          />
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {t.steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < t.steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 left-full w-full h-[2px] bg-border -translate-y-1/2 z-0" />
                )}
                
                <Card className="relative z-10 p-6 h-full border-2 hover:border-primary transition-colors">
                  <div className="mb-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <span className="text-5xl font-bold text-primary/20">{step.number}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}