import { getAllArticles } from './lib/articles';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';

export default function BlogPage() {
  const articles = getAllArticles();

  return (
    <>
      <Breadcrumbs />
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            Triya Blog
          </h1>
          <p className="text-lg text-muted-foreground">
            Insights on AI surveillance, edge computing, and security technology for the Middle East market
          </p>
        </div>

        {/* Featured Article */}
        {articles[0] && (
          <div className="mb-16">
            <Link href={`/blog/${articles[0].slug}`}>
              <div className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image */}
                  <div className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <span className="inline-block px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm font-medium mb-2">
                        Featured
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 md:p-8 flex flex-col justify-center">
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
                        {articles[0].readTime}
                      </span>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {articles[0].title}
                    </h2>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {articles[0].excerpt}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      {articles[0].tags.slice(0, 3).map((tag) => (
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
                        Read Article <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Article Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.slice(1).map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`}>
              <article className="group h-full">
                <div className="h-full flex flex-col overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                  {/* Image */}
                  <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block px-2 py-1 bg-background/90 backdrop-blur text-xs font-medium rounded">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-6 flex flex-col">
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
                        {article.readTime}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    
                    <p className="text-muted-foreground mb-4 line-clamp-3 flex-1">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        {article.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
            Stay Updated on AI Surveillance Trends
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Get the latest insights on edge AI, security technology, and surveillance best practices for the Middle East market.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors gap-2"
          >
            Subscribe to Updates <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}