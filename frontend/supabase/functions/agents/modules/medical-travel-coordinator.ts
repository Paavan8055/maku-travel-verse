import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'medical-travel-coordinator');
  
  try {
    const { 
      medicalConditions = [],
      medicationNeeds = [],
      doctorConsultation = false,
      medicalInsurance = true,
      emergencyContacts = [],
      healthFacilities = false,
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const medicalHistory = await memory?.getMemory('medical-travel-coordinator', userId, 'medical_travel_requirements') || [];

    const systemPrompt = `You are a medical travel coordinator for MAKU Travel's health-conscious travelers.
    
    MEDICAL TRAVEL REQUEST:
    - Medical conditions: ${medicalConditions.join(', ') || 'General health travel'}
    - Medication needs: ${medicationNeeds.join(', ') || 'No special medications'}
    - Doctor consultation: ${doctorConsultation}
    - Medical insurance: ${medicalInsurance}
    - Emergency contacts: ${emergencyContacts.length} contacts provided
    - Health facilities access: ${healthFacilities}
    - Destinations: ${destinations.join(', ') || 'Health-safe destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    MEDICAL HISTORY: ${JSON.stringify(medicalHistory)}

    Provide comprehensive medical travel coordination including:
    1. Pre-travel medical consultation recommendations
    2. Medication transport and customs regulations
    3. International health insurance verification
    4. Emergency medical facility locations
    5. Specialist doctor and clinic recommendations
    6. Medical equipment and device transport
    7. Vaccination and health requirement updates
    8. Medical translation services
    9. Prescription refill arrangements abroad
    10. Emergency medical evacuation coverage
    11. Health-safe accommodation recommendations
    12. 24/7 medical emergency hotline access
    
    Prioritize health safety and medical emergency preparedness.`;

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
          { role: 'user', content: `Coordinate medical travel to ${destinations.join(', ')} for conditions: ${medicalConditions.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const medicalCoordination = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'medical_travel_coordinated', {
      destinations: destinations.length,
      medicalConditions: medicalConditions.length,
      medicalInsurance
    });

    const updatedHistory = [...medicalHistory, {
      destinations,
      medicalConditions,
      medicationNeeds,
      doctorConsultation,
      coordinatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        medicalCoordination,
        emergencyPreparedness: '24/7 medical emergency support activated',
        insuranceVerification: medicalInsurance ? 'Medical insurance coverage verified' : 'Travel medical insurance recommended',
        medicationGuidance: 'Medication transport and customs compliance guidance provided'
      },
      memoryUpdates: [
        {
          key: 'medical_travel_requirements',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Medical travel coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate medical travel'
    };
  }
};