'use client';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export const GA_MEASUREMENT_ID = 'G-B5PQ2YG092';

// Track basic page views (already handled by default GA)
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }
};

// Track custom events
export const event = (action: string, parameters?: any) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, parameters);
  }
};

// Specific event tracking functions for your business
export const useAnalytics = () => {
  // Track Request Demo clicks
  const trackRequestDemo = (location: string) => {
    event('generate_lead', {
      event_category: 'Lead Generation',
      event_label: `Request Demo - ${location}`,
      value: 1,
    });
  };

  // Track Watch Video clicks
  const trackWatchVideo = (location: string) => {
    event('video_play', {
      event_category: 'Engagement',
      event_label: `Watch Video - ${location}`,
      value: 1,
    });
  };

  // Track LinkedIn clicks
  const trackLinkedInClick = () => {
    event('click', {
      event_category: 'Social Media',
      event_label: 'LinkedIn',
      value: 1,
    });
  };

  // Track Contact Form submissions
  const trackContactForm = (formData?: { company?: string; industry?: string }) => {
    event('form_submit', {
      event_category: 'Contact',
      event_label: 'Contact Form',
      company_name: formData?.company,
      industry: formData?.industry,
    });
  };

  // Track industry page views
  const trackIndustryView = (industry: string) => {
    event('view_item', {
      event_category: 'Industry',
      event_label: industry,
      content_type: 'use_case',
    });
  };

  // Track navigation menu clicks
  const trackNavigation = (menuItem: string) => {
    event('click', {
      event_category: 'Navigation',
      event_label: menuItem,
    });
  };

  // Track CTA clicks
  const trackCTAClick = (ctaName: string, location: string) => {
    event('select_content', {
      event_category: 'CTA',
      event_label: ctaName,
      content_type: location,
    });
  };

  return {
    trackRequestDemo,
    trackWatchVideo,
    trackLinkedInClick,
    trackContactForm,
    trackIndustryView,
    trackNavigation,
    trackCTAClick,
  };
};