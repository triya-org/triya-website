"use client";

import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Clock
} from "lucide-react";
export default function RetailPage() {
  const content = {
      hero: {
        badge: "Retail",
        title: "Retail Video Analytics",
        titleHighlight: "for Loss Prevention & Growth",
        subtitle: "Turn your existing store CCTV into AI video analytics — prevent theft and shrinkage, understand shoppers with footfall and heatmaps, and keep service fast. No camera replacement, no rip-and-replace."
      },
      intro: {
        title: "Retail video analytics on the cameras you already own",
        paragraphs: [
          "Triya adds real-time artificial intelligence to your existing store CCTV, turning every camera into a retail video analytics and loss-prevention system. Because the platform is camera-agnostic and works over standard RTSP/ONVIF feeds, there is no rip-and-replace — your current cameras become an intelligent layer that protects stock and reveals how customers actually shop.",
          "From footfall counting and dwell-time heatmaps to queue monitoring, shelf stock-out alerts and shrinkage detection, Triya watches every camera every second and alerts your team the moment something needs attention — across a single store or an entire chain, from one web portal, deployed in the cloud or fully on-premise."
        ]
      },
      challenges: {
        title: "Retail Security & Operations Challenges",
        items: [
          {
            icon: ShieldAlert,
            title: "Shoplifting & Theft",
            description: "Annual shrinkage costs retailers billions with traditional security unable to prevent losses"
          },
          {
            icon: Users,
            title: "Customer Experience",
            description: "Long queues and poor service lead to customer dissatisfaction and lost sales"
          },
          {
            icon: TrendingUp,
            title: "Store Analytics",
            description: "Limited insights into customer behavior and store performance"
          },
          {
            icon: Clock,
            title: "Incident Response",
            description: "Delayed detection and response to security incidents"
          }
        ]
      },
      solution: {
        title: "Retail Video Analytics Capabilities",
        description: "Turn existing store cameras into a real-time analytics and operations layer: understand customers, protect stock, and keep service fast.",
        features: [
          {
            title: "Store Footfall Analytics",
            description: "Customer footfall counts across every store entrance — by hour, day and location — to measure traffic and conversion.",
            stats: "Per-entrance"
          },
          {
            title: "Section Analytics & Heatmaps",
            description: "Section-wise footfall, customer dwell-time analysis, and movement & engagement heatmaps to optimize layout and product placement.",
            stats: "Heatmaps"
          },
          {
            title: "Queue & Service-Desk Monitoring",
            description: "Billing and service-desk wait times, with automated alerts when queues exceed your defined thresholds.",
            stats: "Real-time alerts"
          },
          {
            title: "Shelf & Stock Monitoring",
            description: "Shelf stock-occupancy levels with automated, image-attached alerts when stock falls below set limits.",
            stats: "Auto alerts"
          },
          {
            title: "Loss Prevention & Shrinkage",
            description: "Object-movement, theft and suspicious-activity detection across the shop floor and stockroom to reduce shrinkage.",
            stats: "Floor & stockroom"
          },
          {
            title: "Staff Presence & Standards",
            description: "Counter staffing, uniform compliance and housekeeping verification to keep service and standards consistent.",
            stats: "Compliance"
          }
        ]
      },
      benefits: {
        title: "Why Retailers Choose Triya",
        items: [
          "Works with your existing CCTV — no camera replacement or rip-and-replace",
          "Real-time theft, shrinkage and suspicious-activity alerts",
          "Footfall, dwell-time and heatmap analytics to grow sales",
          "Faster checkout with automated queue alerts",
          "Shelf stock-out alerts to protect availability and revenue",
          "Privacy-first: deploy in the cloud or fully on-premise",
          "One dashboard for every store, with unlimited user access"
        ]
},
      cta: {
        title: "Revolutionize Your Retail Security",
        description: "Discover how AI can protect your assets and enhance customer experience",
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
            aria-label="AI surveillance demonstration for retail security and loss prevention - smart cameras monitoring retail environment to prevent shoplifting, optimize customer flow, and enhance shopping experience"
          >
            <source src="/videos/retail_hero_1.mp4" type="video/mp4" />
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
                <ShoppingCart className="h-3 w-3 mr-1" />
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