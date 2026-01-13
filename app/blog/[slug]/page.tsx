import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Share2, Tag } from 'lucide-react';
import { getAllArticles, getArticleBySlug } from '../lib/articles';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { RelatedUseCases } from '@/components/shared/related-use-cases';
import { BlogErrorBoundary } from '../components/error-boundary';
import { ContentRenderer } from '../components/content-renderer';
import { generateBlogSchema } from '../lib/blog-schema';

// Generate static params for all blog articles
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for each blog article
export async function generateMetadata({ 
  params 
}: { 
  params: { slug: string } 
}): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found | Triya Blog',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${article.title} | Triya Blog`,
    description: article.excerpt,
    keywords: article.tags,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      tags: article.tags,
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://www.triya.ai/blog/${article.slug}`,
    },
  };
}

// Share functionality component
function ShareButton({ article }: { article: any }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
      aria-label="Share article"
    >
      <Share2 className="h-4 w-4" />
      <span className="text-sm">Share</span>
    </button>
  );
}

// Main blog article page component
export default function BlogArticlePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const blogSchema = generateBlogSchema(article);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      
      <Breadcrumbs 
        items={[
          { name: 'Blog', href: '/blog' },
          { name: article.title }
        ]}
      />
      
      <article className="min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Back to blog link */}
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Blog</span>
          </Link>

          {/* Article header */}
          <header className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded">
                {article.category}
              </span>
              {article.featured && (
                <span className="px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-sm font-medium rounded">
                  Featured
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              {article.title}
            </h1>

            <p className="text-xl text-muted-foreground mb-6">
              {article.excerpt}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(article.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {article.readTime}
                </span>
                <span>By {article.author}</span>
              </div>

              <ShareButton article={article} />
            </div>
          </header>

          {/* Article content */}
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <BlogErrorBoundary>
                <ContentRenderer content={article.content} />
              </BlogErrorBoundary>
            </div>

            {/* Tags */}
            <div className="mt-12 pt-6 border-t">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {article.tags.map((tag) => (
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
                Ready to Transform Your Surveillance?
              </h3>
              <p className="text-muted-foreground mb-6">
                Experience the power of edge AI surveillance with 85% cost savings. 
                Get a personalized demo for your business today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Request Demo
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center px-6 py-3 bg-background border border-border rounded-lg hover:bg-muted transition-colors font-medium"
                >
                  View FAQ
                </Link>
              </div>
            </div>
          </div>

          {/* Related use cases */}
          <div className="mt-16 max-w-6xl mx-auto">
            <RelatedUseCases currentSlug={params.slug} />
          </div>
        </div>
      </article>
    </>
  );
}