import { Metadata } from 'next';
import { generateFAQSchema } from './faq-data';

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | Triya AI Surveillance',
  description: 'Find answers about Triya edge AI surveillance platform. Learn about costs, installation, features, Arabic support, and local deployment in UAE, Dubai, Abu Dhabi.',
  keywords: [
    'Triya FAQ',
    'AI surveillance questions',
    'surveillance system cost',
    'Dubai security installation',
    'Abu Dhabi AI deployment',
    'Arabic surveillance support',
    'edge AI questions',
    'on-premise surveillance FAQ',
    'camera compatibility',
    'security system pricing'
  ],
  openGraph: {
    title: 'Frequently Asked Questions - Triya AI Surveillance',
    description: 'Get answers about Triya\'s 85% cost-saving AI surveillance platform. Installation, pricing, and support in UAE.',
    url: 'https://www.triya.ai/faq',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FAQ - Triya AI Surveillance Platform',
    description: 'Answers about edge AI surveillance, costs, and local installation in UAE.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.triya.ai/faq',
  },
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const faqSchema = generateFAQSchema();
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}