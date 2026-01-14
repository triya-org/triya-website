'use client';

import { Share2, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
  article: {
    title: string;
    excerpt: string;
  };
}

export function ShareButton({ article }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

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
    } else {
      // Fallback: copy link to clipboard
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
      aria-label="Share article"
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span className="text-sm">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          <span className="text-sm">Share</span>
        </>
      )}
    </button>
  );
}