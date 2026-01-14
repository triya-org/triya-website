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
    if (!text) return text;
    
    // Handle text with format: **Label:** rest of text
    if (text.startsWith('**') && text.includes(':**')) {
      const match = text.match(/^\*\*([^:]+):\*\*(.*)$/);
      if (match) {
        const [, label, rest] = match;
        return (
          <>
            <strong className="text-foreground font-semibold">{label}:</strong>
            {rest}
          </>
        );
      }
    }
    
    // Handle regular bold text
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part
    );
  };

  // Convert markdown-style content to HTML
  const renderContent = (content: string) => {
    const sections = content.split('\n\n');
    const processedIndices = new Set<number>();
    let inQASection = false; // Track if we're in a Q&A section like "Common Objections Addressed"
    
    return sections.map((section, index) => {
      // Skip if already processed as part of a Q&A pair
      if (processedIndices.has(index)) return null;
      // Skip empty sections
      if (!section.trim()) return null;

      // Handle ## headings (H2)
      if (section.startsWith('## ')) {
        const text = section.replace('## ', '');
        // Check if this is a Q&A section header
        inQASection = text.toLowerCase().includes('objection') || text.toLowerCase().includes('q&a') || text.toLowerCase().includes('questions');
        
        // Special formatting for certain section headers
        if (text.includes('Hidden Costs') || text.includes('Recording Only')) {
          return (
            <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
              {parseInlineMarkdown(text)}
            </h2>
          );
        }
        
        if (text.includes('Implementation') && text.includes('Easy')) {
          return (
            <h2 key={index} className="text-2xl font-bold mt-8 mb-4 flex items-center gap-2">
              <span className="text-green-500">✅</span>
              {parseInlineMarkdown(text)}
            </h2>
          );
        }
        
        return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{parseInlineMarkdown(text)}</h2>;
      }

      // Handle ### headings (H3)
      if (section.startsWith('### ')) {
        const heading = section.replace('### ', '');
        
        // Check for Multi-Point Verification section first
        if (heading === 'Multi-Point Verification') {
          // Look for the numbered list in the next sections
          let introText = '';
          let numberedItems: string[] = [];
          for (let i = index + 1; i < sections.length; i++) {
            const nextSection = sections[i];
            if (!nextSection || nextSection.startsWith('#')) break;
            
            // Capture the intro text
            if (nextSection.includes("AI doesn't just check")) {
              introText = nextSection;
              processedIndices.add(i);
            }
            // Capture numbered list items (1. through 5.)
            else if (nextSection.match(/^[1-5]\./)) {
              const items = nextSection.split('\n').filter(item => item.trim());
              numberedItems = items;
              processedIndices.add(i);
              break;
            }
          }
          
          if (introText || numberedItems.length > 0) {
            return (
              <div key={index} className="mb-6 p-5 bg-gradient-to-br from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10 rounded-xl border border-border/50">
                <h4 className="font-bold text-lg mb-4 text-foreground flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  {heading}
                </h4>
                {introText && <p className="mb-4 text-muted-foreground">{introText}</p>}
                {numberedItems.length > 0 && (
                  <ol className="list-decimal list-inside space-y-2 ml-4">
                    {numberedItems.map((item, i) => {
                      const text = item.replace(/^\d+\.\s*/, '');
                      return (
                        <li key={i} className="text-sm text-muted-foreground">
                          {text}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            );
          }
        }
        
        // Check for Manufacturing Plants and similar industry sections with subsections
        if (heading === 'Manufacturing Plants' || heading === 'Construction Sites' || 
            heading === 'Oil & Gas Facilities' || heading === 'Healthcare Facilities') {
          // Look ahead for subsection content
          const subsections: Record<string, string[]> = {};
          let caseStudy: { title: string; items: string[] } | null = null;
          
          for (let i = index + 1; i < sections.length; i++) {
            const nextSection = sections[i];
            if (!nextSection) continue;
            if (nextSection.startsWith('###') || nextSection.startsWith('##')) break; // Stop at next heading
            
            // Parse subsection with bold header followed by dash list
            if (nextSection.includes('**') && nextSection.includes(':**')) {
              const lines = nextSection.split('\n').filter(line => line.trim());
              const headerLine = lines[0];
              
              // Extract header between ** markers
              const headerMatch = headerLine.match(/\*\*([^:]+):\*\*/);
              if (headerMatch) {
                const header = headerMatch[1];
                const items = [];
                
                // Collect dash-prefixed items
                for (let j = 1; j < lines.length; j++) {
                  if (lines[j].startsWith('-')) {
                    items.push(lines[j].replace(/^-\s*/, ''));
                  }
                }
                
                if (header.includes('Case Study')) {
                  caseStudy = { title: headerLine.replace(/\*\*/g, ''), items };
                } else {
                  subsections[header] = items;
                }
                processedIndices.add(i);
              }
            }
          }
          
          if (Object.keys(subsections).length > 0 || caseStudy) {
            const bgGradient = heading.includes('Manufacturing') ? 'from-indigo-50/30 to-blue-50/20 dark:from-indigo-950/20 dark:to-blue-950/10' :
                              heading.includes('Construction') ? 'from-orange-50/30 to-amber-50/20 dark:from-orange-950/20 dark:to-amber-950/10' :
                              heading.includes('Oil') ? 'from-slate-50/30 to-gray-50/20 dark:from-slate-950/20 dark:to-gray-950/10' :
                              'from-emerald-50/30 to-green-50/20 dark:from-emerald-950/20 dark:to-green-950/10';
            
            return (
              <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50`}>
                <h4 className="font-bold text-lg mb-4 text-foreground">
                  {heading}
                </h4>
                
                {Object.entries(subsections).map(([header, items], i) => (
                  <div key={i} className="mb-4">
                    <p className="font-semibold text-sm mb-2 text-foreground">{header}:</p>
                    <ul className="space-y-1 ml-4">
                      {items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="text-primary/60 mt-1">•</span>
                          <span className="text-sm text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                
                {caseStudy && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="font-semibold text-sm mb-2 text-primary">{caseStudy.title}</p>
                    <ul className="space-y-1">
                      {caseStudy.items.map((item, j) => (
                        <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary/40">▸</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          }
        }
        
        // Check for any H3 heading followed by dash-separated metrics (Success Stories pattern)
        if (heading === 'Global Construction Firm' || heading === 'Regional Manufacturing Hub' || heading === 'National Oil Company') {
          // Look for the metrics in the next section
          let metricsContent = '';
          if (index + 1 < sections.length) {
            const nextSection = sections[index + 1];
            if (nextSection.startsWith('- **')) {
              metricsContent = nextSection;
              processedIndices.add(index + 1);
            }
          }
          
          // Parse the metrics whether we found content or not - the heading itself might have inline content
          const metrics: { label: string; value: string; isTotal?: boolean }[] = [];
          
          if (metricsContent) {
            const lines = metricsContent.split('\n').filter(l => l.trim());
            lines.forEach(line => {
              const cleanLine = line.replace(/^-\s*/, '');
              const match = cleanLine.match(/\*\*([^:]+):\*\*\s*(.*)/);
              if (match) {
                metrics.push({ label: match[1], value: match[2] });
              }
            });
          }
          
          // Always render the card for these specific headings
          const isConstruction = heading.includes('Construction');
          const isManufacturing = heading.includes('Manufacturing');
          const isOil = heading.includes('Oil');
          const bgGradient = isConstruction ? 'from-orange-50/30 to-amber-50/20 dark:from-orange-950/20 dark:to-amber-950/10' :
                            isManufacturing ? 'from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10' :
                            'from-slate-50/30 to-gray-50/20 dark:from-slate-950/20 dark:to-gray-950/10';
          
          return (
            <div key={index} className={`mb-6 p-6 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow`}>
              <h4 className="font-bold text-xl mb-4 text-foreground">
                <span>{heading}</span>
              </h4>
              {metrics.length > 0 ? (
                <div className="grid gap-3">
                  {metrics.map((metric, i) => {
                    const isResult = metric.label.toLowerCase().includes('result');
                    const isSavings = metric.label.toLowerCase().includes('savings');
                    return (
                      <div key={i} className={`flex justify-between items-center py-2.5 px-3 rounded-lg ${
                        isResult ? 'bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30' :
                        isSavings ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30' :
                        'bg-background/50 border border-border/30'
                      }`}>
                        <span className={`font-medium text-sm ${
                          isResult || isSavings ? 'text-foreground' : 'text-muted-foreground'
                        }`}>{metric.label}</span>
                        <span className={`font-semibold text-sm ${
                          isResult ? 'text-green-700 dark:text-green-400' :
                          isSavings ? 'text-emerald-700 dark:text-emerald-400' :
                          'text-foreground'
                        }`}>{metric.value}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No metrics available</p>
              )}
            </div>
          );
        }
        
        // Check for ROI sections and Investment/Returns patterns
        if (heading === 'Investment (Medium-sized Facility)' || heading === 'Savings and Returns' || 
            heading.includes('Investment') && heading.includes('(') || heading.includes('Annual Returns')) {
          // Look for the metrics in the next section
          let metricsContent = '';
          if (index + 1 < sections.length) {
            const nextSection = sections[index + 1];
            // Check if next section has dash-lists with AED amounts or bold labels
            if (nextSection.startsWith('- ') && (nextSection.includes('AED') || nextSection.includes('**'))) {
              metricsContent = nextSection;
              processedIndices.add(index + 1);
            }
          }
          
          if (metricsContent) {
            const metrics: { label: string; value: string; isTotal?: boolean }[] = [];
            const lines = metricsContent.split('\n').filter(l => l.trim());
            lines.forEach(line => {
              const cleanLine = line.replace(/^-\s*/, '');
              // Check for lines with bold labels like **AI surveillance system:** AED 200,000
              if (cleanLine.includes('**') && cleanLine.includes(':')) {
                const match = cleanLine.match(/\*\*([^:*]+)(?:\*\*)?:\s*(?:\*\*)?([^*]+)(?:\*\*)?/);
                if (match) {
                  const label = match[1].trim();
                  const value = match[2].trim();
                  const isTotal = label.toLowerCase().includes('total');
                  metrics.push({ label, value, isTotal });
                }
              } else {
                // Regular metric lines
                const colonIndex = cleanLine.indexOf(':');
                if (colonIndex > -1) {
                  const label = cleanLine.substring(0, colonIndex).trim();
                  const value = cleanLine.substring(colonIndex + 1).trim();
                  metrics.push({ label, value });
                }
              }
            });
            
            const isInvestment = heading.includes('Investment');
            const bgGradient = isInvestment ? 'from-red-50/30 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10' :
                              'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10';
            
            return (
              <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50`}>
                <h4 className="font-bold text-lg mb-4 text-foreground">
                  {heading}
                </h4>
                <div className="grid gap-3">
                  {metrics.map((metric, i) => {
                    const isTotal = metric.isTotal || metric.label.includes('Total');
                    return (
                      <div key={i} className={`flex justify-between items-center py-2 border-b border-border/30 last:border-0 ${isTotal ? 'font-bold border-t-2 pt-3' : ''}`}>
                        <span className={`font-medium text-sm ${isTotal ? 'text-foreground' : 'text-muted-foreground'}`}>{metric.label}:</span>
                        <span className={`text-sm ${isTotal ? 'text-base font-bold' : 'font-semibold text-foreground'}`}>{metric.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        }
        
        // Check for headings followed by numbered lists (like Multi-Point Verification)
        if (heading === 'Multi-Point Verification' || heading.includes('Verification')) {
          // Look for numbered list content in the next sections
          let combinedContent = '';
          let descriptionText = '';
          
          // First check for descriptive text
          if (index + 1 < sections.length) {
            const nextSection = sections[index + 1];
            if (!nextSection.startsWith('#') && !nextSection.match(/^\d\./) && !processedIndices.has(index + 1)) {
              descriptionText = nextSection;
              processedIndices.add(index + 1);
              
              // Then look for numbered list in the section after that
              if (index + 2 < sections.length) {
                const numberedSection = sections[index + 2];
                if (numberedSection.match(/^\d\./) && !processedIndices.has(index + 2)) {
                  combinedContent = numberedSection;
                  processedIndices.add(index + 2);
                }
              }
            } else if (nextSection.match(/^\d\./) && !processedIndices.has(index + 1)) {
              // Direct numbered list
              combinedContent = nextSection;
              processedIndices.add(index + 1);
            }
          }
          
          if (combinedContent || descriptionText) {
            return (
              <div key={index} className="mb-6">
                <h3 className="text-xl font-semibold mt-6 mb-4 flex items-center gap-2">
                  <span className="text-blue-500">🔍</span>
                  {heading}
                </h3>
                {descriptionText && (
                  <p className="mb-4 text-muted-foreground">{parseInlineMarkdown(descriptionText)}</p>
                )}
                {combinedContent && (
                  <div className="p-4 bg-gradient-to-r from-blue-50/30 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-lg border border-blue-200/30 dark:border-blue-800/20">
                    <ol className="list-decimal list-inside space-y-2">
                      {combinedContent.split('\n').filter(line => line.trim()).map((item, i) => {
                        const text = item.replace(/^\d+\.\s*/, '');
                        return (
                          <li key={i} className="text-sm text-muted-foreground">
                            {parseInlineMarkdown(text)}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}
              </div>
            );
          }
        }
        
        // Check for Manufacturing Plants pattern with Common Hazards and AI Monitoring
        if (heading === 'Manufacturing Plants' || heading.includes('Manufacturing')) {
          // Look for the structured content in the next section
          let structuredContent = '';
          if (index + 1 < sections.length) {
            const nextSection = sections[index + 1];
            if ((nextSection.includes('**Common Hazards:**') || nextSection.includes('**AI Monitoring')) && !processedIndices.has(index + 1)) {
              structuredContent = nextSection;
              processedIndices.add(index + 1);
            }
          }
          
          if (structuredContent) {
            // Parse the structured content
            const parts = structuredContent.split('**AI Monitoring Includes:**');
            const hazardsPart = parts[0].replace('**Common Hazards:**', '').trim();
            const monitoringPart = parts[1] ? parts[1].trim() : '';
            
            const hazardsList = hazardsPart.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());
            const monitoringList = monitoringPart.split('\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-\s*/, '').trim());
            
            return (
              <div key={index} className="mb-6">
                <h3 className="text-xl font-semibold mt-6 mb-4">
                  {heading}
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Common Hazards */}
                  <div className="p-4 bg-gradient-to-br from-red-50/30 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10 rounded-lg border border-red-200/30 dark:border-red-800/20">
                    <h4 className="font-semibold text-base mb-3 text-foreground">
                      Common Hazards
                    </h4>
                    <ul className="space-y-2">
                      {hazardsList.map((hazard, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-400 mt-1">•</span>
                          <span className="text-sm text-muted-foreground">{parseInlineMarkdown(hazard)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* AI Monitoring */}
                  {monitoringList.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10 rounded-lg border border-blue-200/30 dark:border-blue-800/20">
                      <h4 className="font-semibold text-base mb-3 text-foreground">
                        AI Monitoring Includes
                      </h4>
                      <ul className="space-y-2">
                        {monitoringList.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span className="text-sm text-muted-foreground">{parseInlineMarkdown(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        }
        
        // Check if this is a Q&A format (has quotes - either straight or curly)
        const hasQuotes = heading.includes('"') || heading.includes('"') || heading.includes('"') || heading.includes('"');
        
        // If we're in a Q&A section OR the heading has quotes followed by content
        if (hasQuotes) {
          // This is likely a Q&A item - extract the question
          const question = heading.replace(/[""""]/g, '');
          
          // Look for the answer in the next section
          let answer = '';
          
          // Check next sections for the answer (non-heading content)
          for (let i = index + 1; i < sections.length; i++) {
            const nextSection = sections[i];
            if (!nextSection || nextSection.startsWith('#')) break;
            if (!processedIndices.has(i)) {
              answer = nextSection;
              processedIndices.add(i);
              break; // Only take the first paragraph as answer
            }
          }
          
          if (answer) {
            return (
              <div key={index} className="mb-6 p-5 bg-gradient-to-r from-blue-50/20 to-indigo-50/10 dark:from-blue-950/10 dark:to-indigo-950/5 rounded-xl border border-blue-200/30 dark:border-blue-800/20">
                <div>
                  <div>
                    <h4 className="font-bold text-lg mb-3 text-foreground">&ldquo;{question}&rdquo;</h4>
                    <p className="text-base text-muted-foreground leading-relaxed">{parseInlineMarkdown(answer)}</p>
                  </div>
                </div>
              </div>
            );
          } else {
            // No answer found, still show as styled Q&A but without answer
            return (
              <div key={index} className="mb-6 p-5 bg-gradient-to-r from-blue-50/20 to-indigo-50/10 dark:from-blue-950/10 dark:to-indigo-950/5 rounded-xl border border-blue-200/30 dark:border-blue-800/20">
                <div>
                  <div>
                    <h4 className="font-bold text-lg text-foreground">&ldquo;{question}&rdquo;</h4>
                  </div>
                </div>
              </div>
            );
          }
        }
        
        // Check for numbered H3 headings (like "### 1. Something" or "### Week 1: Something")
        const numberedMatch = heading.match(/^(\d+\.|Week \d+:)\s*(.+)/);
        if (numberedMatch) {
          const [, prefix, title] = numberedMatch;
          
          // Look for bullet points in the next sections
          let content = '';
          for (let i = index + 1; i < sections.length; i++) {
            const nextSection = sections[i];
            if (!nextSection || nextSection.startsWith('#')) break;
            if (!processedIndices.has(i) && nextSection.startsWith('-')) {
              content = nextSection;
              processedIndices.add(i);
              break;
            }
          }
          
          if (content) {
            const items = content.split('\n').filter(item => item.trim());
            return (
              <div key={index} className="mb-6 p-4 bg-gradient-to-r from-muted/10 to-muted/5 rounded-lg border border-border/50">
                <h4 className="font-semibold text-lg mb-3 text-foreground">
                  <span className="text-primary">{prefix}</span> {title}
                </h4>
                <ul className="space-y-2 ml-4">
                  {items.map((item, i) => {
                    const text = item.replace(/^[-*] /, '');
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary/60 mt-1">•</span>
                        <span className="text-sm text-muted-foreground">{parseInlineMarkdown(text)}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          }
          
          return (
            <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
              <span className="text-primary">{prefix}</span> {title}
            </h3>
          );
        }
        
        // Special styling for case studies
        if (heading.toLowerCase().includes('case study')) {
          return (
            <h3 key={index} className="text-xl font-bold mt-8 mb-4">
              {heading}
            </h3>
          );
        }
        
        // Check for ROI Calculator subsections (various patterns)
        if (heading.includes('Small Businesses') || heading.includes('Medium Enterprises') || heading.includes('Large Organizations') ||
            heading.includes('Investment (') || heading.includes('Savings and Returns')) {
          // Collect the metrics from the following paragraphs
          const metrics: { label: string; value: string; isTotal?: boolean }[] = [];
          for (let i = index + 1; i < sections.length; i++) {
            const nextSection = sections[i];
            if (!nextSection || nextSection.startsWith('#')) break;
            
            // Check if it's a dash-separated list
            if (nextSection.startsWith('- ')) {
              const lines = nextSection.split('\n').filter(l => l.trim());
              lines.forEach(line => {
                const cleanLine = line.replace(/^-\s*/, '');
                // Check for bold total lines
                if (cleanLine.startsWith('**')) {
                  const match = cleanLine.match(/\*\*([^:]+):\s*([^*]+)\*\*/);
                  if (match) {
                    metrics.push({ label: match[1], value: match[2], isTotal: true });
                  }
                } else {
                  // Regular metric lines
                  const colonIndex = cleanLine.indexOf(':');
                  if (colonIndex > -1) {
                    const label = cleanLine.substring(0, colonIndex).trim();
                    const value = cleanLine.substring(colonIndex + 1).trim();
                    metrics.push({ label, value });
                  }
                }
              });
              processedIndices.add(i);
            // Check if it's a metric line (starts with **)
            } else if (nextSection.startsWith('**')) {
              const lines = nextSection.split('\n').filter(l => l.trim());
              lines.forEach(line => {
                const match = line.match(/\*\*([^:]+):\*\*\s*(.*)/);
                if (match) {
                  metrics.push({ label: match[1], value: match[2] });
                }
              });
              processedIndices.add(i);
            } else {
              break;
            }
          }
          
          if (metrics.length > 0) {
            // Determine icon and colors based on section type
            const isSmall = heading.includes('Small');
            const isMedium = heading.includes('Medium');
            const isInvestment = heading.includes('Investment');
            const isSavings = heading.includes('Savings');
            const bgGradient = isInvestment ? 'from-red-50/30 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10' :
                              isSavings ? 'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10' :
                              isSmall ? 'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10' : 
                              isMedium ? 'from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10' :
                              'from-purple-50/30 to-pink-50/20 dark:from-purple-950/20 dark:to-pink-950/10';
            
            // Find the savings metric to highlight it
            const savingsMetric = metrics.find(m => m.label.includes('Savings'));
            
            return (
              <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50`}>
                <h4 className="font-bold text-lg mb-4 text-foreground">
                  {heading}
                </h4>
                <div className="grid gap-3">
                  {metrics.map((metric, i) => {
                    const isSavings = metric.label.includes('Savings');
                    const isTotal = metric.isTotal || metric.label.includes('Total');
                    return (
                      <div key={i} className={`flex justify-between items-center py-2 border-b border-border/30 last:border-0 ${isSavings ? 'text-green-600 dark:text-green-400 font-bold' : ''} ${isTotal ? 'font-bold border-t-2 pt-3' : ''}`}>
                        <span className={`font-medium text-sm ${isSavings || isTotal ? '' : 'text-muted-foreground'}`}>{metric.label}:</span>
                        <span className={`text-sm ${isSavings ? 'text-lg' : isTotal ? 'text-base font-bold' : 'font-semibold text-foreground'}`}>{metric.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        }
        
        // Check for Success Stories subsections (various patterns)
        if (heading.includes('Retail Chain') || heading.includes('Manufacturing Plant') || heading.includes('Office Complex') ||
            heading.includes('Global Construction Firm') || heading.includes('Regional Manufacturing Hub') || heading.includes('National Oil Company')) {
          // Collect the metrics from the following paragraphs
          const metrics: { label: string; value: string; isTotal?: boolean }[] = [];
          for (let i = index + 1; i < sections.length; i++) {
            const nextSection = sections[i];
            if (!nextSection || nextSection.startsWith('#')) break;
            
            // Check if it's a dash-separated list with bold labels
            if (nextSection.startsWith('- **') || nextSection.startsWith('-**')) {
              const lines = nextSection.split('\n').filter(l => l.trim());
              lines.forEach(line => {
                const cleanLine = line.replace(/^-\s*/, '');
                const match = cleanLine.match(/\*\*([^:]+):\*\*\s*(.*)/);
                if (match) {
                  metrics.push({ label: match[1], value: match[2] });
                }
              });
              processedIndices.add(i);
            // Check if it's a metric line (starts with **)
            } else if (nextSection.startsWith('**')) {
              const lines = nextSection.split('\n').filter(l => l.trim());
              lines.forEach(line => {
                const match = line.match(/\*\*([^:]+):\*\*\s*(.*)/);
                if (match) {
                  metrics.push({ label: match[1], value: match[2] });
                }
              });
              processedIndices.add(i);
            } else {
              break; // Stop if we hit non-metric content
            }
          }
          
          if (metrics.length > 0) {
            // Determine icon and colors based on type
            const isRetail = heading.includes('Retail');
            const isManufacturing = heading.includes('Manufacturing');
            const isConstruction = heading.includes('Construction');
            const isOil = heading.includes('Oil');
            const bgGradient = isRetail ? 'from-purple-50/30 to-pink-50/20 dark:from-purple-950/20 dark:to-pink-950/10' : 
                              isManufacturing ? 'from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10' :
                              isConstruction ? 'from-orange-50/30 to-amber-50/20 dark:from-orange-950/20 dark:to-amber-950/10' :
                              isOil ? 'from-slate-50/30 to-gray-50/20 dark:from-slate-950/20 dark:to-gray-950/10' :
                              'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10';
            
            return (
              <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50`}>
                <h4 className="font-bold text-lg mb-4 text-foreground">
                  {heading}
                </h4>
                <div className="grid gap-3">
                  {metrics.map((metric, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="font-medium text-sm text-muted-foreground">{metric.label}:</span>
                      <span className="font-semibold text-sm text-foreground">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        }
        
        // Check for Investment and Returns sections (for ROI Breakdown)
        if (heading.includes('Investment') || heading.includes('Annual Returns')) {
          // Look for metrics in the next sections
          const metrics: { label: string; value: string; isTotal?: boolean }[] = [];
          for (let i = index + 1; i < sections.length; i++) {
            const nextSection = sections[i];
            if (!nextSection || nextSection.startsWith('#')) break;
            
            // Check if it's a metric line (starts with **)
            if (nextSection.startsWith('**')) {
              const lines = nextSection.split('\n').filter(l => l.trim());
              lines.forEach(line => {
                const match = line.match(/\*\*([^:]+):\*\*\s*(.*)/);
                if (match) {
                  metrics.push({ label: match[1], value: match[2] });
                }
              });
              processedIndices.add(i);
            } else {
              break;
            }
          }
          
          if (metrics.length > 0) {
            const isInvestment = heading.includes('Investment');
            const bgColor = isInvestment ? 
              'from-red-50/30 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10' :
              'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10';
            const borderColor = isInvestment ?
              'border-red-200/50 dark:border-red-800/30' :
              'border-green-200/50 dark:border-green-800/30';
            const totalMetric = metrics.find(m => m.label.includes('Total'));
            
            return (
              <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgColor} rounded-xl border ${borderColor}`}>
                <h4 className="font-bold text-lg mb-4 text-foreground">
                  {heading}
                </h4>
                <div className="space-y-2">
                  {metrics.map((metric, i) => {
                    const isTotal = metric.label.includes('Total');
                    return (
                      <div key={i} className={`flex justify-between items-center py-2 ${isTotal ? 'border-t border-border/30 pt-3 font-bold text-lg' : ''}`}>
                        <span className={`font-medium ${isTotal ? 'text-base' : 'text-sm text-muted-foreground'}`}>{metric.label}:</span>
                        <span className={`${isTotal ? 'text-lg' : 'text-sm font-semibold'} text-foreground`}>{metric.value}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }
        }
        
        // Check for any H3 heading followed by bullet list
        let bulletContent = '';
        for (let i = index + 1; i < sections.length; i++) {
          const nextSection = sections[i];
          if (!nextSection || nextSection.startsWith('#')) break;
          if (!processedIndices.has(i) && nextSection.startsWith('-')) {
            bulletContent = nextSection;
            processedIndices.add(i);
            break;
          }
        }
        
        if (bulletContent) {
          const items = bulletContent.split('\n').filter(item => item.trim());
          return (
            <div key={index} className="mb-6">
              <h3 className="text-xl font-semibold mt-6 mb-3">{parseInlineMarkdown(heading)}</h3>
              <ul className="space-y-2 ml-4">
                {items.map((item, i) => {
                  const text = item.replace(/^[-*] /, '');
                  return (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span className="text-base text-muted-foreground">{parseInlineMarkdown(text)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }
        
        // Regular H3 heading (no bullet list follows)
        return <h3 key={index} className="text-xl font-semibold mt-6 mb-3">{parseInlineMarkdown(heading)}</h3>;
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
        const titleMatch = section.match(/\*\*([^*]+)\*\*/);
        const title = titleMatch ? titleMatch[1] : '';
        
        // Extract all items after @@ markers
        const parts = section.split('@@').slice(1);
        const cleanItems = parts.map(item => item.replace(/^[-\s]+/, '').trim()).filter(item => item);
        
        if (cleanItems.length > 0) {
          // Determine icon based on title
          const bgColor = title.toLowerCase().includes('financial') ? 
            'from-amber-50/30 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/10' :
            'from-red-50/30 to-pink-50/20 dark:from-red-950/20 dark:to-pink-950/10';
          
          const borderColor = title.toLowerCase().includes('financial') ? 
            'border-amber-200/50 dark:border-amber-800/30' :
            'border-red-200/50 dark:border-red-800/30';
            
          return (
            <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgColor} rounded-xl border ${borderColor}`}>
              <h4 className="font-semibold text-lg mb-4 text-foreground">
                {title}
              </h4>
              <div className="space-y-2">
                {cleanItems.map((item, i) => {
                  // Check if item has a label:value format
                  if (item.includes(':')) {
                    const [label, ...rest] = item.split(':');
                    const value = rest.join(':').trim();
                    
                    return (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <span className="font-medium text-sm min-w-[100px]">
                          {label}:
                        </span>
                        <span className="text-sm text-muted-foreground">{value}</span>
                      </div>
                    );
                  }
                  
                  // Regular item without label
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-primary/60 mt-1">•</span>
                      <span className="text-sm text-muted-foreground">{item}</span>
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
      
      // Check for Success Stories pattern first (dash list with bold labels like **Sites:** or **Workers:**)
      if ((section.startsWith('- **Sites:') || section.startsWith('- **Workers:') || section.startsWith('- **Facilities:') || 
           section.startsWith('- **Operations:') || section.startsWith('- **Result:') || section.startsWith('- **Savings:') ||
           section.startsWith('- **Coverage:') || section.startsWith('- **Recognition:') || section.startsWith('- **Impact:')) &&
          section.includes('**')) {
        // This is a Success Stories metrics section
        const lines = section.split('\n').filter(l => l.trim());
        const metrics = lines.map(line => {
          const cleanLine = line.replace(/^-\s*/, '');
          const match = cleanLine.match(/\*\*([^:]+):\*\*\s*(.*)/);
          if (match) {
            return { label: match[1], value: match[2] };
          }
          return null;
        }).filter((m): m is { label: string; value: string } => m !== null);
        
        // Try to determine which company this belongs to based on the metrics
        const isConstruction = metrics.some(m => m.label === 'Sites' || (m.label === 'Workers' && m.value.includes('100,000')));
        const isManufacturing = metrics.some(m => m.label === 'Facilities' || (m.label === 'Workers' && m.value.includes('5,000')));
        const isOil = metrics.some(m => m.label === 'Operations' || m.label === 'Coverage');
        
        const title = isConstruction ? 'Global Construction Firm' : 
                     isManufacturing ? 'Regional Manufacturing Hub' : 
                     isOil ? 'National Oil Company' : 'Success Story';
        const bgGradient = isConstruction ? 'from-orange-50/30 to-amber-50/20 dark:from-orange-950/20 dark:to-amber-950/10' :
                          isManufacturing ? 'from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10' :
                          isOil ? 'from-slate-50/30 to-gray-50/20 dark:from-slate-950/20 dark:to-gray-950/10' :
                          'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10';
        
        return (
          <div key={index} className={`mb-6 p-6 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow`}>
            <h4 className="font-bold text-xl mb-4 text-foreground">
              <span>{title}</span>
            </h4>
            <div className="grid gap-3">
              {metrics.map((metric, i) => {
                const isResult = metric.label.toLowerCase().includes('result');
                const isSavings = metric.label.toLowerCase().includes('savings');
                return (
                  <div key={i} className={`flex justify-between items-center py-2.5 px-3 rounded-lg ${
                    isResult ? 'bg-green-50/50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/30' :
                    isSavings ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30' :
                    'bg-background/50 border border-border/30'
                  }`}>
                    <span className={`font-medium text-sm ${
                      isResult || isSavings ? 'text-foreground' : 'text-muted-foreground'
                    }`}>{metric.label}</span>
                    <span className={`font-semibold text-sm ${
                      isResult ? 'text-green-700 dark:text-green-400' :
                      isSavings ? 'text-emerald-700 dark:text-emerald-400' :
                      'text-foreground'
                    }`}>{metric.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      
      // Check for ROI/Investment dash lists (like "- AI system deployment: AED 300,000" or "- **AI system:** AED 200,000")
      if (section.startsWith('- ') && section.includes('AED') && (section.includes(':') || section.includes(':**'))) {
        const lines = section.split('\n').filter(l => l.trim());
        const metrics = lines.map(line => {
          const cleanLine = line.replace(/^-\s*/, '');
          // Check for bold label lines like **AI surveillance system:** AED 200,000
          if (cleanLine.includes('**') && cleanLine.includes(':')) {
            // Handle both patterns: **label:** value and **label: value**
            const match = cleanLine.match(/\*\*([^:*]+)(?:\*\*)?:\s*(?:\*\*)?([^*]+)(?:\*\*)?/);
            if (match) {
              const label = match[1].trim();
              const value = match[2].trim();
              const isTotal = label.toLowerCase().includes('total');
              return { label, value, isTotal };
            }
          } else {
            // Regular metric lines without bold
            const colonIndex = cleanLine.indexOf(':');
            if (colonIndex > -1) {
              const label = cleanLine.substring(0, colonIndex).trim();
              const value = cleanLine.substring(colonIndex + 1).trim();
              return { label, value };
            }
          }
          return null;
        }).filter((m): m is { label: string; value: string; isTotal?: boolean } => m !== null);
        
        // Determine if this is Investment or Savings section
        const isInvestment = metrics.some(m => 
          m.label.toLowerCase().includes('system') || 
          m.label.toLowerCase().includes('integration') || 
          m.label.toLowerCase().includes('training') ||
          m.label.toLowerCase().includes('setup') ||
          m.label.toLowerCase().includes('deployment')
        );
        const title = isInvestment ? 'Investment' : 'Returns';
        const bgGradient = isInvestment ? 'from-red-50/30 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10' :
                          'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10';
        
        return (
          <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50`}>
            <h4 className="font-bold text-lg mb-4 text-foreground">
              {title}
            </h4>
            <div className="grid gap-3">
              {metrics.map((metric, i) => {
                const isTotal = metric.isTotal || metric.label.includes('Total');
                return (
                  <div key={i} className={`flex justify-between items-center py-2 border-b border-border/30 last:border-0 ${isTotal ? 'font-bold border-t-2 pt-3' : ''}`}>
                    <span className={`font-medium text-sm ${isTotal ? 'text-foreground' : 'text-muted-foreground'}`}>{metric.label}:</span>
                    <span className={`text-sm ${isTotal ? 'text-base font-bold' : 'font-semibold text-foreground'}`}>{metric.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      
      // Lists
      if (section.startsWith('- ') || section.startsWith('* ')) {
        const items = section.split('\n').filter(item => item.trim());
        
        // Check if this is a Success Stories metrics list (has Before/After/ROI pattern)
        const hasMetrics = items.some(item => item.includes('**Before:**') || item.includes('**After:**') || item.includes('**ROI:**'));
        
        if (hasMetrics) {
          // This is likely orphaned metrics from Success Stories - render as a card
          const metrics = items.map(item => {
            const cleanItem = item.replace(/^[-*]\s*/, '');
            const match = cleanItem.match(/\*\*([^:]+):\*\*\s*(.*)/);
            if (match) {
              return { label: match[1], value: match[2] };
            }
            return null;
          }).filter((m): m is { label: string; value: string; isTotal?: boolean } => m !== null);
          
          if (metrics.length > 0) {
            // Try to determine the type from context
            const beforeValue = metrics.find(m => m.label === 'Before')?.value || '';
            const isRetail = beforeValue.includes('AED') || beforeValue.includes('losses');
            const isManufacturing = beforeValue.includes('safety') || beforeValue.includes('incidents');
            const bgGradient = isRetail ? 'from-purple-50/30 to-pink-50/20 dark:from-purple-950/20 dark:to-pink-950/10' : 
                              isManufacturing ? 'from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10' :
                              'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10';
            
            return (
              <div key={index} className={`mb-6 p-5 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50`}>
                <div className="grid gap-3">
                  {metrics.map((metric, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
                      <span className="font-medium text-sm text-muted-foreground">{metric.label}:</span>
                      <span className="font-semibold text-sm text-foreground">{metric.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        }
        
        // Regular list
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
        const lines = section.split('\n');
        
        // Check if this is a multi-line numbered list with sub-items (has indented lines)
        const hasSubItems = lines.some(line => line.startsWith('   '));
        
        if (hasSubItems) {
          // Complex numbered list with sub-items
          const items: { number: string; title: string; subItems: string[] }[] = [];
          let currentItem: { number: string; title: string; subItems: string[] } | null = null;
          
          lines.forEach(line => {
            const numberedMatch = line.match(/^(\d+)\.\s+(.+)/);
            if (numberedMatch) {
              // Start of a new numbered item
              if (currentItem) items.push(currentItem);
              currentItem = {
                number: numberedMatch[1],
                title: numberedMatch[2],
                subItems: []
              };
            } else if (line.trim().startsWith('-') && currentItem) {
              // Sub-item
              currentItem.subItems.push(line.trim().substring(1).trim());
            }
          });
          
          if (currentItem) items.push(currentItem);
          
          return (
            <ol key={index} className="space-y-3 mb-6">
              {items.map((item) => (
                <li key={item.number} className="flex gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                    {item.number}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium mb-1">{parseInlineMarkdown(item.title)}</div>
                    {item.subItems.length > 0 && (
                      <ul className="space-y-1 mt-2">
                        {item.subItems.map((subItem, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary/60 mt-1">•</span>
                            <span>{parseInlineMarkdown(subItem)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          );
        }
        
        const items = section.split('\n').filter(item => item.trim());
        
        // Check for mistake/solution format (contains @@)
        const isMistakeSolution = items.some(item => item.includes('@@'));
        
        if (isMistakeSolution) {
          return (
            <div key={index} className="space-y-4 mb-8">
              {items.map((item, i) => {
                const originalNumber = item.match(/^(\d+)\./)?.[1];
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
                          {originalNumber || (i + 1)}
                        </span>
                        <h4 className="font-semibold text-lg text-foreground pt-2">{title}</h4>
                      </div>
                      <div className="grid md:grid-cols-2 divide-x divide-border">
                        <div className="p-4 bg-red-50/50 dark:bg-red-950/10">
                          <div>
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
      
      // Handle paragraphs that start with ** (info blocks)
      if (section.startsWith('**')) {
        // Check if it's a multi-line section with bold labels
        const lines = section.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) {
          // Multiple lines starting with ** - render as an info block
          return (
            <div key={index} className="mb-4 p-4 bg-muted/10 rounded-lg border border-border/50">
              {lines.map((line, i) => (
                <div key={i} className="mb-2 last:mb-0">
                  {parseInlineMarkdown(line)}
                </div>
              ))}
            </div>
          );
        } else {
          // Single line with ** - render with special formatting
          const line = lines[0];
          
          // Check if it's a label:value format
          if (line.includes(':**')) {
            return (
              <div key={index} className="mb-3 pl-4 border-l-2 border-primary/30">
                <p className="text-base">{parseInlineMarkdown(line)}</p>
              </div>
            );
          }
        }
      }
      
      // Check if this section contains text ending with colon followed by bullet list
      const lines = section.split('\n');
      if (lines.length > 1 && lines[0].endsWith(':') && lines[1].startsWith('-')) {
        // This section has a paragraph with colon followed by bullet points
        const leadText = lines[0];
        const bulletLines = lines.slice(1).filter(line => line.trim().startsWith('-'));
        
        return (
          <div key={index} className="mb-6">
            <p className="mb-3 text-muted-foreground font-medium">
              {parseInlineMarkdown(leadText)}
            </p>
            <ul className="space-y-2 ml-4">
              {bulletLines.map((item, i) => {
                const text = item.replace(/^[-*]\s*/, '');
                return (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-1">•</span>
                    <span className="text-muted-foreground">{parseInlineMarkdown(text)}</span>
                  </li>
                );
              })}
            </ul>
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