"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  DollarSign,
  Search,
  Unlock,
  LineChart
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";

export function ProductShowcase() {
  const content = {
      title: "Our Features",
      subtitle: "Cutting-edge technology designed for modern surveillance needs",
      features: [
        {
          icon: DollarSign,
          title: "Significant Cost Savings",
          description: "Retrofit existing cameras; far cheaper than rip-and-replace",
          badge: "Cost Effective"
        },
        {
          icon: Shield,
          title: "Sovereign AI Ready",
          description: "Edge inference, zero cloud dependency, local data control",
          badge: "Secure"
        },
        {
          icon: Search,
          title: "90% Faster Investigations",
          description: "Converse with AI in your language (30+ languages supported) for faster investigations",
          badge: "Efficient"
        },
        {
          icon: Unlock,
          title: "No Vendor Lock-in",
          description: "Camera agnostic, works with any existing IP Cameras",
          badge: "Flexible"
        },
        {
          icon: LineChart,
          title: "Advanced Analytics",
          description: "Comprehensive dashboards with real-time insights and historical analysis",
          badge: "Data-Driven"
        },
        {
          icon: Shield,
          title: "Multi-Industry Support",
          description: "Tailored solutions for manufacturing, retail, healthcare, and smart cities",
          badge: "Versatile"
        }
      ]
  };

  const t = content;

  return (
    <section className="py-24 bg-background">
      <div className="container">
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            {t.title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerChildren}
        >
          {t.features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="group hover:shadow-lg transition-shadow duration-300 h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}