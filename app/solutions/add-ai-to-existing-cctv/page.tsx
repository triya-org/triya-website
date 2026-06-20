"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Camera,
  PlugZap,
  ScanEye,
  BellRing,
  ShieldAlert,
  Flame,
  HardHat,
  PersonStanding,
  Car,
  Users,
  EyeOff,
  PackageSearch,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function AddAiToExistingCctvPage() {
  const content = {
    hero: {
      badge: "Camera-Agnostic Video Analytics",
      title: "Add AI to the CCTV",
      titleHighlight: "You Already Own",
      subtitle:
        "Triya turns your existing cameras into an AI video-analytics system. Camera-agnostic and built on standard RTSP/ONVIF, it works with any IP camera — no camera replacement, no rip-and-replace, no vendor lock-in.",
    },
    intro: {
      title: "Camera-agnostic video analytics for the cameras you already own",
      paragraphs: [
        "Most teams already have CCTV — what they lack is intelligence on top of it. Triya adds AI to existing CCTV by connecting to your current cameras over standard RTSP/ONVIF, so any IP camera becomes a real-time AI sensor. There is no rip-and-replace and no proprietary hardware to buy: the cameras you already own become a camera-agnostic video-analytics platform that detects events, logs every alert, and lets your team search footage in plain language.",
        "Because Triya is AI for existing cameras rather than a new camera line, you can upgrade CCTV to AI in days instead of quarters. Run it in the cloud for the fastest start with no on-site hardware, or fully on-premise on a Triya Edge Box where video never leaves your premises — the same platform either way. In a recent 30-day pilot, a Fortune 500 manufacturer ran 22 detection scenarios on its own existing cameras without swapping a single device.",
      ],
    },
    how: {
      title: "How it works: Connect, Detect, Act",
      description:
        "Three steps to turn existing CCTV into AI video analytics — no new cameras, no complex integration.",
      steps: [
        {
          icon: PlugZap,
          step: "01",
          title: "Connect",
          description:
            "Your existing CCTV feeds connect to Triya over standard RTSP/ONVIF. Any IP camera works, so there is no camera replacement and no vendor lock-in.",
        },
        {
          icon: ScanEye,
          step: "02",
          title: "Detect",
          description:
            "Triya's AI models analyze every feed in real time, logging each detection, hazard and alert so nothing is missed across your camera network.",
        },
        {
          icon: BellRing,
          step: "03",
          title: "Act",
          description:
            "Your team accesses live views, detections and searchable insights through a secure web portal, with instant alerts via email, SMS or webhook.",
        },
      ],
    },
    detect: {
      title: "What you can detect",
      description:
        "A library of AI detection scenarios runs on your existing IP cameras — combine the ones you need today and add more in weeks.",
      features: [
        {
          icon: ShieldAlert,
          title: "Intrusion & Restricted Zones",
          description:
            "Detect people entering restricted or off-limits areas and trigger instant alerts the moment a boundary is crossed.",
          tag: "Security",
        },
        {
          icon: Flame,
          title: "Fire & Smoke Detection",
          description:
            "Spot early signs of fire and smoke across indoor and outdoor cameras to speed up response and reduce damage.",
          tag: "Safety",
        },
        {
          icon: HardHat,
          title: "PPE & Helmet Compliance",
          description:
            "Verify that workers are wearing required helmets and protective equipment in designated zones.",
          tag: "Compliance",
        },
        {
          icon: PersonStanding,
          title: "Fall Detection",
          description:
            "Identify slips and falls in real time so help can reach people faster on factory floors and public spaces.",
          tag: "Safety",
        },
        {
          icon: Car,
          title: "License Plate Recognition (LPR)",
          description:
            "Read and log vehicle license plates at gates and entrances for access control and audit trails.",
          tag: "Access",
        },
        {
          icon: Users,
          title: "People Counting & Crowd Density",
          description:
            "Count people and monitor crowd density to manage occupancy, queues and high-traffic areas.",
          tag: "Operations",
        },
        {
          icon: EyeOff,
          title: "Loitering & Suspicious Activity",
          description:
            "Flag loitering and unusual behavior in sensitive areas before an incident escalates.",
          tag: "Security",
        },
        {
          icon: PackageSearch,
          title: "Object & Theft Detection",
          description:
            "Detect object movement and removal to catch theft and shrinkage across the floor and storerooms.",
          tag: "Loss prevention",
        },
      ],
    },
    benefits: {
      title: "Why teams add AI to existing CCTV with Triya",
      items: [
        "Works with any IP camera over standard RTSP/ONVIF — no camera replacement",
        "Camera-agnostic platform with no rip-and-replace and no vendor lock-in",
        "Natural-language video search in English and Arabic — \"show me intrusions from yesterday\"",
        "Privacy-first: deploy in the cloud or fully on-premise on a Triya Edge Box",
        "Custom AI modules built in weeks to match your scenarios",
        "Unlimited users, a mobile app, and instant alerts via email, SMS or webhook",
      ],
    },
    cta: {
      title: "Upgrade your existing CCTV to AI",
      description:
        "See camera-agnostic video analytics running on your own cameras. Book a demo and we'll show you how fast you can go live.",
      primaryButton: "Book a Demo",
    },
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
            aria-label="AI video analytics running on existing CCTV cameras - Triya connects to any IP camera over RTSP and ONVIF to detect intrusions, fire, PPE compliance and more in real time"
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
                <Camera className="h-3 w-3 mr-1" />
                {t.hero.badge}
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white"
              variants={fadeInUp}
            >
              {t.hero.title}{" "}
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                {t.hero.titleHighlight}
              </span>
            </motion.h1>
            <motion.p className="text-xl text-gray-200 mb-8" variants={fadeInUp}>
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
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-6" variants={fadeInUp}>
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

      {/* How it works Section */}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.how.title}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.how.description}
              </p>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-3">
              {t.how.steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <span className="text-3xl font-bold text-muted-foreground/40">
                            {step.step}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* What you can detect Section */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="max-w-6xl mx-auto"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.detect.title}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.detect.description}
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {t.detect.features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div key={index} variants={fadeInUp}>
                    <Card className="h-full">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-semibold">{feature.title}</h3>
                              <Badge variant="outline">{feature.tag}</Badge>
                            </div>
                            <p className="text-muted-foreground">{feature.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-muted/50">
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
            <motion.div className="grid gap-4 md:grid-cols-2" variants={fadeInUp}>
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
              <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90" asChild>
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
