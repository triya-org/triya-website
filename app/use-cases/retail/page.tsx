"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  ShieldAlert,
  Eye,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function RetailPage() {
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
        badge: "Retail",
        title: "Intelligent Security and Analytics for",
        titleHighlight: "Retail Environments",
        subtitle: "Prevent losses, enhance customer experience, and optimize operations with AI-powered surveillance designed for modern retail."
      },
      challenges: {
        title: "Retail Security & Operations Challenges",
        items: [
          {
            icon: ShieldAlert,
            title: "Shoplifting & Theft",
            description: "Annual shrinkage costs retailers billions with traditional security unable to prevent losses"
          },
          {
            icon: Users,
            title: "Customer Experience",
            description: "Long queues and poor service lead to customer dissatisfaction and lost sales"
          },
          {
            icon: TrendingUp,
            title: "Store Analytics",
            description: "Limited insights into customer behavior and store performance"
          },
          {
            icon: Clock,
            title: "Incident Response",
            description: "Delayed detection and response to security incidents"
          }
        ]
      },
      solution: {
        title: "Triya.ai Retail Solution",
        description: "Transform your store cameras into intelligent business tools that protect assets and drive revenue.",
        features: [
          {
            title: "Real-time Theft Detection",
            description: "Identify suspicious behavior and alert staff instantly to prevent losses",
            stats: "70% loss reduction"
          },
          {
            title: "Queue Management",
            description: "Monitor checkout lines and alert staff when additional registers are needed",
            stats: "40% faster checkout"
          },
          {
            title: "Customer Analytics",
            description: "Track foot traffic, dwell time, and shopping patterns to optimize layout",
            stats: "25% sales increase"
          },
          {
            title: "Heat Mapping",
            description: "Visualize customer movement patterns to improve product placement",
            stats: "Real-time insights"
          }
        ]
      },
      benefits: {
        title: "Key Benefits",
        items: [
          "Reduce shrinkage by up to 70%",
          "Improve customer satisfaction scores by 35%",
          "Increase sales conversion by 25%",
          "Optimize staff allocation in real-time",
          "Complete GDPR/PDPL compliance",
          "Arabic and English customer insights"
        ]
      },
      stats: {
        title: "Proven Results",
        items: [
          { value: "70%", label: "Reduction in Theft" },
          { value: "40%", label: "Faster Checkout" },
          { value: "25%", label: "Sales Increase" },
          { value: "<500ms", label: "Alert Response" }
        ]
      },
      cta: {
        title: "Revolutionize Your Retail Security",
        description: "Discover how AI can protect your assets and enhance customer experience",
        primaryButton: "Schedule Demo",
      }
    },
    ar: {
      hero: {
        badge: "التجزئة",
        title: "الأمن والتحليلات الذكية",
        titleHighlight: "لبيئات التجزئة",
        subtitle: "منع الخسائر وتعزيز تجربة العملاء وتحسين العمليات باستخدام المراقبة المدعومة بالذكاء الاصطناعي المصممة للتجزئة الحديثة."
      },
      challenges: {
        title: "تحديات أمن وعمليات التجزئة",
        items: [
          {
            icon: ShieldAlert,
            title: "السرقة من المتاجر",
            description: "تكلف الخسائر السنوية تجار التجزئة المليارات مع عدم قدرة الأمن التقليدي على منع الخسائر"
          },
          {
            icon: Users,
            title: "تجربة العملاء",
            description: "الطوابير الطويلة والخدمة السيئة تؤدي إلى عدم رضا العملاء وخسارة المبيعات"
          },
          {
            icon: TrendingUp,
            title: "تحليلات المتجر",
            description: "رؤى محدودة حول سلوك العملاء وأداء المتجر"
          },
          {
            icon: Clock,
            title: "الاستجابة للحوادث",
            description: "التأخر في اكتشاف الحوادث الأمنية والاستجابة لها"
          }
        ]
      },
      solution: {
        title: "حل Triya.ai للتجزئة",
        description: "حوّل كاميرات متجرك إلى أدوات أعمال ذكية تحمي الأصول وتزيد الإيرادات.",
        features: [
          {
            title: "كشف السرقة في الوقت الفعلي",
            description: "تحديد السلوك المشبوه وتنبيه الموظفين على الفور لمنع الخسائر",
            stats: "تقليل الخسائر 70%"
          },
          {
            title: "إدارة الطوابير",
            description: "مراقبة خطوط الدفع وتنبيه الموظفين عند الحاجة إلى سجلات إضافية",
            stats: "دفع أسرع 40%"
          },
          {
            title: "تحليلات العملاء",
            description: "تتبع حركة المرور ووقت البقاء وأنماط التسوق لتحسين التصميم",
            stats: "زيادة المبيعات 25%"
          },
          {
            title: "خرائط الحرارة",
            description: "تصور أنماط حركة العملاء لتحسين وضع المنتج",
            stats: "رؤى في الوقت الفعلي"
          }
        ]
      },
      benefits: {
        title: "الفوائد الرئيسية",
        items: [
          "تقليل الانكماش بنسبة تصل إلى 70%",
          "تحسين درجات رضا العملاء بنسبة 35%",
          "زيادة تحويل المبيعات بنسبة 25%",
          "تحسين تخصيص الموظفين في الوقت الفعلي",
          "الامتثال الكامل لـ GDPR/PDPL",
          "رؤى العملاء باللغتين العربية والإنجليزية"
        ]
      },
      stats: {
        title: "نتائج مثبتة",
        items: [
          { value: "70%", label: "تقليل السرقة" },
          { value: "40%", label: "دفع أسرع" },
          { value: "25%", label: "زيادة المبيعات" },
          { value: "<500ms", label: "استجابة التنبيه" }
        ]
      },
      cta: {
        title: "ثورة في أمن التجزئة الخاص بك",
        description: "اكتشف كيف يمكن للذكاء الاصطناعي حماية أصولك وتعزيز تجربة العملاء",
        primaryButton: "جدولة عرض توضيحي",
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
          >
            <source src="/videos/retail_hero_1.mp4" type="video/mp4" />
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
                <ShoppingCart className="h-3 w-3 mr-1" />
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
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-6xl mx-auto"
          >
            <motion.h2 
              className="text-2xl md:text-3xl font-bold text-center mb-8"
              variants={fadeInUp}
            >
              {t.stats.title}
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {t.stats.items.map((stat, index) => (
                <motion.div 
                  key={index} 
                  variants={fadeInUp}
                  className="text-center"
                >
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-24">
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
      <section className="py-24 bg-muted/50">
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
      <section className="py-24">
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
      <section className="py-24 bg-primary/5">
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