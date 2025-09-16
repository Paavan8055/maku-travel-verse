import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'user-support');
  
  try {
    const { issueType, description, priority, category, userDetails } = params;
    
    const supportHistory = await memory.getMemory('user-support', userId, 'support_history') || [];
    const userPreferences = await agent.getUserPreferences(userId);
    
    const systemPrompt = `You are a professional customer support agent for MAKU.Travel.
    
TASK: Provide comprehensive customer support and issue resolution.

SUPPORT REQUEST:
- Issue Type: ${issueType}
- Category: ${category}
- Priority: ${priority}
- Description: ${description}
- User Details: ${JSON.stringify(userDetails)}

USER PREFERENCES: ${JSON.stringify(userPreferences)}
SUPPORT HISTORY: ${JSON.stringify(supportHistory.slice(-5))}

Provide:
1. Immediate issue acknowledgment
2. Step-by-step troubleshooting guidance
3. Clear resolution steps
4. Alternative solutions if applicable
5. Follow-up recommendations
6. Escalation path if needed
7. Timeline for resolution
8. Additional resources or contacts

Be empathetic, professional, and solution-focused. Prioritize customer satisfaction.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiClient}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [{ role: 'system', content: systemPrompt }],
        max_completion_tokens: 1800
      }),
    });

    const aiResponse = await response.json();
    const supportResponse = aiResponse.choices[0]?.message?.content || 'Support response generated';

    // Determine resolution status
    const resolutionStatus = priority === 'high' ? 'escalated' : 
                           issueType === 'technical' ? 'in_progress' : 'resolved';

    await agent.logActivity(userId, 'support_request_handled', { issueType, priority, resolutionStatus });
    
    // Update support history
    const updatedSupportHistory = [
      ...supportHistory.slice(-9),
      {
        issueType,
        category,
        priority,
        description: description.substring(0, 200),
        resolution: supportResponse.substring(0, 300),
        status: resolutionStatus,
        timestamp: new Date().toISOString()
      }
    ];
    
    await memory.setMemory('user-support', userId, 'support_history', updatedSupportHistory);

    return {
      success: true,
      result: {
        supportResponse,
        resolutionStatus,
        nextSteps: resolutionStatus === 'escalated' ? 'Manager will contact within 2 hours' :
                  resolutionStatus === 'in_progress' ? 'Technical team will investigate' :
                  'Issue resolved - please confirm',
        ticketId: `MAKU-${Date.now()}`,
        estimatedResolutionTime: priority === 'high' ? '2 hours' : '24 hours'
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};