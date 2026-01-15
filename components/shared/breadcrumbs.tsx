"use client";

import Link from "next/link";
import { ChevronRight, ChevronLeft, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
    }
  }, []);
  
  // Translations
  const translations = {
    en: {
      home: "Home",
      blog: "Blog",
      faq: "FAQ",
      contact: "Contact",
      "use-cases": "Use Cases",
      "smart-cities": "Smart Cities",
      about: "About",
      pricing: "Pricing"
    },
    ar: {
      home: "الرئيسية",
      blog: "المدونة",
      faq: "الأسئلة الشائعة",
      contact: "اتصل بنا",
      "use-cases": "حالات الاستخدام",
      "smart-cities": "المدن الذكية",
      about: "من نحن",
      pricing: "الأسعار"
    }
  };

  // Select appropriate chevron icon based on language
  const ChevronIcon = language === "ar" ? ChevronLeft : ChevronRight;
  
  // Don't show breadcrumbs on homepage
  if (pathname === "/" || pathname === "") return null;
  
  // Don't show breadcrumbs on use-cases pages (no use-cases index page exists)
  if (pathname.includes("/use-cases/")) return null;
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: translations[language].home, href: "/" }
    ];
    
    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Try to get translation first
      let label = translations[language][segment as keyof typeof translations.en] || 
        // If no translation, format the label (capitalize, replace hyphens)
        segment
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      
      items.push({
        label,
        href: currentPath
      });
    });
    
    return items;
  };
  
  const breadcrumbs = generateBreadcrumbs();
  
  // Generate schema
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": index === breadcrumbs.length - 1 ? undefined : `https://www.triya.ai${item.href}`
    }))
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      
      <nav aria-label="Breadcrumb" className="py-3 px-4 sm:px-6 bg-muted/30">
        <div className="container mx-auto">
          <ol className={`flex items-center text-sm ${language === "ar" ? "gap-2" : "space-x-2"}`}>
            {breadcrumbs.map((item, index) => (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronIcon className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
                
                {index === breadcrumbs.length - 1 ? (
                  // Current page (not clickable)
                  <span className="text-foreground font-medium">
                    {index === 0 && <Home className={`h-4 w-4 inline ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                    {item.label}
                  </span>
                ) : (
                  // Clickable breadcrumb
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {index === 0 && <Home className={`h-4 w-4 inline ${language === "ar" ? "ml-1" : "mr-1"}`} />}
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </>
  );
}