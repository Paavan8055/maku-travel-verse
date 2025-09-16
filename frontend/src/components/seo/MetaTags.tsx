import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  canonical?: string;
}

export const MetaTags = ({
  title,
  description,
  keywords = [],
  image = '/og-image.jpg',
  url = 'https://maku.travel',
  type = 'website',
  noIndex = false,
  canonical
}: MetaTagsProps) => {
  const fullTitle = title.includes('MAKU.Travel') ? title : `${title} | MAKU.Travel`;
  const fullImage = image.startsWith('http') ? image : `https://maku.travel${image}`;
  const keywordsString = keywords.length > 0 ? keywords.join(', ') : 'travel, flights, hotels, activities, booking, vacation, holiday';

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywordsString} />
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="MAKU.Travel" />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@maku_travel" />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="MAKU.Travel" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="en" />
      
      {/* Favicon */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    </Helmet>
  );
};

// Predefined meta tag sets for common pages
export const HomeMetaTags = () => (
  <MetaTags
    title="MAKU.Travel - Premium Travel Booking Platform"
    description="Book flights, hotels, and activities worldwide with MAKU.Travel. Premium experiences, competitive prices, and exceptional service. Start your journey today!"
    keywords={['travel booking', 'flights', 'hotels', 'activities', 'vacation', 'holiday', 'premium travel', 'Australia']}
    url="https://maku.travel"
  />
);

export const SearchMetaTags = ({ searchType, destination }: { searchType?: string; destination?: string }) => {
  const titles = {
    flights: `Find ${destination ? `Flights to ${destination}` : 'Cheap Flights'} - MAKU.Travel`,
    hotels: `${destination ? `Hotels in ${destination}` : 'Hotel Deals'} - Book Now | MAKU.Travel`,
    activities: `${destination ? `Things to Do in ${destination}` : 'Travel Activities'} - MAKU.Travel`
  };

  const descriptions = {
    flights: `Compare and book ${destination ? `flights to ${destination}` : 'flights worldwide'} with MAKU.Travel. Best prices guaranteed on premium airlines.`,
    hotels: `Discover ${destination ? `hotels in ${destination}` : 'amazing hotels worldwide'}. From luxury resorts to boutique accommodations. Book with confidence.`,
    activities: `Explore ${destination ? `top activities in ${destination}` : 'exciting activities worldwide'}. Tours, attractions, and experiences. Book online today.`
  };

  const type = searchType as keyof typeof titles || 'flights';
  
  return (
    <MetaTags
      title={titles[type]}
      description={descriptions[type]}
      keywords={[`${type}`, destination || '', 'booking', 'travel', 'deals', 'best price'].filter(Boolean)}
    />
  );
};

export const DestinationMetaTags = ({ destination }: { destination: any }) => (
  <MetaTags
    title={`${destination.name} Travel Guide - Flights, Hotels & Activities | MAKU.Travel`}
    description={`Plan your trip to ${destination.name}. Find flights, hotels, and activities. ${destination.description?.slice(0, 100)}...`}
    keywords={[destination.name, destination.country, 'travel guide', 'flights', 'hotels', 'activities', 'tourism']}
    image={destination.images?.[0]?.url}
    url={`https://maku.travel/destinations/${destination.id}`}
  />
);