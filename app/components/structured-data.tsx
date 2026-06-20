export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.triya.ai/#organization",
    "name": "Triya",
    "legalName": "TRIYA AI LIMITED",
    "url": "https://www.triya.ai",
    "logo": "https://www.triya.ai/logo.png",
    "description": "AI video analytics platform that adds real-time intelligence to existing CCTV with significant cost savings and on-premise processing",
    "foundingDate": "2025-12-08",
    "founder": {
      "@type": "Person",
      "name": "Triya Founding Team"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sky Tower, Al Reem Island",
      "addressLocality": "Abu Dhabi",
      "addressRegion": "Abu Dhabi",
      "postalCode": "",
      "addressCountry": "AE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+971-58-680-1200",
      "contactType": "sales",
      "email": "founders@triya.ai",
      "availableLanguage": ["en", "ar"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/triyaai"
    ],
    "areaServed": [
      {
        "@type": "Place",
        "name": "Middle East and North Africa"
      },
      {
        "@type": "Place",
        "name": "Asia"
      }
    ],
    "knowsAbout": [
      "AI surveillance",
      "Edge computing",
      "Video analytics",
      "Computer vision",
      "Security systems",
      "Smart city technology",
      "Retail analytics",
      "Manufacturing safety"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function ServiceSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://www.triya.ai/#service",
    "serviceType": "AI Video Analytics & Surveillance Platform",
    "name": "Triya AI Video Analytics Platform",
    "description": "AI video analytics platform that turns existing CCTV cameras into a real-time, on-premise threat-detection system with significant cost savings.",
    "provider": {
      "@type": "Organization",
      "@id": "https://www.triya.ai/#organization",
      "name": "TRIYA AI LIMITED"
    },
    "brand": {
      "@type": "Brand",
      "name": "Triya"
    },
    "areaServed": [
      {
        "@type": "Place",
        "name": "Middle East and North Africa"
      },
      {
        "@type": "Place",
        "name": "Asia"
      }
    ],
    "category": "Enterprise Security Software",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Triya Solutions",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Smart City Surveillance",
            "description": "AI-powered urban security and traffic monitoring"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Retail Security Analytics",
            "description": "Loss prevention and customer behavior analysis"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Manufacturing Safety Monitoring",
            "description": "PPE compliance and hazard detection"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Event Security Management",
            "description": "Crowd control and VIP protection"
          }
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function FAQSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Triya's edge AI surveillance platform?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Triya is an edge AI surveillance platform that processes video analytics on-premise, delivering significant cost savings compared to traditional systems while ensuring complete data sovereignty."
        }
      },
      {
        "@type": "Question",
        "name": "How does Triya reduce surveillance costs?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Triya reduces costs through edge computing, eliminating cloud storage fees, reducing bandwidth requirements, and working with existing camera infrastructure without expensive hardware replacements."
        }
      },
      {
        "@type": "Question",
        "name": "Does Triya support Arabic language?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Triya offers Arabic-first capabilities along with support for over 30 languages, making it ideal for GCC markets and international deployments."
        }
      },
      {
        "@type": "Question",
        "name": "Is Triya compatible with existing cameras?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Triya is camera-agnostic and works with any IP camera or existing CCTV infrastructure, eliminating the need for costly hardware replacements."
        }
      },
      {
        "@type": "Question",
        "name": "Where is video data processed with Triya?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "All video processing happens on-premise at the edge, ensuring complete data sovereignty and privacy compliance without sending sensitive data to the cloud."
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.triya.ai/#localbusiness",
    "name": "TRIYA AI LIMITED",
    "image": "https://www.triya.ai/og-image.png",
    "url": "https://www.triya.ai",
    "telephone": "+971-58-680-1200",
    "email": "hello@triya.ai",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Sky Tower, Al Reem Island",
      "addressLocality": "Abu Dhabi",
      "addressRegion": "Abu Dhabi",
      "postalCode": "",
      "addressCountry": "AE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "24.4988",
      "longitude": "54.4053"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Sunday"
      ],
      "opens": "09:00",
      "closes": "18:00"
    },
    "priceRange": "$$$"
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function BreadcrumbSchema({ items }: { items: Array<{ name: string; url: string }> }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function VideoSchema({ 
  name, 
  description, 
  thumbnailUrl, 
  uploadDate,
  duration 
}: { 
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": name,
    "description": description,
    "thumbnailUrl": thumbnailUrl,
    "uploadDate": uploadDate,
    "duration": duration || "PT2M",
    "publisher": {
      "@type": "Organization",
      "name": "Triya",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.triya.ai/logo.png"
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
