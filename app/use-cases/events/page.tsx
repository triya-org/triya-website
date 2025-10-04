"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Calendar, 
  Users, 
  Shield, 
  BarChart3,
  Eye,
  Trophy,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function EventsPage() {
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
        badge: "Event Management",
        title: "AI-Powered Security for",
        titleHighlight: "Major Events",
        subtitle: "Ensure attendee safety, optimize crowd flow, and enhance event experiences with intelligent surveillance."
      },
      caseStudy: {
        badge: "Case Study",
        title: "Make it in the Emirates 2025",
        subtitle: "Abu Dhabi's Premier Manufacturing & Technology Expo",
        stats: [
          { value: "20%", label: "Reduced Wait Time" },
          { value: "Zero", label: "VIP Delays" },
          { value: "30%", label: "More Sponsor Visibility" },
          { value: "300+", label: "VIPs Protected" }
        ],
        challenges: {
          title: "Event Challenges",
          items: [
            "Managing 10,000+ attendees across multiple exhibition halls",
            "Ensuring smooth VIP movement through dedicated corridors",
            "Optimizing visitor flow to maximize sponsor engagement",
            "Real-time crowd density monitoring for safety"
          ]
        },
        solution: {
          title: "Triya.ai Solution",
          items: [
            {
              title: "Real-time Queue Analytics",
              description: "Monitored entry points and registration desks, reducing wait times by 20% through dynamic staff allocation"
            },
            {
              title: "VIP Corridor Protection",
              description: "Ensured zero delays for 300+ VIP guests with dedicated pathway monitoring and instant alerts"
            },
            {
              title: "Strategic Flow Optimization",
              description: "Increased sponsor booth visibility by 30% through intelligent visitor routing"
            },
            {
              title: "Actionable Analytics",
              description: "Provided real-time insights enabling 5-10% traffic rebalancing throughout the event"
            }
          ]
        }
      },
      features: {
        title: "Event Security Features",
        items: [
          {
            icon: Users,
            title: "Crowd Density Monitoring",
            description: "Real-time analysis of crowd density to prevent dangerous situations",
            stats: "AI-powered alerts"
          },
          {
            icon: Shield,
            title: "VIP Protection",
            description: "Dedicated monitoring for VIP areas and movement corridors",
            stats: "Zero incidents"
          },
          {
            icon: Clock,
            title: "Queue Management",
            description: "Monitor and optimize entry points, registration, and key areas",
            stats: "50% faster entry"
          },
          {
            icon: BarChart3,
            title: "Event Analytics",
            description: "Comprehensive insights on attendee flow and engagement",
            stats: "Real-time dashboard"
          }
        ]
      },
      benefits: {
        title: "Why Choose Triya.ai for Events",
        items: [
          "Ensure attendee safety with real-time crowd monitoring",
          "Optimize visitor flow and reduce congestion",
          "Protect VIPs with dedicated surveillance",
          "Increase sponsor ROI through strategic placement insights",
          "Complete Arabic and English support",
          "On-premise processing ensures data privacy"
        ]
      },
      cta: {
        title: "Secure Your Next Event",
        description: "See how Triya.ai can transform your event security and analytics",
        primaryButton: "Request Demo",
      }
    },
    ar: {
      hero: {
        badge: "إدارة الفعاليات",
        title: "الأمن المدعوم بالذكاء الاصطناعي",
        titleHighlight: "للأحداث الكبرى",
        subtitle: "ضمان سلامة الحضور وتحسين تدفق الحشود وتعزيز تجارب الأحداث بالمراقبة الذكية."
      },
      caseStudy: {
        badge: "دراسة حالة",
        title: "اصنع في الإمارات 2025",
        subtitle: "معرض أبوظبي الرائد للتصنيع والتكنولوجيا",
        stats: [
          { value: "20%", label: "تقليل وقت الانتظار" },
          { value: "صفر", label: "تأخير كبار الشخصيات" },
          { value: "30%", label: "زيادة رؤية الرعاة" },
          { value: "300+", label: "حماية كبار الشخصيات" }
        ],
        challenges: {
          title: "تحديات الحدث",
          items: [
            "إدارة أكثر من 10,000 حاضر عبر قاعات عرض متعددة",
            "ضمان حركة سلسة لكبار الشخصيات عبر ممرات مخصصة",
            "تحسين تدفق الزوار لزيادة مشاركة الرعاة",
            "مراقبة كثافة الحشود في الوقت الفعلي للسلامة"
          ]
        },
        solution: {
          title: "حل Triya.ai",
          items: [
            {
              title: "تحليلات الطوابير في الوقت الفعلي",
              description: "مراقبة نقاط الدخول ومكاتب التسجيل، مما قلل أوقات الانتظار بنسبة 20% من خلال التخصيص الديناميكي للموظفين"
            },
            {
              title: "حماية ممر كبار الشخصيات",
              description: "ضمان عدم التأخير لأكثر من 300 ضيف من كبار الشخصيات مع مراقبة المسار المخصص والتنبيهات الفورية"
            },
            {
              title: "تحسين التدفق الاستراتيجي",
              description: "زيادة رؤية أكشاك الرعاة بنسبة 30% من خلال توجيه الزوار الذكي"
            },
            {
              title: "تحليلات قابلة للتنفيذ",
              description: "توفير رؤى في الوقت الفعلي تمكن من إعادة توازن حركة المرور بنسبة 5-10% طوال الحدث"
            }
          ]
        }
      },
      features: {
        title: "ميزات أمن الأحداث",
        items: [
          {
            icon: Users,
            title: "مراقبة كثافة الحشود",
            description: "تحليل في الوقت الفعلي لكثافة الحشود لمنع المواقف الخطرة",
            stats: "تنبيهات بالذكاء الاصطناعي"
          },
          {
            icon: Shield,
            title: "حماية كبار الشخصيات",
            description: "مراقبة مخصصة لمناطق كبار الشخصيات وممرات الحركة",
            stats: "صفر حوادث"
          },
          {
            icon: Clock,
            title: "إدارة الطوابير",
            description: "مراقبة وتحسين نقاط الدخول والتسجيل والمناطق الرئيسية",
            stats: "دخول أسرع 50%"
          },
          {
            icon: BarChart3,
            title: "تحليلات الأحداث",
            description: "رؤى شاملة حول تدفق الحضور والمشاركة",
            stats: "لوحة معلومات فورية"
          }
        ]
      },
      benefits: {
        title: "لماذا تختار Triya.ai للأحداث",
        items: [
          "ضمان سلامة الحضور مع مراقبة الحشود في الوقت الفعلي",
          "تحسين تدفق الزوار وتقليل الازدحام",
          "حماية كبار الشخصيات بمراقبة مخصصة",
          "زيادة عائد استثمار الرعاة من خلال رؤى التوضع الاستراتيجي",
          "دعم كامل باللغتين العربية والإنجليزية",
          "المعالجة المحلية تضمن خصوصية البيانات"
        ]
      },
      cta: {
        title: "أمّن حدثك القادم",
        description: "اكتشف كيف يمكن لـ Triya.ai تحويل أمن وتحليلات حدثك",
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
          >
            <source src="/videos/event_hero_4.mp4" type="video/mp4" />
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
                <Calendar className="h-3 w-3 mr-1" />
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

      {/* Case Study Section */}
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
              <Badge variant="outline" className="mb-4">
                <Trophy className="h-3 w-3 mr-1" />
                {t.caseStudy.badge}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.caseStudy.title}
              </h2>
              <p className="text-xl text-muted-foreground">
                {t.caseStudy.subtitle}
              </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12"
              variants={fadeInUp}
            >
              {t.caseStudy.stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-6">
                    <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>

            {/* Challenges & Solutions */}
            <div className="grid gap-8 lg:grid-cols-2">
              <motion.div variants={fadeInUp}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      {t.caseStudy.challenges.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {t.caseStudy.challenges.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="h-2 w-2 rounded-full bg-destructive/50 mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={fadeInUp}>
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      {t.caseStudy.solution.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {t.caseStudy.solution.items.map((item, index) => (
                      <div key={index}>
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
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
              {t.features.title}
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {t.features.items.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-xl">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="mb-4">{feature.description}</CardDescription>
                        <Badge variant="secondary">{feature.stats}</Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
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
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}