import { Metadata } from 'next';

export const siteConfig = {
  name: 'Triya',
  domain: 'www.triya.ai',
  url: 'https://www.triya.ai',
  description: 'Triya turns your existing CCTV into a real-time AI video analytics platform — detect incidents on-premise with no rip-and-replace and significant cost savings. Camera-agnostic, cloud or edge.',
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
    title: 'AI Video Analytics & CCTV Intelligence Platform | Triya',
    description: 'AI video analytics and CCTV intelligence from Triya — turn any existing camera into a real-time threat-detection system with on-premise edge processing and significant cost savings. Serving Dubai, Abu Dhabi & the GCC.',
    keywords: ['Triya', 'AI surveillance Dubai', 'surveillance system Abu Dhabi', 'UAE security cameras', 'GCC surveillance', 'edge AI platform', 'Arabic surveillance'],
    openGraph: {
      title: 'Triya - Revolutionary Edge AI Surveillance Platform',
      description: 'Cut surveillance costs significantly with Triya\'s edge AI platform. On-premise processing, multi-language support, camera-agnostic solution.',
      images: ['/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Triya - Edge AI Surveillance Platform',
      description: 'Revolutionary surveillance with significant cost savings. On-premise AI processing for complete data sovereignty.',
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: 'https://www.triya.ai/',
    },
  },
  about: {
    title: 'About Triya | AI Video Analytics Company in Abu Dhabi & GCC',
    description: 'Triya is an AI video analytics company based in Abu Dhabi, turning existing CCTV into intelligent, on-premise security with significant cost savings across the GCC.',
    keywords: ['about Triya', 'AI surveillance company', 'ADGM startup', 'Abu Dhabi technology', 'edge AI platform', 'surveillance innovation'],
    openGraph: {
      title: 'About Triya - Pioneering Edge AI Surveillance',
      description: 'Learn how Triya is transforming surveillance with edge AI, delivering significant cost savings and complete data sovereignty.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/about/',
    },
  },
  contact: {
    title: 'Contact Triya | Get AI Surveillance Demo & Pricing',
    description: 'Contact Triya for a demo of our edge AI surveillance platform. Located in Abu Dhabi Global Market. Get pricing and implementation details.',
    keywords: ['contact Triya', 'AI surveillance demo', 'security system pricing', 'ADGM contact', 'surveillance consultation'],
    openGraph: {
      title: 'Contact Triya - Get Your AI Surveillance Demo',
      description: 'Schedule a demo of Triya\'s revolutionary edge AI surveillance platform. Cut surveillance costs significantly.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/contact/',
    },
  },
  smartCities: {
    title: 'Smart City Video Analytics | AI CCTV Traffic & Crowd - Triya',
    description: 'Smart city video analytics from Triya — AI CCTV for real-time traffic monitoring, crowd analytics and incident detection, processed on-premise with significant cost savings.',
    keywords: ['smart city surveillance', 'urban AI security', 'traffic monitoring AI', 'crowd analytics', 'city surveillance system', 'municipal security AI'],
    openGraph: {
      title: 'Smart City AI Surveillance Solutions by Triya',
      description: 'Comprehensive smart city surveillance with edge AI. Traffic monitoring, crowd control, and incident detection at dramatically lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/smart-cities/',
    },
  },
  retail: {
    title: 'Retail Video Analytics | AI CCTV Loss Prevention - Triya',
    description: 'Retail video analytics from Triya — AI CCTV for loss prevention, theft detection and customer analytics on your existing cameras, with significant cost savings.',
    keywords: ['retail security AI', 'loss prevention system', 'theft detection AI', 'customer analytics', 'retail surveillance', 'store security AI'],
    openGraph: {
      title: 'Retail AI Surveillance Solutions by Triya',
      description: 'Advanced retail security with edge AI. Prevent losses, analyze customer behavior, optimize operations at dramatically lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/retail/',
    },
  },
  manufacturing: {
    title: 'Manufacturing Video Analytics | AI CCTV Safety Monitoring - Triya',
    description: 'Manufacturing video analytics from Triya — AI CCTV for PPE compliance, hazard detection and workplace safety, processed on-premise with significant cost savings.',
    keywords: ['manufacturing surveillance', 'industrial safety AI', 'PPE detection', 'workplace safety monitoring', 'factory surveillance', 'industrial security AI'],
    openGraph: {
      title: 'Manufacturing AI Surveillance Solutions by Triya',
      description: 'Comprehensive factory surveillance with edge AI. Safety compliance, hazard detection, and efficiency monitoring at dramatically lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/manufacturing/',
    },
  },
  events: {
    title: 'Event Video Analytics | AI CCTV Crowd Monitoring - Triya',
    description: 'Event video analytics from Triya — AI CCTV for real-time crowd monitoring, incident response and VIP protection, with significant cost savings.',
    keywords: ['event security AI', 'crowd control system', 'VIP protection', 'event surveillance', 'concert security', 'stadium surveillance AI'],
    openGraph: {
      title: 'Event AI Surveillance Solutions by Triya',
      description: 'Advanced event security with edge AI. Crowd control, VIP protection, and incident management at dramatically lower costs.',
      images: ['/og-image.png'],
      type: 'website',
    },
    alternates: {
      canonical: 'https://www.triya.ai/use-cases/events/',
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
      canonical: 'https://www.triya.ai/privacy/',
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
      canonical: 'https://www.triya.ai/terms/',
    },
  },
};
