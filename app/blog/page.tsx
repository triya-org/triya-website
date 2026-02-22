"use client";

import { useState, useEffect } from 'react';
import { getAllArticlesMetadata } from './lib/articles-metadata';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, Clock, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export default function BlogPage() {
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const articles = getAllArticlesMetadata();

  useEffect(() => {
    // Check for saved language preference
    const savedLang = localStorage.getItem("language") as "en" | "ar";
    if (savedLang) {
      setLanguage(savedLang);
      document.documentElement.dir = savedLang === "ar" ? "rtl" : "ltr";
    }
  }, []);

  const content = {
    en: {
      title: "Triya Blog",
      subtitle: "Insights on AI surveillance, edge computing, and security technology for the Middle East market",
      featured: "Featured",
      readArticle: "Read Article",
      ctaTitle: "Stay Updated on AI Surveillance Trends",
      ctaSubtitle: "Get the latest insights on edge AI, security technology, and surveillance best practices for the Middle East market.",
      ctaButton: "Subscribe to Updates"
    },
    ar: {
      title: "مدونة تريا",
      subtitle: "رؤى حول المراقبة بالذكاء الاصطناعي والحوسبة الطرفية وتكنولوجيا الأمن لسوق الشرق الأوسط",
      featured: "مميز",
      readArticle: "اقرأ المقال",
      ctaTitle: "ابق على اطلاع على اتجاهات المراقبة بالذكاء الاصطناعي",
      ctaSubtitle: "احصل على أحدث الرؤى حول الذكاء الاصطناعي الطرفي وتكنولوجيا الأمن وأفضل ممارسات المراقبة لسوق الشرق الأوسط.",
      ctaButton: "اشترك في التحديثات"
    }
  };

  const t = content[language];
  const ArrowIcon = language === "ar" ? ArrowLeft : ArrowRight;

  return (
    <>
      <Breadcrumbs />
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.title}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        {/* Featured Article */}
        {articles[0] && (
          <div className="mb-16">
            <Link href={`/blog/${articles[0].slug}/`}>
              <div className="group relative overflow-hidden rounded-2xl bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl">
                <div className="p-8 md:p-12">
                  <span className="inline-block px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium mb-4">
                    {t.featured}
                  </span>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(articles[0].date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {articles[0].readTime[language]}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {articles[0].title[language]}
                    </h2>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {articles[0].excerpt[language]}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {articles[0].tags[language].slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                  <div className="mt-6">
                    <span className="inline-flex items-center text-primary font-medium group-hover:gap-3 transition-all gap-2">
                      {t.readArticle} <ArrowIcon className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.slice(1).map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}/`}>
              <article className="group h-full">
                <div className="h-full flex flex-col overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                  <div className="flex-1 p-6 flex flex-col">
                    <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded mb-3 self-start">
                      {article.category[language]}
                    </span>
                    
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(article.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {article.readTime[language]}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title[language]}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {article.excerpt[language]}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {article.tags[language].slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <ArrowIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center p-8 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">
            {t.ctaTitle}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            {t.ctaSubtitle}
          </p>
          <Link
            href="/contact/"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors gap-2"
          >
            {t.ctaButton} <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}