// Viator Product Sync Service - Background job to keep product data fresh
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import logger from "../_shared/logger.ts";
import { enhancedViatorClient, VIATOR_CATEGORIES } from "../_shared/enhanced-viator.ts";

interface SyncRequest {
  destinations?: string[];
  categories?: string[];
  forceSync?: boolean;
  maxProducts?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const requestBody: SyncRequest = await req.json().catch(() => ({}));
    const { 
      destinations = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
      categories = Object.keys(VIATOR_CATEGORIES),
      forceSync = false,
      maxProducts = 100
    } = requestBody;

    logger.info('[VIATOR-SYNC] Starting product sync', { 
      destinations, 
      categories, 
      forceSync, 
      maxProducts 
    });

    if (!enhancedViatorClient.validateCredentials()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Viator API not configured'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      });
    }

    const syncResults = {
      totalProcessed: 0,
      newProducts: 0,
      updatedProducts: 0,
      errors: [],
      syncedDestinations: [],
      startTime: new Date().toISOString()
    };

    // Sync products for each destination and category combination
    for (const destination of destinations) {
      for (const category of categories) {
        try {
          const categoryId = VIATOR_CATEGORIES[category as keyof typeof VIATOR_CATEGORIES];
          
          // Check if we need to sync (skip if recent data exists and not forcing)
          if (!forceSync) {
            const { data: existingData } = await supabase
              .from('viator_search_cache')
              .select('*')
              .eq('destination', destination)
              .eq('category_id', categoryId)
              .gt('cached_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
              .single();

            if (existingData) {
              logger.info('[VIATOR-SYNC] Skipping recent data', { destination, category });
              continue;
            }
          }

          // Search for products
          const searchParams = {
            destination,
            categoryId,
            sortBy: 'REVIEW_AVG_RATING_D' as const,
            currencyCode: 'AUD',
            count: Math.min(maxProducts, 50), // Viator API limit
            startFrom: 0
          };

          const viatorResult = await enhancedViatorClient.searchViatorProducts(searchParams);
          
          if (viatorResult.products && viatorResult.products.length > 0) {
            // Check which products are new vs existing
            const productCodes = viatorResult.products.map(p => p.productCode);
            const { data: existingProducts } = await supabase
              .from('viator_activities')
              .select('product_code')
              .in('product_code', productCodes);

            const existingCodes = new Set(existingProducts?.map(p => p.product_code) || []);
            const newProductCount = viatorResult.products.filter(p => !existingCodes.has(p.productCode)).length;
            const updatedProductCount = viatorResult.products.filter(p => existingCodes.has(p.productCode)).length;

            syncResults.totalProcessed += viatorResult.products.length;
            syncResults.newProducts += newProductCount;
            syncResults.updatedProducts += updatedProductCount;

            logger.info('[VIATOR-SYNC] Synced products', { 
              destination, 
              category,
              total: viatorResult.products.length,
              new: newProductCount,
              updated: updatedProductCount
            });
          }

          // Rate limiting - small delay between requests
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          const errorMsg = `Failed to sync ${destination}/${category}: ${error.message}`;
          syncResults.errors.push(errorMsg);
          logger.error('[VIATOR-SYNC] Sync error', { destination, category, error: error.message });
        }
      }

      syncResults.syncedDestinations.push(destination);
    }

    // Clean up expired cache entries
    await supabase.rpc('cleanup_viator_cache');

    // Log sync completion
    const syncSummary = {
      ...syncResults,
      endTime: new Date().toISOString(),
      duration: Date.now() - new Date(syncResults.startTime).getTime(),
      systemStatus: enhancedViatorClient.getStatus()
    };

    logger.info('[VIATOR-SYNC] Sync completed', syncSummary);

    return new Response(JSON.stringify({
      success: true,
      results: syncSummary
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logger.error('[VIATOR-SYNC] Sync failed', { error: error.message, stack: error.stack });
    
    return new Response(JSON.stringify({
      success: false,
      error: `Viator sync failed: ${error.message}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
