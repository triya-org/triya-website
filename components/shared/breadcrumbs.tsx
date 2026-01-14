"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumbs() {
  const pathname = usePathname();
  
  // Don't show breadcrumbs on homepage
  if (pathname === "/" || pathname === "") return null;
  
  // Don't show breadcrumbs on use-cases pages (no use-cases index page exists)
  if (pathname.includes("/use-cases/")) return null;
  
  // Generate breadcrumb items from pathname
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: "Home", href: "/" }
    ];
    
    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Format the label (capitalize, replace hyphens)
      let label = segment
        .split("-")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      
      // Special cases for better labels
      if (segment === "faq") label = "FAQ";
      if (segment === "use-cases") label = "Use Cases";
      if (segment === "smart-cities") label = "Smart Cities";
      
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
          <ol className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <li key={item.href} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                )}
                
                {index === breadcrumbs.length - 1 ? (
                  // Current page (not clickable)
                  <span className="text-foreground font-medium">
                    {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
                    {item.label}
                  </span>
                ) : (
                  // Clickable breadcrumb
                  <Link
                    href={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {index === 0 && <Home className="h-4 w-4 inline mr-1" />}
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