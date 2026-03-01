export function generateBlogSchema(article: any) {
  // Get title and other bilingual fields in English for SEO schema
  const title = typeof article.title === 'object' ? article.title.en : article.title;
  const excerpt = typeof article.excerpt === 'object' ? article.excerpt.en : article.excerpt;
  const category = typeof article.category === 'object' ? article.category.en : article.category;
  const readTime = typeof article.readTime === 'object' ? article.readTime.en : article.readTime;
  // Calculate word count from English content
  const contentText = typeof article.content === 'object' ? article.content.en : article.content;
  const wordCount = contentText ? contentText.split(' ').length : 0;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": title,
    "description": excerpt,
    "author": {
      "@type": "Person",
      "name": article.author
    },
    "datePublished": article.date,
    "dateModified": article.date,
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
      "@id": `https://www.triya.ai/blog/${article.slug}/`
    },
    "keywords": (typeof article.tags === 'object' ? article.tags.en : article.tags).join(", "),
    "articleSection": category,
    "wordCount": wordCount,
    "timeRequired": readTime
  };
}