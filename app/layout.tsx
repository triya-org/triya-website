import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import GoogleAnalytics from "@/components/GoogleAnalytics";

const dmSans = localFont({
  src: "../public/fonts/DM_Sans/DMSans-VariableFont_opsz,wght.ttf",
  variable: "--font-dm-sans",
  weight: "400 700",
});

export const metadata: Metadata = {
  title: "Triya.ai - Transform any camera into AI-powered security",
  description: "Edge AI surveillance platform with Arabic-first capabilities. Real-time analytics, on-premise processing, 90% cost reduction.",
  keywords: "AI surveillance, edge computing, Arabic AI, video analytics, on-premise security",
  authors: [{ name: "Triya.ai" }],
  openGraph: {
    title: "Triya.ai - Edge AI Surveillance Platform",
    description: "Transform any camera into AI-powered security with Arabic-first capabilities",
    images: ["/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Triya.ai - Edge AI Surveillance Platform",
    description: "Transform any camera into AI-powered security with Arabic-first capabilities",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
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
      </head>
      <body className={`${dmSans.variable} font-sans min-h-screen bg-background text-foreground flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}