import { getArticleBySlug, getAllArticles, getRelatedArticles, generateArticleSchema } from '../lib/articles';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Calendar } from 'lucide-react';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/shared/breadcrumbs';
import { ShareButtons } from '@/components/blog/share-buttons';

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = getArticleBySlug(params.slug);
  
  if (!article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} | Triya Blog`,
    description: article.metaDescription,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.metaDescription,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      images: [`https://www.triya.ai${article.image}`],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.metaDescription,
      images: [`https://www.triya.ai${article.image}`],
    },
    alternates: {
      canonical: `https://www.triya.ai/blog/${params.slug}`,
    },
  };
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug);
  const relatedArticles = getRelatedArticles(params.slug, 2);

  if (!article) {
    notFound();
  }

  const articleSchema = generateArticleSchema(article);

  // Helper function to parse inline markdown (bold, links)
  const parseInlineMarkdown = (text: string) => {
    // Handle bold text
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part
    );
  };

  // Convert markdown-style content to HTML
  const renderContent = (content: string) => {
    // Pre-process content to group headings with their content
    const processedContent = content.replace(/### ([^\n]+)\n\n((?:- [^\n]+\n?)+)/g, (match, heading, list) => {
      return `### ${heading}\n${list}`;
    });
    
    const sections = processedContent.split('\n\n');
    
    // Look-ahead function to check if next section is related
    const isRelatedContent = (currentSection: string, nextSection: string) => {
      if (!nextSection) return false;
      
      // Check if current is a ### heading and next is a list or content
      if (currentSection.startsWith('### ')) {
        return nextSection.startsWith('- ') || 
               nextSection.startsWith('* ') ||
               nextSection.startsWith('**') ||
               (!nextSection.startsWith('#') && !nextSection.match(/^\d\./));
      }
      return false;
    };
    
    // Group related sections
    const groupedSections: string[] = [];
    let i = 0;
    while (i < sections.length) {
      const current = sections[i];
      const next = sections[i + 1];
      
      if (isRelatedContent(current, next)) {
        // Combine heading with its content
        let combined = current;
        let j = i + 1;
        while (j < sections.length && !sections[j].startsWith('#')) {
          combined += '\n\n' + sections[j];
          j++;
        }
        groupedSections.push(combined);
        i = j;
      } else {
        groupedSections.push(current);
        i++;
      }
    }
    
    return groupedSections.map((section, index) => {
      // Skip empty sections
      if (!section.trim()) return null;

      // Handle ### headings with content
      if (section.startsWith('### ')) {
        const lines = section.split('\n');
        const heading = lines[0].replace('### ', '');
        const contentLines = lines.slice(1).filter(line => line.trim());
        
        // If heading has associated content, render as a group
        if (contentLines.length > 0) {
          // Check for question format
          if (heading.includes('?') || heading.startsWith('"')) {
            const cleanHeading = heading.replace(/["']/g, '');
            return (
              <div key={index} className="mb-6 p-5 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                <h4 className="font-semibold text-lg mb-3 text-foreground flex items-center gap-2">
                  <span className="text-blue-600 dark:text-blue-400">❓</span>
                  {cleanHeading}
                </h4>
                <div className="space-y-2 pl-7">
                  {contentLines.map((line, i) => {
                    const cleanLine = line.replace(/^[-*]\s*/, '').trim();
                    if (cleanLine) {
                      return (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className="text-base text-muted-foreground">{parseInlineMarkdown(cleanLine)}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          }
          
          // Check for Case Study format
          if (heading.toLowerCase().includes('case study') || heading.toLowerCase().includes('scenario')) {
            return (
              <div key={index} className="mb-6 p-5 bg-gradient-to-br from-purple-50/30 to-pink-50/20 dark:from-purple-950/20 dark:to-pink-950/10 rounded-xl border border-purple-200/50 dark:border-purple-800/30">
                <h4 className="font-semibold text-lg mb-3 text-foreground flex items-center gap-2">
                  <span className="text-purple-600 dark:text-purple-400">📊</span>
                  {heading}
                </h4>
                <div className="space-y-2">
                  {contentLines.map((line, i) => {
                    const cleanLine = line.replace(/^[-*]\s*/, '').trim();
                    if (cleanLine) {
                      // Check if it's a key-value pair
                      if (cleanLine.includes(':')) {
                        const [key, ...valueParts] = cleanLine.split(':');
                        const value = valueParts.join(':').trim();
                        return (
                          <div key={i} className="flex flex-col sm:flex-row gap-2">
                            <span className="font-medium text-sm text-purple-700 dark:text-purple-400 min-w-[150px]">
                              {parseInlineMarkdown(key)}:
                            </span>
                            <span className="text-base text-muted-foreground">{parseInlineMarkdown(value)}</span>
                          </div>
                        );
                      }
                      return (
                        <p key={i} className="text-base text-muted-foreground">{parseInlineMarkdown(cleanLine)}</p>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            );
          }
          
          // Check for Week/Step format
          if (heading.toLowerCase().includes('week') || heading.toLowerCase().includes('step')) {
            const numberMatch = heading.match(/\d+/);
            const stepNumber = numberMatch ? numberMatch[0] : '';
            
            return (
              <div key={index} className="mb-4 p-4 bg-gradient-to-r from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10 rounded-lg border border-green-200/50 dark:border-green-800/30">
                <div className="flex items-start gap-3">
                  {stepNumber && (
                    <span className="flex-shrink-0 w-8 h-8 bg-green-500/20 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center text-sm font-bold">
                      {stepNumber}
                    </span>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-base mb-2 text-foreground">{heading}</h4>
                    <div className="space-y-1">
                      {contentLines.map((line, i) => {
                        const cleanLine = line.replace(/^[-*]\s*/, '').trim();
                        if (cleanLine) {
                          return (
                            <div key={i} className="text-sm text-muted-foreground">
                              {parseInlineMarkdown(cleanLine)}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          
          // Default format for other ### headings with content
          return (
            <div key={index} className="mb-6">
              <h3 className="text-xl font-semibold mb-3">{parseInlineMarkdown(heading)}</h3>
              <div className="space-y-2">
                {contentLines.map((line, i) => {
                  const cleanLine = line.replace(/^[-*]\s*/, '').trim();
                  if (cleanLine) {
                    if (line.startsWith('-') || line.startsWith('*')) {
                      return (
                        <div key={i} className="flex items-start gap-2 ml-4">
                          <span className="text-muted-foreground mt-1">•</span>
                          <span className="text-base text-muted-foreground">{parseInlineMarkdown(cleanLine)}</span>
                        </div>
                      );
                    }
                    return (
                      <p key={i} className="text-base text-muted-foreground">{parseInlineMarkdown(cleanLine)}</p>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          );
        }
        
        // If no content, render as regular heading
        return <h3 key={index} className="text-xl font-semibold mt-6 mb-3">{parseInlineMarkdown(heading)}</h3>;
      }
      if (section.startsWith('## ')) {
        const text = section.replace('## ', '');
        return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{parseInlineMarkdown(text)}</h2>;
      }
      if (section.startsWith('# ')) {
        const text = section.replace('# ', '');
        return <h1 key={index} className="text-3xl font-bold mb-6">{parseInlineMarkdown(text)}</h1>;
      }
      
      // Special handling for checklist items with checkmarks
      if (section.includes('✅')) {
        const lines = section.split(' - ');
        const title = lines[0];
        const items = lines.slice(1);
        
        return (
          <div key={index} className="mb-6 p-5 bg-gradient-to-br from-muted/10 to-muted/20 rounded-xl border border-border/50">
            <h4 className="font-semibold text-lg mb-4 text-foreground">{parseInlineMarkdown(title.replace('✅', '').trim())}</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-green-500 text-xl mt-0.5 flex-shrink-0">✓</span>
                  <span className="text-base text-muted-foreground leading-relaxed">{parseInlineMarkdown(item.replace(/✅/g, '').trim())}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      
      // Special handling for Step sections
      if (section.startsWith('**Step')) {
        const match = section.match(/\*\*Step (\d+):\s*([^*]+)\*\*\s*(.*)/);
        if (match) {
          const [, stepNum, stepTitle, stepDescription] = match;
          return (
            <div key={index} className="flex gap-4 p-4 mb-3 bg-gradient-to-r from-blue-50/50 to-blue-50/20 dark:from-blue-950/20 dark:to-blue-950/10 rounded-lg border border-blue-200/50 dark:border-blue-800/30">
              <span className="flex-shrink-0 w-10 h-10 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold">
                {stepNum}
              </span>
              <div className="flex-1">
                <h4 className="font-semibold text-base mb-1 text-foreground">{stepTitle}</h4>
                <p className="text-sm text-muted-foreground">{stepDescription}</p>
              </div>
            </div>
          );
        }
      }
      
      // Special handling for sections with @@ separator (like Cost of Non-Compliance)
      if (section.includes('@@') && section.startsWith('**')) {
        const lines = section.split(' - @@');
        const titleMatch = section.match(/\*\*([^*]+)\*\*/);
        const title = titleMatch ? titleMatch[1] : '';
        const items = lines.slice(0);
        
        if (items.length > 0) {
          const cleanItems = items[0].split('@@').slice(1).map(item => item.trim());
          
          return (
            <div key={index} className="mb-6 p-5 bg-gradient-to-br from-amber-50/30 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/10 rounded-xl border border-amber-200/50 dark:border-amber-800/30">
              <h4 className="font-semibold text-lg mb-4 text-foreground flex items-center gap-2">
                <span className="text-amber-600 dark:text-amber-500">💰</span>
                {title}
              </h4>
              <div className="space-y-2">
                {cleanItems.map((item, i) => {
                  const [label, ...rest] = item.split(':');
                  const value = rest.join(':').trim();
                  
                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="font-medium text-sm text-amber-700 dark:text-amber-400 min-w-[100px]">
                        {label}:
                      </span>
                      <span className="text-sm text-muted-foreground">{value || item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
      }
      
      // Special handling for sections with bold title followed by dash-separated items (without checkmarks or @@)
      if (section.startsWith('**') && section.includes(' - ') && !section.includes('✅') && !section.includes('@@')) {
        const lines = section.split(' - ');
        const title = lines[0];
        const items = lines.slice(1);
        
        // Only apply special formatting if there are multiple items
        if (items.length > 1) {
          return (
            <div key={index} className="mb-6">
              <h4 className="font-semibold text-lg mb-3 text-foreground">{parseInlineMarkdown(title)}</h4>
              <div className="pl-4 space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-muted-foreground mt-1">•</span>
                    <span className="text-base text-muted-foreground leading-relaxed">{parseInlineMarkdown(item.trim())}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }
      
      // Lists
      if (section.startsWith('- ') || section.startsWith('* ')) {
        const items = section.split('\n').filter(item => item.trim());
        return (
          <ul key={index} className="list-disc list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            {items.map((item, i) => {
              const text = item.replace(/^[-*] /, '');
              return <li key={i}>{parseInlineMarkdown(text)}</li>;
            })}
          </ul>
        );
      }
      
      // Numbered lists (with special handling for best practices and mistake/solution format)
      if (section.match(/^\d\./)) {
        const items = section.split('\n').filter(item => item.trim());
        
        // Check for mistake/solution format (contains @@)
        const isMistakeSolution = items.some(item => item.includes('@@'));
        
        if (isMistakeSolution) {
          return (
            <div key={index} className="space-y-4 mb-8">
              {items.map((item, i) => {
                const text = item.replace(/^\d+\.\s*/, '');
                const titleMatch = text.match(/\*\*([^*]+)\*\*/);
                const title = titleMatch ? titleMatch[1] : '';
                const parts = text.split('@@').filter(p => p.trim());
                
                if (parts.length >= 3) {
                  // Has both mistake and solution
                  const mistakeText = parts[1].replace('Mistake:', '').trim();
                  const solutionText = parts[2].replace('Solution:', '').trim();
                  
                  return (
                    <div key={i} className="overflow-hidden rounded-xl border border-border/50 bg-card">
                      <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10">
                        <span className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-lg font-bold">
                          {i + 1}
                        </span>
                        <h4 className="font-semibold text-lg text-foreground pt-2">{title}</h4>
                      </div>
                      <div className="grid md:grid-cols-2 divide-x divide-border">
                        <div className="p-4 bg-red-50/50 dark:bg-red-950/10">
                          <div className="flex items-start gap-3">
                            <span className="text-red-500 mt-1">⚠️</span>
                            <div>
                              <p className="font-medium text-sm text-red-700 dark:text-red-400 mb-1">Mistake</p>
                              <p className="text-sm text-muted-foreground">{mistakeText}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-green-50/50 dark:bg-green-950/10">
                          <div className="flex items-start gap-3">
                            <span className="text-green-500 mt-1">✓</span>
                            <div>
                              <p className="font-medium text-sm text-green-700 dark:text-green-400 mb-1">Solution</p>
                              <p className="text-sm text-muted-foreground">{solutionText}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          );
        }
        
        // Check if items contain bold text (best practices format)
        const isBestPractices = items.some(item => item.includes('**'));
        
        if (isBestPractices) {
          return (
            <div key={index} className="space-y-3 mb-8">
              {items.map((item, i) => {
                const text = item.replace(/^\d+\.\s*/, '');
                // Split on the first occurrence of a non-bold character after bold text
                const parts = text.match(/(\*\*[^*]+\*\*)(.*)/);
                if (parts) {
                  const [, boldPart, restPart] = parts;
                  const title = boldPart.replace(/\*\*/g, '');
                  const description = restPart.trim();
                  return (
                    <div key={i} className="flex gap-4 p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                      <span className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-lg font-bold">
                        {i + 1}
                      </span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-base mb-1 text-foreground">{title}</h4>
                        {description && (
                          <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex gap-4 p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg border border-border/50">
                    <span className="flex-shrink-0 w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-lg font-bold">
                      {i + 1}
                    </span>
                    <span className="text-base text-muted-foreground pt-2">{parseInlineMarkdown(text)}</span>
                  </div>
                );
              })}
            </div>
          );
        }
        
        // Regular numbered list
        return (
          <ol key={index} className="list-decimal list-inside space-y-2 mb-4 text-muted-foreground ml-4">
            {items.map((item, i) => {
              const text = item.replace(/^\d+\.\s*/, '');
              return <li key={i}>{parseInlineMarkdown(text)}</li>;
            })}
          </ol>
        );
      }
      
      // Tables
      if (section.includes('|') && section.includes('---')) {
        const rows = section.split('\n').filter(row => row.trim() && !row.includes('---'));
        const headers = rows[0].split('|').filter(cell => cell.trim());
        const dataRows = rows.slice(1).map(row => row.split('|').filter(cell => cell.trim()));
        
        return (
          <div key={index} className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-border border rounded-lg">
              <thead className="bg-muted/50">
                <tr>
                  {headers.map((header, i) => (
                    <th key={i} className="px-4 py-3 text-left text-sm font-semibold">
                      {parseInlineMarkdown(header.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {dataRows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    {row.map((cell, j) => (
                      <td key={j} className="px-4 py-3 text-sm text-muted-foreground">
                        {parseInlineMarkdown(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      
      // Regular paragraphs with inline formatting
      return (
        <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
          {parseInlineMarkdown(section)}
        </p>
      );
    });
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      
      <Breadcrumbs />
      
      <article className="min-h-screen py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Back to Blog */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
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
                <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                  {article.category}
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                {article.title}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-6">
                {article.excerpt}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-muted text-muted-foreground rounded-md text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="h-px bg-border" />
            </header>

            {/* Article Content */}
            <div className="article-content space-y-4">
              {renderContent(article.content)}
            </div>

            {/* Share Section */}
            <ShareButtons title={article.title} url={`/blog/${params.slug}`} />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {relatedArticles.map((related) => (
                    <Link
                      key={related.slug}
                      href={`/blog/${related.slug}`}
                      className="group block p-6 bg-card border border-border rounded-lg hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(related.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        <span className="text-muted">•</span>
                        <Clock className="h-3 w-3" />
                        {related.readTime}
                      </div>
                      
                      <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                        {related.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {related.excerpt}
                      </p>
                      
                      <div className="mt-4 flex items-center text-primary text-sm font-medium gap-1">
                        Read more <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="mt-12 p-8 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg text-center">
              <h2 className="text-2xl font-bold mb-4">
                Ready to Transform Your Surveillance?
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                See how Triya&apos;s edge AI platform can reduce your surveillance costs by 85% while improving security.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors gap-2"
              >
                Request a Demo <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}