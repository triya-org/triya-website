"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { faqData, getCategories } from "./faq-data";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const categories = getCategories(language);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const content = {
    en: {
      title: "Frequently Asked Questions",
      subtitle: "Everything you need to know about Triya's AI surveillance platform",
      ctaTitle: "Still have questions?",
      ctaSubtitle: "Our team is here to help you understand how Triya can transform your security operations.",
      ctaButton: "Contact Us"
    },
    ar: {
      title: "الأسئلة الشائعة",
      subtitle: "كل ما تحتاج لمعرفته حول منصة المراقبة بالذكاء الاصطناعي من تريا",
      ctaTitle: "هل لديك أسئلة أخرى؟",
      ctaSubtitle: "فريقنا هنا لمساعدتك على فهم كيف يمكن لتريا تحويل عمليات الأمن لديك.",
      ctaButton: "اتصل بنا"
    }
  };

  const t = content[language];
  const ChevronIcon = language === "ar" ? ChevronUp : ChevronDown;
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;

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
              {t.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.subtitle}
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
                    .filter(faq => faq.category[language] === category)
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
                            className={`w-full px-6 py-4 text-${language === 'ar' ? 'right' : 'left'} flex items-center justify-between hover:bg-muted/50 transition-colors`}
                          >
                            <span className="font-medium pr-4">{faq.question[language]}</span>
                            <ChevronIcon
                              className={`h-5 w-5 flex-shrink-0 transition-transform duration-200 ${
                                isOpen ? (language === "ar" ? "" : "rotate-180") : (language === "ar" ? "rotate-180" : "")
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
                                <div className={`px-6 pb-4 text-muted-foreground text-${language === 'ar' ? 'right' : 'left'}`}>
                                  {faq.answer[language]}
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
              {t.ctaTitle}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t.ctaSubtitle}
            </p>
            <a
              href="/contact/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {t.ctaButton}
              {language === "ar" ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
    </>
  );
}