"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  /* Product menu hidden for now - will be added once product is built
  {
    title: "Product",
    items: [
      { title: "Features", href: "/features" },
      { title: "Technology", href: "/technology" },
      { title: "Pricing", href: "/pricing" },
    ],
  },
  */
  {
    title: "Industries",
    items: [
      { title: "Manufacturing", href: "/use-cases/manufacturing" },
      { title: "Retail", href: "/use-cases/retail" },
      { title: "Smart Cities", href: "/use-cases/smart-cities" },
      { title: "Event Management", href: "/use-cases/events" },
    ],
  },
  { title: "About", href: "/about" },
  { title: "Contact", href: "/contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
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

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden">
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col space-y-4">
          {navItems.map((item) => (
            <div key={item.title}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="text-lg font-medium hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                </Link>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-primary">{item.title}</h3>
                  {item.items && (
                    <div className="ml-4 mt-2 flex flex-col space-y-2">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.href}
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => setOpen(false)}
                        >
                          {subItem.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          <div className="pt-4 space-y-2">
            <Button variant="outline" className="w-full" onClick={toggleLanguage}>
              {language === "en" ? "العربية" : "English"}
            </Button>
            <Button className="w-full" asChild>
              <Link href="/contact">Request Demo</Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}