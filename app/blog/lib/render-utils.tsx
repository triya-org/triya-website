import React from 'react';
import { parseInlineMarkdown } from './markdown-utils';

// Memoized component for rendering numbered lists
export const NumberedList = React.memo(({ items, title }: { items: string[], title?: string }) => {
  const numberedItems = items.map((item, index) => {
    // Handle items that start with **Title** followed by content
    let processedText = item;
    let boldTitle = null;
    
    // Check if item starts with bold text
    const boldMatch = item.match(/^\*\*([^*]+)\*\*\s*(.*)/);
    if (boldMatch) {
      boldTitle = boldMatch[1];
      processedText = boldMatch[2];
    }
    
    return {
      number: index + 1,
      boldTitle,
      text: processedText
    };
  });

  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-xl font-bold mt-6 mb-4">
          {title}
        </h3>
      )}
      <ol className="space-y-3">
        {numberedItems.map((item) => (
          <li key={item.number} className="flex items-start">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold mr-3 mt-0.5 shrink-0">
              {item.number}
            </span>
            <span className="text-muted-foreground">
              {item.boldTitle && (
                <><strong className="text-foreground font-semibold">{item.boldTitle}</strong> </>
              )}
              {parseInlineMarkdown(item.text)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
});
NumberedList.displayName = 'NumberedList';

// Memoized component for Q&A sections
export const QASection = React.memo(({ question, answer }: { question: string, answer: string }) => (
  <div className="mb-6 p-5 bg-gradient-to-r from-blue-50/20 to-indigo-50/10 dark:from-blue-950/10 dark:to-indigo-950/5 rounded-xl border border-blue-200/30 dark:border-blue-800/20">
    <div>
      <div>
        <h4 className="font-bold text-lg mb-3 text-foreground">&ldquo;{question}&rdquo;</h4>
        <p className="text-muted-foreground leading-relaxed">{parseInlineMarkdown(answer)}</p>
      </div>
    </div>
  </div>
));
QASection.displayName = 'QASection';

// Memoized component for metric cards
export const MetricCard = React.memo(({ 
  title, 
  metrics,
  bgGradient,
  borderColor
}: { 
  title: string;
  metrics: { label: string; value: string; isTotal?: boolean }[];
  bgGradient?: string;
  borderColor?: string;
}) => (
  <div className={`mb-6 p-6 bg-gradient-to-br ${bgGradient || 'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10'} rounded-xl border ${borderColor || 'border-border/50'} shadow-sm hover:shadow-md transition-shadow`}>
    <h4 className="font-bold text-xl mb-4 text-foreground">
      <span>{title}</span>
    </h4>
    <div className="grid gap-3">
      {metrics.map((metric, i) => {
        const isResult = metric.label.toLowerCase().includes('result');
        const isSavings = metric.label.toLowerCase().includes('savings');
        const isSuccess = isResult || isSavings;
        
        return (
          <div key={i} className={`flex justify-between items-center py-2 border-b border-border/30 last:border-0 ${metric.isTotal ? 'font-bold border-t-2 pt-3' : ''}`}>
            <span className={`font-medium ${metric.isTotal ? 'text-base' : 'text-sm text-muted-foreground'}`}>
              {metric.label}:
            </span>
            <span className={`${metric.isTotal ? 'text-lg' : 'text-sm font-semibold'} ${isSuccess ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
              {metric.value}
            </span>
          </div>
        );
      })}
    </div>
  </div>
));
MetricCard.displayName = 'MetricCard';

// Memoized component for subsection cards
export const SubsectionCard = React.memo(({ 
  heading, 
  subsections,
  bgGradient 
}: {
  heading: string;
  subsections: Record<string, string[]>;
  bgGradient?: string;
}) => (
  <div className={`mb-6 p-5 bg-gradient-to-br ${bgGradient || 'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10'} rounded-xl border border-border/50`}>
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
              <span className="text-sm text-muted-foreground">{parseInlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
));
SubsectionCard.displayName = 'SubsectionCard';

// Memoized component for investment/returns sections
export const FinancialSection = React.memo(({ 
  title, 
  metrics,
  isInvestment 
}: {
  title: string;
  metrics: { label: string; value: string; isTotal?: boolean }[];
  isInvestment: boolean;
}) => {
  const bgGradient = isInvestment 
    ? 'from-red-50/30 to-orange-50/20 dark:from-red-950/20 dark:to-orange-950/10'
    : 'from-green-50/30 to-emerald-50/20 dark:from-green-950/20 dark:to-emerald-950/10';

  return (
    <div className={`mb-6 p-5 bg-gradient-to-br ${bgGradient} rounded-xl border border-border/50`}>
      <h4 className="font-bold text-lg mb-4 text-foreground">
        {title}
      </h4>
      <div className="grid gap-3">
        {metrics.map((metric, i) => {
          const isTotal = metric.isTotal || metric.label.includes('Total');
          return (
            <div key={i} className={`flex justify-between items-center py-2 border-b border-border/30 last:border-0 ${isTotal ? 'font-bold border-t-2 pt-3' : ''}`}>
              <span className={`font-medium text-sm ${isTotal ? 'text-foreground' : 'text-muted-foreground'}`}>
                {metric.label}:
              </span>
              <span className={`text-sm ${isTotal ? 'text-base font-bold' : 'font-semibold text-foreground'}`}>
                {metric.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
FinancialSection.displayName = 'FinancialSection';

// Memoized component for implementation timelines
export const TimelineSection = React.memo(({ 
  items 
}: {
  items: { number: string; title: string; subItems: string[] }[];
}) => (
  <div className="mb-8">
    {items.map((item, index) => (
      <div key={index} className="mb-6 p-5 bg-gradient-to-br from-blue-50/30 to-cyan-50/20 dark:from-blue-950/20 dark:to-cyan-950/10 rounded-xl border border-border/50">
        <h4 className="font-bold text-lg mb-3 text-foreground">
          {item.number}. {item.title}
        </h4>
        {item.subItems.length > 0 && (
          <ul className="space-y-2 ml-4">
            {item.subItems.map((subItem, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary mt-1">✓</span>
                <span className="text-sm text-muted-foreground">{parseInlineMarkdown(subItem)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    ))}
  </div>
));
TimelineSection.displayName = 'TimelineSection';

// Memoized component for risk sections
export const RiskSection = React.memo(({ 
  title, 
  items 
}: {
  title: string;
  items: string[];
}) => {
  const bgColor = title.toLowerCase().includes('financial') 
    ? 'from-amber-50/30 to-orange-50/20 dark:from-amber-950/20 dark:to-orange-950/10'
    : 'from-red-50/30 to-pink-50/20 dark:from-red-950/20 dark:to-pink-950/10';
    
  const borderColor = title.toLowerCase().includes('financial')
    ? 'border-amber-200/50 dark:border-amber-800/30'
    : 'border-red-200/50 dark:border-red-800/30';

  return (
    <div className={`mb-6 p-5 bg-gradient-to-br ${bgColor} rounded-xl border ${borderColor}`}>
      <h4 className="font-semibold text-lg mb-4 text-foreground">
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, i) => {
          if (item.includes(':')) {
            const [label, ...rest] = item.split(':');
            const value = rest.join(':').trim();
            
            return (
              <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-2">
                <span className="font-medium text-sm text-foreground min-w-[120px]">
                  {label}:
                </span>
                <span className="text-sm text-muted-foreground">{parseInlineMarkdown(value)}</span>
              </div>
            );
          }
          
          return (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-400 mt-1">•</span>
              <span className="text-sm text-muted-foreground">{parseInlineMarkdown(item)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
RiskSection.displayName = 'RiskSection';