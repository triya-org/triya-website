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
      
      // Check for markdown tables
      if (text.includes('|') && text.split('\n').some(line => line.includes('|--') || line.includes('|:-'))) {
        const lines = text.split('\n').filter(l => l.trim() && l.includes('|'));
        if (lines.length >= 3) {
          // Parse headers
          const headerCells = lines[0].split('|').map(cell => cell.trim()).filter(cell => cell);
          // Skip separator line (index 1)
          // Parse data rows
          const dataRows = lines.slice(2).map(line => 
            line.split('|').map(cell => cell.trim()).filter(cell => cell)
          );
          
          return (
            <div key={index} className="mb-6 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    {headerCells.map((header, i) => (
                      <th key={i} className="text-left p-3 font-semibold text-foreground">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-3 text-muted-foreground">
                          {parseInlineMarkdown(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      }
      
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
                        <svg 
                          className="w-5 h-5 mt-0.5 flex-shrink-0" 
                          viewBox="0 0 20 20" 
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                            fill="currentColor"
                            className="text-amber-700 dark:text-amber-600"
                          />
                        </svg>
                        <span className="text-sm text-muted-foreground">
                          {parseInlineMarkdown(item.replace('✅', '').trim())}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-primary/60">•</span>
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
                        <span className="text-primary/60">•</span>
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
                      <span className="text-primary/60">•</span>
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
      
      // Check for numbered sections (### 1. Title followed by list items)
      if (text.match(/^### \d+\./)) {
        const lines = text.split('\n');
        const headerLine = lines[0];
        const titleMatch = headerLine.match(/^### (\d+)\. (.+)/);
        
        if (titleMatch && lines.some(line => line.trim().startsWith('-'))) {
          const [, number, title] = titleMatch;
          const items = lines.slice(1)
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim());
          
          if (items.length > 0) {
            return (
              <div key={index} className="mb-6 p-5 bg-gradient-to-r from-slate-50/20 to-gray-50/10 dark:from-slate-950/10 dark:to-gray-950/5 rounded-xl border border-border/50">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {number}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-3 text-foreground">{title}</h3>
                    <ul className="space-y-2">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary/60">•</span>
                          <span className="text-sm text-muted-foreground">{parseInlineMarkdown(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          }
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
                  <svg 
                    className="w-5 h-5 mt-0.5 flex-shrink-0" 
                    viewBox="0 0 20 20" 
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      fill="currentColor"
                      className="text-amber-700 dark:text-amber-600"
                    />
                  </svg>
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
        
        // If only one line, render as a single numbered item (preserves number)
        if (lines.length === 1) {
          const match = lines[0].match(/^(\d+)\.\s*(.*)$/);
          if (match) {
            const [, number, content] = match;
            
            // Parse bold title if present
            let boldTitle = null;
            let restContent = content;
            const boldMatch = content.match(/^\*\*([^*]+)\*\*\s*(.*)/);
            if (boldMatch) {
              boldTitle = boldMatch[1];
              restContent = boldMatch[2];
            }
            
            return (
              <div key={index} className="mb-4 flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mr-3 mt-0.5 shrink-0">
                  {number}
                </span>
                <span className="text-muted-foreground">
                  {boldTitle && <><strong className="text-foreground font-semibold">{boldTitle}</strong> </>}
                  {parseInlineMarkdown(restContent)}
                </span>
              </div>
            );
          }
        }
        
        // Multiple lines - use NumberedList component for grouped lists
        const items = lines.map(line => {
          const match = line.match(/^(\d+)\.\s*(.*)$/);
          if (match) {
            // Extract the number and full content
            return match[2]; // Return the content after number
          }
          return line.replace(/^\d+\.\s*/, '');
        });
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
        
        // Check if this is a checklist (contains ✅ symbols OR has a title that suggests it's a checklist)
        const isChecklist = items.some(item => item.includes('✅'));
        
        // Check if this looks like a task/implementation list based on parent context
        const prevText = sections[index - 1]?.trim() || '';
        const isImplementationList = prevText.includes('Week') || prevText.includes('Phase') || 
                                     prevText.includes('Step') || prevText.includes('Implementation');
        
        // Use checkmarks for checklists OR implementation/task lists
        if (isChecklist || isImplementationList) {
          return (
            <ul key={index} className="space-y-2 mb-4">
              {items.map((item, i) => {
                const cleanItem = item.replace('✅', '').trim();
                return (
                  <li key={i} className="flex items-start gap-2 text-muted-foreground">
                    <svg 
                      className="w-5 h-5 mt-0.5 flex-shrink-0" 
                      viewBox="0 0 20 20" 
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        fill="currentColor"
                        className="text-amber-700 dark:text-amber-600"
                      />
                    </svg>
                    <span>{parseInlineMarkdown(cleanItem)}</span>
                  </li>
                );
              })}
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
      
      // Check for paragraph followed by list items (e.g., "Text:\n- item1\n- item2")
      if (text.includes(':\n-')) {
        const lines = text.split('\n');
        const introIndex = lines.findIndex(line => line.trim().endsWith(':'));
        
        if (introIndex !== -1 && lines.some(line => line.trim().startsWith('-'))) {
          const introText = lines.slice(0, introIndex + 1).join(' ').trim();
          const listItems = lines.slice(introIndex + 1)
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim());
          
          if (listItems.length > 0) {
            return (
              <div key={index} className="mb-6">
                <p className="mb-3 text-muted-foreground">
                  {parseInlineMarkdown(introText)}
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  {listItems.map((item, i) => (
                    <li key={i} className="text-muted-foreground">
                      {parseInlineMarkdown(item)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
        }
      }
      
      // Check for paragraph followed by numbered list (e.g., "Text:\n1. item1\n2. item2")
      if (text.includes(':\n') && /\n\d+\./.test(text)) {
        const lines = text.split('\n');
        const introIndex = lines.findIndex(line => line.trim().endsWith(':'));
        
        if (introIndex !== -1 && lines.some(line => /^\d+\./.test(line.trim()))) {
          const introText = lines.slice(0, introIndex + 1).join(' ').trim();
          const numberedItems = lines.slice(introIndex + 1)
            .filter(line => /^\d+\./.test(line.trim()))
            .map(line => line.replace(/^\d+\.\s*/, '').trim());
          
          if (numberedItems.length > 0) {
            return (
              <div key={index} className="mb-6">
                <p className="mb-3 text-muted-foreground">
                  {parseInlineMarkdown(introText)}
                </p>
                <NumberedList items={numberedItems} />
              </div>
            );
          }
        }
      }
      
      // Check if this text contains multiple lines with checkmarks (generic checklist pattern)
      if (text.includes('\n') && text.includes('✅')) {
        const lines = text.split('\n').filter(line => line.trim());
        const checkmarkLines = lines.filter(line => line.trim().startsWith('✅'));
        
        // If we have checkmark lines, render as a checklist
        if (checkmarkLines.length > 0) {
          // Check if there's a title line before the checkmarks
          const titleIndex = lines.findIndex(line => line.trim().startsWith('✅'));
          const title = titleIndex > 0 ? lines[0] : null;
          
          return (
            <div key={index} className="mb-6">
              {title && (
                <h4 className="font-bold text-lg mb-3 text-foreground">
                  {parseInlineMarkdown(title)}
                </h4>
              )}
              <ul className="space-y-2">
                {checkmarkLines.map((item, i) => {
                  const cleanItem = item.replace('✅', '').trim();
                  return (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <svg 
                        className="w-5 h-5 mt-0.5 flex-shrink-0" 
                        viewBox="0 0 20 20" 
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path 
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                          fill="currentColor"
                          className="text-amber-700 dark:text-amber-600"
                        />
                      </svg>
                      {parseInlineMarkdown(cleanItem)}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }
      }
      
      // Check if this text contains multiple **Label:** patterns on separate lines
      if (text.includes('\n') && text.match(/\*\*[^:]+:\*\*/g)) {
        const lines = text.split('\n').filter(line => line.trim());
        const labeledLines = lines.filter(line => /^\*\*[^:]+:\*\*/.test(line.trim()));
        
        // If we have multiple labeled lines, render as a metric/info section
        if (labeledLines.length > 1) {
          const metrics = labeledLines.map(line => {
            const match = line.match(/^\*\*([^:]+):\*\*\s*(.*)$/);
            if (match) {
              return {
                label: match[1].trim(),
                value: match[2].trim()
              };
            }
            return null;
          }).filter(Boolean);
          
          if (metrics.length > 0) {
            return (
              <div key={index} className="mb-6 p-5 bg-gradient-to-br from-blue-50/30 to-indigo-50/20 dark:from-blue-950/20 dark:to-indigo-950/10 rounded-xl border border-border/50">
                <div className="space-y-2">
                  {metrics.map((metric, i) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2">
                      <span className="font-semibold text-foreground min-w-[100px]">
                        {metric.label}:
                      </span>
                      <span className="text-muted-foreground">
                        {parseInlineMarkdown(metric.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }
        }
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