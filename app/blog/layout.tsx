import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Triya AI Surveillance Insights',
  description: 'Expert insights on edge AI surveillance, cost savings, Arabic AI technology, and data sovereignty for Middle East businesses. Learn from industry leaders.',
  keywords: [
    'AI surveillance blog',
    'edge computing insights',
    'surveillance cost reduction',
    'Arabic AI technology',
    'data sovereignty UAE',
    'security technology Middle East',
    'on-premise surveillance',
    'smart city security',
    'retail loss prevention',
    'surveillance best practices'
  ],
  openGraph: {
    title: 'Triya Blog - AI Surveillance Insights',
    description: 'Expert insights on edge AI surveillance technology for the Middle East market.',
    url: 'https://www.triya.ai/blog/',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Triya Blog - AI Surveillance Insights',
    description: 'Expert insights on edge AI surveillance technology.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.triya.ai/blog/',
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children;
}