'use client';

import React, { useMemo } from 'react';
import { parseInlineMarkdown } from '../lib/markdown-utils';
import {
  NumberedList,
  QASection,
  MetricCard,
  SubsectionCard,
  FinancialSection,
  TimelineSection,
  RiskSection
} from '../lib/render-utils';

interface ContentRendererProps {
  content: string;
}

export const ContentRenderer = React.memo(({ content }: ContentRendererProps) => {
  const renderedContent = useMemo(() => {
    const sections = content.split('\n\n').filter(section => section.trim());
    
    return sections.map((section, index) => {
      const text = section.trim();
      
      // Check for inline dash-separated lists (e.g., **Header** - item1 - item2)
      if (text.match(/^\*\*[^*]+\*\*:?\s*-\s*.+\s*-\s*/)) {
        const headerMatch = text.match(/^\*\*([^*]+)\*\*:?\s*/);
        if (headerMatch) {
          const header = headerMatch[1];
          let itemsText = text.substring(headerMatch[0].length);
          // Remove leading " - " if present
          if (itemsText.startsWith(' - ') || itemsText.startsWith('- ')) {
            itemsText = itemsText.replace(/^-?\s*/, '');
          }
          // Split only on " - " (with spaces) to preserve dashes within content like "AES-256" or "2-5 seconds"
          const items = itemsText.split(/\s+-\s+/).filter(item => item.trim());
          
          // Check if it's a checklist with checkmarks
          const hasCheckmarks = items.some(item => item.includes('✅'));
          
          return (
            <div key={index} className="mb-6 p-5 bg-gradient-to-r from-slate-50/20 to-gray-50/10 dark:from-slate-950/10 dark:to-gray-950/5 rounded-xl border border-border/50">
              <h4 className="font-bold text-lg mb-4 text-foreground">{header}</h4>
              <div className={hasCheckmarks ? "grid gap-3 md:grid-cols-2" : "space-y-2"}>
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {hasCheckmarks && item.includes('✅') ? (
                      <>
                        <span className="text-green-500 mt-0.5">✅</span>
                        <span className="text-sm text-muted-foreground">
                          {parseInlineMarkdown(item.replace('✅', '').trim())}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-primary/60 mt-1">•</span>
                        <span className="text-sm text-muted-foreground">{parseInlineMarkdown(item)}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }
      }
      
      // Check for header + list pattern (e.g., **Cloud-Based Analysis:**\n- item1\n- item2)
      if (text.includes('\n-') && text.match(/^\*\*[^*]+\*\*:?/)) {
        const lines = text.split('\n');
        const headerLine = lines[0];
        const headerMatch = headerLine.match(/^\*\*([^*]+)\*\*:?\s*/);
        
        if (headerMatch) {
          const header = headerMatch[1];
          const listItems = lines.slice(1)
            .filter(line => line.trim())
            .map(line => line.replace(/^-\s*/, '').trim());
          
          // Check for special patterns like "Total:" or bold items
          const hasTotal = listItems.some(item => item.includes('**Total') || item.includes('Total:'));
          
          // Check if this is actually an inline list that wasn't properly parsed
          if (listItems.length === 0 && text.includes(' - ')) {
            const parts = text.split('\n');
            const header = parts[0].replace(/^\*\*|\*\*$/g, '').replace(/:$/, '');
            const itemsLine = parts.slice(1).join(' ');
            const items = itemsLine.split(/\s+-\s+/).filter(item => item.trim());
            
            if (items.length > 0) {
              return (
                <div key={index} className="mb-6 p-5 bg-gradient-to-r from-slate-50/20 to-gray-50/10 dark:from-slate-950/10 dark:to-gray-950/5 rounded-xl border border-border/50">
                  <h4 className="font-bold text-lg mb-4 text-foreground">{header}</h4>
                  <div className="space-y-2">
                    {items.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-primary/60 mt-1">•</span>
                        <span className="text-sm text-muted-foreground">{parseInlineMarkdown(item)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
          }
          
          return (
            <div key={index} className="mb-6 p-5 bg-gradient-to-r from-slate-50/20 to-gray-50/10 dark:from-slate-950/10 dark:to-gray-950/5 rounded-xl border border-border/50">
              <h4 className="font-bold text-lg mb-4 text-foreground">{header}</h4>
              <ul className="space-y-2">
                {listItems.map((item, i) => {
                  const isTotal = item.includes('**Total') || item.includes('Total:');
                  return (
                    <li key={i} className={`flex items-start gap-2 ${isTotal ? 'font-bold pt-2 border-t border-border/30 mt-2' : ''}`}>
                      <span className="text-primary/60 mt-1">•</span>
                      <span className={`text-sm ${isTotal ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {parseInlineMarkdown(item)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }
      }
      
      // Check for Week/Phase sections (### Week X: Title followed by list items)
      if ((text.startsWith('### Week ') || text.startsWith('### Phase ')) && text.includes('\n-')) {
        const lines = text.split('\n');
        const headerLine = lines[0].substring(4); // Remove "### "
        const listItems = lines.slice(1)
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim());
        
        return (
          <div key={index} className="mb-6 p-5 bg-gradient-to-br from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10 rounded-xl border border-border/50">
            <h3 className="font-bold text-lg mb-3 text-foreground">{headerLine}</h3>
            <ul className="space-y-2 ml-4">
              {listItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span className="text-sm text-muted-foreground">{parseInlineMarkdown(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      
      // Headers
      if (text.startsWith('## ')) {
        const headerText = text.substring(3);
        if (headerText.includes('Warning') || headerText.includes('Critical') || headerText.includes('Important')) {
          return (
            <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
              {parseInlineMarkdown(headerText)}
            </h2>
          );
        }
        return (
          <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
            {parseInlineMarkdown(headerText)}
          </h2>
        );
      }
      
      if (text.startsWith('### ')) {
        const heading = text.substring(4);
        if (heading.includes('Investment') || heading.includes('Returns') || 
            heading.includes('Cost') || heading.includes('ROI')) {
          return (
            <h3 key={index} className="text-xl font-bold mt-8 mb-4">
              {heading}
            </h3>
          );
        }
        return (
          <h3 key={index} className="text-xl font-bold mt-6 mb-4">
            {parseInlineMarkdown(heading)}
          </h3>
        );
      }
      
      if (text.startsWith('#### ')) {
        return (
          <h4 key={index} className="text-lg font-semibold mt-4 mb-3">
            {parseInlineMarkdown(text.substring(5))}
          </h4>
        );
      }
      
      // Numbered lists
      if (/^\d+\./.test(text)) {
        const lines = text.split('\n').filter(l => l.trim());
        const items = lines.map(line => line.replace(/^\d+\.\s*/, ''));
        return <NumberedList key={index} items={items} />;
      }
      
      // Q&A sections
      if (text.startsWith('"') && text.includes('?"') && text.includes('\n')) {
        const [question, ...answerParts] = text.split('\n');
        const cleanQuestion = question.replace(/^"|"$/g, '').replace(/\?$/, '?');
        const answer = answerParts.join(' ').trim();
        return <QASection key={index} question={cleanQuestion} answer={answer} />;
      }
      
      // Success stories and metric cards
      if ((section.startsWith('- **Sites:') || section.startsWith('- **Workers:') || 
           section.startsWith('- **Facilities:') || section.startsWith('- **Operations:')) &&
          section.includes('**')) {
        const metrics = [];
        const lines = section.split('\n');
        
        lines.forEach(line => {
          const cleanLine = line.replace(/^-\s*/, '');
          const match = cleanLine.match(/\*\*([^:]+):\*\*\s*(.+)/);
          if (match) {
            metrics.push({ 
              label: match[1].trim(), 
              value: match[2].trim() 
            });
          }
        });
        
        if (metrics.length > 0) {
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
          
          return <MetricCard key={index} title={title} metrics={metrics} bgGradient={bgGradient} />;
        }
      }
      
      // ROI/Investment sections
      if (section.startsWith('- ') && section.includes('AED') && (section.includes(':') || section.includes(':**'))) {
        const lines = section.split('\n').filter(l => l.trim());
        const metrics = lines.map(line => {
          const cleanLine = line.replace(/^-\s*/, '');
          if (cleanLine.includes('**') && cleanLine.includes(':')) {
            const match = cleanLine.match(/\*\*([^:*]+)(?:\*\*)?:\s*(?:\*\*)?([^*]+)(?:\*\*)?/);
            if (match) {
              const label = match[1].trim();
              const value = match[2].trim();
              const isTotal = label.toLowerCase().includes('total');
              return { label, value, isTotal };
            }
          } else {
            const colonIndex = cleanLine.indexOf(':');
            if (colonIndex > -1) {
              const label = cleanLine.substring(0, colonIndex).trim();
              const value = cleanLine.substring(colonIndex + 1).trim();
              return { label, value };
            }
          }
          return null;
        }).filter(Boolean);
        
        if (metrics.length > 0) {
          const isInvestment = metrics.some(m => 
            m.label.toLowerCase().includes('system') || 
            m.label.toLowerCase().includes('integration') || 
            m.label.toLowerCase().includes('training') ||
            m.label.toLowerCase().includes('setup') ||
            m.label.toLowerCase().includes('deployment')
          );
          const title = isInvestment ? 'Investment' : 'Returns';
          
          return <FinancialSection key={index} title={title} metrics={metrics} isInvestment={isInvestment} />;
        }
      }
      
      // Risk sections
      if (text.startsWith('**Financial') || text.startsWith('**Reputation')) {
        const [titleLine, ...contentLines] = text.split('\n');
        const title = titleLine.replace(/\*\*/g, '').replace(/:$/, '');
        const items = contentLines.filter(line => line.trim()).map(line => 
          line.replace(/^[-\s]+/, '').trim()
        );
        
        if (items.length > 0) {
          return <RiskSection key={index} title={title} items={items} />;
        }
      }
      
      // Bulleted lists (including checklists)
      if (text.startsWith('- ') || text.startsWith('* ') || text.startsWith('• ')) {
        const items = text.split('\n')
          .filter(line => line.trim())
          .map(line => line.replace(/^[-*•]\s*/, '').trim());
        
        // Check if this is a checklist (contains ✅ symbols)
        const isChecklist = items.some(item => item.includes('✅'));
        
        if (isChecklist) {
          return (
            <ul key={index} className="space-y-2 mb-4">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-muted-foreground">
                  {item.startsWith('✅') ? (
                    <>
                      <span className="text-green-500 mt-0.5">✅</span>
                      <span>{parseInlineMarkdown(item.replace('✅', '').trim())}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-muted-foreground/50 mt-0.5">•</span>
                      <span>{parseInlineMarkdown(item)}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          );
        }
        
        return (
          <ul key={index} className="list-disc pl-6 mb-4 space-y-2">
            {items.map((item, i) => (
              <li key={i} className="text-muted-foreground">
                {parseInlineMarkdown(item)}
              </li>
            ))}
          </ul>
        );
      }
      
      // Blockquotes
      if (text.startsWith('>')) {
        const quoteText = text.replace(/^>\s*/gm, '').trim();
        return (
          <blockquote key={index} className="border-l-4 border-primary/50 pl-4 italic mb-4">
            {parseInlineMarkdown(quoteText)}
          </blockquote>
        );
      }
      
      // Regular paragraphs
      if (text.length > 0) {
        return (
          <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
            {parseInlineMarkdown(text)}
          </p>
        );
      }
      
      return null;
    }).filter(Boolean);
  }, [content]);

  return <>{renderedContent}</>;
});

ContentRenderer.displayName = 'ContentRenderer';