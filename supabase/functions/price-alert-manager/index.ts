import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const { action, alertId, userId, alertData } = await req.json();
    console.log('Price alert request:', { action, userId });

    switch (action) {
      case 'create':
        return await createAlert(supabaseClient, userId, alertData);
      case 'update':
        return await updateAlert(supabaseClient, alertId, alertData);
      case 'delete':
        return await deleteAlert(supabaseClient, alertId);
      case 'check':
        return await checkAlerts(supabaseClient, alertId);
      case 'list':
        return await listAlerts(supabaseClient, userId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Price alert error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        meta: { timestamp: new Date().toISOString() }
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function createAlert(supabase: any, userId: string, alertData: any) {
  const {
    serviceType,
    searchParams,
    targetPrice,
    currency = 'USD',
    email,
    alertName,
    expiresAt
  } = alertData;

  if (!serviceType || !searchParams || !targetPrice || !email) {
    throw new Error('Missing required alert data');
  }

  const { data: alert, error } = await supabase
    .from('price_alerts')
    .insert({
      user_id: userId,
      service_type: serviceType,
      search_params: searchParams,
      target_price: targetPrice,
      currency,
      email,
      alert_name: alertName || `${serviceType} price alert`,
      status: 'active',
      expires_at: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create price alert');
  }

  const currentPrice = await getCurrentPrice(serviceType, searchParams);
  
  if (currentPrice && currentPrice <= targetPrice) {
    await triggerAlert(supabase, alert.id, currentPrice);
  }

  return new Response(
    JSON.stringify({
      success: true,
      alert: {
        id: alert.id,
        serviceType,
        targetPrice,
        currentPrice,
        status: alert.status
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateAlert(supabase: any, alertId: string, alertData: any) {
  const updateFields: any = { updated_at: new Date().toISOString() };
  
  if (alertData.targetPrice) updateFields.target_price = alertData.targetPrice;
  if (alertData.email) updateFields.email = alertData.email;
  if (alertData.alertName) updateFields.alert_name = alertData.alertName;

  const { data: alert, error } = await supabase
    .from('price_alerts')
    .update(updateFields)
    .eq('id', alertId)
    .select()
    .single();

  if (error) {
    throw new Error('Failed to update price alert');
  }

  return new Response(
    JSON.stringify({
      success: true,
      alert: {
        id: alert.id,
        targetPrice: alert.target_price,
        status: alert.status
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteAlert(supabase: any, alertId: string) {
  const { error } = await supabase
    .from('price_alerts')
    .update({ 
      status: 'deleted',
      deleted_at: new Date().toISOString() 
    })
    .eq('id', alertId);

  if (error) {
    throw new Error('Failed to delete price alert');
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Price alert deleted'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function checkAlerts(supabase: any, specificAlertId?: string) {
  let query = supabase
    .from('price_alerts')
    .select('*')
    .eq('status', 'active');

  if (specificAlertId) {
    query = query.eq('id', specificAlertId);
  }

  const { data: alerts, error } = await query;

  if (error) {
    throw new Error('Failed to fetch alerts');
  }

  const results = [];

  for (const alert of alerts) {
    const currentPrice = await getCurrentPrice(alert.service_type, alert.search_params);
    
    await supabase
      .from('price_alerts')
      .update({ 
        last_checked: new Date().toISOString(),
        last_price: currentPrice 
      })
      .eq('id', alert.id);

    if (currentPrice && currentPrice <= alert.target_price) {
      await triggerAlert(supabase, alert.id, currentPrice);
      results.push({
        alertId: alert.id,
        triggered: true,
        currentPrice,
        targetPrice: alert.target_price
      });
    } else {
      results.push({
        alertId: alert.id,
        triggered: false,
        currentPrice,
        targetPrice: alert.target_price
      });
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      checkedAlerts: results.length,
      results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listAlerts(supabase: any, userId: string) {
  const { data: alerts, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'deleted')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch user alerts');
  }

  return new Response(
    JSON.stringify({
      success: true,
      count: alerts.length,
      alerts: alerts.map((alert: any) => ({
        id: alert.id,
        serviceType: alert.service_type,
        alertName: alert.alert_name,
        targetPrice: alert.target_price,
        status: alert.status,
        lastPrice: alert.last_price,
        createdAt: alert.created_at
      }))
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getCurrentPrice(serviceType: string, searchParams: any): Promise<number | null> {
  // Mock price generation for demo
  const mockPrices = {
    flight: Math.floor(Math.random() * 800) + 200,
    hotel: Math.floor(Math.random() * 300) + 100,
    activity: Math.floor(Math.random() * 150) + 25
  };

  return mockPrices[serviceType as keyof typeof mockPrices] || null;
}

async function triggerAlert(supabase: any, alertId: string, currentPrice: number) {
  await supabase
    .from('price_alerts')
    .update({ 
      status: 'triggered',
      triggered_at: new Date().toISOString(),
      triggered_price: currentPrice
    })
    .eq('id', alertId);

  console.log(`Price alert triggered: ${alertId} at ${currentPrice}`);
}