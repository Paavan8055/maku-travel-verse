import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'pet-travel-specialist');
  
  try {
    const { 
      petType = 'dog',
      breed,
      size,
      age,
      healthConditions = [],
      destination,
      travelDates,
      accommodationType = 'hotel',
      transportMode = 'flight',
      specialRequirements = []
    } = params;

    if (!destination || !travelDates || !petType) {
      return {
        success: false,
        error: 'Missing required parameters: destination, travel dates, or pet type'
      };
    }

    const petTravelHistory = await memory?.getMemory('pet-travel-specialist', userId, 'pet_specialization_history') || [];
    const userPrefs = await agent.getUserPreferences(userId);

    const systemPrompt = `You are a specialized pet travel expert for MAKU Travel with extensive knowledge of international pet travel regulations.

    PET TRAVEL SPECIALIZATION REQUEST:
    - Pet Type: ${petType}
    - Breed: ${breed || 'Not specified'}
    - Size: ${size || 'Not specified'}
    - Age: ${age || 'Not specified'}
    - Health Conditions: ${healthConditions.join(', ') || 'None reported'}
    - Destination: ${destination}
    - Travel Dates: ${JSON.stringify(travelDates)}
    - Accommodation Type: ${accommodationType}
    - Transport Mode: ${transportMode}
    - Special Requirements: ${specialRequirements.join(', ') || 'None'}

    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    PREVIOUS PET TRAVEL SPECIALIZATIONS: ${JSON.stringify(petTravelHistory)}

    Provide expert pet travel specialization including:
    1. Breed-specific travel requirements and restrictions
    2. International health certificate and vaccination requirements
    3. Quarantine protocols and entry requirements by destination
    4. USDA/APHIS and destination country veterinary documentation
    5. Pet-friendly airline policies and carrier specifications (IATA regulations)
    6. Pre-travel health preparations and timeline (6-8 weeks minimum)
    7. Specialized pet accommodations and services at destination
    8. Emergency veterinary contacts and pet hospitals at destination
    9. Pet travel insurance recommendations and coverage options
    10. Local pet regulations, leash laws, and cultural considerations
    11. Climate considerations and seasonal travel recommendations
    12. Pet stress management and comfort strategies during travel

    Focus on regulatory compliance, safety protocols, and specialized pet care needs.`;

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
          { role: 'user', content: `Provide specialized pet travel guidance for ${petType} (${breed}) traveling to ${destination}` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const specializedGuidance = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'pet_travel_specialized', {
      petType,
      breed,
      destination,
      transportMode,
      healthConditions: healthConditions.length
    });

    const updatedHistory = [...petTravelHistory, {
      petType,
      breed,
      size,
      destination,
      travelDates,
      transportMode,
      healthConditions,
      specialRequirements,
      consultedAt: new Date().toISOString()
    }].slice(-20);

    return {
      success: true,
      result: {
        specializedGuidance,
        petProfile: {
          type: petType,
          breed,
          size,
          age,
          healthConditions
        },
        regulatoryRequirements: {
          documentation: 'USDA health certificate, veterinary records, vaccination certificates',
          quarantine: 'Destination-specific quarantine requirements',
          timeline: 'Start preparation 6-8 weeks before travel'
        },
        travelSpecifications: {
          carrier: 'IATA-approved pet travel carrier specifications',
          airline: 'Pet-friendly airline policies and restrictions',
          accommodation: 'Pet-friendly lodging options and policies'
        },
        emergencySupport: {
          veterinary: `Emergency veterinary services in ${destination}`,
          insurance: 'Pet travel insurance options and coverage',
          support: '24/7 pet travel emergency assistance'
        }
      },
      memoryUpdates: [
        {
          key: 'pet_specialization_history',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Pet travel specialist error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide specialized pet travel guidance'
    };
  }
};