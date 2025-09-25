import { useEffect } from 'react';

interface StructuredDataProps {
  type: 'Organization' | 'Website' | 'TravelAgency' | 'Product' | 'LocalBusiness' | 'Article';
  data: Record<string, any>;
}

export const StructuredData = ({ type, data }: StructuredDataProps) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': type,
      ...data
    };
    
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, [type, data]);
  
  return null;
};

// Predefined structured data templates
export const OrganizationStructuredData = () => (
  <StructuredData
    type="TravelAgency"
    data={{
      name: "TravelHub",
      description: "Premium travel booking platform offering flights, hotels, and activities worldwide",
      url: "https://travelhub.travel",
      logo: "https://travelhub.travel/logo.png",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+61-XXX-XXX-XXX",
        contactType: "customer service",
        availableLanguage: ["English"]
      },
      sameAs: [
        "https://facebook.com/maku.travel",
        "https://twitter.com/maku_travel",
        "https://instagram.com/maku.travel"
      ],
      address: {
        "@type": "PostalAddress",
        addressCountry: "AU"
      }
    }}
  />
);

export const WebsiteStructuredData = () => (
  <StructuredData
    type="Website"
    data={{
      name: "TravelHub",
      url: "https://travelhub.travel",
      description: "Book flights, hotels, and activities with confidence. Premium travel experiences at competitive prices.",
      publisher: {
        "@type": "Organization",
        name: "TravelHub"
      },
      potentialAction: {
        "@type": "SearchAction",
        target: "https://travelhub.travel/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }}
  />
);

export const ProductStructuredData = ({ product }: { product: any }) => (
  <StructuredData
    type="Product"
    data={{
      name: product.name,
      description: product.description,
      image: product.image,
      brand: {
        "@type": "Brand",
        name: product.brand || "TravelHub"
      },
      offers: {
        "@type": "Offer",
        price: product.price?.amount,
        priceCurrency: product.price?.currency || "AUD",
        availability: "https://schema.org/InStock",
        seller: {
          "@type": "Organization",
          name: "MAKU.Travel"
        }
      },
      aggregateRating: product.rating && {
        "@type": "AggregateRating",
        ratingValue: product.rating.score,
        reviewCount: product.rating.reviews
      }
    }}
  />
);