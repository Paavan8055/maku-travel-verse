import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'visa-assistant');
  
  try {
    const { 
      destination, 
      nationality,
      travelPurpose = 'tourism', // tourism, business, education, medical, transit
      stayDuration = null,
      hasExistingVisa = false,
      previousVisas = []
    } = params;

    if (!destination || !nationality) {
      return {
        success: false,
        error: 'Missing required parameters: destination or nationality'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const visaHistory = await memory?.getMemory('visa-assistant', userId, 'visa_applications') || [];

    const systemPrompt = `You are a visa and documentation specialist for MAKU Travel.
    
    VISA ASSISTANCE REQUEST:
    - Destination: ${destination}
    - Nationality: ${nationality}
    - Travel purpose: ${travelPurpose}
    - Stay duration: ${stayDuration || 'Not specified'}
    - Has existing visa: ${hasExistingVisa}
    - Previous visas: ${previousVisas.join(', ') || 'None'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    VISA HISTORY: ${JSON.stringify(visaHistory)}

    Provide comprehensive visa guidance including:
    1. Visa requirement status (required/not required/visa on arrival)
    2. Specific visa types and categories available
    3. Required documents and supporting materials
    4. Application process and procedures
    5. Processing times and fees
    6. Appointment booking requirements
    7. Biometric and interview requirements
    8. Financial proof and bank statements needed
    9. Invitation letters and sponsorship documents
    10. Health and vaccination requirements
    11. Travel insurance requirements
    12. Visa validity and extension options
    13. Multiple entry vs single entry considerations
    14. Transit visa requirements if applicable
    15. Expedited processing options
    
    Include specific embassy/consulate contact information.
    Provide step-by-step application guidance with timelines.`;

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
          { role: 'user', content: `Provide visa guidance for ${nationality} citizen traveling to ${destination} for ${travelPurpose}` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const visaGuidance = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'visa_guidance_provided', {
      destination,
      nationality,
      travelPurpose,
      hasExistingVisa
    });

    const updatedVisaHistory = [...visaHistory, {
      destination,
      nationality,
      travelPurpose,
      stayDuration,
      guidedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        visaGuidance,
        destination,
        nationality,
        travelPurpose,
        visaRequired: 'Check specific requirements in the guidance',
        processingTime: 'Varies by visa type and nationality'
      },
      memoryUpdates: [
        {
          key: 'visa_applications',
          data: updatedVisaHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Visa assistant error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide visa guidance'
    };
  }
};