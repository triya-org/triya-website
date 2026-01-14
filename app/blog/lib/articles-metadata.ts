// Article metadata interface
export interface ArticleMetadata {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  category: string;
  tags: string[];
  metaDescription: string;
  keywords: string[];
}

// Complete article interface (extends metadata)
export interface Article extends ArticleMetadata {
  content: string;
}

// Article metadata only (no content) - for listing pages
export const articlesMetadata: ArticleMetadata[] = [
  {
    slug: "edge-ai-cost-savings",
    title: "How Edge AI Reduces Surveillance Costs by 85% in UAE Businesses",
    excerpt: "Discover how edge AI technology is revolutionizing surveillance economics for businesses across Dubai, Abu Dhabi, and the wider GCC region.",
    author: "Triya Team",
    date: "2024-01-15",
    readTime: "8 min read",
    image: "/blog/edge-ai-costs.jpg",
    category: "Technology",
    tags: ["Edge AI", "Cost Savings", "ROI", "UAE Business"],
    metaDescription: "Learn how edge AI surveillance reduces costs by 85% for UAE businesses. Compare cloud vs edge costs, calculate ROI, and see real Dubai case studies.",
    keywords: ["reduce surveillance costs dubai", "edge ai cost savings", "surveillance ROI calculator", "security system costs UAE"],
  },
  {
    slug: "arabic-surveillance-breakthrough",
    title: "Arabic AI Surveillance: Breaking Language Barriers in GCC Security",
    excerpt: "How Triya's Arabic-first AI surveillance platform is transforming security operations across the Middle East with native language support and cultural awareness.",
    author: "Triya Team",
    date: "2024-01-12",
    readTime: "7 min read",
    image: "/blog/arabic-ai.jpg",
    category: "Innovation",
    tags: ["Arabic AI", "Localization", "GCC Security", "RTL Support"],
    metaDescription: "Discover how Arabic AI surveillance is revolutionizing security in the GCC. Native Arabic support, RTL interfaces, and cultural adaptation for Middle East markets.",
    keywords: ["arabic surveillance system", "arabic security camera", "ai surveillance arabic support", "middle east security technology"],
  },
  {
    slug: "privacy-first-surveillance",
    title: "On-Premise vs Cloud: Why Data Sovereignty Matters for UAE Companies",
    excerpt: "Understanding the critical importance of data sovereignty and privacy in surveillance systems for UAE and GCC organizations.",
    author: "Triya Team",
    date: "2024-01-10",
    readTime: "9 min read",
    image: "/blog/data-sovereignty.jpg",
    category: "Compliance",
    tags: ["Data Privacy", "On-Premise", "Compliance", "Data Sovereignty"],
    metaDescription: "Learn why UAE companies choose on-premise surveillance over cloud solutions. Data sovereignty, privacy laws, and compliance requirements explained.",
    keywords: ["uae data sovereignty", "on premise surveillance dubai", "data privacy laws uae", "surveillance compliance gcc"],
  },
  {
    slug: "ai-surveillance-regulations-uae-saudi",
    title: "The Complete Guide to AI Surveillance Regulations in UAE and Saudi Arabia",
    excerpt: "Navigate the complex landscape of surveillance laws, permits, and compliance requirements for AI-powered security systems in the GCC region.",
    author: "Triya Team",
    date: "2024-01-08",
    readTime: "10 min read",
    image: "/blog/regulations-guide.jpg",
    category: "Legal",
    tags: ["Regulations", "Compliance", "UAE Law", "Saudi Law", "Legal Framework"],
    metaDescription: "Complete guide to AI surveillance regulations in UAE and Saudi Arabia. Understand permits, compliance requirements, and legal frameworks for security systems.",
    keywords: ["surveillance laws uae", "security camera regulations saudi", "ai surveillance permits dubai", "cctv compliance gcc"],
  },
  {
    slug: "real-time-vs-recorded-surveillance",
    title: "Real-Time vs Recorded: Why Instant Detection Saves Lives and Money",
    excerpt: "Explore the critical differences between real-time AI monitoring and traditional recorded surveillance, with case studies showing prevented incidents and ROI impact.",
    author: "Triya Team",
    date: "2024-01-05",
    readTime: "8 min read",
    image: "/blog/real-time-monitoring.jpg",
    category: "Technology",
    tags: ["Real-Time AI", "Incident Prevention", "ROI", "Emergency Response"],
    metaDescription: "Real-time AI surveillance vs traditional recording: Learn how instant detection prevents incidents, saves money, and improves security response times.",
    keywords: ["real time surveillance dubai", "ai monitoring vs recording", "instant threat detection", "preventive security systems"],
  },
  {
    slug: "upgrade-cctv-to-ai-surveillance",
    title: "5 Signs Your Business Needs to Upgrade from CCTV to AI Surveillance",
    excerpt: "Is your traditional CCTV system holding you back? Discover the clear indicators that it's time to embrace AI-powered surveillance for better security and ROI.",
    author: "Triya Team",
    date: "2024-01-03",
    readTime: "6 min read",
    image: "/blog/upgrade-guide.jpg",
    category: "Business",
    tags: ["Upgrade Guide", "CCTV", "AI Transformation", "Business Security"],
    metaDescription: "5 clear signs your business needs AI surveillance instead of traditional CCTV. Upgrade guide with ROI calculations and implementation roadmap.",
    keywords: ["upgrade cctv to ai", "smart surveillance dubai", "cctv replacement", "ai security system benefits"],
  },
  {
    slug: "ai-surveillance-retail-analytics",
    title: "How AI Surveillance Transforms Retail: From Loss Prevention to Customer Insights",
    excerpt: "Discover how modern retailers use AI surveillance beyond security to understand customer behavior, optimize operations, and increase revenue.",
    author: "Triya Team",
    date: "2024-01-01",
    readTime: "9 min read",
    image: "/blog/retail-analytics.jpg",
    category: "Retail",
    tags: ["Retail Analytics", "Customer Behavior", "Loss Prevention", "Business Intelligence"],
    metaDescription: "AI surveillance in retail: Beyond security to customer analytics, heat mapping, queue management, and revenue optimization. Real case studies from UAE retailers.",
    keywords: ["retail surveillance analytics", "customer behavior tracking", "retail loss prevention ai", "store optimization dubai"],
  },
  {
    slug: "ppe-compliance-ai-monitoring",
    title: "PPE Compliance Made Simple: How AI Monitors Workplace Safety 24/7",
    excerpt: "Learn how AI surveillance automates PPE compliance monitoring, prevents workplace accidents, and saves millions in safety violations and insurance costs.",
    author: "Triya Team",
    date: "2023-12-28",
    readTime: "8 min read",
    image: "/blog/ppe-safety.jpg",
    category: "Safety",
    tags: ["PPE Compliance", "Workplace Safety", "Industrial AI", "Safety Monitoring"],
    metaDescription: "Automated PPE compliance monitoring with AI surveillance. Reduce workplace accidents by 73%, ensure 95%+ compliance rates, and save on insurance costs.",
    keywords: ["ppe compliance monitoring", "workplace safety ai", "construction site surveillance", "industrial safety dubai"],
  }
];

// Dynamic content loader
export async function loadArticleContent(slug: string): Promise<string> {
  try {
    const articleModule = await import(`./articles/${slug}.ts`);
    return articleModule.content;
  } catch (error) {
    console.error(`Failed to load article content for ${slug}:`, error);
    return '';
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