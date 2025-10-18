"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, Mail, Scale } from "lucide-react";

export default function TermsPage() {
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const lastUpdated = "4 October 2025";

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
              <Scale className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              variants={fadeInUp}
            >
              Terms of Use
            </motion.h1>
            <motion.p
              className="text-lg text-muted-foreground mb-2"
              variants={fadeInUp}
            >
              Terms &amp; Conditions
            </motion.p>
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

      {/* Terms Content */}
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="prose prose-gray dark:prose-invert max-w-none p-6 md:p-10">
                {/* 1. Definitions */}
                <h2 className="text-2xl font-bold mb-4">1. Definitions</h2>
                <ul className="mb-6 space-y-2">
                  <li><strong>Agreement</strong> – This Terms of Use document, any Order Forms, schedules, and addenda.</li>
                  <li><strong>Customer</strong> – The entity that enters into an agreement with Triya to use the Services.</li>
                  <li><strong>User</strong> – Employees or agents of the Customer who are authorized to use the Services.</li>
                  <li><strong>Services</strong> – Triya&apos;s software, APIs, dashboards, edge devices, video analytics, cloud services, and any related deliverables.</li>
                  <li><strong>Order Form</strong> – A document ordering Services (number of cameras, modules, support, etc.).</li>
                  <li><strong>Customer Data</strong> – Data, including video, images, metadata, logs, or other content uploaded or processed in the course of providing Services.</li>
                  <li><strong>Confidential Information</strong> – Non-public information disclosed between parties, including source code, trade secrets, business plans, technical data.</li>
                  <li><strong>Term</strong> – Duration of this Agreement as per the Order Form or as otherwise stated.</li>
                </ul>

                {/* 2. Scope & License Grant */}
                <h2 className="text-2xl font-bold mb-4">2. Scope &amp; License Grant</h2>
                <p className="mb-6">
                  Subject to compliance and payment, Triya grants a non-exclusive, non-transferable, non-sublicensable right to use the Services during the Term for internal business purposes. Triya retains all ownership and intellectual property rights in the Services, underlying models, and algorithms.
                </p>

                {/* 3. Restrictions & Acceptable Use */}
                <h2 className="text-2xl font-bold mb-4">3. Restrictions &amp; Acceptable Use</h2>
                <p className="mb-6">
                  Users must not reverse engineer, copy, distribute, or use the Services to create a competitive product. Use must comply with law and export control regulations.
                </p>

                {/* 4. Order Forms, Fees & Payment */}
                <h2 className="text-2xl font-bold mb-4">4. Order Forms, Fees &amp; Payment</h2>
                <p className="mb-6">
                  Fees are due per the Order Form, within 30 days of invoice. Late payments may incur suspension of Services. Taxes are additional. Underreporting results in invoicing adjustments.
                </p>

                {/* 5. Delivery, Installation & Hardware */}
                <h2 className="text-2xl font-bold mb-4">5. Delivery, Installation &amp; Hardware</h2>
                <p className="mb-6">
                  Hardware (if included) is delivered and maintained per Order Form. Ownership remains with Triya until payment is completed. Remote maintenance may occur with notice.
                </p>

                {/* 6. Customer Data & Privacy */}
                <h2 className="text-2xl font-bold mb-4">6. Customer Data &amp; Privacy</h2>
                <p className="mb-6">
                  Customer retains ownership of data. Triya acts as Processor or Controller as per Privacy Policy. Triya may use anonymized data for product improvement. No model training without written consent.
                </p>

                {/* 7. Confidentiality */}
                <h2 className="text-2xl font-bold mb-4">7. Confidentiality</h2>
                <p className="mb-6">
                  Each party must protect Confidential Information and use it only to perform the Agreement. Obligations survive termination for five years.
                </p>

                {/* 8. Term & Termination */}
                <h2 className="text-2xl font-bold mb-4">8. Term &amp; Termination</h2>
                <p className="mb-6">
                  The Agreement starts on the date you first access or use the Services or the Order Form effective date and continues for the Term. Either party may terminate for material breach after 30 days&apos; notice. Upon termination, access ceases and data is deleted or returned per policy or contract.
                </p>

                {/* 9. Warranties & Disclaimers */}
                <h2 className="text-2xl font-bold mb-4">9. Warranties &amp; Disclaimers</h2>
                <p className="mb-6">
                  Triya warrants Services will materially conform to documentation and be provided with reasonable care. Services are otherwise provided &apos;as is&apos; without implied warranties.
                </p>

                {/* 10. Limitation of Liability */}
                <h2 className="text-2xl font-bold mb-4">10. Limitation of Liability</h2>
                <p className="mb-6">
                  Except for willful misconduct or gross negligence, liability is capped at fees paid in the previous 12 months. No indirect or consequential damages apply.
                </p>

                {/* 11. Indemnification */}
                <h2 className="text-2xl font-bold mb-4">11. Indemnification</h2>
                <p className="mb-6">
                  Customer indemnifies Triya against claims from misuse or data violations. Triya indemnifies Customer for IP infringement claims, provided prompt notice and cooperation are given.
                </p>

                {/* 12. Changes to Services & Terms */}
                <h2 className="text-2xl font-bold mb-4">12. Changes to Services &amp; Terms</h2>
                <p className="mb-6">
                  Triya may modify Services and Terms with notice. Continued use after updates constitutes acceptance.
                </p>

                {/* 13. Governing Law & Dispute Resolution */}
                <h2 className="text-2xl font-bold mb-4">13. Governing Law &amp; Dispute Resolution</h2>
                <p className="mb-6">
                  This Agreement is governed by the laws of the UAE. Disputes will be resolved under UAE court jurisdiction, after good faith negotiation.
                </p>

                {/* 14. Miscellaneous */}
                <h2 className="text-2xl font-bold mb-4">14. Miscellaneous</h2>
                <p className="mb-4">
                  Entire Agreement, Severability, Waiver, Assignment, and Force Majeure clauses apply. Neither party is liable for delays due to events beyond control. Notices may be sent to <a href="mailto:contact@triya.ai" className="text-primary hover:underline">contact@triya.ai</a>.
                </p>

                {/* Contact Section */}
                <div className="bg-muted/50 rounded-lg p-6 mt-8">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Triya AI Ltd
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      For questions about these Terms of Use, please contact:
                    </p>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a href="mailto:contact@triya.ai" className="text-primary hover:underline">
                        contact@triya.ai
                      </a>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Registered in UAE
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}