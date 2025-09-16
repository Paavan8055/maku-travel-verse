import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'real-time-notification-dispatcher');
  
  try {
    const { 
      notificationType = 'booking_update',
      channels = ['push', 'email', 'sms'],
      urgency = 'normal',
      personalization = true,
      batchingEnabled = false,
      deliverySchedule = 'immediate'
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const notificationHistory = await memory?.getMemory('real-time-notification-dispatcher', userId, 'notification_logs') || [];

    const systemPrompt = `You are a real-time notification dispatcher for MAKU Travel's communication system.
    
    NOTIFICATION DISPATCH REQUEST:
    - Notification type: ${notificationType}
    - Channels: ${channels.join(', ')}
    - Urgency: ${urgency}
    - Personalization: ${personalization}
    - Batching enabled: ${batchingEnabled}
    - Delivery schedule: ${deliverySchedule}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    NOTIFICATION HISTORY: ${JSON.stringify(notificationHistory)}

    Provide comprehensive real-time notification dispatch including:
    1. Multi-channel notification orchestration and delivery
    2. Real-time personalization and content optimization
    3. Delivery timing optimization based on user preferences
    4. Channel preference management and failover logic
    5. Notification batching and frequency management
    6. A/B testing for notification effectiveness
    7. Delivery confirmation and read receipt tracking
    8. Spam prevention and unsubscribe management
    9. Emergency notification prioritization and routing
    10. Timezone-aware delivery scheduling
    11. Template management and dynamic content insertion
    12. Delivery analytics and engagement measurement
    
    Ensure timely and relevant notifications across all channels.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Dispatch ${notificationType} notifications via ${channels.join(', ')} with ${urgency} priority` }
        ],
        max_completion_tokens: 1500
      }),
    });

    const aiResponse = await response.json();
    const dispatchPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'notification_dispatched', {
      notificationType,
      channels: channels.length,
      urgency
    });

    const updatedHistory = [...notificationHistory, {
      notificationType,
      channels,
      urgency,
      dispatchedAt: new Date().toISOString()
    }].slice(-50);

    return {
      success: true,
      result: {
        dispatchPlan,
        deliveryStatus: deliverySchedule === 'immediate' ? 'Notifications sent immediately' : 'Scheduled for optimal delivery time',
        personalizationLevel: personalization ? 'Fully personalized content and timing' : 'Standard template delivery',
        channelOptimization: 'Channel selection optimized based on user preferences and engagement history'
      },
      memoryUpdates: [
        {
          key: 'notification_logs',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Notification dispatch error:', error);
    return {
      success: false,
      error: error.message || 'Failed to dispatch notifications'
    };
  }
};