import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Preloader } from "@/components/transition/Preloader";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { pageMetadata } from "@/app/lib/seo-config";
import { OrganizationSchema, LocalBusinessSchema } from "@/app/components/structured-data";

/* Brand fonts — LOCKED (Triya.AI Design System, Jun 2026).
   Display: General Sans · Text/UI: Hanken Grotesk · Mono: JetBrains Mono ·
   Arabic: IBM Plex Sans Arabic. No DM Sans, no serif. */
const generalSans = localFont({
  src: "../public/fonts/brand/GeneralSans-Variable.woff2",
  variable: "--font-display",
  weight: "200 700",
  display: "swap",
});

const hankenGrotesk = localFont({
  src: "../public/fonts/brand/HankenGrotesk-Variable.ttf",
  variable: "--font-sans-brand",
  weight: "100 900",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../public/fonts/brand/JetBrainsMono-Variable.ttf",
  variable: "--font-mono-brand",
  weight: "100 800",
  display: "swap",
});

const plexArabic = localFont({
  src: [
    { path: "../public/fonts/brand/IBMPlexSansArabic-Regular.ttf", weight: "400" },
    { path: "../public/fonts/brand/IBMPlexSansArabic-Medium.ttf", weight: "500" },
    { path: "../public/fonts/brand/IBMPlexSansArabic-SemiBold.ttf", weight: "600" },
    { path: "../public/fonts/brand/IBMPlexSansArabic-Bold.ttf", weight: "700" },
  ],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  ...pageMetadata.home,
  authors: [{ name: "Triya.ai" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'add-your-google-verification-code',
    yandex: 'add-your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <GoogleAnalytics />
        <OrganizationSchema />
        <LocalBusinessSchema />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#FAF9F5" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body
        className={`${generalSans.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} ${plexArabic.variable} font-sans min-h-screen bg-background text-foreground flex flex-col`}
      >
        <Preloader />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}