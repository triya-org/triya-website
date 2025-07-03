"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Target, 
  Lightbulb, 
  Shield,
  Globe,
  Linkedin,
  Mail
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
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
        title: "Building the Future of",
        titleHighlight: "Intelligent Security",
        subtitle: "Triya.ai is revolutionizing surveillance with edge AI technology, bringing real-time intelligence to security operations across the GCC region."
      },
      mission: {
        title: "Our Mission",
        description: "To democratize AI-powered security by making advanced surveillance accessible, affordable, and effective for organizations of all sizes across the Middle East.",
        stats: [
          { label: "Founded", value: "2025" },
          { label: "Team Size", value: "15+" },
          { label: "Countries (target by end 2025)", value: "2" },
          { label: "Deployments (target by 2025)", value: "5+" }
        ]
      },
      values: {
        title: "Our Values",
        items: [
          {
            icon: Shield,
            title: "Security First",
            description: "On-premise processing ensures complete data sovereignty and privacy compliance."
          },
          {
            icon: Globe,
            title: "Regional Focus",
            description: "Built specifically for GCC markets with Arabic-first capabilities."
          },
          {
            icon: Lightbulb,
            title: "Innovation",
            description: "Pushing the boundaries of edge AI to deliver real-time intelligent solutions."
          },
          {
            icon: Users,
            title: "Customer Success",
            description: "Dedicated to helping our clients achieve their security objectives."
          }
        ]
      },
      cta: {
        title: "Join Us in Transforming Security",
        description: "Partner with us to bring intelligent surveillance to your organization",
        button: "Get Started"
      }
    },
    ar: {
      hero: {
        title: "بناء مستقبل",
        titleHighlight: "الأمن الذكي",
        subtitle: "تُحدث Triya.ai ثورة في المراقبة باستخدام تقنية الذكاء الاصطناعي الطرفي، مما يجلب الذكاء في الوقت الفعلي لعمليات الأمن في جميع أنحاء منطقة دول مجلس التعاون الخليجي."
      },
      mission: {
        title: "مهمتنا",
        description: "إضفاء الطابع الديمقراطي على الأمن المدعوم بالذكاء الاصطناعي من خلال جعل المراقبة المتقدمة في متناول الجميع وبأسعار معقولة وفعالة للمؤسسات من جميع الأحجام في جميع أنحاء الشرق الأوسط.",
        stats: [
          { label: "تأسست", value: "2025" },
          { label: "حجم الفريق", value: "15+" },
          { label: "البلدان (الهدف بنهاية 2025)", value: "2" },
          { label: "عمليات النشر (الهدف بحلول 2025)", value: "5+" }
        ]
      },
      values: {
        title: "قيمنا",
        items: [
          {
            icon: Shield,
            title: "الأمن أولاً",
            description: "تضمن المعالجة المحلية السيادة الكاملة على البيانات والامتثال للخصوصية."
          },
          {
            icon: Globe,
            title: "التركيز الإقليمي",
            description: "تم بناؤه خصيصًا لأسواق دول مجلس التعاون الخليجي مع قدرات عربية أولاً."
          },
          {
            icon: Lightbulb,
            title: "الابتكار",
            description: "دفع حدود الذكاء الاصطناعي الطرفي لتقديم حلول ذكية في الوقت الفعلي."
          },
          {
            icon: Users,
            title: "نجاح العملاء",
            description: "مكرسة لمساعدة عملائنا على تحقيق أهدافهم الأمنية."
          }
        ]
      },
      cta: {
        title: "انضم إلينا في تحويل الأمن",
        description: "شارك معنا لجلب المراقبة الذكية إلى مؤسستك",
        button: "ابدأ الآن"
      }
    }
  };

  const t = content[language];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              variants={fadeInUp}
            >
              {t.hero.title}{" "}
              <span className="text-primary">{t.hero.titleHighlight}</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground"
              variants={fadeInUp}
            >
              {t.hero.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-4xl mx-auto"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.mission.title}</h2>
              <p className="text-xl text-muted-foreground">{t.mission.description}</p>
            </motion.div>
            
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
              variants={fadeInUp}
            >
              {t.mission.stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
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
              {t.values.title}
            </motion.h2>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {t.values.items.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{value.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{value.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section - Hidden for now */}
      {/* Team content removed - can be re-enabled later */}

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
            <Button size="lg" className="gap-2" asChild>
              <Link href="/contact">
                {t.cta.button}
                <Mail className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}