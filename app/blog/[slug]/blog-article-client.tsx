"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag } from 'lucide-react';
import { ShareButton } from '../components/share-button';
import { ContentRenderer } from '../components/content-renderer';
import { BlogErrorBoundary } from '../components/error-boundary';

interface BlogArticleClientProps {
  article: any; // Using any for flexibility with the article structure
}

export function BlogArticleClient({ article }: BlogArticleClientProps) {
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
      backToBlog: "Back to Blog",
      by: "By",
      readyToTransform: "Ready to Transform Your Surveillance?",
      readyDescription: "Experience the power of edge AI surveillance with 85% cost savings. Get a personalized demo for your business today.",
      requestDemo: "Request Demo",
      viewFaq: "View FAQ"
    },
    ar: {
      backToBlog: "العودة إلى المدونة",
      by: "بواسطة",
      readyToTransform: "هل أنت مستعد لتحويل نظام المراقبة الخاص بك؟",
      readyDescription: "اختبر قوة المراقبة بالذكاء الاصطناعي الطرفي مع توفير 85% من التكاليف. احصل على عرض توضيحي مخصص لعملك اليوم.",
      requestDemo: "طلب عرض توضيحي",
      viewFaq: "عرض الأسئلة الشائعة"
    }
  };

  const t = content[language];
  const BackArrow = language === "ar" ? ArrowRight : ArrowLeft;

  return (
    <article className="min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Back to blog link */}
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <BackArrow className="h-4 w-4" />
          <span>{t.backToBlog}</span>
        </Link>

        {/* Article header */}
        <header className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded">
              {article.category[language]}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {article.title[language]}
          </h1>

          <p className="text-xl text-muted-foreground mb-6">
            {article.excerpt[language]}
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {article.readTime[language]}
              </span>
              <span>{t.by} {article.author}</span>
            </div>

            <ShareButton article={article} />
          </div>
        </header>

        {/* Article content */}
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <BlogErrorBoundary>
              <ContentRenderer content={article.content[language]} />
            </BlogErrorBoundary>
          </div>

          {/* Tags */}
          <div className="mt-12 pt-6 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {article.tags[language].map((tag: string) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 rounded-md text-sm transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Call to action */}
          <div className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">
              {t.readyToTransform}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t.readyDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                {t.requestDemo}
              </Link>
              <Link
                href="/faq"
                className="inline-flex items-center justify-center px-6 py-3 bg-background border border-border rounded-lg hover:bg-muted transition-colors font-medium"
              >
                {t.viewFaq}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </article>
  );
}