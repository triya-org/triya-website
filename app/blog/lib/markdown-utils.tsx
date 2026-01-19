import React from 'react';

export const parseInlineMarkdown = (text: string) => {
  if (!text) return text;
  
  // Handle @@ delimited content (e.g., @@Mistake: text @@Solution: text)
  if (text.includes('@@')) {
    // Split by @@ but keep empty strings to know position
    const rawParts = text.split('@@');
    const parts = rawParts.filter((part, index) => {
      // Keep non-empty parts and check if they should be processed
      return part.trim() || (index === 0 && part === '');
    });
    
    // Only process if we have @@ delimiters (parts.length > 1 after split)
    if (rawParts.length > 1) {
      const processedParts = rawParts.filter(part => part.trim());
      if (processedParts.length > 0) {
        return (
          <span className="inline-block">
            {processedParts.map((part, i) => {
              // Check if part starts with a label (e.g., "Mistake:", "Solution:", "UAE:")
              const colonIndex = part.indexOf(':');
              if (colonIndex > 0 && colonIndex < 20) {
                const label = part.substring(0, colonIndex).trim();
                const content = part.substring(colonIndex + 1).trim();
                
                return (
                  <span key={i} className={i > 0 ? "block mt-2" : "block"}>
                    <strong className="text-foreground font-semibold">
                      {label}:
                    </strong>
                    <span className="ml-1">{content}</span>
                  </span>
                );
              }
              return <span key={i} className={i > 0 ? "ml-1" : ""}>{part}</span>;
            })}
          </span>
        );
      }
    }
  }
  
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