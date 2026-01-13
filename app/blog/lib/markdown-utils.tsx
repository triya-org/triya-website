import React from 'react';

export const parseInlineMarkdown = (text: string) => {
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