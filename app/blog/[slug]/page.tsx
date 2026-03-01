import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllArticlesMetadata, getArticleBySlug as getArticleBySlugAsync } from '../lib/articles-metadata';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { generateBlogSchema } from '../lib/blog-schema';
import { BlogArticleClient } from './blog-article-client';

// Generate static params for all blog articles
export async function generateStaticParams() {
  const articles = getAllArticlesMetadata();
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
  const article = await getArticleBySlugAsync(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found | Triya Blog',
      description: 'The requested article could not be found.',
    };
  }

  return {
    title: `${article.title.en} | Triya Blog`,
    description: article.excerpt.en,
    keywords: article.tags.en,
    openGraph: {
      title: article.title.en,
      description: article.excerpt.en,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      tags: article.tags.en,
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title.en,
      description: article.excerpt.en,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://www.triya.ai/blog/${article.slug}/`,
    },
  };
}

// Main blog article page component
export default async function BlogArticlePage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const article = await getArticleBySlugAsync(params.slug);

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
      
      <Breadcrumbs />
      <BlogArticleClient article={article} />
    </>
  );
}