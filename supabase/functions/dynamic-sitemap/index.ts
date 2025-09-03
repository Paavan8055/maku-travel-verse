import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import logger from "../_shared/logger.ts";


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const baseUrl = 'https://maku.travel';
    const now = new Date().toISOString();

    // Generate sitemap XML
    const sitemap = await generateSitemap(supabase, baseUrl, now);

    return new Response(sitemap, {
      headers: corsHeaders,
      status: 200
    });

  } catch (error) {
    logger.error('[SITEMAP] Generation failed:', error);
    
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://maku.travel</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`, {
      headers: corsHeaders,
      status: 200
    });
  }
});

async function generateSitemap(supabase: any, baseUrl: string, now: string): Promise<string> {
  const urls = [];

  // Static pages
  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' },
    { url: '/search', priority: '0.9', changefreq: 'daily' },
    { url: '/hotels', priority: '0.9', changefreq: 'daily' },
    { url: '/flights', priority: '0.9', changefreq: 'daily' },
    { url: '/activities', priority: '0.9', changefreq: 'daily' },
    { url: '/gift-cards', priority: '0.8', changefreq: 'weekly' },
    { url: '/partners', priority: '0.7', changefreq: 'weekly' },
    { url: '/roadmap', priority: '0.6', changefreq: 'monthly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/contact', priority: '0.7', changefreq: 'monthly' },
    { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
    { url: '/terms', priority: '0.5', changefreq: 'yearly' }
  ];

  // Add static pages
  staticPages.forEach(page => {
    urls.push({
      loc: `${baseUrl}${page.url}`,
      lastmod: now,
      changefreq: page.changefreq,
      priority: page.priority
    });
  });

  // Add destination content pages
  try {
    const { data: destinations } = await supabase
      .from('destination_content')
      .select('destination_id, destination_name, updated_at')
      .eq('content_status', 'published')
      .limit(1000);

    if (destinations) {
      destinations.forEach((dest: any) => {
        urls.push({
          loc: `${baseUrl}/destinations/${dest.destination_id}`,
          lastmod: dest.updated_at || now,
          changefreq: 'weekly',
          priority: '0.8'
        });
      });
    }
  } catch (error) {
    logger.warn('[SITEMAP] Failed to load destinations:', error);
  }

  // Add dream destinations
  try {
    const { data: dreamDestinations } = await supabase
      .from('dream_destinations')
      .select('id, name, created_at')
      .limit(500);

    if (dreamDestinations) {
      dreamDestinations.forEach((dest: any) => {
        urls.push({
          loc: `${baseUrl}/dream-destinations/${dest.id}`,
          lastmod: dest.created_at || now,
          changefreq: 'monthly',
          priority: '0.6'
        });
      });
    }
  } catch (error) {
    logger.warn('[SITEMAP] Failed to load dream destinations:', error);
  }

  // Generate XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  urls.forEach(url => {
    xml += `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`;
  });

  xml += `
</urlset>`;

  return xml;
}