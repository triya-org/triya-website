"use client";

import { Card } from "@/components/ui/card";
import { Camera, Cpu, BarChart3, Shield } from "lucide-react";

interface HowItWorksProps {
  language: "en" | "ar";
}

export function HowItWorks({ language }: HowItWorksProps) {
  const content = {
    en: {
      title: "How It Works",
      subtitle: "Transform your existing security infrastructure with our edge AI platform",
      steps: [
        {
          icon: Camera,
          title: "Connect Cameras",
          description: "Integrate with any existing IP camera or CCTV system. No special hardware required.",
          number: "01"
        },
        {
          icon: Cpu,
          title: "Edge Processing",
          description: "AI models run locally on NVIDIA Jetson devices, ensuring data privacy and sub-500ms latency.",
          number: "02"
        },
        {
          icon: BarChart3,
          title: "Real-time Analytics",
          description: "Get instant insights with 99% accuracy in Arabic text and object detection.",
          number: "03"
        },
        {
          icon: Shield,
          title: "Actionable Alerts",
          description: "Receive customized alerts for security incidents, PPE violations, and operational insights.",
          number: "04"
        }
      ]
    },
    ar: {
      title: "كيف يعمل",
      subtitle: "حوّل البنية التحتية الأمنية الحالية باستخدام منصتنا للذكاء الاصطناعي الطرفي",
      steps: [
        {
          icon: Camera,
          title: "ربط الكاميرات",
          description: "التكامل مع أي كاميرا IP أو نظام CCTV موجود. لا يتطلب أجهزة خاصة.",
          number: "01"
        },
        {
          icon: Cpu,
          title: "المعالجة الطرفية",
          description: "تعمل نماذج الذكاء الاصطناعي محلياً على أجهزة NVIDIA Jetson، مما يضمن خصوصية البيانات وزمن استجابة أقل من 500ms.",
          number: "02"
        },
        {
          icon: BarChart3,
          title: "التحليلات الفورية",
          description: "احصل على رؤى فورية بدقة 99% في النص العربي وكشف الأشياء.",
          number: "03"
        },
        {
          icon: Shield,
          title: "تنبيهات قابلة للتنفيذ",
          description: "تلقي تنبيهات مخصصة لحوادث الأمن، وانتهاكات معدات الحماية الشخصية، والرؤى التشغيلية.",
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