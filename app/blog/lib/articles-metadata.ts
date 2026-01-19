// Article metadata interface
export interface ArticleMetadata {
  slug: string;
  title: {
    en: string;
    ar: string;
  };
  excerpt: {
    en: string;
    ar: string;
  };
  author: string;
  date: string;
  readTime: {
    en: string;
    ar: string;
  };
  image: string;
  category: {
    en: string;
    ar: string;
  };
  tags: {
    en: string[];
    ar: string[];
  };
  metaDescription: string;
  keywords: string[];
}

// Complete article interface (extends metadata)
export interface Article extends ArticleMetadata {
  content: {
    en: string;
    ar: string;
  };
}

// Article metadata only (no content) - for listing pages
export const articlesMetadata: ArticleMetadata[] = [
  {
    slug: "edge-ai-cost-savings",
    title: {
      en: "How Edge AI Reduces Surveillance Costs by 85% in UAE Businesses",
      ar: "كيف يقلل الذكاء الاصطناعي الطرفي من تكاليف المراقبة بنسبة 85% في الأعمال الإماراتية"
    },
    excerpt: {
      en: "Discover how edge AI technology is revolutionizing surveillance economics for businesses across Dubai, Abu Dhabi, and the wider GCC region.",
      ar: "اكتشف كيف تُحدث تقنية الذكاء الاصطناعي الطرفي ثورة في اقتصاديات المراقبة للأعمال في دبي وأبوظبي ومنطقة دول مجلس التعاون الخليجي."
    },
    author: "Triya Team",
    date: "2024-01-15",
    readTime: {
      en: "8 min read",
      ar: "8 دقائق قراءة"
    },
    image: "/blog/edge-ai-costs.jpg",
    category: {
      en: "Technology",
      ar: "التكنولوجيا"
    },
    tags: {
      en: ["Edge AI", "Cost Savings", "ROI", "UAE Business"],
      ar: ["الذكاء الاصطناعي الطرفي", "توفير التكاليف", "عائد الاستثمار", "الأعمال الإماراتية"]
    },
    metaDescription: "Learn how edge AI surveillance reduces costs by 85% for UAE businesses. Compare cloud vs edge costs, calculate ROI, and see real Dubai case studies.",
    keywords: ["reduce surveillance costs dubai", "edge ai cost savings", "surveillance ROI calculator", "security system costs UAE"],
  },
  {
    slug: "arabic-surveillance-breakthrough",
    title: {
      en: "Arabic AI Surveillance: Breaking Language Barriers in GCC Security",
      ar: "المراقبة بالذكاء الاصطناعي العربي: كسر الحواجز اللغوية في أمن دول مجلس التعاون الخليجي"
    },
    excerpt: {
      en: "How Triya's Arabic-first AI surveillance platform is transforming security operations across the Middle East with native language support and cultural awareness.",
      ar: "كيف تحول منصة تريا للمراقبة بالذكاء الاصطناعي الموجهة للعربية عمليات الأمن في الشرق الأوسط مع دعم اللغة الأصلية والوعي الثقافي."
    },
    author: "Triya Team",
    date: "2024-01-12",
    readTime: {
      en: "7 min read",
      ar: "7 دقائق قراءة"
    },
    image: "/blog/arabic-ai.jpg",
    category: {
      en: "Innovation",
      ar: "الابتكار"
    },
    tags: {
      en: ["Arabic AI", "Localization", "GCC Security", "RTL Support"],
      ar: ["الذكاء الاصطناعي العربي", "التوطين", "أمن دول مجلس التعاون الخليجي", "دعم اللغة العربية"]
    },
    metaDescription: "Discover how Arabic AI surveillance is revolutionizing security in the GCC. Native Arabic support, RTL interfaces, and cultural adaptation for Middle East markets.",
    keywords: ["arabic surveillance system", "arabic security camera", "ai surveillance arabic support", "middle east security technology"],
  },
  {
    slug: "privacy-first-surveillance",
    title: {
      en: "On-Premise vs Cloud: Why Data Sovereignty Matters for UAE Companies",
      ar: "المحلي مقابل السحابي: لماذا تهم سيادة البيانات للشركات الإماراتية"
    },
    excerpt: {
      en: "Understanding the critical importance of data sovereignty and privacy in surveillance systems for UAE and GCC organizations.",
      ar: "فهم الأهمية الحرجة لسيادة البيانات والخصوصية في أنظمة المراقبة للمؤسسات في الإمارات ودول مجلس التعاون الخليجي."
    },
    author: "Triya Team",
    date: "2024-01-10",
    readTime: {
      en: "9 min read",
      ar: "9 دقائق قراءة"
    },
    image: "/blog/data-sovereignty.jpg",
    category: {
      en: "Compliance",
      ar: "الامتثال"
    },
    tags: {
      en: ["Data Privacy", "On-Premise", "Compliance", "Data Sovereignty"],
      ar: ["خصوصية البيانات", "محلي", "الامتثال", "سيادة البيانات"]
    },
    metaDescription: "Learn why UAE companies choose on-premise surveillance over cloud solutions. Data sovereignty, privacy laws, and compliance requirements explained.",
    keywords: ["uae data sovereignty", "on premise surveillance dubai", "data privacy laws uae", "surveillance compliance gcc"],
  },
  {
    slug: "ai-surveillance-regulations-uae-saudi",
    title: {
      en: "The Complete Guide to AI Surveillance Regulations in UAE and Saudi Arabia",
      ar: "الدليل الكامل للوائح المراقبة بالذكاء الاصطناعي في الإمارات والسعودية"
    },
    excerpt: {
      en: "Navigate the complex landscape of surveillance laws, permits, and compliance requirements for AI-powered security systems in the GCC region.",
      ar: "تنقل عبر المشهد المعقد لقوانين المراقبة والتصاريح ومتطلبات الامتثال لأنظمة الأمن المدعومة بالذكاء الاصطناعي في منطقة دول مجلس التعاون الخليجي."
    },
    author: "Triya Team",
    date: "2024-01-08",
    readTime: {
      en: "10 min read",
      ar: "10 دقائق قراءة"
    },
    image: "/blog/regulations-guide.jpg",
    category: {
      en: "Legal",
      ar: "القانوني"
    },
    tags: {
      en: ["Regulations", "Compliance", "UAE Law", "Saudi Law", "Legal Framework"],
      ar: ["اللوائح", "الامتثال", "القانون الإماراتي", "القانون السعودي", "الإطار القانوني"]
    },
    metaDescription: "Complete guide to AI surveillance regulations in UAE and Saudi Arabia. Understand permits, compliance requirements, and legal frameworks for security systems.",
    keywords: ["surveillance laws uae", "security camera regulations saudi", "ai surveillance permits dubai", "cctv compliance gcc"],
  },
  {
    slug: "real-time-vs-recorded-surveillance",
    title: {
      en: "Real-Time vs Recorded: Why Instant Detection Saves Lives and Money",
      ar: "الوقت الفعلي مقابل المسجل: لماذا يوفر الكشف الفوري الأرواح والمال"
    },
    excerpt: {
      en: "Explore the critical differences between real-time AI monitoring and traditional recorded surveillance, with case studies showing prevented incidents and ROI impact.",
      ar: "استكشف الفروقات الحرجة بين المراقبة بالذكاء الاصطناعي في الوقت الفعلي والمراقبة التقليدية المسجلة، مع دراسات حالة توضح الحوادث المنعة وتأثير العائد على الاستثمار."
    },
    author: "Triya Team",
    date: "2024-01-05",
    readTime: {
      en: "8 min read",
      ar: "8 دقائق قراءة"
    },
    image: "/blog/real-time-monitoring.jpg",
    category: {
      en: "Technology",
      ar: "التكنولوجيا"
    },
    tags: {
      en: ["Real-Time AI", "Incident Prevention", "ROI", "Emergency Response"],
      ar: ["الذكاء الاصطناعي في الوقت الفعلي", "منع الحوادث", "عائد الاستثمار", "الاستجابة للطوارئ"]
    },
    metaDescription: "Real-time AI surveillance vs traditional recording: Learn how instant detection prevents incidents, saves money, and improves security response times.",
    keywords: ["real time surveillance dubai", "ai monitoring vs recording", "instant threat detection", "preventive security systems"],
  },
  {
    slug: "upgrade-cctv-to-ai-surveillance",
    title: {
      en: "5 Signs Your Business Needs to Upgrade from CCTV to AI Surveillance",
      ar: "5 علامات تشير إلى حاجة عملك للترقية من CCTV إلى المراقبة بالذكاء الاصطناعي"
    },
    excerpt: {
      en: "Is your traditional CCTV system holding you back? Discover the clear indicators that it's time to embrace AI-powered surveillance for better security and ROI.",
      ar: "هل يعيقك نظام المراقبة التقليدي CCTV؟ اكتشف المؤشرات الواضحة التي تدل على أن الوقت قد حان لتبني المراقبة المدعومة بالذكاء الاصطناعي لأمان أفضل وعائد على الاستثمار."
    },
    author: "Triya Team",
    date: "2024-01-03",
    readTime: {
      en: "6 min read",
      ar: "6 دقائق قراءة"
    },
    image: "/blog/upgrade-guide.jpg",
    category: {
      en: "Business",
      ar: "الأعمال"
    },
    tags: {
      en: ["Upgrade Guide", "CCTV", "AI Transformation", "Business Security"],
      ar: ["دليل الترقية", "كاميرات المراقبة", "التحول بالذكاء الاصطناعي", "أمن الأعمال"]
    },
    metaDescription: "5 clear signs your business needs AI surveillance instead of traditional CCTV. Upgrade guide with ROI calculations and implementation roadmap.",
    keywords: ["upgrade cctv to ai", "smart surveillance dubai", "cctv replacement", "ai security system benefits"],
  },
  {
    slug: "ai-surveillance-retail-analytics",
    title: {
      en: "How AI Surveillance Transforms Retail: From Loss Prevention to Customer Insights",
      ar: "كيف تحول المراقبة بالذكاء الاصطناعي قطاع التجزئة: من منع الخسائر إلى رؤى العملاء"
    },
    excerpt: {
      en: "Discover how modern retailers use AI surveillance beyond security to understand customer behavior, optimize operations, and increase revenue.",
      ar: "اكتشف كيف يستخدم تجار التجزئة الحديثون المراقبة بالذكاء الاصطناعي لما هو أبعد من الأمان لفهم سلوك العملاء وتحسين العمليات وزيادة الإيرادات."
    },
    author: "Triya Team",
    date: "2024-01-01",
    readTime: {
      en: "9 min read",
      ar: "9 دقائق قراءة"
    },
    image: "/blog/retail-analytics.jpg",
    category: {
      en: "Retail",
      ar: "التجزئة"
    },
    tags: {
      en: ["Retail Analytics", "Customer Behavior", "Loss Prevention", "Business Intelligence"],
      ar: ["تحليلات التجزئة", "سلوك العملاء", "منع الخسائر", "ذكاء الأعمال"]
    },
    metaDescription: "AI surveillance in retail: Beyond security to customer analytics, heat mapping, queue management, and revenue optimization. Real case studies from UAE retailers.",
    keywords: ["retail surveillance analytics", "customer behavior tracking", "retail loss prevention ai", "store optimization dubai"],
  },
  {
    slug: "ppe-compliance-ai-monitoring",
    title: {
      en: "PPE Compliance Made Simple: How AI Monitors Workplace Safety 24/7",
      ar: "الامتثال لمعدات الوقاية الشخصية أصبح بسيطاً: كيف يراقب الذكاء الاصطناعي سلامة مكان العمل على مدار الساعة"
    },
    excerpt: {
      en: "Learn how AI surveillance automates PPE compliance monitoring, prevents workplace accidents, and saves millions in safety violations and insurance costs.",
      ar: "تعرف على كيفية أتمتة المراقبة بالذكاء الاصطناعي لمراقبة الامتثال لمعدات الوقاية الشخصية، ومنع حوادث العمل، وتوفير الملايين في انتهاكات السلامة وتكاليف التأمين."
    },
    author: "Triya Team",
    date: "2023-12-28",
    readTime: {
      en: "8 min read",
      ar: "8 دقائق قراءة"
    },
    image: "/blog/ppe-safety.jpg",
    category: {
      en: "Safety",
      ar: "السلامة"
    },
    tags: {
      en: ["PPE Compliance", "Workplace Safety", "Industrial AI", "Safety Monitoring"],
      ar: ["الامتثال لمعدات الوقاية الشخصية", "سلامة مكان العمل", "الذكاء الاصطناعي الصناعي", "مراقبة السلامة"]
    },
    metaDescription: "Automated PPE compliance monitoring with AI surveillance. Reduce workplace accidents by 73%, ensure 95%+ compliance rates, and save on insurance costs.",
    keywords: ["ppe compliance monitoring", "workplace safety ai", "construction site surveillance", "industrial safety dubai"],
  }
];

