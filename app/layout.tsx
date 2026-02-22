import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { pageMetadata } from "@/app/lib/seo-config";
import { OrganizationSchema, LocalBusinessSchema } from "@/app/components/structured-data";

const dmSans = localFont({
  src: "../public/fonts/DM_Sans/DMSans-VariableFont_opsz,wght.ttf",
  variable: "--font-dm-sans",
  weight: "400 700",
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
        
        {/* Hreflang Tags */}
        <link rel="alternate" hrefLang="en" href="https://www.triya.ai" />
        <link rel="alternate" hrefLang="ar" href="https://www.triya.ai/ar" />
        <link rel="alternate" hrefLang="x-default" href="https://www.triya.ai" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Resource Hints */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#000000" />
        
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
      </head>
      <body className={`${dmSans.variable} font-sans min-h-screen bg-background text-foreground flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}