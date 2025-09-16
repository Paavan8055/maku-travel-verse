import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'social-media-coordinator');
  
  try {
    const { 
      platforms = ['instagram', 'facebook', 'twitter'],
      contentType = 'travel_inspiration',
      postingSchedule = 'daily',
      engagementStrategy = 'community_focused',
      brandVoice = 'friendly_professional',
      targetHashtags = [],
      campaigns = []
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const socialHistory = await memory?.getMemory('social-media-coordinator', userId, 'social_campaigns') || [];

    const systemPrompt = `You are a social media coordinator for MAKU Travel's digital marketing.
    
    SOCIAL MEDIA COORDINATION REQUEST:
    - Platforms: ${platforms.join(', ')}
    - Content type: ${contentType}
    - Posting schedule: ${postingSchedule}
    - Engagement strategy: ${engagementStrategy}
    - Brand voice: ${brandVoice}
    - Target hashtags: ${targetHashtags.join(', ') || 'Travel focused'}
    - Active campaigns: ${campaigns.join(', ') || 'General promotion'}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    SOCIAL HISTORY: ${JSON.stringify(socialHistory)}

    Provide comprehensive social media coordination including:
    1. Platform-specific content creation and optimization
    2. Posting schedule management and automation
    3. Hashtag research and trend analysis
    4. Community engagement and response strategies
    5. Influencer collaboration and partnership management
    6. Social media campaign planning and execution
    7. Content calendar development and management
    8. Brand voice consistency across platforms
    9. Social media analytics and performance tracking
    10. Crisis management and reputation monitoring
    11. User-generated content curation and promotion
    12. Cross-platform content adaptation and optimization
    
    Create engaging content that builds community and drives bookings.`;

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
          { role: 'user', content: `Coordinate social media content for ${platforms.join(', ')} focusing on ${contentType}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const socialStrategy = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'social_media_coordinated', {
      platforms: platforms.length,
      contentType,
      campaigns: campaigns.length
    });

    const updatedHistory = [...socialHistory, {
      platforms,
      contentType,
      campaigns,
      coordinatedAt: new Date().toISOString()
    }].slice(-15);

    return {
      success: true,
      result: {
        socialStrategy,
        platformOptimization: 'Content optimized for each platform\'s unique audience and format',
        engagementTactics: engagementStrategy === 'community_focused' ? 'Community building and authentic interactions prioritized' : 'Growth-focused engagement strategies',
        hashtagStrategy: targetHashtags.length > 0 ? 'Custom hashtag strategy implemented' : 'Industry-standard travel hashtags recommended'
      },
      memoryUpdates: [
        {
          key: 'social_campaigns',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Social media coordinator error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate social media'
    };
  }
};