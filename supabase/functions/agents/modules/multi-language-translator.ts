import { BaseAgent, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (userId, intent, params, supabaseClient, openAiClient, memory) => {
  const agent = new BaseAgent(supabaseClient, 'multi-language-translator');
  
  try {
    const { 
      text,
      sourceLanguage = 'auto',
      targetLanguage,
      context = 'travel',
      preserveFormatting = true,
      includeTransliteration = false,
      culturalAdaptation = true
    } = params;

    if (!text || !targetLanguage) {
      return {
        success: false,
        error: 'Text and target language are required for translation'
      };
    }

    const userPrefs = await agent.getUserPreferences(userId);
    const translationHistory = await memory?.getMemory('multi-language-translator', userId, 'translation_patterns') || [];

    const systemPrompt = `You are an advanced multi-language translator specialized in travel and hospitality contexts.
    
    TRANSLATION REQUEST:
    - Source text: "${text}"
    - Source language: ${sourceLanguage}
    - Target language: ${targetLanguage}
    - Context: ${context}
    - Preserve formatting: ${preserveFormatting}
    - Include transliteration: ${includeTransliteration}
    - Cultural adaptation: ${culturalAdaptation}
    
    USER PROFILE:
    - Preferences: ${JSON.stringify(userPrefs)}
    - Translation history: ${JSON.stringify(translationHistory.slice(-5))}
    
    Provide professional translation with:
    1. Accurate and contextually appropriate translation
    2. Cultural nuances and local expressions
    3. Travel-specific terminology when applicable
    4. Pronunciation guide if requested
    5. Alternative expressions or formality levels
    6. Cultural etiquette notes when relevant
    7. Regional variations if significant
    8. Confidence level of translation
    9. Suggested improvements for cultural sensitivity
    10. Context-specific adaptations
    
    Format as JSON with translation, confidence, cultural_notes, and alternatives.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        max_completion_tokens: 1500,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Translate the following text to ${targetLanguage}: "${text}"` }
        ]
      })
    });

    const data = await response.json();
    let translationResult;
    
    try {
      translationResult = JSON.parse(data.choices[0].message.content);
    } catch {
      // Fallback if response isn't JSON
      translationResult = {
        translation: data.choices[0].message.content,
        confidence: 0.9,
        cultural_notes: 'Standard translation provided',
        alternatives: []
      };
    }

    await agent.logActivity(userId, 'translation', {
      sourceLanguage,
      targetLanguage,
      context,
      textLength: text.length,
      confidence: translationResult.confidence
    });

    // Update translation patterns
    const newTranslation = {
      sourceLanguage,
      targetLanguage,
      context,
      confidence: translationResult.confidence,
      timestamp: new Date().toISOString()
    };
    
    const updatedHistory = [...translationHistory, newTranslation].slice(-50);
    await memory?.setMemory('multi-language-translator', userId, 'translation_patterns', updatedHistory);

    return {
      success: true,
      translation: translationResult.translation,
      confidence: translationResult.confidence,
      culturalNotes: translationResult.cultural_notes,
      alternatives: translationResult.alternatives,
      sourceLanguageDetected: sourceLanguage === 'auto' ? 'detected' : sourceLanguage,
      memoryUpdates: {
        translation_patterns: updatedHistory
      }
    };
  } catch (error) {
    console.error('Error in multi-language-translator:', error);
    return {
      success: false,
      error: 'Failed to translate text'
    };
  }
};