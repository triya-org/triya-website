export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const faqData: FAQItem[] = [
  // Product & Features
  {
    category: "Product & Features",
    question: "What is Triya's edge AI surveillance platform?",
    answer: "Triya is an advanced AI-powered video analytics platform that transforms any camera into an intelligent security system. It processes video data on-premise using edge computing, providing real-time alerts, object detection, and behavioral analysis while maintaining complete data privacy."
  },
  {
    category: "Product & Features",
    question: "How does Triya reduce surveillance costs by 85%?",
    answer: "Triya reduces costs through multiple factors: eliminating expensive cloud storage fees, reducing bandwidth requirements by processing data locally, preventing losses through real-time alerts, and working with existing camera infrastructure without requiring hardware replacement."
  },
  {
    category: "Product & Features",
    question: "Does Triya work with existing security cameras?",
    answer: "Yes, Triya is camera-agnostic and compatible with most IP cameras, CCTV systems, and webcams. Our platform integrates seamlessly with your existing infrastructure, eliminating the need for costly camera replacements."
  },
  {
    category: "Product & Features",
    question: "What makes Triya different from traditional CCTV systems?",
    answer: "Unlike passive CCTV that only records, Triya actively analyzes video in real-time, detecting threats, unusual behaviors, and specific events instantly. It provides intelligent alerts, supports 30+ languages including Arabic, and processes everything on-premise for complete privacy."
  },
  {
    category: "Product & Features",
    question: "Can Triya detect specific objects or behaviors?",
    answer: "Yes, Triya can detect people, vehicles, license plates, PPE compliance, crowd density, loitering, intrusion, abandoned objects, and many custom scenarios. Our AI models are continuously updated to recognize new patterns and behaviors."
  },
  
  // Technical & Implementation
  {
    category: "Technical & Implementation",
    question: "What are the system requirements for Triya?",
    answer: "Triya requires a standard server or edge device with GPU support for optimal performance. We support Windows, Linux, and can run on various hardware from desktop computers to specialized edge computing devices. Our team provides detailed specifications based on your camera count and requirements."
  },
  {
    category: "Technical & Implementation",
    question: "How long does Triya installation take?",
    answer: "Basic installation typically takes 2-4 hours for up to 10 cameras. Larger deployments may take 1-2 days depending on the number of cameras and integration requirements. Our team handles the entire setup process including configuration and testing."
  },
  {
    category: "Technical & Implementation",
    question: "Is internet connection required for Triya to work?",
    answer: "No, Triya operates completely offline using edge computing. Internet is only needed for optional features like remote monitoring, software updates, and cloud backup. The core AI surveillance functions work without any internet connection."
  },
  {
    category: "Technical & Implementation",
    question: "What video formats and resolutions does Triya support?",
    answer: "Triya supports all major video formats including H.264, H.265, MJPEG, and RTSP streams. We handle resolutions from 480p to 4K, automatically optimizing processing based on your requirements and available computing resources."
  },
  {
    category: "Technical & Implementation",
    question: "Can Triya integrate with existing security systems?",
    answer: "Yes, Triya provides APIs and webhooks for integration with access control systems, alarm systems, and security management platforms. We support standard protocols and can customize integrations for enterprise requirements."
  },
  
  // Pricing & Support
  {
    category: "Pricing & Support",
    question: "How much does Triya cost?",
    answer: "Triya offers flexible pricing based on the number of cameras and features required. Our solutions typically cost 85% less than cloud-based alternatives. Contact us for a customized quote based on your specific needs and deployment size."
  },
  {
    category: "Pricing & Support",
    question: "Is there a free trial or demo available?",
    answer: "Yes, we offer a comprehensive demo where we'll show Triya working with your actual cameras and use cases. We also provide proof-of-concept deployments for enterprise clients to evaluate the platform in their environment."
  },
  {
    category: "Pricing & Support",
    question: "What support options are available?",
    answer: "We provide multiple support tiers including email support, phone support, and 24/7 dedicated support for enterprise clients. All plans include software updates, and we offer both remote and on-site support options across the GCC region."
  },
  {
    category: "Pricing & Support",
    question: "Do you provide training for our security team?",
    answer: "Yes, we provide comprehensive training covering system operation, alert management, and report generation. Training can be conducted on-site or remotely, with materials available in English and Arabic."
  },
  
  // Location & Availability
  {
    category: "Location & Availability",
    question: "Do you provide local installation in UAE?",
    answer: "Yes, we have local teams in Abu Dhabi and Dubai providing same-day installation and support services throughout the UAE. Our headquarters is located in Abu Dhabi Global Market (ADGM)."
  },
  {
    category: "Location & Availability",
    question: "How fast can you deploy Triya in Dubai or Abu Dhabi?",
    answer: "For standard deployments in Dubai and Abu Dhabi, we can typically install and configure Triya within 24-48 hours of approval. Emergency deployments can be arranged for critical security needs with same-day service available."
  },
  {
    category: "Location & Availability",
    question: "Which countries does Triya serve?",
    answer: "We primarily serve the GCC region including UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, and Oman. We're expanding across the broader Middle East and North Africa region with local partners."
  },
  {
    category: "Location & Availability",
    question: "Is on-site support available in my area?",
    answer: "We provide on-site support across major cities in the GCC including Abu Dhabi, Dubai, Riyadh, Doha, Kuwait City, and Muscat. For other locations, we offer remote support and work with certified local partners."
  },
  
  // Privacy & Security
  {
    category: "Privacy & Security",
    question: "How is video data stored and protected?",
    answer: "All video data is processed and stored on-premise on your own servers, giving you complete control. Data is encrypted using AES-256 encryption, and we never have access to your video feeds or stored data unless explicitly authorized for support."
  },
  {
    category: "Privacy & Security",
    question: "Does Triya comply with data protection regulations?",
    answer: "Yes, Triya is designed for complete regulatory compliance. By processing data on-premise, we help organizations meet GDPR, local data sovereignty requirements, and industry-specific regulations while maintaining the highest security standards."
  }
];

// Helper function to get FAQs by category
export function getFAQsByCategory(category: string): FAQItem[] {
  return faqData.filter(faq => faq.category === category);
}

// Helper function to get all unique categories
export function getCategories(): string[] {
  return Array.from(new Set(faqData.map(faq => faq.category)));
}

// Generate FAQ Schema for SEO
export function generateFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}