"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  HardHat,
  ShieldAlert,
  Eye,
  BellRing,
  ArrowRight,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

export default function PpeComplianceMonitoringPage() {
  const content = {
      hero: {
        badge: "Workplace Safety",
        title: "PPE Compliance Monitoring",
        titleHighlight: "with AI PPE Detection",
        subtitle: "Add real-time AI PPE detection to your existing CCTV. Triya automatically verifies that workers wear safety helmets, hi-vis vests and other mandatory protective equipment in designated zones — and alerts your team the moment someone is non-compliant. No camera replacement, no rip-and-replace."
      },
      intro: {
        title: "PPE compliance monitoring on the cameras you already own",
        paragraphs: [
          "Triya adds real-time artificial intelligence to your existing CCTV, turning every camera into a PPE compliance monitoring system. Because the platform is camera-agnostic and works over standard RTSP/ONVIF feeds, there is no rip-and-replace — your current cameras become an intelligent layer that continuously checks whether people in designated zones are wearing the protective equipment your site requires.",
          "From safety-helmet detection and hi-vis vest verification to instant alerts when a worker is non-compliant, Triya watches every camera every second across manufacturing plants, industrial sites, construction sites and warehouses. Alerts arrive by email, SMS or webhook, everything lives in a single web portal, and you can even search your footage in plain language — \"find people without helmets in zone 3\" — deployed in the cloud or fully on-premise."
        ]
      },
      challenges: {
        title: "PPE & Workplace Safety Challenges",
        items: [
          {
            icon: HardHat,
            title: "Missed PPE Violations",
            description: "Manual checks and spot inspections can't catch every worker entering a zone without a helmet or hi-vis vest"
          },
          {
            icon: Eye,
            title: "Cameras No One Watches",
            description: "Existing CCTV records footage but does not actively flag non-compliant behaviour in real time"
          },
          {
            icon: AlertTriangle,
            title: "Hazardous Zones",
            description: "Workers near machinery and restricted areas need consistent protection that is hard to enforce by hand"
          },
          {
            icon: BellRing,
            title: "Slow Incident Response",
            description: "Delayed awareness of unsafe conditions means problems are noticed only after an incident occurs"
          }
        ]
      },
      solution: {
        title: "AI PPE Detection Capabilities",
        description: "Turn existing site cameras into a real-time PPE compliance and safety layer: detect missing protective equipment, verify designated zones, and alert your team instantly.",
        features: [
          {
            title: "Safety Helmet & Hard Hat Detection",
            description: "AI safety-helmet detection verifies that workers in designated zones are wearing hard hats, with instant alerts on anyone non-compliant.",
            stats: "Real-time alerts"
          },
          {
            title: "Hi-Vis Vest & PPE Verification",
            description: "Detection of hi-vis vests and other mandatory protective equipment to confirm workers are properly equipped before they enter hazardous areas.",
            stats: "Zone-based"
          },
          {
            title: "Restricted-Zone & Intrusion Detection",
            description: "Line-crossing and restricted-zone intrusion detection near machinery and dangerous areas to keep people out of harm's way.",
            stats: "Line-crossing"
          },
          {
            title: "Fall Detection",
            description: "Detect when a person falls so your team can respond quickly to potential injuries on the floor or at height.",
            stats: "Person-down"
          },
          {
            title: "Fire, Smoke & Smoking Detection",
            description: "Early fire and smoke detection, plus smoking detection in prohibited areas, as part of the same safety platform.",
            stats: "Early warning"
          },
          {
            title: "Natural-Language Footage Search",
            description: "Ask your cameras in plain language — \"find people without helmets in zone 3\" — and get the relevant clips back without scrubbing.",
            stats: "Plain English"
          }
        ]
      },
      benefits: {
        title: "Why Teams Choose Triya for PPE Compliance",
        items: [
          "Works with your existing CCTV — no camera replacement or rip-and-replace",
          "Real-time PPE detection for helmets, hard hats and hi-vis vests",
          "Instant alerts when a worker in a designated zone is non-compliant",
          "One platform for PPE, intrusion, fall, fire, smoke and smoking detection",
          "Alerts delivered by email, SMS or webhook to the right people",
          "Search footage in plain language from a single web portal",
          "Privacy-first: deploy in the cloud or fully on-premise"
        ]
      },
      proof: {
        title: "Proven on real cameras at scale",
        description: "In a 30-day pilot at a Fortune 500 manufacturer, Triya ran 22 detection scenarios — including PPE compliance — entirely on the customer's existing cameras, with no new hardware installed."
      },
      cta: {
        title: "Make Every Camera a Safety Inspector",
        description: "See how AI PPE detection can keep your workforce protected and compliant on the cameras you already have.",
        primaryButton: "Schedule Demo",
      }
  };

  const t = content;

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-[100dvh] md:h-[65vh] flex items-center justify-center overflow-hidden py-20 md:py-0">
        {/* Video Background Container */}
        <div className="absolute inset-0 z-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
            aria-label="AI PPE compliance monitoring demonstration - smart cameras performing safety-helmet and hi-vis vest detection to verify workers wear required protective equipment in manufacturing and construction environments"
          >
            <source src="/videos/hero_1.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-4">
                <HardHat className="h-3 w-3 mr-1" />
                {t.hero.badge}
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white"
              variants={fadeInUp}
            >
              {t.hero.title}{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">{t.hero.titleHighlight}</span>
            </motion.h1>
            <motion.p
              className="text-xl text-gray-200 mb-8"
              variants={fadeInUp}
            >
              {t.hero.subtitle}
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" asChild>
                <Link href="/contact/">
                  {t.cta.primaryButton} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Intro Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-3xl mx-auto"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-6"
              variants={fadeInUp}
            >
              {t.intro.title}
            </motion.h2>
            {t.intro.paragraphs.map((para, index) => (
              <motion.p
                key={index}
                className="text-lg text-muted-foreground mb-5"
                variants={fadeInUp}
              >
                {para}
              </motion.p>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              variants={fadeInUp}
            >
              {t.challenges.title}
            </motion.h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {t.challenges.items.map((challenge, index) => {
                const Icon = challenge.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full">
                      <CardHeader>
                        <div className="h-12 w-12 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
                          <Icon className="h-6 w-6 text-destructive" />
                        </div>
                        <CardTitle className="text-xl">{challenge.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription>{challenge.description}</CardDescription>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 bg-muted/50">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-6xl mx-auto"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t.solution.title}
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.solution.description}
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {t.solution.features.map((feature, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                          <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {feature.stats}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div
              className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 mx-auto"
              variants={fadeInUp}
            >
              <ShieldAlert className="h-6 w-6 text-primary" />
            </motion.div>
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              variants={fadeInUp}
            >
              {t.proof.title}
            </motion.h2>
            <motion.p
              className="text-lg text-muted-foreground"
              variants={fadeInUp}
            >
              {t.proof.description}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              variants={fadeInUp}
            >
              {t.benefits.title}
            </motion.h2>
            <motion.div
              className="grid gap-4 md:grid-cols-2"
              variants={fadeInUp}
            >
              {t.benefits.items.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary/5">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.cta.title}</h2>
            <p className="text-xl text-muted-foreground mb-8">{t.cta.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2" asChild>
                <Link href="/contact/">
                  {t.cta.primaryButton} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
