import React from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { MetaTags } from '@/components/seo/MetaTags';
import { StructuredData, OrganizationStructuredData, WebsiteStructuredData } from '@/components/seo/StructuredData';

interface SEOWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  canonical?: string;
  structuredData?: any;
  productData?: any;
}

export const SEOWrapper: React.FC<SEOWrapperProps> = ({
  children,
  title = "MAKU.Travel - Premium Travel Booking Platform",
  description = "Book flights, hotels, and activities worldwide with MAKU.Travel. Premium experiences, competitive prices, and exceptional service.",
  keywords = ['travel booking', 'flights', 'hotels', 'activities', 'vacation', 'holiday', 'premium travel'],
  image,
  url,
  type,
  noIndex,
  canonical,
  structuredData,
  productData
}) => {
  const { trackPageView } = useAnalytics();

  React.useEffect(() => {
    // Track page view
    trackPageView(title, {
      url: window.location.href,
      path: window.location.pathname
    });
  }, [title, trackPageView]);

  return (
    <>
      {/* Meta Tags */}
      <MetaTags
        title={title}
        description={description}
        keywords={keywords}
        image={image}
        url={url}
        type={type}
        noIndex={noIndex}
        canonical={canonical}
      />

      {/* Structured Data */}
      <OrganizationStructuredData />
      <WebsiteStructuredData />
      
      {/* Custom Structured Data */}
      {structuredData && (
        <StructuredData type={structuredData.type} data={structuredData.data} />
      )}
      
      {/* Product Structured Data */}
      {productData && (
        <StructuredData type="Product" data={productData} />
      )}

      {/* Page Content */}
      {children}
    </>
  );
};

export default SEOWrapper;