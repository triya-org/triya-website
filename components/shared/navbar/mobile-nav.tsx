"use client";

import { useState } from "react";
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

const navItemsData = [
  {
    title: "Industries",
    items: [
      { title: "Manufacturing", href: "/use-cases/manufacturing/" },
      { title: "Retail", href: "/use-cases/retail/" },
      { title: "Smart Cities", href: "/use-cases/smart-cities/" },
      { title: "Event Management", href: "/use-cases/events/" },
    ],
  },
  { title: "Blog", href: "/blog/" },
  { title: "FAQ", href: "/faq/" },
  { title: "Contact", href: "/contact/" },
];

const content = {
  menu: "Menu",
  requestDemo: "Request Demo"
};

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const navItems = navItemsData;
  const t = content;

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
          <SheetTitle>{t.menu}</SheetTitle>
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
            <Button className="w-full" asChild>
              <Link href="/contact/">{t.requestDemo}</Link>
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}