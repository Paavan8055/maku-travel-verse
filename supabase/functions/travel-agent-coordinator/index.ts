import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TravelRequest {
  type: 'search' | 'book' | 'modify' | 'cancel';
  service: 'flight' | 'hotel' | 'activity';
  params: Record<string, any>;
  userId?: string;
  bookingId?: string;
}

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

    const request: TravelRequest = await req.json();
    console.log('Travel agent coordinator request:', request);

    // Route to appropriate specialized agent
    const result = await routeToSpecializedAgent(supabaseClient, request);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Travel coordinator error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function routeToSpecializedAgent(supabase: any, request: TravelRequest) {
  const { type, service, params, userId, bookingId } = request;
  
  // Create coordination task
  const coordinationId = `coord_${Date.now()}`;
  
  await supabase
    .from('agent_tasks_consolidated')
    .insert({
      agent_id: coordinationId,
      task_type: 'travel_coordination',
      params: {
        request_type: type,
        service,
        coordination_id: coordinationId,
        started_at: new Date().toISOString(),
        ...params
      },
      user_id: userId,
      status: 'active',
      priority: 1
    });

  switch (service) {
    case 'flight':
      return await coordinateFlightService(supabase, coordinationId, type, params, userId);
      
    case 'hotel':
      return await coordinateHotelService(supabase, coordinationId, type, params, userId);
      
    case 'activity':
      return await coordinateActivityService(supabase, coordinationId, type, params, userId);
      
    default:
      throw new Error(`Unsupported service: ${service}`);
  }
}

async function coordinateFlightService(supabase: any, coordinationId: string, type: string, params: any, userId?: string) {
  console.log(`Coordinating flight ${type} request`);

  if (type === 'search') {
    // Multi-provider flight search coordination
    const providers = ['amadeus', 'sabre'];
    const searchTasks = [];

    for (const provider of providers) {
      const taskId = `flight_search_${provider}_${Date.now()}`;
      
      const task = supabase
        .from('agent_tasks_consolidated')
        .insert({
          agent_id: taskId,
          task_type: 'flight_search',
          params: {
            provider,
            origin: params.origin,
            destination: params.destination,
            departure_date: params.departureDate,
            return_date: params.returnDate,
            passengers: params.passengers,
            cabin_class: params.cabinClass,
            coordination_id: coordinationId
          },
          user_id: userId,
          status: 'pending',
          priority: 2
        });

      searchTasks.push(task);
    }

    await Promise.all(searchTasks);

    // Simulate search results aggregation
    return {
      success: true,
      coordinationId,
      type: 'flight_search',
      status: 'coordinating',
      providers: providers.length,
      estimated_completion: new Date(Date.now() + 10000).toISOString()
    };
  }

  if (type === 'book') {
    // Flight booking coordination
    const bookingAgent = `flight_booking_${Date.now()}`;
    
    await supabase
      .from('agent_tasks_consolidated')
      .insert({
        agent_id: bookingAgent,
        task_type: 'flight_booking',
        params: {
          flight_offer: params.offer,
          passengers: params.passengers,
          payment_info: params.payment,
          coordination_id: coordinationId
        },
        user_id: userId,
        status: 'pending',
        priority: 1
      });

    return {
      success: true,
      coordinationId,
      type: 'flight_booking',
      bookingAgent,
      status: 'processing'
    };
  }

  return { success: false, error: `Unsupported flight operation: ${type}` };
}

async function coordinateHotelService(supabase: any, coordinationId: string, type: string, params: any, userId?: string) {
  console.log(`Coordinating hotel ${type} request`);

  if (type === 'search') {
    // Multi-provider hotel search
    const providers = ['hotelbeds', 'amadeus'];
    const searchTasks = [];

    for (const provider of providers) {
      const taskId = `hotel_search_${provider}_${Date.now()}`;
      
      const task = supabase
        .from('agent_tasks_consolidated')
        .insert({
          agent_id: taskId,
          task_type: 'hotel_search',
          params: {
            provider,
            destination: params.destination,
            check_in: params.checkIn,
            check_out: params.checkOut,
            adults: params.adults,
            children: params.children,
            rooms: params.rooms,
            coordination_id: coordinationId
          },
          user_id: userId,
          status: 'pending',
          priority: 2
        });

      searchTasks.push(task);
    }

    await Promise.all(searchTasks);

    return {
      success: true,
      coordinationId,
      type: 'hotel_search',
      status: 'coordinating',
      providers: providers.length
    };
  }

  if (type === 'book') {
    const bookingAgent = `hotel_booking_${Date.now()}`;
    
    await supabase
      .from('agent_tasks_consolidated')
      .insert({
        agent_id: bookingAgent,
        task_type: 'hotel_booking',
        params: {
          hotel_offer: params.offer,
          guest_info: params.guests,
          payment_info: params.payment,
          coordination_id: coordinationId
        },
        user_id: userId,
        status: 'pending',
        priority: 1
      });

    return {
      success: true,
      coordinationId,
      type: 'hotel_booking',
      bookingAgent,
      status: 'processing'
    };
  }

  return { success: false, error: `Unsupported hotel operation: ${type}` };
}

async function coordinateActivityService(supabase: any, coordinationId: string, type: string, params: any, userId?: string) {
  console.log(`Coordinating activity ${type} request`);

  if (type === 'search') {
    const taskId = `activity_search_${Date.now()}`;
    
    await supabase
      .from('agent_tasks_consolidated')
      .insert({
        agent_id: taskId,
        task_type: 'activity_search',
        params: {
          destination: params.destination,
          date_from: params.dateFrom,
          date_to: params.dateTo,
          adults: params.adults,
          children: params.children,
          coordination_id: coordinationId
        },
        user_id: userId,
        status: 'pending',
        priority: 2
      });

    return {
      success: true,
      coordinationId,
      type: 'activity_search',
      status: 'coordinating'
    };
  }

  if (type === 'book') {
    const bookingAgent = `activity_booking_${Date.now()}`;
    
    await supabase
      .from('agent_tasks_consolidated')
      .insert({
        agent_id: bookingAgent,
        task_type: 'activity_booking',
        params: {
          activity_offer: params.offer,
          participant_info: params.participants,
          payment_info: params.payment,
          coordination_id: coordinationId
        },
        user_id: userId,
        status: 'pending',
        priority: 1
      });

    return {
      success: true,
      coordinationId,
      type: 'activity_booking',
      bookingAgent,
      status: 'processing'
    };
  }

  return { success: false, error: `Unsupported activity operation: ${type}` };
}