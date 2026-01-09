"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Factory, ShoppingCart, Building2, Calendar } from "lucide-react";

interface UseCasesProps {
  language: "en" | "ar";
}

export function UseCases({ language }: UseCasesProps) {
  const content = {
    en: {
      title: "Industry Solutions",
      subtitle: "Tailored AI surveillance for every sector",
      cta: "Learn More",
      industries: [
        {
          icon: Factory,
          slug: "manufacturing",
          title: "Manufacturing",
          description: "Monitor production lines, ensure worker safety, and prevent equipment theft with 24/7 AI surveillance.",
          features: ["Safety compliance monitoring", "Theft prevention", "Quality control", "Worker productivity"],
          image: "/images/industries/manufacturing_1.png"
        },
        {
          icon: ShoppingCart,
          slug: "retail",
          title: "Retail",
          description: "Enhance customer experience, prevent shoplifting, and optimize store operations with intelligent monitoring.",
          features: ["Loss prevention", "Customer analytics", "Queue management", "Heat mapping"],
          image: "/images/industries/retail_1.png"
        },
        {
          icon: Building2,
          slug: "smart-cities",
          title: "Smart Cities",
          description: "Create safer urban environments with traffic monitoring, crowd management, and incident detection.",
          features: ["Traffic analysis", "Crowd control", "Incident response", "Public safety"],
          image: "/images/industries/smart-cities_1.png"
        },
        {
          icon: Calendar,
          slug: "events",
          title: "Event Management",
          description: "Ensure attendee safety, optimize crowd flow, and enhance event experiences with intelligent surveillance.",
          features: ["Real-time queue analytics", "VIP corridor protection", "Strategic flow optimization", "Actionable analytics"],
          image: "/images/industries/events_1.png"
        }
      ]
    },
    ar: {
      title: "حلول الصناعة",
      subtitle: "مراقبة بالذكاء الاصطناعي مخصصة لكل قطاع",
      cta: "اعرف المزيد",
      industries: [
        {
          icon: Factory,
          slug: "manufacturing",
          title: "التصنيع",
          description: "راقب خطوط الإنتاج، وتأكد من سلامة العمال، وامنع سرقة المعدات بمراقبة على مدار الساعة.",
          features: ["مراقبة الامتثال للسلامة", "منع السرقة", "مراقبة الجودة", "إنتاجية العمال"],
          image: "/images/industries/manufacturing_1.png"
        },
        {
          icon: ShoppingCart,
          slug: "retail",
          title: "التجزئة",
          description: "حسّن تجربة العملاء، وامنع السرقة، وحسّن عمليات المتجر بالمراقبة الذكية.",
          features: ["منع الخسائر", "تحليلات العملاء", "إدارة الطوابير", "خرائط الحرارة"],
          image: "/images/industries/retail_1.png"
        },
        {
          icon: Building2,
          slug: "smart-cities",
          title: "المدن الذكية",
          description: "أنشئ بيئات حضرية أكثر أماناً مع مراقبة حركة المرور وإدارة الحشود وكشف الحوادث.",
          features: ["تحليل المرور", "السيطرة على الحشود", "الاستجابة للحوادث", "السلامة العامة"],
          image: "/images/industries/smart-cities_1.png"
        },
        {
          icon: Calendar,
          slug: "events",
          title: "إدارة الفعاليات",
          description: "ضمان سلامة الحضور وتحسين تدفق الحشود وتعزيز تجارب الأحداث بالمراقبة الذكية.",
          features: ["تحليلات الطوابير الفورية", "حماية ممر كبار الشخصيات", "تحسين التدفق الاستراتيجي", "تحليلات قابلة للتنفيذ"],
          image: "/images/industries/events_1.png"
        }
      ]
    }
  };

  const t = content[language];

  return (
    <section className="py-24 bg-muted/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            {t.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {t.industries.map((industry, index) => {
            const Icon = industry.icon;
            return (
              <Card key={index} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="grid md:grid-cols-2 h-full">
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src={industry.image}
                      alt={`${industry.title} AI surveillance - ${industry.description.substring(0, 60)}...`}
                      width={400}
                      height={300}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between">
                    <div>
                      <CardHeader className="p-0 mb-4">
                        <CardTitle className="text-2xl flex items-center gap-3">
                          <Icon className="h-6 w-6 text-primary" />
                          {industry.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <CardDescription className="text-base mb-4">
                          {industry.description}
                        </CardDescription>
                        <ul className="space-y-2 mb-6">
                          {industry.features.slice(0, 3).map((feature, idx) => (
                            <li key={idx} className="flex items-center text-sm text-muted-foreground">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </div>
                    <Link href={`/use-cases/${industry.slug}`}>
                      <Button variant="outline" className="w-full group/btn">
                        {t.cta}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}