"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Building2,
  Car,
  Users,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Map
} from "lucide-react";

export default function SmartCitiesPage() {
  const content = {
      hero: {
        badge: "Smart Cities",
        title: "Smart City Video Analytics",
        titleHighlight: "for Safer Cities",
        subtitle: "Turn your existing city CCTV into AI video analytics for traffic monitoring, crowd analytics, license plate recognition, and real-time public safety alerts. No camera replacement, no rip-and-replace."
      },
      intro: {
        title: "Smart city surveillance on the cameras your city already owns",
        paragraphs: [
          "Triya adds real-time artificial intelligence to your existing urban CCTV network, turning every camera into a smart city video analytics and public safety system. Because the platform is camera-agnostic and works over standard RTSP/ONVIF feeds, there is no rip-and-replace and no vendor lock-in — your current traffic, intersection and public-space cameras become an intelligent layer for city traffic monitoring AI and urban surveillance AI.",
          "From vehicle analytics and license plate recognition to crowd density detection, intrusion alerts and abandoned-object detection, Triya watches every camera every second and sends instant alerts the moment something needs attention. Operators work from a single web portal with natural-language video search — searchable in English and Arabic — across the entire city, deployed in the cloud or fully on-premise at the edge for data sovereignty."
        ]
      },
      challenges: {
        title: "Urban Security & Management Challenges",
        items: [
          {
            icon: Car,
            title: "Traffic Congestion",
            description: "Managing traffic flow and detecting incidents across busy city streets and intersections"
          },
          {
            icon: Users,
            title: "Crowd Control",
            description: "Monitoring large gatherings and detecting dangerous crowd density at events and public spaces"
          },
          {
            icon: AlertTriangle,
            title: "Incident Response",
            description: "Delayed detection of accidents, intrusions, or security threats across the city"
          },
          {
            icon: Map,
            title: "Urban Planning",
            description: "Limited data on pedestrian and vehicle patterns to inform city planning decisions"
          }
        ]
      },
      solution: {
        title: "Smart City Video Analytics Capabilities",
        description: "Turn existing city cameras into a real-time public safety and traffic analytics layer: monitor roads, understand crowds, and respond to incidents faster.",
        features: [
          {
            title: "Traffic Monitoring & Vehicle Analytics",
            description: "Monitor traffic flow and vehicle movement across streets and intersections to understand congestion and road usage patterns.",
            stats: "Real-time"
          },
          {
            title: "License Plate Recognition (LPR/ANPR)",
            description: "Automatic number plate recognition for access control, parking and enforcement at city entry points and restricted areas.",
            stats: "LPR / ANPR"
          },
          {
            title: "People Counting & Occupancy",
            description: "Count people and track occupancy per area to manage public spaces, transit hubs and venues by zone.",
            stats: "Per-zone"
          },
          {
            title: "Crowd Density & Gathering Detection",
            description: "Detect crowd build-up and gatherings with duration analytics to support event safety and emergency planning.",
            stats: "Crowd analytics"
          },
          {
            title: "Intrusion & Restricted-Zone Detection",
            description: "Detect unauthorized entry into restricted zones around public infrastructure, utilities and sensitive sites.",
            stats: "Instant alerts"
          },
          {
            title: "Suspicious Activity & Abandoned Objects",
            description: "Flag loitering, suspicious behaviour, abandoned items and camera tampering for faster public safety response.",
            stats: "Auto detection"
          }
        ]
      },
      benefits: {
        title: "Why Cities Choose Triya",
        items: [
          "Works with your existing CCTV — no camera replacement or rip-and-replace",
          "Real-time traffic, intrusion and suspicious-activity alerts",
          "Crowd analytics to support event safety and emergency planning",
          "License plate recognition for access control and enforcement",
          "Natural-language video search across the whole city network",
          "Data sovereignty: deploy in the cloud or fully on-premise at the edge",
          "One web portal for every camera, with alerts via email, SMS or webhook"
        ]
      },
      cta: {
        title: "Build Your Smart City Infrastructure",
        description: "Discover how AI can make your city safer and more efficient",
        primaryButton: "Request Demo",
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
            aria-label="Smart city AI surveillance system monitoring urban traffic flow, crowd management, and public safety - intelligent cameras for city-wide security and analytics"
          >
            <source src="/videos/smartcity_hero_1.mp4" type="video/mp4" />
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
      <section className="py-24 bg-muted/50">
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
      <section className="py-24">
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
