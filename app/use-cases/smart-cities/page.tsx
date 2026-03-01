"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Building2, 
  Car, 
  Users, 
  AlertTriangle,
  Camera,
  TrafficCone,
  ArrowRight,
  CheckCircle2,
  Map
} from "lucide-react";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export default function SmartCitiesPage() {
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const content = {
    en: {
      hero: {
        badge: "Smart Cities",
        title: "Intelligent Urban Surveillance for",
        titleHighlight: "Safer Cities",
        subtitle: "Transform urban infrastructure with AI-powered monitoring for traffic management, public safety, and city analytics."
      },
      challenges: {
        title: "Urban Security & Management Challenges",
        items: [
          {
            icon: Car,
            title: "Traffic Congestion",
            description: "Managing traffic flow and detecting incidents in real-time across city streets"
          },
          {
            icon: Users,
            title: "Crowd Control",
            description: "Monitoring large gatherings and preventing dangerous crowd density"
          },
          {
            icon: AlertTriangle,
            title: "Incident Response",
            description: "Delayed detection and response to accidents, crimes, or emergencies"
          },
          {
            icon: Map,
            title: "Urban Planning",
            description: "Limited data on pedestrian and vehicle patterns for city planning"
          }
        ]
      },
      solution: {
        title: "Triya.ai Smart City Solution",
        description: "Create safer, more efficient cities with edge AI surveillance and analytics.",
        features: [
          {
            title: "Traffic Flow Optimization",
            description: "Monitor traffic patterns and detect congestion, accidents, or violations in real-time",
            stats: "30% less congestion"
          },
          {
            title: "Public Safety Monitoring",
            description: "Detect suspicious behavior, unattended objects, and security threats automatically",
            stats: "50% faster response"
          },
          {
            title: "Crowd Analytics",
            description: "Monitor crowd density and movement patterns to prevent stampedes and optimize flow",
            stats: "Real-time alerts"
          },
          {
            title: "Urban Analytics Dashboard",
            description: "Comprehensive city-wide insights for better planning and resource allocation",
            stats: "Data-driven decisions"
          }
        ]
      },
      benefits: {
        title: "Key Benefits",
        items: [
          "Reduce traffic congestion by 30%",
          "Improve emergency response time by 50%",
          "Prevent crowd-related incidents",
          "Optimize city resource allocation",
          "Complete data sovereignty for citizens",
          "Arabic and English command center interface"
        ]
      },
      cta: {
        title: "Build Your Smart City Infrastructure",
        description: "Discover how AI can make your city safer and more efficient",
        primaryButton: "Request Demo",
      }
    },
    ar: {
      hero: {
        badge: "المدن الذكية",
        title: "المراقبة الحضرية الذكية",
        titleHighlight: "لمدن أكثر أماناً",
        subtitle: "حوّل البنية التحتية الحضرية بمراقبة مدعومة بالذكاء الاصطناعي لإدارة حركة المرور والسلامة العامة وتحليلات المدينة."
      },
      challenges: {
        title: "تحديات الأمن والإدارة الحضرية",
        items: [
          {
            icon: Car,
            title: "ازدحام المرور",
            description: "إدارة تدفق حركة المرور واكتشاف الحوادث في الوقت الفعلي عبر شوارع المدينة"
          },
          {
            icon: Users,
            title: "السيطرة على الحشود",
            description: "مراقبة التجمعات الكبيرة ومنع كثافة الحشود الخطرة"
          },
          {
            icon: AlertTriangle,
            title: "الاستجابة للحوادث",
            description: "التأخر في اكتشاف الحوادث أو الجرائم أو حالات الطوارئ والاستجابة لها"
          },
          {
            icon: Map,
            title: "التخطيط الحضري",
            description: "بيانات محدودة عن أنماط المشاة والمركبات للتخطيط الحضري"
          }
        ]
      },
      solution: {
        title: "حل Triya.ai للمدن الذكية",
        description: "أنشئ مدناً أكثر أماناً وكفاءة مع مراقبة وتحليلات الذكاء الاصطناعي الطرفي.",
        features: [
          {
            title: "تحسين تدفق حركة المرور",
            description: "مراقبة أنماط حركة المرور واكتشاف الازدحام أو الحوادث أو المخالفات في الوقت الفعلي",
            stats: "ازدحام أقل 30%"
          },
          {
            title: "مراقبة السلامة العامة",
            description: "اكتشاف السلوك المشبوه والأشياء المتروكة والتهديدات الأمنية تلقائياً",
            stats: "استجابة أسرع 50%"
          },
          {
            title: "تحليلات الحشود",
            description: "مراقبة كثافة الحشود وأنماط الحركة لمنع التدافع وتحسين التدفق",
            stats: "تنبيهات فورية"
          },
          {
            title: "لوحة تحليلات حضرية",
            description: "رؤى شاملة على مستوى المدينة لتحسين التخطيط وتخصيص الموارد",
            stats: "قرارات مبنية على البيانات"
          }
        ]
      },
      benefits: {
        title: "الفوائد الرئيسية",
        items: [
          "تقليل ازدحام المرور بنسبة 30%",
          "تحسين وقت الاستجابة للطوارئ بنسبة 50%",
          "منع الحوادث المتعلقة بالحشود",
          "تحسين تخصيص موارد المدينة",
          "السيادة الكاملة على بيانات المواطنين",
          "واجهة مركز القيادة باللغتين العربية والإنجليزية"
        ]
      },
      cta: {
        title: "ابنِ البنية التحتية لمدينتك الذكية",
        description: "اكتشف كيف يمكن للذكاء الاصطناعي جعل مدينتك أكثر أماناً وكفاءة",
        primaryButton: "طلب عرض توضيحي",
      }
    }
  };

  const t = content[language];

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] md:h-[65vh] flex items-center justify-center overflow-hidden py-20 md:py-0">
        {/* Video Background Container */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            aria-label="Smart city AI surveillance system monitoring urban traffic flow, crowd management, and public safety - intelligent cameras for city-wide security and analytics"
          >
            <source src="/videos/smartcity_hero_1.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">
                <Building2 className="h-3 w-3 mr-1" />
                {t.hero.badge}
              </Badge>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white"
              variants={fadeInUp}
            >
              {t.hero.title}{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{t.hero.titleHighlight}</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-gray-200 mb-8"
              variants={fadeInUp}
            >
              {t.hero.subtitle}
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" asChild>
                <Link href="/contact/">
                  {t.cta.primaryButton} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              variants={fadeInUp}
            >
              {t.challenges.title}
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {t.challenges.items.map((challenge, index) => {
                const Icon = challenge.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="text-xl">{challenge.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-6xl mx-auto"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.solution.title}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.solution.description}
              </p>
            </motion.div>
            
            <div className="grid gap-8 md:grid-cols-2">
              {t.solution.features.map((feature, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {feature.stats}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-4xl mx-auto"
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              variants={fadeInUp}
            >
              {t.benefits.title}
            </motion.h2>
            <motion.div 
              className="grid gap-4 md:grid-cols-2"
              variants={fadeInUp}
            >
              {t.benefits.items.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Related Use Cases */}
      
      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.cta.title}</h2>
            <p className="text-xl text-muted-foreground mb-8">{t.cta.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                {t.cta.primaryButton} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}