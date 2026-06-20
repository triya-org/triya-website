"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Search,
  MessageSquareText,
  ScanEye,
  Clock,
  Languages,
  Camera,
  ShieldAlert,
  Car,
  HardHat,
  Users,
  ServerCog,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function AiVideoSearchPage() {
  const content = {
    hero: {
      badge: "Natural-Language CCTV Search",
      title: "Search Your CCTV",
      titleHighlight: "in Plain English",
      subtitle:
        "Triya's AI video search lets you ask your cameras a question in plain language — \"show me intrusions from yesterday\" — and get the relevant, timestamped footage back in seconds. No more scrubbing through hours of recordings to find what you need.",
    },
    intro: {
      title: "Ask your CCTV a question and find footage by description",
      paragraphs: [
        "Traditional video review means scrubbing through hours of footage across dozens of cameras, hoping to spot the moment that matters. AI video search changes that. With Triya you simply ask your CCTV a question in plain language — in English or Arabic — like \"when did a vehicle enter after hours\" or \"find people without helmets in zone 3\", and the platform returns the precise clips that match your description in seconds.",
        "Natural language CCTV search works because Triya continuously runs real-time AI on every feed. The platform logs every detection, hazard and event across all your cameras, so when you search CCTV footage with AI you are searching a rich, timestamped index rather than raw video. That is what makes video search AI practical for security, safety and operations teams who need answers, not hours of review.",
      ],
    },
    how: {
      title: "How AI video search works: Detect, Index, Ask",
      description:
        "Three steps to turn continuous camera footage into searchable, timestamped evidence you can find by description.",
      steps: [
        {
          icon: ScanEye,
          step: "01",
          title: "Detect",
          description:
            "Triya runs real-time AI on every camera feed, identifying intrusions, vehicles, PPE gaps, crowds, hazards and more as they happen.",
        },
        {
          icon: ServerCog,
          step: "02",
          title: "Index",
          description:
            "Every detection and event is logged with a precise timestamp and camera, building a searchable record across your entire network.",
        },
        {
          icon: MessageSquareText,
          step: "03",
          title: "Ask",
          description:
            "Type a question in plain language and Triya returns the matching, timestamped clips in seconds — no scrubbing, no manual review.",
        },
      ],
    },
    queries: {
      title: "Ask your cameras anything",
      description:
        "Find footage by description using everyday language. Here are examples of the questions teams put to their CCTV with Triya.",
      features: [
        {
          icon: ShieldAlert,
          title: "\"Show me intrusions from yesterday\"",
          description:
            "Pull every intrusion or restricted-zone breach in a time window and jump straight to the timestamped clips.",
          tag: "Security",
        },
        {
          icon: Car,
          title: "\"When did a vehicle enter after hours?\"",
          description:
            "Find after-hours vehicle activity at gates and entrances without reviewing a full night of footage.",
          tag: "Access",
        },
        {
          icon: HardHat,
          title: "\"Find people without helmets in zone 3\"",
          description:
            "Surface PPE and helmet-compliance events in a specific area for safety review and audit trails.",
          tag: "Compliance",
        },
        {
          icon: Users,
          title: "\"Show crowd build-up at the entrance\"",
          description:
            "Locate moments of crowd density or queue build-up to review occupancy and operational hotspots.",
          tag: "Operations",
        },
      ],
    },
    capabilities: {
      title: "Built for fast, precise video search",
      description:
        "AI video search is part of the broader Triya platform — camera-agnostic, secure, and ready to deploy on the cameras you already own.",
      features: [
        {
          icon: MessageSquareText,
          title: "Natural-language search",
          description:
            "Ask your CCTV questions the way you'd ask a colleague. No query syntax, no filters to configure — just describe what you're looking for.",
          tag: "Search",
        },
        {
          icon: Clock,
          title: "Timestamped evidence in seconds",
          description:
            "Results come back as precise, timestamped clips tied to the right camera, so you go straight to the moment that matters.",
          tag: "Speed",
        },
        {
          icon: Languages,
          title: "English & Arabic",
          description:
            "Search and ask in English or Arabic, so every member of your team can find footage by description in their own language.",
          tag: "Language",
        },
        {
          icon: Camera,
          title: "Camera-agnostic",
          description:
            "Works on top of your existing CCTV over standard RTSP/ONVIF — no camera replacement and no vendor lock-in.",
          tag: "Platform",
        },
      ],
    },
    benefits: {
      title: "Why teams choose Triya AI video search",
      items: [
        "Search CCTV footage with AI instead of scrubbing through hours of recordings",
        "Ask your CCTV in plain language — English or Arabic — and find footage by description",
        "Built on real-time AI detections, so every result is precise and timestamped",
        "Camera-agnostic: works with existing CCTV over standard RTSP/ONVIF",
        "Single web portal with alerts via email, SMS or webhook",
        "Deploy in the cloud or fully on-premise, with the same platform either way",
      ],
    },
    cta: {
      title: "See AI video search on your own cameras",
      description:
        "Watch natural-language CCTV search find the footage you need in seconds. Book a demo and ask your cameras a question.",
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
            aria-label="AI video search for CCTV - ask your cameras a question in plain language and Triya returns the relevant, timestamped footage in seconds instead of scrubbing through hours of recordings"
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
                <Search className="h-3 w-3 mr-1" />
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

      {/* Example queries Section */}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.queries.title}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.queries.description}
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {t.queries.features.map((feature, index) => {
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

      {/* Capabilities Section */}
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
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t.capabilities.title}</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                {t.capabilities.description}
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2">
              {t.capabilities.features.map((feature, index) => {
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
