import React, { useEffect } from 'react';

// SEO utilities for MAKU.Travel - Following enterprise SEO best practices

export interface SEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  twitterCard?: 'summary' | 'summary_large_image';
  schemaOrg?: Record<string, any>;
  robots?: string;
}

export const generateSEOMetadata = (page: string, data?: any): SEOMetadata => {
  const baseUrl = 'https://maku.travel';
  
  const seoConfigs: Record<string, SEOMetadata> = {
    home: {
      title: 'MAKU.Travel - Book Flights, Hotels & Activities | Best Travel Deals',
      description: 'Discover amazing travel deals on flights, hotels, and activities worldwide. Book your next adventure with MAKU.Travel - your trusted travel companion since 2025.',
      keywords: ['travel booking', 'flights', 'hotels', 'activities', 'vacation deals', 'travel planning'],
      canonical: baseUrl,
      ogTitle: 'MAKU.Travel - Your Gateway to Amazing Travel Experiences',
      ogDescription: 'Book flights, hotels, and activities with unbeatable prices and 24/7 support.',
      ogImage: `${baseUrl}/og-home.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      robots: 'index, follow',
      schemaOrg: {
        '@context': 'https://schema.org',
        '@type': 'TravelAgency',
        name: 'MAKU.Travel',
        url: baseUrl,
        description: 'Book flights, hotels, and activities worldwide',
        logo: `${baseUrl}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'customer service',
          areaServed: 'Worldwide'
        }
      }
    },
    flights: {
      title: 'Flight Search & Booking | Compare Cheap Flights - MAKU.Travel',
      description: 'Find and book cheap flights to destinations worldwide. Compare prices from top airlines and save on your next trip with MAKU.Travel.',
      keywords: ['cheap flights', 'flight booking', 'airline tickets', 'domestic flights', 'international flights'],
      canonical: `${baseUrl}/search/flights`,
      ogTitle: 'Book Cheap Flights | MAKU.Travel',
      ogDescription: 'Compare flight prices and book with confidence.',
      ogImage: `${baseUrl}/og-flights.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      robots: 'index, follow'
    },
    hotels: {
      title: 'Hotel Booking | Best Hotel Deals & Discounts - MAKU.Travel',
      description: 'Book hotels worldwide with exclusive deals and instant confirmation. From luxury resorts to budget accommodations.',
      keywords: ['hotel booking', 'hotel deals', 'accommodation', 'resorts', 'luxury hotels', 'budget hotels'],
      canonical: `${baseUrl}/search/hotels`,
      ogTitle: 'Book Hotels | MAKU.Travel',
      ogDescription: 'Find the perfect hotel for your next trip.',
      ogImage: `${baseUrl}/og-hotels.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      robots: 'index, follow'
    },
    activities: {
      title: 'Tours & Activities Booking | Local Experiences - MAKU.Travel',
      description: 'Book tours, activities, and experiences worldwide. Discover local attractions, skip-the-line tickets, and unique adventures.',
      keywords: ['tours', 'activities', 'experiences', 'attractions', 'tickets', 'local tours'],
      canonical: `${baseUrl}/search/activities`,
      ogTitle: 'Book Tours & Activities | MAKU.Travel',
      ogDescription: 'Discover amazing experiences at your destination.',
      ogImage: `${baseUrl}/og-activities.jpg`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
      robots: 'index, follow'
    },
    dashboard: {
      title: 'My Dashboard - MAKU.Travel',
      description: 'Manage your bookings, view travel history, and plan your next adventure.',
      canonical: `${baseUrl}/dashboard`,
      robots: 'noindex, nofollow' // Private page
    }
  };

  let config = seoConfigs[page] || seoConfigs.home;

  // Dynamic data injection for specific pages
  if (data) {
    if (page === 'hotel-details' && data.hotel) {
      config = {
        ...config,
        title: `${data.hotel.name} - Book Now | MAKU.Travel`,
        description: `Book ${data.hotel.name} in ${data.hotel.location}. ${data.hotel.description || 'Great hotel with excellent amenities.'}`,
        canonical: `${baseUrl}/hotels/${data.hotel.id}`,
        ogTitle: `${data.hotel.name} - Hotel Booking`,
        ogDescription: data.hotel.description,
        ogImage: data.hotel.image || `${baseUrl}/og-hotels.jpg`,
        schemaOrg: {
          '@context': 'https://schema.org',
          '@type': 'Hotel',
          name: data.hotel.name,
          description: data.hotel.description,
          address: data.hotel.location,
          image: data.hotel.image,
          priceRange: data.hotel.priceRange
        }
      };
    }

    if (page === 'flight-search' && data.route) {
      config = {
        ...config,
        title: `Flights from ${data.route.origin} to ${data.route.destination} - MAKU.Travel`,
        description: `Find cheap flights from ${data.route.origin} to ${data.route.destination}. Compare prices and book with MAKU.Travel.`,
        canonical: `${baseUrl}/flights/${data.route.origin}-${data.route.destination}`
      };
    }
  }

  return config;
};

