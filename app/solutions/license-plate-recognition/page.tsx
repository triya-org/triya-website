"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Car,
  DoorOpen,
  ParkingSquare,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

export default function LicensePlateRecognitionPage() {
  const content = {
      hero: {
        badge: "License Plate Recognition",
        title: "AI License Plate Recognition",
        titleHighlight: "for Access & Parking (ANPR/LPR)",
        subtitle: "Add automatic number plate recognition to the cameras you already own. Triya turns existing CCTV into an LPR system for automated gate access, vehicle tracking and parking enforcement — camera-agnostic, no rip-and-replace."
      },
      intro: {
        title: "License plate recognition software on the cameras you already own",
        paragraphs: [
          "Triya adds real-time AI to your existing CCTV, turning every camera into a license plate recognition (LPR/ANPR) system. Because the platform is camera-agnostic and works over standard RTSP/ONVIF feeds, there is no rip-and-replace — your current cameras read vehicle number plates to automate access, track visiting vehicles and enforce parking rules.",
          "Automatic number plate recognition powers LPR gate access for residents and known vehicles, contractor and visitor vehicle tracking, and parking enforcement across communities, basements and commercial lots. Triya watches every camera every second and sends alerts via email, SMS or webhook the moment a plate needs attention — all from a single web portal, deployed in the cloud or fully on-premise, with natural-language search such as \"when did vehicle X enter after hours\"."
        ]
      },
      challenges: {
        title: "Vehicle Access & Parking Challenges",
        items: [
          {
            icon: DoorOpen,
            title: "Manual Gate Access",
            description: "Guards manually checking and logging vehicles at gates slows entry and leaves gaps in the record"
          },
          {
            icon: UserCheck,
            title: "Visitor & Contractor Vehicles",
            description: "Hard to track which contractor and visitor vehicles entered, when, and whether they were authorized"
          },
          {
            icon: ParkingSquare,
            title: "Parking Enforcement",
            description: "Unauthorized vehicles in communities, basements and lots are difficult to spot and act on in time"
          },
          {
            icon: ShieldAlert,
            title: "Vehicles in Restricted Zones",
            description: "Vehicles parked or moving outside permitted zones go unnoticed until an incident occurs"
          }
        ]
      },
      solution: {
        title: "License Plate Recognition Capabilities",
        description: "Turn existing cameras into a real-time ANPR/LPR layer: automate access, track every vehicle, and enforce parking rules across your sites.",
        features: [
          {
            title: "LPR Gate Access",
            description: "Automatic number plate recognition at entry and exit to trigger automated gate access for residents and known vehicles, with every entry logged.",
            stats: "Automated entry"
          },
          {
            title: "Contractor & Visitor Tracking",
            description: "Track contractor and visitor vehicles by number plate — capturing when each vehicle entered and left for an accurate, searchable record.",
            stats: "Vehicle log"
          },
          {
            title: "Parking Enforcement",
            description: "Detect vehicles parked across communities, basements and commercial lots, and flag those that are unauthorized or overstaying.",
            stats: "Community & basement"
          },
          {
            title: "Restricted-Zone Monitoring",
            description: "Monitor vehicles outside permitted zones with parking and vehicle-restriction rules, alerting your team when a plate breaks them.",
            stats: "Zone rules"
          },
          {
            title: "Real-Time Plate Alerts",
            description: "Send LPR alerts via email, SMS or webhook the moment a watched, unknown or unauthorized number plate is recognized.",
            stats: "Email / SMS / webhook"
          },
          {
            title: "Natural-Language Search",
            description: "Ask plain-English questions like \"when did vehicle X enter after hours\" to find any vehicle event from one web portal.",
            stats: "Web portal"
          }
        ]
      },
      benefits: {
        title: "Why Teams Choose Triya for ANPR",
        items: [
          "Works with your existing CCTV — no camera replacement or rip-and-replace",
          "Camera-agnostic LPR over standard RTSP/ONVIF feeds",
          "Automated LPR gate access for residents and known vehicles",
          "Accurate contractor and visitor vehicle tracking",
          "ANPR parking enforcement across communities, basements and lots",
          "Real-time plate alerts via email, SMS or webhook",
          "Privacy-first: deploy in the cloud or fully on-premise",
          "One web portal with natural-language vehicle search"
        ]
      },
      cta: {
        title: "Automate Vehicle Access with AI License Plate Recognition",
        description: "See how Triya adds ANPR/LPR to your existing cameras for access, tracking and parking",
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
            aria-label="AI license plate recognition demonstration - smart cameras reading vehicle number plates for automated gate access, visitor vehicle tracking and parking enforcement"
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
                <Car className="h-3 w-3 mr-1" />
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