// Dynamic content loader
export async function loadArticleContent(slug: string): Promise<{ en: string; ar: string }> {
  try {
    const articleModule = await import(`./articles/${slug}.ts`);
    return articleModule.content;
  } catch (error) {
    console.error(`Failed to load article content for ${slug}:`, error);
    return { en: '', ar: '' };
  }
}

// Get full article with content (uses dynamic import)
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const metadata = articlesMetadata.find(article => article.slug === slug);
  if (!metadata) {
    return undefined;
  }

  const content = await loadArticleContent(slug);
  return {
    ...metadata,
    content
  };
}

// Get all articles metadata (no content - for listing pages)
export function getAllArticlesMetadata(): ArticleMetadata[] {
  return articlesMetadata.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Get related articles metadata (no content)
export function getRelatedArticlesMetadata(currentSlug: string, limit: number = 2): ArticleMetadata[] {
  return articlesMetadata
    .filter(article => article.slug !== currentSlug)
    .slice(0, limit);
}

// Generate Article Schema for SEO
export function generateArticleSchema(article: Article | ArticleMetadata) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.metaDescription,
    "image": `https://www.triya.ai${article.image}`,
    "datePublished": article.date,
    "dateModified": article.date,
    "author": {
      "@type": "Organization",
      "name": "Triya"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Triya",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.triya.ai/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://www.triya.ai/blog/${article.slug}`
    },
    "keywords": article.keywords.join(", "),
    "articleSection": article.category
  };
}