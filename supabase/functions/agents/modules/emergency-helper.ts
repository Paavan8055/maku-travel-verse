import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'emergency-helper');
  
  try {
    const { 
      emergencyType = 'general', // medical, security, travel_disruption, document_loss, financial, communication
      location = null,
      severity = 'medium', // low, medium, high, critical
      description = '',
      contactsNeeded = true,
      immediateAssistance = false
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const emergencyHistory = await memory?.getMemory('emergency-helper', userId, 'emergency_contacts') || [];

    // Get current travel information
    const { data: currentTravel } = await supabaseClient
      .from('bookings')
      .select('booking_type, booking_data, status')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(2);

    const systemPrompt = `You are an emergency assistance specialist for MAKU Travel.
    
    EMERGENCY ASSISTANCE REQUEST:
    - Emergency type: ${emergencyType}
    - Location: ${location || 'Location to be determined'}
    - Severity: ${severity}
    - Description: ${description}
    - Contacts needed: ${contactsNeeded}
    - Immediate assistance: ${immediateAssistance}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    CURRENT TRAVEL: ${JSON.stringify(currentTravel)}
    EMERGENCY HISTORY: ${JSON.stringify(emergencyHistory)}

    Provide immediate emergency assistance including:
    1. Emergency contact numbers (local and international)
    2. Step-by-step emergency procedures
    3. Local emergency services and hospitals
    4. Embassy and consulate contact information
    5. Travel insurance claim procedures
    6. Document replacement processes
    7. Financial emergency assistance options
    8. Communication and family notification
    9. Transportation and accommodation alternatives
    10. Legal assistance and representation
    11. Medical referrals and prescription transfers
    12. Security and safety protocols
    13. Travel disruption contingency plans
    14. Emergency evacuation procedures
    15. Follow-up support and recovery assistance
    
    CRITICAL: Provide immediate actionable steps for emergencies.
    Include all relevant phone numbers and addresses.
    Prioritize safety and well-being above all else.`;

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
          { role: 'user', content: `EMERGENCY: ${emergencyType} situation with ${severity} severity. ${description}` }
        ],
        max_completion_tokens: 2500
      }),
    });

    const aiResponse = await response.json();
    const emergencyAssistance = aiResponse.choices[0]?.message?.content;

    // Log emergency for follow-up
    await agent.logActivity(userId, 'emergency_assistance_provided', {
      emergencyType,
      severity,
      location,
      immediateAssistance
    });

    // Create critical alert for high severity emergencies
    if (severity === 'high' || severity === 'critical') {
      await supabaseClient
        .from('critical_alerts')
        .insert({
          alert_type: 'emergency_assistance',
          severity: severity === 'critical' ? 'critical' : 'high',
          message: `Emergency assistance provided to user for ${emergencyType}`,
          booking_id: currentTravel?.[0]?.id || null,
          requires_manual_action: true
        });
    }

    const updatedEmergencyHistory = [...emergencyHistory, {
      emergencyType,
      severity,
      location,
      description: description.substring(0, 100),
      assistedAt: new Date().toISOString()
    }].slice(-10);

    return {
      success: true,
      result: {
        emergencyAssistance,
        emergencyType,
        severity,
        criticalAlert: severity === 'high' || severity === 'critical',
        followUpRequired: true,
        emergencyNumber: '24/7 MAKU Emergency Hotline: +1-800-MAKU-911'
      },
      memoryUpdates: [
        {
          key: 'emergency_contacts',
          data: updatedEmergencyHistory,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Emergency helper error:', error);
    return {
      success: false,
      error: error.message || 'Failed to provide emergency assistance'
    };
  }
};