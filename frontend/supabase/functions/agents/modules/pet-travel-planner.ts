import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

// Primary Pet Travel Agent - orchestrates other specialized agents
export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'pet-travel-planner');
  
  // Agent delegation helper
  const delegateToAgent = async (agentId: string, taskIntent: string, taskParams: any) => {
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/agents/${agentId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          intent: taskIntent,
          params: taskParams
        })
      });
      return await response.json();
    } catch (error) {
      console.error(`Failed to delegate to ${agentId}:`, error);
      return { success: false, error: error.message };
    }
  };
  
  try {
    const { 
      destination, 
      dates, 
      pets = [], // [{type, breed, size, age, healthNeeds}]
      transportMode = 'flight', // flight, car, train
      accommodationType = 'hotel' // hotel, vacation_rental, camping
    } = params;

    if (!destination || !dates || pets.length === 0) {
      return {
        success: false,
        error: 'Missing required parameters: destination, dates, or pet information'
      };
    }

    // Delegate to specialized agents based on intent
    if (intent === 'find_pet_transport') {
      return await delegateToAgent('transport-advisor', 'pet_friendly_transport', { ...params, petRequirements: pets });
    }
    
    if (intent === 'find_pet_accommodation') {
      return await delegateToAgent('booking-assistant', 'pet_friendly_hotels', { ...params, pets });
    }
    
    if (intent === 'pet_documentation') {
      return await delegateToAgent('documentation-handler', 'pet_travel_docs', { destination, pets });
    }
    
    if (intent === 'pet_emergency_contacts') {
      return await delegateToAgent('emergency-helper', 'pet_vet_contacts', { destination });
    }

    const petTravelHistory = await memory?.getMemory('pet-travel-planner', userId, 'pet_trips') || [];

    const systemPrompt = `You are the PRIMARY pet travel agent for MAKU Travel. You coordinate with specialized agents to deliver complete pet travel solutions.
    
    PET TRAVEL REQUEST:
    - Destination: ${destination}
    - Travel dates: ${JSON.stringify(dates)}
    - Pets: ${JSON.stringify(pets)}
    - Transport mode: ${transportMode}
    - Accommodation type: ${accommodationType}
    
    PREVIOUS PET TRIPS: ${JSON.stringify(petTravelHistory)}

    Create a comprehensive pet travel plan including:
    1. Pet-friendly airlines/transport options with policies
    2. Required documentation (health certificates, vaccinations)
    3. Pet-friendly accommodations with specific amenities
    4. Local veterinarian contacts and emergency services
    5. Pet-friendly activities, parks, and attractions
    6. Pet supply stores and services at destination
    7. Quarantine and entry requirements by country/state
    8. Travel carrier requirements and comfort tips
    9. Pet travel insurance recommendations
    10. Local pet regulations and leash laws
    
    Consider pet stress, comfort, safety, and legal requirements.
    Provide specific airline policies and pet size/weight restrictions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Plan a pet-friendly trip to ${destination} for ${pets.length} pet(s): ${pets.map(p => `${p.type} (${p.size})`).join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const petTravelPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'pet_trip_planned', {
      destination,
      petCount: pets.length,
      petTypes: pets.map(p => p.type),
      transportMode
    });

    const updatedPetHistory = [...petTravelHistory, {
      destination,
      dates,
      pets,
      transportMode,
      accommodationType,
      plannedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        petTravelPlan,
        petProfile: pets,
        requirements: {
          documentation: 'Health certificates and vaccination records',
          carrier: 'IATA-approved travel carrier specifications',
          restrictions: 'Size, weight, and breed restrictions by carrier'
        },
        emergencyContacts: `Veterinary services and pet emergency contacts in ${destination}`
      },
      memoryUpdates: [
        {
          key: 'pet_trips',
          data: updatedPetHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Pet travel planner error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create pet travel plan'
    };
  }
};