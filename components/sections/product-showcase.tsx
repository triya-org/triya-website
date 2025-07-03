"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Zap, 
  Globe2, 
  Server, 
  LineChart, 
  Lock,
  Cpu,
  Languages
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";

interface ProductShowcaseProps {
  language: "en" | "ar";
}

export function ProductShowcase({ language }: ProductShowcaseProps) {
  const content = {
    en: {
      title: "Edge AI Platform Features",
      subtitle: "Cutting-edge technology designed for modern surveillance needs",
      features: [
        {
          icon: Languages,
          title: "Arabic-First LLM",
          description: "99% accuracy in Arabic language processing, understanding context and nuances",
          badge: "Industry Leading"
        },
        {
          icon: Zap,
          title: "Sub-500ms Latency",
          description: "Real-time threat detection and response with ultra-low latency processing",
          badge: "Real-time"
        },
        {
          icon: Server,
          title: "On-Premise Processing",
          description: "Complete data sovereignty with local processing, no cloud dependencies",
          badge: "Secure"
        },
        {
          icon: Cpu,
          title: "NVIDIA Jetson Powered",
          description: "Optimized for edge computing with TensorRT-LLM acceleration",
          badge: "High Performance"
        },
        {
          icon: LineChart,
          title: "Advanced Analytics",
          description: "Comprehensive dashboards with real-time insights and historical analysis",
          badge: "Data-Driven"
        },
        {
          icon: Shield,
          title: "Multi-Industry Support",
          description: "Tailored solutions for manufacturing, retail, healthcare, and smart cities",
          badge: "Versatile"
        }
      ]
    },
    ar: {
      title: "ميزات منصة الذكاء الاصطناعي الطرفي",
      subtitle: "تقنية متطورة مصممة لاحتياجات المراقبة الحديثة",
      features: [
        {
          icon: Languages,
          title: "نموذج لغوي عربي أولاً",
          description: "دقة 99% في معالجة اللغة العربية، فهم السياق والفروقات الدقيقة",
          badge: "رائد في الصناعة"
        },
        {
          icon: Zap,
          title: "زمن استجابة أقل من 500ms",
          description: "كشف التهديدات والاستجابة في الوقت الفعلي مع معالجة فائقة السرعة",
          badge: "الوقت الفعلي"
        },
        {
          icon: Server,
          title: "معالجة محلية",
          description: "سيادة البيانات الكاملة مع المعالجة المحلية، بدون اعتماد على السحابة",
          badge: "آمن"
        },
        {
          icon: Cpu,
          title: "مدعوم بـ NVIDIA Jetson",
          description: "محسّن للحوسبة الطرفية مع تسريع TensorRT-LLM",
          badge: "أداء عالي"
        },
        {
          icon: LineChart,
          title: "تحليلات متقدمة",
          description: "لوحات معلومات شاملة مع رؤى في الوقت الفعلي وتحليل تاريخي",
          badge: "قائم على البيانات"
        },
        {
          icon: Shield,
          title: "دعم متعدد الصناعات",
          description: "حلول مخصصة للتصنيع والتجزئة والرعاية الصحية والمدن الذكية",
          badge: "متعدد الاستخدامات"
        }
      ]
    }
  };

  const t = content[language];

  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            {t.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerChildren}
        >
          {t.features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="group hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}