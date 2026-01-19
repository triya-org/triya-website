export interface FAQItem {
  question: {
    en: string;
    ar: string;
  };
  answer: {
    en: string;
    ar: string;
  };
  category: {
    en: string;
    ar: string;
  };
}

export const faqData: FAQItem[] = [
  // Product & Features
  {
    category: {
      en: "Product & Features",
      ar: "المنتج والميزات"
    },
    question: {
      en: "What is Triya's edge AI surveillance platform?",
      ar: "ما هي منصة المراقبة بالذكاء الاصطناعي من تريا؟"
    },
    answer: {
      en: "Triya is an advanced AI-powered video analytics platform that transforms any camera into an intelligent security system. It processes video data on-premise using edge computing, providing real-time alerts, object detection, and behavioral analysis while maintaining complete data privacy.",
      ar: "تريا هي منصة متقدمة لتحليل الفيديو بالذكاء الاصطناعي تحول أي كاميرا إلى نظام أمني ذكي. تعالج بيانات الفيديو محلياً باستخدام الحوسبة الطرفية، وتوفر تنبيهات فورية واكتشاف الأجسام وتحليل السلوك مع الحفاظ على خصوصية البيانات الكاملة."
    }
  },
  {
    category: {
      en: "Product & Features",
      ar: "المنتج والميزات"
    },
    question: {
      en: "How does Triya reduce surveillance costs by 85%?",
      ar: "كيف تقلل تريا من تكاليف المراقبة بنسبة 85%؟"
    },
    answer: {
      en: "Triya reduces costs through multiple factors: eliminating expensive cloud storage fees, reducing bandwidth requirements by processing data locally, preventing losses through real-time alerts, and working with existing camera infrastructure without requiring hardware replacement.",
      ar: "تقلل تريا التكاليف من خلال عوامل متعددة: إلغاء رسوم التخزين السحابي المكلفة، وتقليل متطلبات النطاق الترددي من خلال معالجة البيانات محلياً، ومنع الخسائر من خلال التنبيهات الفورية، والعمل مع البنية التحتية للكاميرات الحالية دون الحاجة لاستبدال الأجهزة."
    }
  },
  {
    category: {
      en: "Product & Features",
      ar: "المنتج والميزات"
    },
    question: {
      en: "Does Triya work with existing security cameras?",
      ar: "هل تعمل تريا مع كاميرات الأمان الحالية؟"
    },
    answer: {
      en: "Yes, Triya is camera-agnostic and compatible with most IP cameras, CCTV systems, and webcams. Our platform integrates seamlessly with your existing infrastructure, eliminating the need for costly camera replacements.",
      ar: "نعم، تريا متوافقة مع جميع أنواع الكاميرات وتعمل مع معظم كاميرات IP وأنظمة CCTV وكاميرات الويب. تتكامل منصتنا بسلاسة مع البنية التحتية الحالية لديك، مما يلغي الحاجة لاستبدال الكاميرات المكلف."
    }
  },
  {
    category: {
      en: "Product & Features",
      ar: "المنتج والميزات"
    },
    question: {
      en: "What makes Triya different from traditional CCTV systems?",
      ar: "ما الذي يميز تريا عن أنظمة المراقبة التقليدية؟"
    },
    answer: {
      en: "Unlike passive CCTV that only records, Triya actively analyzes video in real-time, detecting threats, unusual behaviors, and specific events instantly. It provides intelligent alerts, supports 30+ languages including Arabic, and processes everything on-premise for complete privacy.",
      ar: "بخلاف أنظمة المراقبة التقليدية التي تسجل فقط، تحلل تريا الفيديو بنشاط في الوقت الفعلي، وتكتشف التهديدات والسلوكيات غير العادية والأحداث المحددة فوراً. توفر تنبيهات ذكية، وتدعم أكثر من 30 لغة بما فيها العربية، وتعالج كل شيء محلياً للحفاظ على الخصوصية الكاملة."
    }
  },
  {
    category: {
      en: "Product & Features",
      ar: "المنتج والميزات"
    },
    question: {
      en: "Can Triya detect specific objects or behaviors?",
      ar: "هل يمكن لتريا اكتشاف أجسام أو سلوكيات محددة؟"
    },
    answer: {
      en: "Yes, Triya can detect people, vehicles, license plates, PPE compliance, crowd density, loitering, intrusion, abandoned objects, and many custom scenarios. Our AI models are continuously updated to recognize new patterns and behaviors.",
      ar: "نعم، يمكن لتريا اكتشاف الأشخاص والمركبات ولوحات الأرقام والامتثال لمعدات الحماية الشخصية وكثافة الحشود والتسكع والاقتحام والأجسام المهجورة والعديد من السيناريوهات المخصصة. يتم تحديث نماذج الذكاء الاصطناعي لدينا باستمرار للتعرف على أنماط وسلوكيات جديدة."
    }
  },
  
  // Technical & Implementation
  {
    category: {
      en: "Technical & Implementation",
      ar: "التقنية والتنفيذ"
    },
    question: {
      en: "What are the system requirements for Triya?",
      ar: "ما هي متطلبات النظام لتريا؟"
    },
    answer: {
      en: "Triya requires a standard server or edge device with GPU support for optimal performance. We support Windows, Linux, and can run on various hardware from desktop computers to specialized edge computing devices. Our team provides detailed specifications based on your camera count and requirements.",
      ar: "تتطلب تريا خادماً قياسياً أو جهاز حوسبة طرفية مع دعم GPU للحصول على أفضل أداء. ندعم Windows وLinux ويمكن التشغيل على أجهزة متنوعة من أجهزة الكمبيوتر المكتبية إلى أجهزة الحوسبة الطرفية المتخصصة. يوفر فريقنا مواصفات مفصلة بناءً على عدد الكاميرات ومتطلباتك."
    }
  },
  {
    category: {
      en: "Technical & Implementation",
      ar: "التقنية والتنفيذ"
    },
    question: {
      en: "How long does Triya installation take?",
      ar: "كم يستغرق تثبيت تريا؟"
    },
    answer: {
      en: "Basic installation typically takes 2-4 hours for up to 10 cameras. Larger deployments may take 1-2 days depending on the number of cameras and integration requirements. Our team handles the entire setup process including configuration and testing.",
      ar: "يستغرق التثبيت الأساسي عادة 2-4 ساعات لما يصل إلى 10 كاميرات. قد تستغرق التثبيتات الأكبر 1-2 يوم حسب عدد الكاميرات ومتطلبات التكامل. يتولى فريقنا عملية الإعداد الكاملة بما في ذلك التكوين والاختبار."
    }
  },
  {
    category: {
      en: "Technical & Implementation",
      ar: "التقنية والتنفيذ"
    },
    question: {
      en: "Is internet connection required for Triya to work?",
      ar: "هل الاتصال بالإنترنت مطلوب لعمل تريا؟"
    },
    answer: {
      en: "No, Triya operates completely offline using edge computing. Internet is only needed for optional features like remote monitoring, software updates, and cloud backup. The core AI surveillance functions work without any internet connection.",
      ar: "لا، تعمل تريا بشكل كامل دون اتصال بالإنترنت باستخدام الحوسبة الطرفية. الإنترنت مطلوب فقط للميزات الاختيارية مثل المراقبة عن بعد والتحديثات البرمجية والنسخ الاحتياطي السحابي. تعمل وظائف المراقبة الأساسية بالذكاء الاصطناعي دون أي اتصال بالإنترنت."
    }
  },
  {
    category: {
      en: "Technical & Implementation",
      ar: "التقنية والتنفيذ"
    },
    question: {
      en: "What video formats and resolutions does Triya support?",
      ar: "ما هي تنسيقات الفيديو والدقة التي تدعمها تريا؟"
    },
    answer: {
      en: "Triya supports all major video formats including H.264, H.265, MJPEG, and RTSP streams. We handle resolutions from 480p to 4K, automatically optimizing processing based on your requirements and available computing resources.",
      ar: "تدعم تريا جميع تنسيقات الفيديو الرئيسية بما في ذلك H.264 وH.265 وMJPEG وتدفقات RTSP. نتعامل مع دقة من 480p إلى 4K، مع تحسين المعالجة تلقائياً بناءً على متطلباتك وموارد الحوسبة المتاحة."
    }
  },
  {
    category: {
      en: "Technical & Implementation",
      ar: "التقنية والتنفيذ"
    },
    question: {
      en: "Can Triya integrate with existing security systems?",
      ar: "هل يمكن لتريا التكامل مع أنظمة الأمان الحالية؟"
    },
    answer: {
      en: "Yes, Triya provides APIs and webhooks for integration with access control systems, alarm systems, and security management platforms. We support standard protocols and can customize integrations for enterprise requirements.",
      ar: "نعم، توفر تريا واجهات برمجة التطبيقات APIs وwebhooks للتكامل مع أنظمة التحكم في الوصول وأنظمة الإنذار ومنصات إدارة الأمن. ندعم البروتوكولات القياسية ويمكننا تخصيص التكاملات لمتطلبات المؤسسات."
    }
  },
  
  // Pricing & Support
  {
    category: {
      en: "Pricing & Support",
      ar: "الأسعار والدعم"
    },
    question: {
      en: "How much does Triya cost?",
      ar: "كم تكلفة تريا؟"
    },
    answer: {
      en: "Triya offers flexible pricing based on the number of cameras and features required. Our solutions typically cost 85% less than cloud-based alternatives. Contact us for a customized quote based on your specific needs and deployment size.",
      ar: "تقدم تريا أسعاراً مرنة بناءً على عدد الكاميرات والميزات المطلوبة. تكلف حلولنا عادة أقل بنسبة 85% من البدائل السحابية. اتصل بنا للحصول على عرض سعر مخصص بناءً على احتياجاتك المحددة وحجم التثبيت."
    }
  },
  {
    category: {
      en: "Pricing & Support",
      ar: "الأسعار والدعم"
    },
    question: {
      en: "Is there a free trial or demo available?",
      ar: "هل يتوفر عرض تجريبي أو تجربة مجانية؟"
    },
    answer: {
      en: "Yes, we offer a comprehensive demo where we'll show Triya working with your actual cameras and use cases. We also provide proof-of-concept deployments for enterprise clients to evaluate the platform in their environment.",
      ar: "نعم، نقدم عرضاً توضيحياً شاملاً حيث سنعرض عمل تريا مع كاميراتك الفعلية وحالات الاستخدام الخاصة بك. كما نوفر تثبيتات إثبات المفهوم للعملاء من المؤسسات لتقييم المنصة في بيئتهم."
    }
  },
  {
    category: {
      en: "Pricing & Support",
      ar: "الأسعار والدعم"
    },
    question: {
      en: "What support options are available?",
      ar: "ما هي خيارات الدعم المتاحة؟"
    },
    answer: {
      en: "We provide multiple support tiers including email support, phone support, and 24/7 dedicated support for enterprise clients. All plans include software updates, and we offer both remote and on-site support options across the GCC region.",
      ar: "نوفر مستويات دعم متعددة بما في ذلك الدعم عبر البريد الإلكتروني والدعم الهاتفي والدعم المخصص على مدار الساعة للعملاء من المؤسسات. تتضمن جميع الخطط تحديثات البرامج، ونقدم خيارات الدعم عن بعد وفي الموقع عبر منطقة دول مجلس التعاون الخليجي."
    }
  },
  {
    category: {
      en: "Pricing & Support",
      ar: "الأسعار والدعم"
    },
    question: {
      en: "Do you provide training for our security team?",
      ar: "هل تقدمون تدريباً لفريق الأمن لدينا؟"
    },
    answer: {
      en: "Yes, we provide comprehensive training covering system operation, alert management, and report generation. Training can be conducted on-site or remotely, with materials available in English and Arabic.",
      ar: "نعم، نقدم تدريباً شاملاً يغطي تشغيل النظام وإدارة التنبيهات وإنشاء التقارير. يمكن إجراء التدريب في الموقع أو عن بعد، مع توفر المواد التدريبية باللغتين الإنجليزية والعربية."
    }
  },
  
  // Location & Availability
  {
    category: {
      en: "Location & Availability",
      ar: "الموقع والتوافر"
    },
    question: {
      en: "Do you provide local installation in UAE?",
      ar: "هل تقدمون التثبيت المحلي في دولة الإمارات؟"
    },
    answer: {
      en: "Yes, we have local teams in Abu Dhabi and Dubai providing same-day installation and support services throughout the UAE. Our headquarters is located in Abu Dhabi Global Market (ADGM).",
      ar: "نعم، لدينا فرق محلية في أبوظبي ودبي تقدم خدمات التثبيت والدعم في نفس اليوم في جميع أنحاء دولة الإمارات. يقع مقرنا الرئيسي في سوق أبوظبي العالمي (ADGM)."
    }
  },
  {
    category: {
      en: "Location & Availability",
      ar: "الموقع والتوافر"
    },
    question: {
      en: "How fast can you deploy Triya in Dubai or Abu Dhabi?",
      ar: "ما هي سرعة نشر تريا في دبي أو أبوظبي؟"
    },
    answer: {
      en: "For standard deployments in Dubai and Abu Dhabi, we can typically install and configure Triya within 24-48 hours of approval. Emergency deployments can be arranged for critical security needs with same-day service available.",
      ar: "للتثبيتات القياسية في دبي وأبوظبي، يمكننا عادة تثبيت وتكوين تريا خلال 24-48 ساعة من الموافقة. يمكن ترتيب التثبيتات الطارئة لاحتياجات الأمن الحرجة مع توفر الخدمة في نفس اليوم."
    }
  },
  {
    category: {
      en: "Location & Availability",
      ar: "الموقع والتوافر"
    },
    question: {
      en: "Which countries does Triya serve?",
      ar: "ما هي الدول التي تخدمها تريا؟"
    },
    answer: {
      en: "We primarily serve the GCC region including UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, and Oman. We're expanding across the broader Middle East and North Africa region with local partners.",
      ar: "نخدم بشكل أساسي منطقة دول مجلس التعاون الخليجي بما في ذلك الإمارات والسعودية وقطر والكويت والبحرين وعمان. نحن نتوسع عبر منطقة الشرق الأوسط وشمال أفريقيا الأوسع مع شركاء محليين."
    }
  },
  {
    category: {
      en: "Location & Availability",
      ar: "الموقع والتوافر"
    },
    question: {
      en: "Is on-site support available in my area?",
      ar: "هل الدعم في الموقع متاح في منطقتي؟"
    },
    answer: {
      en: "We provide on-site support across major cities in the GCC including Abu Dhabi, Dubai, Riyadh, Doha, Kuwait City, and Muscat. For other locations, we offer remote support and work with certified local partners.",
      ar: "نوفر الدعم في الموقع عبر المدن الرئيسية في دول مجلس التعاون الخليجي بما في ذلك أبوظبي ودبي والرياض والدوحة ومدينة الكويت ومسقط. للمواقع الأخرى، نقدم الدعم عن بعد ونعمل مع شركاء محليين معتمدين."
    }
  },
  
  // Privacy & Security
  {
    category: {
      en: "Privacy & Security",
      ar: "الخصوصية والأمان"
    },
    question: {
      en: "How is video data stored and protected?",
      ar: "كيف يتم تخزين بيانات الفيديو وحمايتها؟"
    },
    answer: {
      en: "All video data is processed and stored on-premise on your own servers, giving you complete control. Data is encrypted using AES-256 encryption, and we never have access to your video feeds or stored data unless explicitly authorized for support.",
      ar: "تتم معالجة جميع بيانات الفيديو وتخزينها محلياً على خوادمك الخاصة، مما يمنحك التحكم الكامل. يتم تشفير البيانات باستخدام تشفير AES-256، ولا يمكننا الوصول إلى موجزات الفيديو أو البيانات المخزنة إلا بتصريح صريح للدعم."
    }
  },
  {
    category: {
      en: "Privacy & Security",
      ar: "الخصوصية والأمان"
    },
    question: {
      en: "Does Triya comply with data protection regulations?",
      ar: "هل تمتثل تريا للوائح حماية البيانات؟"
    },
    answer: {
      en: "Yes, Triya is designed for complete regulatory compliance. By processing data on-premise, we help organizations meet GDPR, local data sovereignty requirements, and industry-specific regulations while maintaining the highest security standards.",
      ar: "نعم، تريا مصممة للامتثال التنظيمي الكامل. من خلال معالجة البيانات محلياً، نساعد المؤسسات على تلبية متطلبات GDPR ومتطلبات سيادة البيانات المحلية واللوائح الخاصة بالصناعة مع الحفاظ على أعلى معايير الأمان."
    }
  }
];

// Helper function to get FAQs by category
export function getFAQsByCategory(category: string, language: "en" | "ar" = "en"): FAQItem[] {
  return faqData.filter(faq => faq.category[language] === category);
}

// Helper function to get all unique categories
export function getCategories(language: "en" | "ar" = "en"): string[] {
  return Array.from(new Set(faqData.map(faq => faq.category[language])));
}

// Generate FAQ Schema for SEO
export function generateFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question.en,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer.en
      }
    }))
  };
}