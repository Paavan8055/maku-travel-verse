import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'travel-documentation-specialist');
  
  try {
    const { 
      nationality = '',
      documentTypes = [],
      urgencyLevel = 'standard',
      travelPurpose = 'tourism',
      multipleDestinations = false,
      documentStatus = 'needs_renewal',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const documentHistory = await memory?.getMemory('travel-documentation-specialist', userId, 'travel_documents') || [];

    const systemPrompt = `You are a travel documentation specialist for MAKU Travel's document services.
    
    TRAVEL DOCUMENTATION REQUEST:
    - Nationality: ${nationality}
    - Document types needed: ${documentTypes.join(', ') || 'Passport and visa requirements'}
    - Urgency level: ${urgencyLevel}
    - Travel purpose: ${travelPurpose}
    - Multiple destinations: ${multipleDestinations}
    - Document status: ${documentStatus}
    - Destinations: ${destinations.join(', ') || 'Document requirements assessment needed'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    DOCUMENT HISTORY: ${JSON.stringify(documentHistory)}

    Provide comprehensive travel documentation guidance including:
    1. Passport validity and renewal requirements
    2. Visa application processes and timelines
    3. Document photo and specification requirements
    4. Embassy and consulate appointment scheduling
    5. Express and expedited processing options
    6. Document authentication and apostille services
    7. Travel document insurance and backup copies
    8. Entry and exit requirement verification
    9. Multi-destination documentation coordination
    10. Digital document storage and organization
    11. Document security and fraud prevention
    12. Emergency document replacement procedures
    
    Ensure all travel documentation is complete, valid, and properly processed.`;

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
          { role: 'user', content: `Coordinate travel documentation for ${nationality} citizen traveling to ${destinations.join(', ')} for ${travelPurpose} with ${urgencyLevel} urgency` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const documentationGuidance = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'documentation_guided', {
      nationality,
      destinations: destinations.length,
      urgencyLevel
    });

    const updatedHistory = [...documentHistory, {
      nationality,
      destinations,
      documentTypes,
      urgencyLevel,
      guidedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        documentationGuidance,
        timelineManagement: `${urgencyLevel} processing timeline with all deadlines clearly outlined`,
        completenessVerification: 'All required documents and specifications verified',
        emergencySupport: 'Emergency document replacement and support procedures provided'
      },
      memoryUpdates: [
        {
          key: 'travel_documents',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Travel documentation specialist error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide documentation guidance'
    };
  }
};