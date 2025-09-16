import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'travel-insurance-coordinator');
  
  try {
    const { 
      tripDetails = {},
      travelerInfo = {},
      coverageNeeds = [],
      existingPolicies = [],
      riskAssessment = true,
      budgetRange = null,
      priorityFeatures = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const insuranceHistory = await memory?.getMemory('travel-insurance-coordinator', userId, 'insurance_preferences') || [];

    const systemPrompt = `You are a travel insurance coordination specialist for MAKU Travel's risk management system.
    
    INSURANCE REQUEST:
    - Trip details: ${JSON.stringify(tripDetails)}
    - Traveler information: ${JSON.stringify(travelerInfo)}
    - Coverage needs: ${JSON.stringify(coverageNeeds)}
    - Existing policies: ${JSON.stringify(existingPolicies)}
    - Risk assessment needed: ${riskAssessment}
    - Budget range: ${budgetRange || 'not specified'}
    - Priority features: ${JSON.stringify(priorityFeatures)}
    
    USER PROFILE:
    - Preferences: ${JSON.stringify(userPrefs)}
    - Insurance history: ${JSON.stringify(insuranceHistory.slice(-5))}
    
    Provide comprehensive travel insurance coordination including:
    1. Personalized insurance recommendations
    2. Coverage gap analysis and recommendations
    3. Risk assessment for specific destinations/activities
    4. Policy comparison and feature analysis
    5. Cost-benefit analysis across providers
    6. Claims process guidance and tips
    7. Pre-existing condition considerations
    8. Adventure/sports activity coverage
    9. Medical evacuation and repatriation coverage
    10. Trip cancellation and interruption protection
    11. Baggage and personal effects coverage
    12. Emergency assistance services evaluation
    13. Policy exclusions and limitations warnings
    14. Renewal and multi-trip policy options
    
    Format as detailed insurance coordination plan with specific recommendations.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 2500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Coordinate travel insurance for trip: ${JSON.stringify(tripDetails)}` }
        ]
      })
    });

    const data = await response.json();
    const insuranceRecommendations = data.choices[0].message.content;

    await agent.logActivity(userId, 'insurance_coordination', {
      tripDetails,
      coverageNeeds,
      budgetRange,
      recommendationLength: insuranceRecommendations.length
    });

    // Update insurance preferences
    const newInsuranceEntry = {
      tripDetails,
      coverageNeeds,
      budgetRange,
      priorityFeatures,
      coordinationDate: new Date().toISOString(),
      recommendationsProvided: true
    };
    
    const updatedHistory = [...insuranceHistory, newInsuranceEntry].slice(-15);
    await memory?.setMemory('travel-insurance-coordinator', userId, 'insurance_preferences', updatedHistory);

    return {
      success: true,
      insuranceRecommendations,
      riskAssessmentCompleted: riskAssessment,
      coverageAnalysis: 'comprehensive',
      policyComparison: 'included',
      memoryUpdates: {
        insurance_preferences: updatedHistory
      }
    };
  } catch (error) {
    console.error('Error in travel-insurance-coordinator:', error);
    return {
      success: false,
      error: 'Failed to coordinate travel insurance'
    };
  }
};