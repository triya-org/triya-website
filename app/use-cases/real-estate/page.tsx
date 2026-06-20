"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Building2,
  HardHat,
  ShieldAlert,
  Car,
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function RealEstatePage() {
  const content = {
      hero: {
        badge: "Real Estate & Facilities",
        title: "Real Estate & Facilities Video Analytics",
        titleHighlight: "for Property, Construction & Communities",
        subtitle: "Turn your existing property and construction site CCTV into AI video analytics — enforce site safety, secure perimeters and assets, manage gate access with license plate recognition, and understand how facilities are used. No camera replacement, no rip-and-replace."
      },
      intro: {
        title: "Real estate and facilities video analytics on the cameras you already own",
        paragraphs: [
          "Triya adds real-time artificial intelligence to your existing CCTV across construction sites, communities and managed buildings, turning every camera into a property security analytics and facilities management video analytics system. Because the platform is camera-agnostic and works over standard RTSP/ONVIF feeds from any IP camera, there is no rip-and-replace and no vendor lock-in — your current cameras become an intelligent layer that protects people, assets and the public.",
          "From construction site safety AI that flags missing helmets and PPE or intrusion into restricted zones, to perimeter and asset protection, license plate recognition gate access, and footfall in sales galleries and amenities, Triya watches every camera every second and alerts your team via email, SMS or webhook the moment something needs attention — across a single site or an entire portfolio, from one web portal, deployed in the cloud or fully on-premise."
        ]
      },
      challenges: {
        title: "Real Estate & Facilities Security Challenges",
        items: [
          {
            icon: HardHat,
            title: "Site Safety & Compliance",
            description: "PPE and helmet non-compliance, restricted-zone intrusion and after-hours access go unnoticed on busy construction sites"
          },
          {
            icon: ShieldAlert,
            title: "Asset & Material Theft",
            description: "Perimeter breaches and theft of materials from laydown and storage areas are costly and hard to catch in real time"
          },
          {
            icon: Car,
            title: "Access & Parking Control",
            description: "Manual gate access and parking enforcement across communities and basements is slow and inconsistent"
          },
          {
            icon: Clock,
            title: "Incident Response",
            description: "Delayed detection of crowds, dumping and intrusions means issues escalate before teams can act"
          }
        ]
      },
      solution: {
        title: "Real Estate & Facilities Video Analytics Capabilities",
        description: "Turn existing site and community cameras into a real-time AI CCTV for facilities — keep workers safe, protect assets, control access, and understand how spaces are used.",
        features: [
          {
            title: "Construction Site Safety",
            description: "Helmet and PPE compliance, restricted-zone intrusion around active works, after-hours site access detection and worker headcount on site.",
            stats: "Real-time"
          },
          {
            title: "Site & Asset Security",
            description: "Perimeter and hoarding breach detection, plus material theft and object-movement monitoring across laydown and storage areas.",
            stats: "Perimeter"
          },
          {
            title: "Community & Facility Operations",
            description: "Visitor footfall in sales galleries and amenities, occupancy of shared spaces, cleaning and housekeeping verification, and illegal dumping detection.",
            stats: "Occupancy"
          },
          {
            title: "Vehicle & Access Management",
            description: "License plate recognition gate access, contractor vehicle tracking, and parking enforcement across communities and basements.",
            stats: "LPR gate access"
          },
          {
            title: "Crowd Safety at Events & Handovers",
            description: "Gathering detection, crowd density monitoring and people counting to keep events, launches and handovers safe.",
            stats: "Crowd density"
          },
          {
            title: "Any Camera, Cloud or Edge",
            description: "Works over RTSP/ONVIF with any IP camera, with natural-language video search and custom AI modules delivered in weeks.",
            stats: "No lock-in"
          }
        ]
      },
      benefits: {
        title: "Why Property & Facilities Teams Choose Triya",
        items: [
          "Works with your existing CCTV — no camera replacement or rip-and-replace",
          "Real-time PPE, intrusion and after-hours access alerts for site safety",
          "Perimeter breach, theft and object-movement detection for assets",
          "License plate recognition for faster, automated gate access",
          "Footfall and occupancy insights across galleries, amenities and shared spaces",
          "Privacy-first: deploy in the cloud or fully on-premise at the edge",
          "One dashboard for every site and community, with alerts via email, SMS or webhook"
        ]
      },
      cta: {
        title: "Secure Your Sites, Communities & Facilities",
        description: "Discover how AI CCTV for facilities can keep workers safe and protect your assets",
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
            aria-label="AI surveillance demonstration for real estate and facilities — smart cameras monitoring construction sites, communities and buildings for safety, perimeter security and access control"
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
                <Building2 className="h-3 w-3 mr-1" />
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
              <Button size="lg" className="gap-2">
                {t.cta.primaryButton} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
