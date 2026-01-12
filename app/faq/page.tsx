"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { faqData, getCategories } from "./faq-data";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const categories = getCategories();

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <>
      <Breadcrumbs />
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 sm:px-6">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about Triya&apos;s AI surveillance platform
            </p>
          </motion.div>

          {/* FAQ Items */}
          <motion.div variants={fadeInUp} className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  {category}
                </h2>
                <div className="space-y-4">
                  {faqData
                    .filter(faq => faq.category === category)
                    .map((faq, index) => {
                      const globalIndex = faqData.indexOf(faq);
                      const isOpen = openItems.includes(globalIndex);
                      
                      return (
                        <div
                          key={globalIndex}
                          className="border border-border rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleItem(globalIndex)}
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-medium pr-4">{faq.question}</span>
                            <ChevronDown
                              className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-6 pb-4 text-muted-foreground">
                                  {faq.answer}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            variants={fadeInUp}
            className="mt-16 text-center p-8 bg-muted/30 rounded-lg"
          >
            <h2 className="text-2xl font-semibold mb-4">
              Still have questions?
            </h2>
            <p className="text-muted-foreground mb-6">
              Our team is here to help you understand how Triya can transform your security operations.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
    </>
  );
}