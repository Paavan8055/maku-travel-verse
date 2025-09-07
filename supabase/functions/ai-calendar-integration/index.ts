import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, eventData, preferences } = await req.json();
    console.log('AI Calendar Integration:', { action, userId });

    switch (action) {
      case 'schedule_meeting':
        return await scheduleMeeting(userId, eventData);
      case 'resolve_conflict':
        return await resolveConflict(userId, eventData);
      case 'sync_travel_booking':
        return await syncTravelBooking(userId, eventData);
      case 'optimize_schedule':
        return await optimizeSchedule(userId, preferences);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Error in ai-calendar-integration:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function scheduleMeeting(userId: string, eventData: any) {
  console.log('Scheduling meeting for user:', userId);

  // AI-powered meeting scheduling with conflict detection
  const { data: existingEvents } = await supabase
    .from('ai_workplace_calendar')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', eventData.start_time)
    .lte('end_time', eventData.end_time);

  const conflicts = (existingEvents || []).filter(event => 
    new Date(event.start_time) < new Date(eventData.end_time) &&
    new Date(event.end_time) > new Date(eventData.start_time)
  );

  let aiSuggestions = {};
  if (conflicts.length > 0) {
    aiSuggestions = {
      conflicts: conflicts.length,
      suggested_times: generateAlternativeTimes(eventData, conflicts),
      priority_recommendation: 'high'
    };
  }

  const { data: newEvent, error } = await supabase
    .from('ai_workplace_calendar')
    .insert({
      user_id: userId,
      event_title: eventData.title,
      event_description: eventData.description,
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      timezone: eventData.timezone || 'UTC',
      event_type: eventData.type || 'meeting',
      ai_suggestions: aiSuggestions,
      attendees: eventData.attendees || [],
      location: eventData.location,
      is_ai_generated: eventData.is_ai_generated || false
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    event: newEvent,
    conflicts: conflicts.length,
    ai_suggestions: aiSuggestions
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function resolveConflict(userId: string, conflictData: any) {
  console.log('Resolving calendar conflict for user:', userId);

  const { eventId, resolution } = conflictData;

  // Update event with AI-powered conflict resolution
  const { data: updatedEvent, error } = await supabase
    .from('ai_workplace_calendar')
    .update({
      conflict_resolution: {
        resolved: true,
        resolution_type: resolution.type,
        new_time: resolution.new_time,
        resolved_at: new Date().toISOString(),
        ai_confidence: 0.95
      }
    })
    .eq('id', eventId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    event: updatedEvent,
    resolution: 'Conflict resolved automatically'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function syncTravelBooking(userId: string, bookingData: any) {
  console.log('Syncing travel booking with calendar:', userId);

  const travelEvents = [];

  // Create calendar events for flights
  if (bookingData.flights) {
    for (const flight of bookingData.flights) {
      travelEvents.push({
        user_id: userId,
        event_title: `Flight: ${flight.origin} → ${flight.destination}`,
        event_description: `Flight ${flight.flight_number} - ${flight.airline}`,
        start_time: flight.departure,
        end_time: flight.arrival,
        event_type: 'travel',
        travel_integration: {
          type: 'flight',
          booking_id: bookingData.booking_id,
          confirmation: flight.confirmation,
          gate: flight.gate,
          seat: flight.seat
        },
        location: `${flight.origin} Airport`,
        is_ai_generated: true
      });
    }
  }

  // Create calendar events for hotels
  if (bookingData.hotels) {
    for (const hotel of bookingData.hotels) {
      travelEvents.push({
        user_id: userId,
        event_title: `Hotel: ${hotel.name}`,
        event_description: `Check-in: ${hotel.checkin} | Check-out: ${hotel.checkout}`,
        start_time: hotel.checkin,
        end_time: hotel.checkout,
        event_type: 'accommodation',
        travel_integration: {
          type: 'hotel',
          booking_id: bookingData.booking_id,
          confirmation: hotel.confirmation,
          room_type: hotel.room_type
        },
        location: hotel.address,
        is_ai_generated: true
      });
    }
  }

  if (travelEvents.length > 0) {
    const { data: insertedEvents, error } = await supabase
      .from('ai_workplace_calendar')
      .insert(travelEvents)
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({
      success: true,
      events_created: insertedEvents.length,
      events: insertedEvents
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    success: true,
    events_created: 0,
    message: 'No travel events to sync'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

async function optimizeSchedule(userId: string, preferences: any) {
  console.log('Optimizing schedule for user:', userId);

  // Get all events for the next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: events } = await supabase
    .from('ai_workplace_calendar')
    .select('*')
    .eq('user_id', userId)
    .gte('start_time', new Date().toISOString())
    .lte('start_time', thirtyDaysFromNow.toISOString())
    .order('start_time');

  // AI-powered optimization suggestions
  const optimizations = generateOptimizations(events || [], preferences);

  return new Response(JSON.stringify({
    success: true,
    total_events: (events || []).length,
    optimizations: optimizations,
    efficiency_score: calculateEfficiencyScore(events || []),
    recommendations: [
      'Consider batching similar meetings',
      'Add buffer time between travel events',
      'Schedule focus blocks for deep work'
    ]
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function generateAlternativeTimes(eventData: any, conflicts: any[]) {
  const alternatives = [];
  const startTime = new Date(eventData.start_time);
  const duration = new Date(eventData.end_time).getTime() - startTime.getTime();

  // Suggest 3 alternative time slots
  for (let i = 1; i <= 3; i++) {
    const newStart = new Date(startTime.getTime() + (i * 60 * 60 * 1000)); // +1 hour intervals
    const newEnd = new Date(newStart.getTime() + duration);
    
    alternatives.push({
      start_time: newStart.toISOString(),
      end_time: newEnd.toISOString(),
      confidence: 0.8 - (i * 0.1)
    });
  }

  return alternatives;
}

function generateOptimizations(events: any[], preferences: any) {
  const optimizations = [];

  // Check for back-to-back meetings
  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];
    
    if (new Date(next.start_time).getTime() === new Date(current.end_time).getTime()) {
      optimizations.push({
        type: 'add_buffer',
        event_id: current.id,
        suggestion: 'Add 15-minute buffer before next meeting',
        priority: 'medium'
      });
    }
  }

  // Check for long travel days
  const travelEvents = events.filter(e => e.event_type === 'travel');
  if (travelEvents.length > 2) {
    optimizations.push({
      type: 'travel_optimization',
      suggestion: 'Consider consolidating travel to reduce fatigue',
      priority: 'high'
    });
  }

  return optimizations;
}

function calculateEfficiencyScore(events: any[]) {
  if (events.length === 0) return 100;
  
  let score = 100;
  
  // Penalize for conflicts
  const conflicts = events.filter(e => e.ai_suggestions?.conflicts > 0);
  score -= conflicts.length * 10;
  
  // Penalize for back-to-back meetings
  let backToBackCount = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (new Date(events[i + 1].start_time).getTime() === new Date(events[i].end_time).getTime()) {
      backToBackCount++;
    }
  }
  score -= backToBackCount * 5;
  
  return Math.max(0, score);
}