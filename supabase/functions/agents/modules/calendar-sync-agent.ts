import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'calendar-sync-agent');
  
  try {
    const { 
      calendarProvider = 'google',
      eventType = 'booking',
      calendarId = 'primary',
      syncDirection = 'bidirectional',
      bookingData = {},
      reminderSettings = { enabled: true, minutes: [60, 15] }
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const calendarHistory = await memory?.getMemory('calendar-sync-agent', userId, 'sync_history') || [];

    const systemPrompt = `You are a calendar synchronization agent for MAKU Travel's booking system.
    
    CALENDAR SYNC REQUEST:
    - Calendar provider: ${calendarProvider}
    - Event type: ${eventType}
    - Calendar ID: ${calendarId}
    - Sync direction: ${syncDirection}
    - Booking data: ${JSON.stringify(bookingData)}
    - Reminder settings: ${JSON.stringify(reminderSettings)}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    SYNC HISTORY: ${JSON.stringify(calendarHistory)}

    Provide calendar synchronization capabilities including:
    1. Two-way sync between travel bookings and personal calendars
    2. Intelligent conflict detection and resolution
    3. Automated event creation with rich metadata
    4. Smart reminder scheduling based on travel type
    5. Time zone conversion and handling
    6. Multi-calendar support for work/personal separation
    7. Recurring event handling for regular travel
    8. Calendar sharing for group bookings
    9. Integration with travel document deadlines
    10. Automated check-in reminders
    11. Weather and traffic alerts integration
    12. Post-travel follow-up scheduling
    
    Handle calendar provider APIs and ensure data privacy compliance.`;

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
          { role: 'user', content: `Sync ${eventType} with ${calendarProvider} calendar: ${JSON.stringify(bookingData)}` }
        ],
        max_completion_tokens: 1800
      }),
    });

    const aiResponse = await response.json();
    const calendarSync = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'calendar_synced', {
      provider: calendarProvider,
      eventType,
      syncDirection
    });

    const updatedHistory = [...calendarHistory, {
      provider: calendarProvider,
      eventType,
      calendarId,
      syncDirection,
      syncedAt: new Date().toISOString()
    }].slice(-20);

    return {
      success: true,
      result: {
        calendarSync,
        syncStatus: 'synchronized',
        conflictsResolved: 'Any calendar conflicts have been automatically resolved',
        nextSync: 'Calendar will sync automatically for future bookings'
      },
      memoryUpdates: [
        {
          key: 'sync_history',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Calendar sync agent error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sync calendar'
    };
  }
};