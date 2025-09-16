import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'travel-insurance-advisor');
  
  try {
    const { 
      tripValue = null,
      coverageLevel = 'comprehensive',
      preExistingConditions = [],
      riskActivities = [],
      travelDuration = 'short_term',
      destinationRisk = 'low',
      age = null
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const insuranceHistory = await memory?.getMemory('travel-insurance-advisor', userId, 'insurance_policies') || [];

    const systemPrompt = `You are a travel insurance advisor for MAKU Travel's protection services.
    
    TRAVEL INSURANCE REQUEST:
    - Trip value: ${tripValue || 'Not specified'}
    - Coverage level: ${coverageLevel}
    - Pre-existing conditions: ${preExistingConditions.join(', ') || 'None declared'}
    - Risk activities: ${riskActivities.join(', ') || 'Standard travel activities'}
    - Travel duration: ${travelDuration}
    - Destination risk level: ${destinationRisk}
    - Age: ${age || 'Not specified'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    INSURANCE HISTORY: ${JSON.stringify(insuranceHistory)}

    Provide comprehensive travel insurance guidance including:
    1. Policy type and coverage level recommendations
    2. Premium cost analysis and comparison
    3. Medical coverage and emergency evacuation
    4. Trip cancellation and interruption protection
    5. Baggage and personal item coverage
    6. Adventure sports and high-risk activity coverage
    7. Pre-existing medical condition considerations
    8. Age-specific coverage and limitations
    9. Destination-specific risk assessments
    10. Claims process and documentation requirements
    11. Emergency contact and assistance services
    12. Policy exclusions and limitation explanations
    
    Ensure comprehensive protection tailored to individual travel needs and risks.`;

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
          { role: 'user', content: `Advise travel insurance for ${travelDuration} trip with ${coverageLevel} coverage and ${destinationRisk} destination risk` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const insuranceAdvice = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'insurance_advised', {
      coverageLevel,
      travelDuration,
      riskActivities: riskActivities.length
    });

    const updatedHistory = [...insuranceHistory, {
      coverageLevel,
      travelDuration,
      destinationRisk,
      riskActivities,
      advisedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        insuranceAdvice,
        protectionLevel: `${coverageLevel} coverage recommended for optimal protection`,
        riskAssessment: `${destinationRisk} risk destination with appropriate coverage adjustments`,
        emergencySupport: '24/7 emergency assistance and claims support included'
      },
      memoryUpdates: [
        {
          key: 'insurance_policies',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Travel insurance advisor error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide insurance advice'
    };
  }
};