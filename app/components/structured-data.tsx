export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.triya.ai/#organization",
    "name": "Triya",
    "legalName": "Triya Technologies",
    "url": "https://www.triya.ai",
    "logo": "https://www.triya.ai/logo.png",
    "description": "Edge AI surveillance platform delivering 85% cost savings with on-premise video analytics and Arabic-first capabilities",
    "foundingDate": "2023",
    "founder": {
      "@type": "Person",
      "name": "Triya Founding Team"
    },
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Office 3122 Tower C2, Al Khatem Tower, ADGM Square",
      "addressLocality": "Abu Dhabi",
      "addressRegion": "Abu Dhabi",
      "postalCode": "0000",
      "addressCountry": "AE"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+971-58-680-1200",
      "contactType": "sales",
      "email": "hello@triya.ai",
      "availableLanguage": ["en", "ar"]
    },
    "sameAs": [
      "https://www.linkedin.com/company/triyaai"
    ],
    "areaServed": {
      "@type": "Place",
      "name": "Middle East and North Africa"
    },
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

export function ProductSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": "https://www.triya.ai/#product",
    "name": "Triya Edge AI Surveillance Platform",
    "description": "Revolutionary edge AI surveillance platform with 85% cost savings, on-premise processing, and multi-language support including Arabic",
    "brand": {
      "@type": "Brand",
      "name": "Triya"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "Triya Technologies"
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "offerCount": "4",
      "offers": [
        {
          "@type": "Offer",
          "name": "Smart City Surveillance",
          "description": "AI-powered urban security and traffic monitoring"
        },
        {
          "@type": "Offer",
          "name": "Retail Security Analytics",
          "description": "Loss prevention and customer behavior analysis"
        },
        {
          "@type": "Offer",
          "name": "Manufacturing Safety Monitoring",
          "description": "PPE compliance and hazard detection"
        },
        {
          "@type": "Offer",
          "name": "Event Security Management",
          "description": "Crowd control and VIP protection"
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "50"
    },
    "award": "ADGM Innovation Award 2024",
    "category": "Enterprise Security Software",
    "isRelatedTo": [
      {
        "@type": "Thing",
        "name": "Artificial Intelligence"
      },
      {
        "@type": "Thing",
        "name": "Video Surveillance"
      },
      {
        "@type": "Thing",
        "name": "Edge Computing"
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
          "text": "Triya is an edge AI surveillance platform that processes video analytics on-premise, delivering 85% cost savings compared to traditional systems while ensuring complete data sovereignty."
        }
      },
      {
        "@type": "Question",
        "name": "How does Triya reduce surveillance costs by 85%?",
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
    "name": "Triya Technologies",
    "image": "https://www.triya.ai/og-image.png",
    "url": "https://www.triya.ai",
    "telephone": "+971-58-680-1200",
    "email": "hello@triya.ai",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Office 3122 Tower C2, Al Khatem Tower, ADGM Square",
      "addressLocality": "Abu Dhabi",
      "addressRegion": "Abu Dhabi",
      "postalCode": "0000",
      "addressCountry": "AE"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "24.4539",
      "longitude": "54.3773"
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
