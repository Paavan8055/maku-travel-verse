import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

/**
 * Mem0 Webhook Handler
 * 
 * Handles webhook events from Mem0 for memory management:
 * - Add: New memory created
 * - Update: Existing memory updated  
 * - Delete: Memory deleted
 * 
 * Integrates with Maku.Travel user analytics and travel preferences
 */

interface Mem0WebhookEvent {
  event: 'memory.add' | 'memory.update' | 'memory.delete';
  data: {
    id: string;
    user_id: string;
    memory: string;
    metadata?: any;
    created_at?: string;
    updated_at?: string;
  };
  timestamp: string;
  signature?: string;
}

interface MemoryRecord {
  id?: string;
  mem0_id: string;
  user_id: string;
  memory_content: string;
  memory_type: string;
  metadata: any;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests for webhooks
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only POST method allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse webhook payload
    const webhookEvent: Mem0WebhookEvent = await req.json();
    
    console.log(`[MEM0-WEBHOOK] Received event: ${webhookEvent.event} for user: ${webhookEvent.data.user_id}`);

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('X-Mem0-Signature');
    const webhookSecret = Deno.env.get('MEM0_WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      // Verify webhook signature for security
      const isValid = await verifyMem0Signature(
        JSON.stringify(webhookEvent), 
        signature, 
        webhookSecret
      );
      
      if (!isValid) {
        console.error('[MEM0-WEBHOOK] Invalid signature');
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid webhook signature'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Process the webhook event
    const result = await processMemoryEvent(supabase, webhookEvent);

    if (result.success) {
      // Track analytics event
      await trackMemoryEvent(supabase, webhookEvent);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Memory ${webhookEvent.event} processed successfully`,
        processed_at: new Date().toISOString(),
        memory_id: result.memory_id
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        error: result.error,
        event: webhookEvent.event
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('[MEM0-WEBHOOK] Error processing webhook:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      message: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function verifyMem0Signature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    console.error('[MEM0-WEBHOOK] Signature verification error:', error);
    return false;
  }
}

async function processMemoryEvent(supabase: any, event: Mem0WebhookEvent): Promise<{ success: boolean; error?: string; memory_id?: string }> {
  try {
    const { event: eventType, data } = event;

    // Determine memory type from content analysis
    const memoryType = categorizeMemory(data.memory);
    
    // Prepare memory record
    const memoryRecord: MemoryRecord = {
      mem0_id: data.id,
      user_id: data.user_id,
      memory_content: data.memory,
      memory_type: memoryType,
      metadata: {
        ...data.metadata,
        mem0_created_at: data.created_at,
        mem0_updated_at: data.updated_at,
        webhook_processed_at: new Date().toISOString()
      },
      is_active: eventType !== 'memory.delete'
    };

    switch (eventType) {
      case 'memory.add':
        console.log(`[MEM0-WEBHOOK] Adding new memory for user: ${data.user_id}`);
        
        const { data: insertedMemory, error: insertError } = await supabase
          .from('user_memories')
          .insert(memoryRecord)
          .select()
          .single();

        if (insertError) {
          console.error('[MEM0-WEBHOOK] Insert error:', insertError);
          return { success: false, error: insertError.message };
        }

        // Update user preferences based on memory content
        await updateUserPreferences(supabase, data.user_id, data.memory, memoryType);

        return { success: true, memory_id: insertedMemory.id };

      case 'memory.update':
        console.log(`[MEM0-WEBHOOK] Updating memory: ${data.id}`);
        
        const { data: updatedMemory, error: updateError } = await supabase
          .from('user_memories')
          .update({
            memory_content: memoryRecord.memory_content,
            memory_type: memoryRecord.memory_type,
            metadata: memoryRecord.metadata,
            updated_at: new Date().toISOString()
          })
          .eq('mem0_id', data.id)
          .select()
          .single();

        if (updateError) {
          console.error('[MEM0-WEBHOOK] Update error:', updateError);
          return { success: false, error: updateError.message };
        }

        // Update user preferences
        await updateUserPreferences(supabase, data.user_id, data.memory, memoryType);

        return { success: true, memory_id: updatedMemory.id };

      case 'memory.delete':
        console.log(`[MEM0-WEBHOOK] Deleting memory: ${data.id}`);
        
        const { error: deleteError } = await supabase
          .from('user_memories')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('mem0_id', data.id);

        if (deleteError) {
          console.error('[MEM0-WEBHOOK] Delete error:', deleteError);
          return { success: false, error: deleteError.message };
        }

        return { success: true, memory_id: data.id };

      default:
        return { success: false, error: `Unsupported event type: ${eventType}` };
    }

  } catch (error) {
    console.error('[MEM0-WEBHOOK] Processing error:', error);
    return { success: false, error: error.message };
  }
}

function categorizeMemory(memoryContent: string): string {
  const content = memoryContent.toLowerCase();
  
  // Travel preference categorization
  if (content.includes('hotel') || content.includes('accommodation')) {
    return 'hotel_preference';
  } else if (content.includes('flight') || content.includes('airline')) {
    return 'flight_preference';
  } else if (content.includes('activity') || content.includes('tour') || content.includes('experience')) {
    return 'activity_preference';
  } else if (content.includes('destination') || content.includes('travel to')) {
    return 'destination_interest';
  } else if (content.includes('budget') || content.includes('price') || content.includes('cost')) {
    return 'budget_preference';
  } else if (content.includes('date') || content.includes('time') || content.includes('schedule')) {
    return 'timing_preference';
  } else {
    return 'general_travel_memory';
  }
}

async function updateUserPreferences(supabase: any, userId: string, memoryContent: string, memoryType: string) {
  try {
    // Extract preferences from memory content
    const preferences = extractTravelPreferences(memoryContent, memoryType);
    
    if (Object.keys(preferences).length > 0) {
      // Upsert user preferences
      const { error } = await supabase
        .from('user_travel_preferences')
        .upsert({
          user_id: userId,
          preferences: preferences,
          last_memory_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('[MEM0-WEBHOOK] Preference update error:', error);
      } else {
        console.log(`[MEM0-WEBHOOK] Updated preferences for user: ${userId}`);
      }
    }
  } catch (error) {
    console.error('[MEM0-WEBHOOK] Preference extraction error:', error);
  }
}

function extractTravelPreferences(content: string, type: string): any {
  const preferences: any = {};
  const contentLower = content.toLowerCase();

  // Extract specific preferences based on memory type
  switch (type) {
    case 'hotel_preference':
      if (contentLower.includes('luxury') || contentLower.includes('5 star')) {
        preferences.hotel_category = 'luxury';
      } else if (contentLower.includes('budget') || contentLower.includes('cheap')) {
        preferences.hotel_category = 'budget';
      } else if (contentLower.includes('boutique')) {
        preferences.hotel_category = 'boutique';
      }
      
      // Extract amenity preferences
      if (contentLower.includes('pool')) preferences.hotel_amenities = [...(preferences.hotel_amenities || []), 'pool'];
      if (contentLower.includes('gym')) preferences.hotel_amenities = [...(preferences.hotel_amenities || []), 'gym'];
      if (contentLower.includes('spa')) preferences.hotel_amenities = [...(preferences.hotel_amenities || []), 'spa'];
      break;

    case 'flight_preference':
      if (contentLower.includes('business class')) {
        preferences.cabin_class = 'business';
      } else if (contentLower.includes('first class')) {
        preferences.cabin_class = 'first';
      } else if (contentLower.includes('economy')) {
        preferences.cabin_class = 'economy';
      }
      
      if (contentLower.includes('direct') || contentLower.includes('non-stop')) {
        preferences.flight_type = 'direct';
      }
      break;

    case 'destination_interest':
      // Extract mentioned destinations
      const destinations = extractDestinations(content);
      if (destinations.length > 0) {
        preferences.interested_destinations = destinations;
      }
      break;

    case 'budget_preference':
      // Extract budget ranges
      const budgetMatch = content.match(/\$(\d+)/);
      if (budgetMatch) {
        preferences.budget_range = parseInt(budgetMatch[1]);
      }
      break;
  }

  return preferences;
}

function extractDestinations(content: string): string[] {
  // Simple destination extraction (could be enhanced with NLP)
  const commonDestinations = [
    'tokyo', 'paris', 'london', 'new york', 'los angeles', 'dubai', 'singapore',
    'hong kong', 'sydney', 'rome', 'barcelona', 'amsterdam', 'berlin', 'madrid'
  ];
  
  const contentLower = content.toLowerCase();
  return commonDestinations.filter(dest => contentLower.includes(dest));
}

async function trackMemoryEvent(supabase: any, event: Mem0WebhookEvent) {
  try {
    // Track the memory event in analytics
    await supabase
      .from('events')
      .insert({
        event_type: `mem0_${event.event.split('.')[1]}`, // memory_add, memory_update, memory_delete
        event_category: 'memory_management',
        user_id: event.data.user_id,
        event_data: {
          mem0_id: event.data.id,
          memory_content: event.data.memory,
          memory_type: categorizeMemory(event.data.memory)
        },
        properties: {
          webhook_timestamp: event.timestamp,
          content_length: event.data.memory.length
        },
        context: {
          source: 'mem0_webhook',
          event_type: event.event
        }
      });

    console.log(`[MEM0-WEBHOOK] Analytics event tracked for ${event.event}`);
  } catch (error) {
    console.error('[MEM0-WEBHOOK] Analytics tracking error:', error);
  }
}