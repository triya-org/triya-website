"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Mail, Phone, Linkedin } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const getContent = (language: "en" | "ar") => ({
  en: {
    description: "Transform any camera into a privacy-first, AI-powered security & analytics solution",
    industries: "Industries",
    industryItems: [
      { title: "Manufacturing", href: "/use-cases/manufacturing" },
      { title: "Retail", href: "/use-cases/retail" },
      { title: "Event Management", href: "/use-cases/events" },
      { title: "Smart Cities", href: "/use-cases/smart-cities" },
    ],
    contactUs: "Contact Us",
    headquarters: "Headquarters",
    headquartersLocation: "Abu Dhabi Global Market, UAE",
    copyright: "© 2025 Triya.ai. All rights reserved.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service"
  },
  ar: {
    description: "حوّل أي كاميرا إلى حل أمني وتحليلي مدعوم بالذكاء الاصطناعي ويحمي الخصوصية",
    industries: "الصناعات",
    industryItems: [
      { title: "التصنيع", href: "/use-cases/manufacturing" },
      { title: "التجزئة", href: "/use-cases/retail" },
      { title: "إدارة الفعاليات", href: "/use-cases/events" },
      { title: "المدن الذكية", href: "/use-cases/smart-cities" },
    ],
    contactUs: "اتصل بنا",
    headquarters: "المقر الرئيسي",
    headquartersLocation: "سوق أبوظبي العالمي، الإمارات",
    copyright: "© 2025 Triya.ai. جميع الحقوق محفوظة.",
    privacyPolicy: "سياسة الخصوصية",
    termsOfService: "شروط الخدمة"
  }
}[language]);

export function Footer() {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const { trackLinkedInClick } = useAnalytics();
  
  useEffect(() => {
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);
  
  const t = getContent(language);
  
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <Image
              src="/brand_kit_transparent_logo.png"
              alt="Triya.ai"
              width={885}
              height={210}
              className="h-10 w-auto"
            />
            <p className="text-sm text-muted-foreground">
              {t.description}
            </p>
            <div className="flex space-x-4">
              <Link href="https://www.linkedin.com/company/triyaai/about/" target="_blank" onClick={trackLinkedInClick}>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          
          
          {/* Industries */}
          <div className="space-y-4">
            <h4 className="font-semibold">{t.industries}</h4>
            <nav className="flex flex-col space-y-2">
              {t.industryItems.map((industry) => (
                <Link 
                  key={industry.href}
                  href={industry.href} 
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  {industry.title}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">{t.contactUs}</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t.headquartersLocation}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="hover:text-primary">
                  founders@triya.ai
                </span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span className="hover:text-primary">
                  +971-58-68-1200
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-sm text-muted-foreground">
              {t.copyright}
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                {t.privacyPolicy}
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                {t.termsOfService}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}