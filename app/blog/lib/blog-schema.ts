export function generateBlogSchema(article: any) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.excerpt,
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
      "@id": `https://www.triya.ai/blog/${article.slug}`
    },
    "keywords": article.tags.join(", "),
    "articleSection": article.category,
    "wordCount": article.content.split(' ').length,
    "timeRequired": article.readTime
  };
}