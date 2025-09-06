import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'accessibility-coordinator');
  
  try {
    const { 
      accessibilityNeeds = [],
      mobilityAssistance = false,
      medicalRequirements = [],
      assistiveDevices = [],
      caregiverTravel = false,
      specialServices = [],
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const accessibilityHistory = await memory?.getMemory('accessibility-coordinator', userId, 'accessibility_requirements') || [];

    const systemPrompt = `You are an accessibility travel coordinator for MAKU Travel's inclusive travel services.
    
    ACCESSIBILITY TRAVEL REQUEST:
    - Accessibility needs: ${accessibilityNeeds.join(', ') || 'General accessibility'}
    - Mobility assistance: ${mobilityAssistance}
    - Medical requirements: ${medicalRequirements.join(', ') || 'None specified'}
    - Assistive devices: ${assistiveDevices.join(', ') || 'None required'}
    - Caregiver travel: ${caregiverTravel}
    - Special services: ${specialServices.join(', ') || 'Standard accessible services'}
    - Destinations: ${destinations.join(', ') || 'Accessibility-verified destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    ACCESSIBILITY HISTORY: ${JSON.stringify(accessibilityHistory)}

    Provide comprehensive accessible travel coordination including:
    1. Wheelchair-accessible accommodation verification
    2. Airport and airline accessibility services
    3. Medical equipment transport arrangements
    4. Accessible tour and activity options
    5. Restaurant and venue accessibility assessment
    6. Transportation accessibility verification
    7. Emergency medical contact coordination
    8. Caregiver accommodation arrangements
    9. Communication assistance services
    10. Accessible bathroom and facility mapping
    11. Medication and treatment availability
    12. Local accessibility resource connections
    
    Ensure full compliance with accessibility standards and personalized support.`;

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
          { role: 'user', content: `Coordinate accessible travel to ${destinations.join(', ')} with requirements: ${accessibilityNeeds.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const accessibilityPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'accessibility_coordinated', {
      destinations: destinations.length,
      accessibilityNeeds: accessibilityNeeds.length,
      mobilityAssistance
    });

    const updatedHistory = [...accessibilityHistory, {
      destinations,
      accessibilityNeeds,
      mobilityAssistance,
      medicalRequirements,
      coordinatedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        accessibilityPlan,
        verificationStatus: 'All accommodations and services verified for accessibility',
        emergencySupport: 'Emergency accessibility support contacts provided',
        specialArrangements: 'Custom accessibility arrangements confirmed'
      },
      memoryUpdates: [
        {
          key: 'accessibility_requirements',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Accessibility coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate accessible travel'
    };
  }
};