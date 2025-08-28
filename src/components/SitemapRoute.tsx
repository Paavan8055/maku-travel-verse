import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SitemapRoute: React.FC = () => {
  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('dynamic-sitemap');
        
        if (error) {
          console.error('Failed to fetch sitemap:', error);
          return;
        }
        
        // Set response headers
        const response = new Response(data, {
          headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600'
          }
        });
        
        // Replace current page content with sitemap XML
        document.open();
        document.write(data);
        document.close();
        
      } catch (error) {
        console.error('Error generating sitemap:', error);
        
        // Fallback sitemap
        const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://maku.travel</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://maku.travel/search</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;
        
        document.open();
        document.write(fallbackSitemap);
        document.close();
      }
    };
    
    fetchSitemap();
  }, []);

  return null;
};

export default SitemapRoute;