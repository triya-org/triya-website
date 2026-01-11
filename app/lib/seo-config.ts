import { Metadata } from 'next';

export const siteConfig = {
  name: 'Triya',
  domain: 'www.triya.ai',
  url: 'https://www.triya.ai',
  description: 'Edge AI surveillance platform with 85% cost savings. On-premise video analytics, Arabic-first capabilities, multi-language support for smart cities, retail, manufacturing.',
  keywords: [
    'Triya',
    'Triya AI',
    'AI surveillance system',
    'intelligent video analytics',
    'security camera software', 
    'video monitoring solution',
    'edge AI platform',
    'on-premise AI',
    'Arabic AI surveillance',
    'GCC security solutions',
    'smart city surveillance',
    'retail security AI',
    'manufacturing surveillance',
    'event security monitoring',
    'real-time person detection',
    'AI-powered license plate recognition',
    'automated security incident alerting',
    'retail loss prevention AI',
    'sovereign AI surveillance',
    'privacy-first surveillance',
    'camera-agnostic security',
    'multi-language surveillance',
    'ADGM technology',
    'Abu Dhabi AI startup',
    'Middle East security tech',
    'cost-effective surveillance',
    'computer vision platform'
  ]
};

export const pageMetadata: Record<string, Metadata> = {
  home: {
    title: 'Triya | Edge AI Surveillance Platform - 85% Cost Savings',
    description: 'Triya delivers edge AI surveillance with 85% cost savings. On-premise processing, Arabic-first capabilities, 30+ languages. Transform security for smart cities, retail, manufacturing.',
    keywords: ['Triya', 'AI surveillance', 'edge AI', 'video analytics', 'security camera software', 'smart surveillance', 'cost-effective security'],
    openGraph: {
      title: 'Triya - Revolutionary Edge AI Surveillance Platform',
      description: 'Save 85% on surveillance costs with Triya\'s edge AI platform. On-premise processing, multi-language support, camera-agnostic solution.',
      images: ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Triya - Edge AI Surveillance Platform',
      description: 'Revolutionary surveillance with 85% cost savings. On-premise AI processing for complete data sovereignty.',
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: 'https://www.triya.ai',
    },
  },
  about: {
    title: 'About Triya | Leading Edge AI Surveillance Company in MENA',
    description: 'Triya is revolutionizing surveillance with edge AI technology. Based in Abu Dhabi, we deliver 85% cost savings with on-premise processing and Arabic-first capabilities.',
    keywords: ['about Triya', 'AI surveillance company', 'ADGM startup', 'Abu Dhabi technology', 'edge AI platform', 'surveillance innovation'],
    openGraph: {
      title: 'About Triya - Pioneering Edge AI Surveillance',
      description: 'Learn how Triya is transforming surveillance with edge AI, delivering 85% cost savings and complete data sovereignty.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/about',
    },
  },
  contact: {
    title: 'Contact Triya | Get AI Surveillance Demo & Pricing',
    description: 'Contact Triya for a demo of our edge AI surveillance platform. Located in Abu Dhabi Global Market. Get pricing and implementation details.',
    keywords: ['contact Triya', 'AI surveillance demo', 'security system pricing', 'ADGM contact', 'surveillance consultation'],
    openGraph: {
      title: 'Contact Triya - Get Your AI Surveillance Demo',
      description: 'Schedule a demo of Triya\'s revolutionary edge AI surveillance platform. Save 85% on surveillance costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/contact',
    },
  },
  smartCities: {
    title: 'Smart City Surveillance | AI Traffic & Crowd Monitoring - Triya',
    description: 'Transform urban security with Triya\'s smart city surveillance. Real-time traffic monitoring, crowd analytics, incident detection with 85% cost savings.',
    keywords: ['smart city surveillance', 'urban AI security', 'traffic monitoring AI', 'crowd analytics', 'city surveillance system', 'municipal security AI'],
    openGraph: {
      title: 'Smart City AI Surveillance Solutions by Triya',
      description: 'Comprehensive smart city surveillance with edge AI. Traffic monitoring, crowd control, and incident detection at 85% lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/smart-cities',
    },
  },
  retail: {
    title: 'Retail Security AI | Loss Prevention & Customer Analytics - Triya',
    description: 'Enhance retail security with Triya\'s AI surveillance. Real-time theft detection, customer behavior analytics, queue management with 85% cost savings.',
    keywords: ['retail security AI', 'loss prevention system', 'theft detection AI', 'customer analytics', 'retail surveillance', 'store security AI'],
    openGraph: {
      title: 'Retail AI Surveillance Solutions by Triya',
      description: 'Advanced retail security with edge AI. Prevent losses, analyze customer behavior, optimize operations at 85% lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/retail',
    },
  },
  manufacturing: {
    title: 'Manufacturing Surveillance | Industrial Safety AI Monitoring - Triya',
    description: 'Ensure workplace safety with Triya\'s manufacturing AI surveillance. PPE compliance, hazard detection, operational efficiency with 85% cost savings.',
    keywords: ['manufacturing surveillance', 'industrial safety AI', 'PPE detection', 'workplace safety monitoring', 'factory surveillance', 'industrial security AI'],
    openGraph: {
      title: 'Manufacturing AI Surveillance Solutions by Triya',
      description: 'Comprehensive factory surveillance with edge AI. Safety compliance, hazard detection, and efficiency monitoring at 85% lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/manufacturing',
    },
  },
  events: {
    title: 'Event Security AI | Crowd Control & VIP Protection - Triya',
    description: 'Secure events with Triya\'s AI surveillance. Real-time crowd monitoring, VIP tracking, incident response with 85% cost savings.',
    keywords: ['event security AI', 'crowd control system', 'VIP protection', 'event surveillance', 'concert security', 'stadium surveillance AI'],
    openGraph: {
      title: 'Event AI Surveillance Solutions by Triya',
      description: 'Advanced event security with edge AI. Crowd control, VIP protection, and incident management at 85% lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/events',
    },
  },
  privacy: {
    title: 'Privacy Policy | Triya AI Surveillance Platform',
    description: 'Triya\'s privacy policy for our edge AI surveillance platform. Learn how we protect your data with on-premise processing and complete data sovereignty.',
    keywords: ['Triya privacy', 'data protection', 'surveillance privacy', 'GDPR compliance', 'data sovereignty'],
    openGraph: {
      title: 'Privacy Policy - Triya AI Surveillance',
      description: 'Our commitment to privacy and data protection with on-premise AI processing.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/privacy',
    },
  },
  terms: {
    title: 'Terms of Service | Triya AI Surveillance Platform',
    description: 'Terms and conditions for using Triya\'s edge AI surveillance platform and services.',
    keywords: ['Triya terms', 'service agreement', 'surveillance terms', 'legal terms'],
    openGraph: {
      title: 'Terms of Service - Triya AI Surveillance',
      description: 'Terms and conditions for Triya\'s edge AI surveillance platform.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/terms',
    },
  },
};
