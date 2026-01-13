'use client';

import { Share2 } from 'lucide-react';

interface ShareButtonProps {
  article: {
    title: string;
    excerpt: string;
  };
}

export function ShareButton({ article }: ShareButtonProps) {
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
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
      aria-label="Share article"
    >
      <Share2 className="h-4 w-4" />
      <span className="text-sm">Share</span>
    </button>
  );
}