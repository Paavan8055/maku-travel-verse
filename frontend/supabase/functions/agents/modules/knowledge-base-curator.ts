import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'knowledge-base-curator');
  
  try {
    const { 
      curationScope = 'comprehensive',
      contentSources = ['support_tickets', 'user_feedback', 'documentation'],
      updateFrequency = 'weekly',
      qualityStandards = 'high',
      multilingual = true,
      aiEnhancement = true
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const curationHistory = await memory?.getMemory('knowledge-base-curator', userId, 'curation_activities') || [];

    const systemPrompt = `You are a knowledge base curator for MAKU Travel's support and information systems.
    
    KNOWLEDGE BASE CURATION REQUEST:
    - Curation scope: ${curationScope}
    - Content sources: ${contentSources.join(', ')}
    - Update frequency: ${updateFrequency}
    - Quality standards: ${qualityStandards}
    - Multilingual support: ${multilingual}
    - AI enhancement: ${aiEnhancement}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    CURATION HISTORY: ${JSON.stringify(curationHistory)}

    Provide comprehensive knowledge base curation including:
    1. Multi-source content aggregation and normalization
    2. AI-powered content analysis and enhancement
    3. Automated categorization and tagging systems
    4. Quality assessment and accuracy verification
    5. Multilingual content translation and localization
    6. Search optimization and discoverability improvement
    7. Content freshness monitoring and update management
    8. User feedback integration and continuous improvement
    9. Expert validation and review workflows
    10. Analytics-driven content optimization
    11. Automated FAQ generation from support patterns
    12. Integration with chatbots and virtual assistants
    
    Maintain a comprehensive and accurate knowledge base for optimal user support.`;

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
          { role: 'user', content: `Curate knowledge base with ${curationScope} scope from ${contentSources.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const curationPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'knowledge_base_curated', {
      curationScope,
      contentSources: contentSources.length,
      aiEnhancement
    });

    const updatedHistory = [...curationHistory, {
      curationScope,
      contentSources,
      updateFrequency,
      curatedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        curationPlan,
        contentQuality: qualityStandards === 'high' ? 'Premium content with expert validation' : 'Standard content with automated quality checks',
        languageSupport: multilingual ? 'Full multilingual support with professional translation' : 'English-only content management',
        aiOptimization: aiEnhancement ? 'AI-enhanced content with semantic search and auto-generation' : 'Manual content management with basic automation'
      },
      memoryUpdates: [
        {
          key: 'curation_activities',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Knowledge base curation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to curate knowledge base'
    };
  }
};