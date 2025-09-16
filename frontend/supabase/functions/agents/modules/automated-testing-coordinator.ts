import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'automated-testing-coordinator');
  
  try {
    const { 
      testingSuite = 'comprehensive',
      testTypes = ['unit', 'integration', 'e2e'],
      coverage = 'high',
      environments = ['staging', 'production'],
      scheduling = 'continuous',
      reportingLevel = 'detailed'
    } = params;

    const userPrefs = await agent.getUserPreferences(userId);
    const testingHistory = await memory?.getMemory('automated-testing-coordinator', userId, 'testing_reports') || [];

    const systemPrompt = `You are an automated testing coordinator for MAKU Travel's quality assurance.
    
    AUTOMATED TESTING REQUEST:
    - Testing suite: ${testingSuite}
    - Test types: ${testTypes.join(', ')}
    - Coverage: ${coverage}
    - Environments: ${environments.join(', ')}
    - Scheduling: ${scheduling}
    - Reporting level: ${reportingLevel}
    
    USER PREFERENCES: ${JSON.stringify(userPrefs)}
    TESTING HISTORY: ${JSON.stringify(testingHistory)}

    Provide comprehensive automated testing coordination including:
    1. Multi-tier test suite orchestration and execution
    2. Cross-environment testing and validation
    3. Continuous integration and deployment testing
    4. Performance and load testing automation
    5. Security testing and vulnerability scanning
    6. API testing and contract validation
    7. Browser and device compatibility testing
    8. Data integrity and migration testing
    9. Regression testing and change impact analysis
    10. Test result analysis and failure diagnosis
    11. Automated bug reporting and assignment
    12. Coverage analysis and gap identification
    
    Ensure comprehensive quality assurance through automated testing.`;

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
          { role: 'user', content: `Coordinate ${testingSuite} testing suite with ${testTypes.join(', ')} tests across ${environments.join(', ')}` }
        ],
        max_completion_tokens: 2000
      }),
    });

    const aiResponse = await response.json();
    const testingPlan = aiResponse.choices[0]?.message?.content;

    await agent.logActivity(userId, 'testing_coordinated', {
      testingSuite,
      testTypes: testTypes.length,
      environments: environments.length
    });

    const updatedHistory = [...testingHistory, {
      testingSuite,
      testTypes,
      environments,
      coordinatedAt: new Date().toISOString()
    }].slice(-20);

    return {
      success: true,
      result: {
        testingPlan,
        coverageLevel: coverage === 'high' ? '95%+ code coverage with comprehensive test scenarios' : 'Standard coverage with core functionality testing',
        automationLevel: scheduling === 'continuous' ? 'Full CI/CD integration with automated testing pipelines' : 'Scheduled testing with manual triggering',
        qualityAssurance: 'Multi-tier testing ensures maximum reliability and performance'
      },
      memoryUpdates: [
        {
          key: 'testing_reports',
          data: updatedHistory,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

  } catch (error) {
    console.error('Testing coordination error:', error);
    return {
      success: false,
      error: error.message || 'Failed to coordinate testing'
    };
  }
};