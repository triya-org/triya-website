"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import React from "react";
import { MobileNav } from "./mobile-nav";

const getContent = (language: "en" | "ar") => ({
  en: {
    industries: "Industries",
    contact: "Contact",
    requestDemo: "Request Demo",
    industryItems: [
      {
        title: "Manufacturing",
        href: "/use-cases/manufacturing",
        description: "PPE compliance and safety monitoring for industrial facilities",
      },
      {
        title: "Retail",
        href: "/use-cases/retail",
        description: "Theft prevention and customer analytics for stores",
      },
      {
        title: "Smart Cities",
        href: "/use-cases/smart-cities",
        description: "Traffic management and public safety solutions",
      },
      {
        title: "Event Management",
        href: "/use-cases/events",
        description: "Crowd analytics and security for major events",
      },
    ]
  },
  ar: {
    industries: "الصناعات",
    contact: "اتصل بنا",
    requestDemo: "طلب عرض توضيحي",
    industryItems: [
      {
        title: "التصنيع",
        href: "/use-cases/manufacturing",
        description: "الامتثال لمعدات الحماية الشخصية ومراقبة السلامة للمرافق الصناعية",
      },
      {
        title: "التجزئة",
        href: "/use-cases/retail",
        description: "منع السرقة وتحليلات العملاء للمتاجر",
      },
      {
        title: "المدن الذكية",
        href: "/use-cases/smart-cities",
        description: "إدارة حركة المرور وحلول السلامة العامة",
      },
      {
        title: "إدارة الفعاليات",
        href: "/use-cases/events",
        description: "تحليلات الحشود والأمن للأحداث الكبرى",
      },
    ]
  }
}[language]);

export function Navbar() {
  const [language, setLanguage] = React.useState<"en" | "ar">("en");
  const { trackRequestDemo } = useAnalytics();

  React.useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
    localStorage.setItem("language", newLang);
    document.documentElement.dir = newLang === "ar" ? "rtl" : "ltr";
    // Reload page to apply language changes
    window.location.reload();
  };

  const t = getContent(language);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Image
            src="/triya_ai_new_logo.png"
            alt="Triya AI - Edge AI Surveillance Platform with 85% Cost Savings"
            width={885}
            height={210}
            className="h-10 md:h-12 w-auto"
            priority
          />
        </Link>
        
        <NavigationMenu className="mx-6 hidden md:flex">
          <NavigationMenuList>
            {/* Product menu hidden for now - will be added once product is built
            <NavigationMenuItem>
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Edge AI Platform
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Transform any camera into an AI-powered security system with Arabic-first capabilities
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/features" title="Features">
                    Real-time analytics, on-premise processing, 99% Arabic accuracy
                  </ListItem>
                  <ListItem href="/technology" title="Technology">
                    NVIDIA Jetson powered edge computing with sub-500ms latency
                  </ListItem>
                  <ListItem href="/pricing" title="Pricing">
                    85% cost reduction compared to cloud alternatives
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            */}
            
            <NavigationMenuItem>
              <NavigationMenuTrigger>{t.industries}</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {t.industryItems.map((industry) => (
                    <ListItem
                      key={industry.title}
                      title={industry.title}
                      href={industry.href}
                    >
                      {industry.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            
            <NavigationMenuItem>
              <Link href="/contact" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  {t.contact}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        
        <div className="ml-auto flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="outline" onClick={toggleLanguage}>
              {language === "en" ? "العربية" : "English"}
            </Button>
            <Button asChild onClick={() => trackRequestDemo('Navbar')}>
              <Link href="/contact">{t.requestDemo}</Link>
            </Button>
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";