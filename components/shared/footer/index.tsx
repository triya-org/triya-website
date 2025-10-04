"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapPin, Mail, Phone, Linkedin } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

export function Footer() {
  const { trackLinkedInClick } = useAnalytics();
  
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
              Transform any camera into a privacy-first, AI-powered security & analytics solution
            </p>
            <div className="flex space-x-4">
              <Link href="https://www.linkedin.com/company/triyaai/about/" target="_blank" onClick={trackLinkedInClick}>
                <Button variant="ghost" size="icon">
                  <Linkedin className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Product */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/features" className="text-sm text-muted-foreground hover:text-primary">
                Features
              </Link>
              <Link href="/technology" className="text-sm text-muted-foreground hover:text-primary">
                Technology
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-primary">
                Pricing
              </Link>
              <Link href="/case-studies" className="text-sm text-muted-foreground hover:text-primary">
                Case Studies
              </Link>
            </nav>
          </div>
          
          {/* Industries */}
          <div className="space-y-4">
            <h4 className="font-semibold">Industries</h4>
            <nav className="flex flex-col space-y-2">
              <Link href="/use-cases/manufacturing" className="text-sm text-muted-foreground hover:text-primary">
                Manufacturing
              </Link>
              <Link href="/use-cases/retail" className="text-sm text-muted-foreground hover:text-primary">
                Retail
              </Link>
              <Link href="/use-cases/healthcare" className="text-sm text-muted-foreground hover:text-primary">
                Healthcare
              </Link>
              <Link href="/use-cases/smart-cities" className="text-sm text-muted-foreground hover:text-primary">
                Smart Cities
              </Link>
            </nav>
          </div>
          
          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold">Contact Us</h4>
            <div className="space-y-2">
              <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Abu Dhabi Global Market, UAE</span>
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
              © 2025 Triya.ai. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}