export const injectSEOMetadata = (metadata: SEOMetadata) => {
  // Update document title
  document.title = metadata.title;

  // Helper function to update or create meta tags
  const updateMetaTag = (name: string, content: string, attribute: 'name' | 'property' = 'name') => {
    let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attribute, name);
      document.head.appendChild(tag);
    }
    tag.content = content;
  };

  // Basic meta tags
  updateMetaTag('description', metadata.description);
  if (metadata.keywords) {
    updateMetaTag('keywords', metadata.keywords.join(', '));
  }
  if (metadata.robots) {
    updateMetaTag('robots', metadata.robots);
  }

  // Open Graph tags
  if (metadata.ogTitle) {
    updateMetaTag('og:title', metadata.ogTitle, 'property');
  }
  if (metadata.ogDescription) {
    updateMetaTag('og:description', metadata.ogDescription, 'property');
  }
  if (metadata.ogImage) {
    updateMetaTag('og:image', metadata.ogImage, 'property');
  }
  if (metadata.ogType) {
    updateMetaTag('og:type', metadata.ogType, 'property');
  }
  updateMetaTag('og:url', window.location.href, 'property');

  // Twitter Card tags
  if (metadata.twitterCard) {
    updateMetaTag('twitter:card', metadata.twitterCard);
    updateMetaTag('twitter:title', metadata.ogTitle || metadata.title);
    updateMetaTag('twitter:description', metadata.ogDescription || metadata.description);
    if (metadata.ogImage) {
      updateMetaTag('twitter:image', metadata.ogImage);
    }
  }

  // Canonical URL
  if (metadata.canonical) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = metadata.canonical;
  }

  // Schema.org structured data
  if (metadata.schemaOrg) {
    let schemaScript = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
    if (schemaScript) {
      schemaScript.textContent = JSON.stringify(metadata.schemaOrg);
    } else {
      const newSchemaScript = document.createElement('script') as HTMLScriptElement;
      newSchemaScript.type = 'application/ld+json';
      newSchemaScript.textContent = JSON.stringify(metadata.schemaOrg);
      document.head.appendChild(newSchemaScript);
    }
  }
};

// React Hook for SEO
export const useSEO = (page: string, data?: any) => {
  useEffect(() => {
    const metadata = generateSEOMetadata(page, data);
    injectSEOMetadata(metadata);

    // Cleanup function to reset to defaults when component unmounts
    return () => {
      if (page !== 'home') {
        const homeMetadata = generateSEOMetadata('home');
        injectSEOMetadata(homeMetadata);
      }
    };
  }, [page, data]);
};

// Performance monitoring for SEO metrics
export const measureSEOPerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
      domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart || 0,
      loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart || 0,
      totalLoadTime: perfData?.loadEventEnd - perfData?.fetchStart || 0
    };
  }
  return null;
};