"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Server,
  Cpu,
  Lock,
  Cloud,
  ShieldAlert,
  Flame,
  HardHat,
  PersonStanding,
  Car,
  Users,
  WifiOff,
  ScrollText,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function OnPremiseVideoAnalyticsPage() {
  const content = {
    hero: {
      badge: "On-Premise & Edge Video Analytics",
      title: "Edge AI Video Analytics That",
      titleHighlight: "Never Leaves Your Premises",
      subtitle:
        "Triya runs all AI inference on a Triya Edge Box at your site, so video is processed locally and never leaves your premises. The same platform and the same detection library as our cloud — built for data sovereignty, strict data-residency rules and sites with limited connectivity.",
    },
    intro: {
      title: "On-premise AI surveillance for data-sovereign sites",
      paragraphs: [
        "Triya offers both cloud and on-premise deployment on the same platform, with the same AI scenario library. This page is about the on-premise and edge option: instead of streaming footage to a remote service, all AI inference runs on a Triya Edge Box deployed at your site. Your video is processed locally and never leaves the premises, which makes edge AI video analytics a natural fit for sites with strict data-residency requirements, data sovereignty needs, or limited and intermittent connectivity.",
        "On-premise video analytics requires on-site AI hardware, but it gives you full control over where your footage lives. Many customers begin in the cloud for speed, then move specific sites to the edge when data sovereignty or connectivity demands it. Either way Triya is camera-agnostic — it works with your existing CCTV over standard RTSP/ONVIF — and you keep the same web portal, the same alerts via email, SMS or webhook, and the same natural-language search across both deployment models. Offline video analytics on the edge means surveillance keeps working even when the network does not.",
      ],
    },
    how: {
      title: "How on-premise video analytics works",
      description:
        "Three steps to run edge AI video analytics on-site, with footage that never leaves your premises.",
      steps: [
        {
          icon: Server,
          step: "01",
          title: "Deploy the Edge Box",
          description:
            "A Triya Edge Box is installed at your site as the on-site AI hardware. It connects to your existing cameras over standard RTSP/ONVIF — no rip-and-replace.",
        },
        {
          icon: Cpu,
          step: "02",
          title: "Process locally",
          description:
            "All AI inference runs on the Edge Box at the edge. Video is analyzed on-premise in real time and never leaves your premises, even on sites with limited connectivity.",
        },
        {
          icon: Lock,
          step: "03",
          title: "Stay in control",
          description:
            "Your team uses the same secure web portal, alerts and natural-language search as the cloud — while footage and detections stay under your roof.",
        },
      ],
    },
    detect: {
      title: "The same detection library, running at the edge",
      description:
        "The on-premise detection library is identical to the cloud — combine the scenarios you need, all processed locally on the Edge Box.",
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
      ],
    },
    compare: {
      title: "Cloud or edge — the same platform either way",
      description:
        "Start in the cloud for speed, move sites to the edge for data sovereignty. The AI scenario library and portal stay the same.",
      options: [
        {
          icon: Cloud,
          title: "Cloud deployment",
          description:
            "The fastest start with no on-site servers or hardware to buy or maintain. A per-camera subscription deploys in days and scales instantly.",
          tag: "Fastest start",
        },
        {
          icon: Server,
          title: "On-premise & edge deployment",
          description:
            "All AI inference runs on a Triya Edge Box at your site, so video never leaves your premises. Requires on-site AI hardware and suits data-residency and offline needs.",
          tag: "Data sovereignty",
        },
      ],
    },
    benefits: {
      title: "Why teams choose on-premise & edge with Triya",
      items: [
        "Video that never leaves your premises — all AI inference runs locally on a Triya Edge Box",
        "Built for data sovereignty, strict data-residency and regulatory requirements",
        "Offline video analytics that keeps working on sites with limited connectivity",
        "Camera-agnostic: works with your existing CCTV over standard RTSP/ONVIF",
        "Same AI scenario library, web portal, alerts and natural-language search as the cloud",
        "Start in the cloud for speed, then move specific sites to the edge when sovereignty demands it",
      ],
    },
    extras: {
      title: "Built for regulated and disconnected sites",
      features: [
        {
          icon: WifiOff,
          title: "Limited connectivity",
          description:
            "When bandwidth is scarce or unreliable, edge processing keeps detection and alerting running without depending on a constant network link.",
          tag: "Resilience",
        },
        {
          icon: ScrollText,
          title: "Data-residency & sovereignty",
          description:
            "Keep footage and detections inside your own walls to satisfy data-residency rules and data sovereignty surveillance requirements.",
          tag: "Compliance",
        },
      ],
    },
    cta: {
      title: "Bring AI video analytics on-premise",
      description:
        "See edge AI video analytics running on a Triya Edge Box, with video that never leaves your premises. Book a demo and we'll map it to your sites.",
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
            aria-label="On-premise and edge AI video analytics from Triya - all AI inference runs locally on a Triya Edge Box so video is processed on-site and never leaves your premises"
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
                <Server className="h-3 w-3 mr-1" />
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

      {/* Cloud vs Edge Section */}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.compare.title}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.compare.description}
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {t.compare.options.map((option, index) => {
                const Icon = option.icon;
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
                              <h3 className="text-xl font-semibold">{option.title}</h3>
                              <Badge variant="outline">{option.tag}</Badge>
                            </div>
                            <p className="text-muted-foreground">{option.description}</p>
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

      {/* What you can detect Section */}
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

      {/* Built for regulated/disconnected sites Section */}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.extras.title}</h2>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {t.extras.features.map((feature, index) => {
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
