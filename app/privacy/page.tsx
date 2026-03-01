"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Calendar, Mail, MapPin, Globe } from "lucide-react";

export default function PrivacyPage() {
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const lastUpdated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-4">
              <Shield className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              variants={fadeInUp}
            >
              Privacy Policy
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground flex items-center justify-center gap-2"
              variants={fadeInUp}
            >
              <Calendar className="h-4 w-4" />
              Last updated: {lastUpdated}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="prose prose-gray dark:prose-invert max-w-none p-6 md:p-10">
                {/* 1. Introduction */}
                <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
                <p className="mb-4">
                  Triya AI Ltd (&ldquo;Triya AI&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is an artificial intelligence company registered under the laws of the Abu Dhabi Global Market (ADGM), located at ADGM Square, Al Maryah Island, Abu Dhabi, UAE.
                </p>
                <p className="mb-4">
                  We are committed to protecting the privacy, confidentiality, and security of the personal data and video data that we process through our products and services. This Privacy Policy explains how we collect, use, store, share, and protect such data in accordance with the ADGM Data Protection Regulations 2021 (&ldquo;ADGM DPR&rdquo;), the UAE Federal Data Protection Law No. 45 of 2021 (PDPL), and international standards including the EU General Data Protection Regulation (GDPR).
                </p>
                <p className="mb-6">
                  By using our website or services, you acknowledge that you have read and understood this Privacy Policy.
                </p>

                {/* 2. Definitions */}
                <h2 className="text-2xl font-bold mb-4">2. Definitions</h2>
                <ul className="mb-6 space-y-2">
                  <li><strong>Personal Data</strong> – Any information relating to an identified or identifiable natural person (a &ldquo;Data Subject&rdquo;), such as name, contact details, image, or IP address.</li>
                  <li><strong>Video Data / Imagery Data</strong> – Video streams, camera images, frames, and metadata processed by Triya AI&apos;s systems.</li>
                  <li><strong>Customer / Client</strong> – Any organization that uses Triya AI&apos;s products or services under contract.</li>
                  <li><strong>User / Operator</strong> – Authorized individuals of a Customer who access Triya AI&apos;s systems or dashboard.</li>
                  <li><strong>Data Subject</strong> – Any person whose personal data or image is captured or processed.</li>
                  <li><strong>Processor / Subprocessor</strong> – A third party engaged by Triya AI to process data on our behalf (e.g., cloud provider).</li>
                  <li><strong>Controller</strong> – The entity that determines the purposes and means of processing personal data. In most cases, Triya AI acts as a Processor on behalf of Customers; however, we act as a Controller for certain internal operations.</li>
                </ul>

                {/* 3. Legal Basis for Processing */}
                <h2 className="text-2xl font-bold mb-4">3. Legal Basis for Processing</h2>
                <p className="mb-4">
                  Triya AI processes data lawfully, fairly, and transparently in accordance with ADGM DPR, PDPL, and GDPR. Our lawful bases for processing include:
                </p>
                <ul className="mb-6 space-y-2">
                  <li><strong>Contractual Necessity:</strong> To provide services as per our agreements with Customers.</li>
                  <li><strong>Legal Obligation:</strong> To comply with applicable laws or regulations.</li>
                  <li><strong>Legitimate Interest:</strong> To maintain system security, prevent fraud, and improve service performance.</li>
                  <li><strong>Consent:</strong> When Customers enable optional modules such as face recognition or license plate recognition (ALPR), we process biometric or special-category data only with explicit consent and in full compliance with ADGM and GDPR requirements.</li>
                </ul>

                {/* 4. Data We Collect */}
                <h2 className="text-2xl font-bold mb-4">4. Data We Collect</h2>

                <h3 className="text-xl font-semibold mb-3">4.1. Information You Provide</h3>
                <ul className="mb-4 space-y-2">
                  <li>Name, email address, organization, and login credentials when registering for an account</li>
                  <li>Billing and invoicing information</li>
                  <li>Support requests and communications</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">4.2. Video & Sensor Data</h3>
                <ul className="mb-4 space-y-2">
                  <li>Live and recorded video streams from CCTV, RTSP, or ONVIF cameras</li>
                  <li>Extracted metadata</li>
                  <li>Optional biometric identifiers and license plate information when activated by the Customer</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3">4.3. Usage & System Data</h3>
                <ul className="mb-6 space-y-2">
                  <li>Log files, access timestamps, device/browser information</li>
                  <li>IP addresses</li>
                  <li>Telemetry and analytics data</li>
                </ul>

                {/* 5. Purpose of Processing */}
                <h2 className="text-2xl font-bold mb-4">5. Purpose of Processing</h2>
                <p className="mb-6">
                  We process data to deliver AI-powered analytics, operate systems, provide support, maintain security, manage billing, ensure compliance, and generate aggregated insights for improvement.
                </p>

                {/* 6. Data Retention and Deletion */}
                <h2 className="text-2xl font-bold mb-4">6. Data Retention and Deletion</h2>
                <ul className="mb-6 space-y-2">
                  <li>Video and Image Data are retained for a maximum of 30 days by default, unless up to 90 days is agreed with the Customer.</li>
                  <li>Logs and metadata are retained for up to 12 months.</li>
                  <li>Data is deleted or anonymized upon expiry or verified deletion request.</li>
                  <li>Backups are encrypted and purged within defined retention limits.</li>
                </ul>

                {/* 7. Data Hosting and Cross-Border Transfers */}
                <h2 className="text-2xl font-bold mb-4">7. Data Hosting and Cross-Border Transfers</h2>
                <ul className="mb-6 space-y-2">
                  <li>Data is primarily hosted within the UAE region.</li>
                  <li>For international clients, data may be hosted in that client&apos;s jurisdiction.</li>
                  <li>Cross-border transfers are protected by Standard Contractual Clauses, encryption, and transfers only to adequate jurisdictions.</li>
                </ul>

                {/* 8. Data Sharing and Disclosure */}
                <h2 className="text-2xl font-bold mb-4">8. Data Sharing and Disclosure</h2>
                <p className="mb-6">
                  Data may be shared with subprocessors, affiliates, or authorities under lawful conditions. Triya AI does not sell personal or video data.
                </p>

                {/* 9. Security Measures */}
                <h2 className="text-2xl font-bold mb-4">9. Security Measures</h2>
                <p className="mb-6">
                  We employ encryption, role-based access control, monitoring, audits, and employee confidentiality. In case of a data breach, we notify ADGM within 72 hours if required, and affected parties if risk is high.
                </p>

                {/* 10. Rights of Data Subjects */}
                <h2 className="text-2xl font-bold mb-4">10. Rights of Data Subjects</h2>
                <p className="mb-4">
                  Data Subjects have rights to:
                </p>
                <ul className="mb-4 space-y-2">
                  <li>Access their personal data</li>
                  <li>Correction of inaccurate data</li>
                  <li>Deletion of data</li>
                  <li>Restriction of processing</li>
                  <li>Data portability</li>
                  <li>Objection to processing</li>
                  <li>Withdrawal of consent</li>
                </ul>
                <p className="mb-6">
                  Requests can be sent to <a href="mailto:contact@triya.ai" className="text-primary hover:underline">contact@triya.ai</a>.
                </p>

                {/* 11. Cookies and Tracking Technologies */}
                <h2 className="text-2xl font-bold mb-4">11. Cookies and Tracking Technologies</h2>
                <p className="mb-6">
                  Our website uses cookies for authentication, performance measurement, and analytics. Essential cookies cannot be disabled.
                </p>

                {/* 12. Updates to this Policy */}
                <h2 className="text-2xl font-bold mb-4">12. Updates to this Policy</h2>
                <p className="mb-6">
                  This Policy may be updated periodically. Updates are posted at <a href="https://www.triya.ai/privacy/" className="text-primary hover:underline">https://www.triya.ai/privacy</a> with notice for material changes.
                </p>

                {/* 13. Contact Information */}
                <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
                <div className="bg-muted/50 rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" />
                    Triya AI Ltd
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p>ADGM Square, Al Maryah Island</p>
                        <p>Abu Dhabi, UAE</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a href="mailto:contact@triya.ai" className="text-primary hover:underline">
                        contact@triya.ai
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <a href="https://www.triya.ai" className="text-primary hover:underline">
                        https://www.triya.ai
                      </a>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    If unsatisfied with our response, you may contact the ADGM Office of Data Protection.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}