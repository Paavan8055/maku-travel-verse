import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'safari-wildlife-guide');
  
  try {
    const { 
      wildlifeInterests = [],
      safariType = 'game_drive',
      accommodationType = 'lodge',
      photographyFocus = false,
      conservationInterest = false,
      season = 'any',
      destinations = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const safariHistory = await memory?.getMemory('safari-wildlife-guide', userId, 'safari_experiences') || [];

    const systemPrompt = `You are a safari and wildlife specialist for MAKU Travel's nature experiences.
    
    SAFARI WILDLIFE REQUEST:
    - Wildlife interests: ${wildlifeInterests.join(', ') || 'General wildlife viewing'}
    - Safari type: ${safariType}
    - Accommodation type: ${accommodationType}
    - Photography focus: ${photographyFocus}
    - Conservation interest: ${conservationInterest}
    - Season preference: ${season}
    - Destinations: ${destinations.join(', ') || 'Top safari destinations'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    SAFARI HISTORY: ${JSON.stringify(safariHistory)}

    Provide expert safari and wildlife guidance including:
    1. Optimal wildlife viewing seasons and timing
    2. Game reserve and national park recommendations
    3. Safari vehicle and guide arrangements
    4. Wildlife photography equipment and tips
    5. Conservation project participation opportunities
    6. Cultural interaction with local communities
    7. Bush camp and luxury lodge accommodations
    8. Big Five and rare species tracking
    9. Bird watching and specialized wildlife tours
    10. Walking safari and bush experience options
    11. Ethical wildlife interaction guidelines
    12. Safari clothing and equipment recommendations
    
    Maximize wildlife encounters while supporting conservation efforts.`;

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
          { role: 'user', content: `Guide safari experience in ${destinations.join(', ')} focusing on ${wildlifeInterests.join(', ')} with ${safariType}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const safariGuide = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'safari_guided', {
      destinations: destinations.length,
      wildlifeInterests: wildlifeInterests.length,
      safariType
    });

    const updatedHistory = [...safariHistory, {
      destinations,
      wildlifeInterests,
      safariType,
      photographyFocus,
      guidedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        safariGuide,
        wildlifeTracking: 'Expert wildlife tracking and viewing opportunities identified',
        conservationImpact: conservationInterest ? 'Conservation project participation arranged' : 'Wildlife viewing focused experience',
        photographySupport: photographyFocus ? 'Professional photography guidance and equipment support provided' : 'General wildlife viewing optimized'
      },
      memoryUpdates: [
        {
          key: 'safari_experiences',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Safari wildlife guide error:', error);
    return {
      success: false,
      error: error.message || 'Failed to guide safari experience'
    };
  }
};