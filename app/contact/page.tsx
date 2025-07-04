"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerChildren } from "@/lib/motion-variants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Mail, 
  Phone, 
  MessageSquare,
  Building,
  Clock,
  Send
} from "lucide-react";

export default function ContactPage() {
  const [language, setLanguage] = useState<"en" | "ar">("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const content = {
    en: {
      hero: {
        title: "Let's Start a",
        titleHighlight: "Conversation",
        subtitle: "Ready to transform your security infrastructure? Our team is here to help you explore how Triya.ai can meet your specific needs."
      },
      form: {
        title: "Send us a message",
        description: "Fill out the form below and we'll get back to you within 24 hours.",
        fields: {
          name: "Full Name",
          email: "Email Address",
          company: "Company Name",
          phone: "Phone Number",
          message: "Message",
          messagePlaceholder: "Tell us about your security needs..."
        },
        submit: "Send Message"
      },
      contact: {
        title: "Get in touch",
        methods: [
          {
            icon: Building,
            title: "Headquarters",
            description: "Abu Dhabi Global Market",
            detail: "Al Maryah Island, UAE"
          },
          {
            icon: Mail,
            title: "Email Us",
            description: "For general inquiries",
            detail: "founders@triya.ai"
          },
          {
            icon: Phone,
            title: "Call Us",
            description: "Mon-Fri 9am-6pm GST",
            detail: "+971-58-68-1200"
          },
          {
            icon: Clock,
            title: "Response Time",
            description: "We typically respond within",
            detail: "24 hours"
          }
        ]
      },
      cta: {
        title: "Ready for a Demo?",
        description: "See Triya.ai in action with a personalized demonstration",
        button: "Schedule Demo"
      }
    },
    ar: {
      hero: {
        title: "لنبدأ",
        titleHighlight: "محادثة",
        subtitle: "هل أنت مستعد لتحويل البنية التحتية الأمنية الخاصة بك؟ فريقنا هنا لمساعدتك في استكشاف كيف يمكن لـ Triya.ai تلبية احتياجاتك المحددة."
      },
      form: {
        title: "أرسل لنا رسالة",
        description: "املأ النموذج أدناه وسنعود إليك خلال 24 ساعة.",
        fields: {
          name: "الاسم الكامل",
          email: "عنوان البريد الإلكتروني",
          company: "اسم الشركة",
          phone: "رقم الهاتف",
          message: "الرسالة",
          messagePlaceholder: "أخبرنا عن احتياجاتك الأمنية..."
        },
        submit: "إرسال الرسالة"
      },
      contact: {
        title: "تواصل معنا",
        methods: [
          {
            icon: Building,
            title: "المقر الرئيسي",
            description: "سوق أبوظبي العالمي",
            detail: "جزيرة المارية، الإمارات"
          },
          {
            icon: Mail,
            title: "راسلنا",
            description: "للاستفسارات العامة",
            detail: "founders@triya.ai"
          },
          {
            icon: Phone,
            title: "اتصل بنا",
            description: "الإثنين-الجمعة 9ص-6م",
            detail: "+971-58-68-1200"
          },
          {
            icon: Clock,
            title: "وقت الاستجابة",
            description: "نرد عادة خلال",
            detail: "24 ساعة"
          }
        ]
      },
      cta: {
        title: "جاهز لعرض توضيحي؟",
        description: "شاهد Triya.ai في العمل مع عرض توضيحي شخصي",
        button: "جدولة عرض توضيحي"
      }
    }
  };

  const t = content[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
        <div className="container relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerChildren}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
              variants={fadeInUp}
            >
              {t.hero.title}{" "}
              <span className="text-primary">{t.hero.titleHighlight}</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground"
              variants={fadeInUp}
            >
              {t.hero.subtitle}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="container">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Contact Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{t.form.title}</CardTitle>
                  <CardDescription>{t.form.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t.form.fields.name}</Label>
                        <Input id="name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">{t.form.fields.email}</Label>
                        <Input id="email" type="email" required />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company">{t.form.fields.company}</Label>
                        <Input id="company" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t.form.fields.phone}</Label>
                        <Input id="phone" type="tel" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">{t.form.fields.message}</Label>
                      <Textarea
                        id="message"
                        placeholder={t.form.fields.messagePlaceholder}
                        rows={5}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2">
                      {t.form.submit}
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
            >
              <h2 className="text-2xl font-bold mb-6">{t.contact.title}</h2>
              <div className="space-y-4">
                {t.contact.methods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <motion.div key={index} variants={fadeInUp}>
                      <Card>
                        <CardContent className="flex items-start space-x-4 pt-6">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{method.title}</h3>
                            <p className="text-sm text-muted-foreground mb-1">
                              {method.description}
                            </p>
                            <p className="text-sm font-medium">{method.detail}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-muted/50">
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
            <Button 
              size="lg" 
              variant="secondary" 
              className="gap-2"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              {t.cta.button}
              <MessageSquare className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}