"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Factory, 
  HardHat, 
  Shield, 
  AlertTriangle,
  BarChart3,
  Eye,
  ArrowRight,
  CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ManufacturingPage() {
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
        badge: "Manufacturing",
        title: "AI-Powered Safety and Security for",
        titleHighlight: "Manufacturing Facilities",
        subtitle: "Ensure worker safety, prevent equipment theft, and optimize production with edge AI surveillance tailored for industrial environments."
      },
      challenges: {
        title: "Manufacturing Security Challenges",
        items: [
          {
            icon: HardHat,
            title: "PPE Compliance",
            description: "Manual monitoring of safety gear compliance is inefficient and error-prone"
          },
          {
            icon: AlertTriangle,
            title: "Workplace Accidents",
            description: "Delayed response to safety incidents can lead to serious injuries"
          },
          {
            icon: Shield,
            title: "Equipment Theft",
            description: "High-value machinery and materials are vulnerable to theft"
          },
          {
            icon: BarChart3,
            title: "Productivity Tracking",
            description: "Limited visibility into production line efficiency and bottlenecks"
          }
        ]
      },
      solution: {
        title: "Triya.ai Manufacturing Solution",
        description: "Our edge AI platform transforms your existing security cameras into intelligent safety and productivity monitors.",
        features: [
          {
            title: "Real-time PPE Detection",
            description: "Instantly detect missing helmets, safety vests, gloves, and other protective equipment",
            stats: "99% accuracy"
          },
          {
            title: "Hazard Zone Monitoring",
            description: "Alert when workers enter restricted or dangerous areas without proper authorization",
            stats: "<500ms response"
          },
          {
            title: "Equipment Security",
            description: "Track machinery usage and detect unauthorized access or movement",
            stats: "24/7 monitoring"
          },
          {
            title: "Production Analytics",
            description: "Monitor workflow efficiency and identify bottlenecks in real-time",
            stats: "30% efficiency gain"
          }
        ]
      },
      benefits: {
        title: "Key Benefits",
        items: [
          "Reduce workplace accidents by up to 60%",
          "Ensure 100% PPE compliance automatically",
          "Prevent equipment theft and misuse",
          "Increase production efficiency by 30%",
          "Complete data sovereignty with on-premise processing",
          "Arabic and English language support"
        ]
      },
      cta: {
        title: "Transform Your Manufacturing Security",
        description: "See how Triya.ai can enhance safety and productivity in your facility",
        primaryButton: "Request Demo",
        secondaryButton: "Download Case Study"
      }
    },
    ar: {
      hero: {
        badge: "التصنيع",
        title: "الأمن والسلامة المدعومة بالذكاء الاصطناعي",
        titleHighlight: "لمرافق التصنيع",
        subtitle: "ضمان سلامة العمال، ومنع سرقة المعدات، وتحسين الإنتاج باستخدام مراقبة الذكاء الاصطناعي الطرفي المصممة للبيئات الصناعية."
      },
      challenges: {
        title: "تحديات أمن التصنيع",
        items: [
          {
            icon: HardHat,
            title: "الامتثال لمعدات الحماية الشخصية",
            description: "المراقبة اليدوية للامتثال لمعدات السلامة غير فعالة وعرضة للخطأ"
          },
          {
            icon: AlertTriangle,
            title: "حوادث مكان العمل",
            description: "التأخر في الاستجابة لحوادث السلامة يمكن أن يؤدي إلى إصابات خطيرة"
          },
          {
            icon: Shield,
            title: "سرقة المعدات",
            description: "الآلات والمواد عالية القيمة معرضة للسرقة"
          },
          {
            icon: BarChart3,
            title: "تتبع الإنتاجية",
            description: "رؤية محدودة لكفاءة خط الإنتاج والاختناقات"
          }
        ]
      },
      solution: {
        title: "حل Triya.ai للتصنيع",
        description: "تحول منصة الذكاء الاصطناعي الطرفي الخاصة بنا كاميرات الأمان الموجودة لديك إلى أجهزة مراقبة ذكية للسلامة والإنتاجية.",
        features: [
          {
            title: "كشف معدات الحماية الشخصية في الوقت الفعلي",
            description: "اكتشف على الفور الخوذات المفقودة وسترات الأمان والقفازات وغيرها من معدات الحماية",
            stats: "دقة 99%"
          },
          {
            title: "مراقبة منطقة الخطر",
            description: "التنبيه عندما يدخل العمال مناطق محظورة أو خطرة دون إذن مناسب",
            stats: "استجابة <500ms"
          },
          {
            title: "أمن المعدات",
            description: "تتبع استخدام الآلات واكتشاف الوصول أو الحركة غير المصرح بها",
            stats: "مراقبة 24/7"
          },
          {
            title: "تحليلات الإنتاج",
            description: "مراقبة كفاءة سير العمل وتحديد الاختناقات في الوقت الفعلي",
            stats: "زيادة الكفاءة 30%"
          }
        ]
      },
      benefits: {
        title: "الفوائد الرئيسية",
        items: [
          "تقليل حوادث مكان العمل بنسبة تصل إلى 60%",
          "ضمان الامتثال لمعدات الحماية الشخصية بنسبة 100% تلقائيًا",
          "منع سرقة المعدات وسوء الاستخدام",
          "زيادة كفاءة الإنتاج بنسبة 30%",
          "السيادة الكاملة على البيانات مع المعالجة المحلية",
          "دعم اللغتين العربية والإنجليزية"
        ]
      },
      cta: {
        title: "حوّل أمن التصنيع الخاص بك",
        description: "اكتشف كيف يمكن لـ Triya.ai تعزيز السلامة والإنتاجية في منشأتك",
        primaryButton: "طلب عرض توضيحي",
        secondaryButton: "تحميل دراسة الحالة"
      }
    }
  };

  const t = content[language];

  return (
    <>
      {/* Hero Section */}
      <section className="relative h-[70vh] md:h-[65vh] flex items-center justify-center overflow-hidden">
        {/* Video Background Container */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          >
            <source src="/videos/manufacturing_hero_1.mp4" type="video/mp4" />
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
                <Factory className="h-3 w-3 mr-1" />
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
                <Link href="/contact">
                  {t.cta.primaryButton} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20" asChild>
                <Link href="/contact">
                  {t.cta.secondaryButton}
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
              <Button size="lg" className="gap-2" asChild>
                <Link href="/contact">
                  {t.cta.primaryButton} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  {t.cta.secondaryButton}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}