import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { BaseAgent, StructuredLogger, AgentHandler } from '../_shared/memory-utils.ts';

export const handler: AgentHandler = async (
  userId: string,
  intent: string,
  params: any,
  supabaseClient: SupabaseClient,
  openAiClient: string,
  memory
) => {
  const agent = new BaseAgent(supabaseClient, 'multilingual-agent');
  
  try {
    StructuredLogger.info('Multilingual agent processing request', {
      userId,
      intent,
      agentId: 'multilingual-agent'
    });

    switch (intent) {
      case 'translate_text':
        return await translateText(agent, userId, params);
      
      case 'detect_language':
        return await detectLanguage(agent, userId, params);
      
      case 'localize_content':
        return await localizeContent(agent, userId, params);
      
      case 'cultural_adaptation':
        return await culturalAdaptation(agent, userId, params);
      
      case 'get_translation_suggestions':
        return await getTranslationSuggestions(agent, userId, params);
      
      default:
        StructuredLogger.warn('Unknown intent for multilingual agent', { intent });
        return {
          success: false,
          error: 'Unknown intent for multilingual agent'
        };
    }
  } catch (error) {
    StructuredLogger.error('Multilingual agent error', { error: error.message, userId });
    return {
      success: false,
      error: error.message
    };
  }
};

async function translateText(
  agent: BaseAgent,
  userId: string,
  params: {
    text: string;
    sourceLanguage?: string;
    targetLanguage: string;
    context?: string;
    useCache?: boolean;
  }
): Promise<any> {
  try {
    // Generate cache key
    const cacheKey = generateCacheKey(params.text, params.sourceLanguage || 'auto', params.targetLanguage);
    
    // Check cache first if enabled
    if (params.useCache !== false) {
      const { data: cachedTranslation, error: cacheError } = await agent['supabase']
        .from('translation_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single();
      
      if (!cacheError && cachedTranslation) {
        // Update usage count
        await agent['supabase']
          .from('translation_cache')
          .update({
            usage_count: cachedTranslation.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', cachedTranslation.id);
        
        return {
          success: true,
          result: {
            translatedText: cachedTranslation.translated_text,
            sourceLanguage: cachedTranslation.source_language,
            targetLanguage: cachedTranslation.target_language,
            qualityScore: cachedTranslation.translation_quality_score,
            fromCache: true
          }
        };
      }
    }

    // Detect source language if not provided
    let sourceLanguage = params.sourceLanguage;
    if (!sourceLanguage || sourceLanguage === 'auto') {
      const detectionResult = await simulateLanguageDetection(params.text);
      sourceLanguage = detectionResult.language;
    }

    // Perform translation
    const translationResult = await simulateTranslation(
      params.text,
      sourceLanguage,
      params.targetLanguage,
      params.context
    );

    // Cache the translation
    await agent['supabase']
      .from('translation_cache')
      .insert({
        source_text: params.text,
        source_language: sourceLanguage,
        target_language: params.targetLanguage,
        translated_text: translationResult.translatedText,
        translation_quality_score: translationResult.qualityScore,
        provider: 'simulation',
        cache_key: cacheKey
      });

    await agent.logActivity(userId, 'text_translated', {
      sourceLanguage,
      targetLanguage: params.targetLanguage,
      textLength: params.text.length,
      qualityScore: translationResult.qualityScore
    });

    return {
      success: true,
      result: {
        translatedText: translationResult.translatedText,
        sourceLanguage,
        targetLanguage: params.targetLanguage,
        qualityScore: translationResult.qualityScore,
        fromCache: false,
        alternatives: translationResult.alternatives
      },
      memoryUpdates: [{
        key: 'recent_translation',
        data: {
          sourceLanguage,
          targetLanguage: params.targetLanguage,
          timestamp: new Date().toISOString()
        }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to translate text', { error: error.message, userId });
    throw error;
  }
}

async function detectLanguage(
  agent: BaseAgent,
  userId: string,
  params: { text: string; confidence?: number }
): Promise<any> {
  try {
    const detection = await simulateLanguageDetection(params.text);
    
    await agent.logActivity(userId, 'language_detected', {
      detectedLanguage: detection.language,
      confidence: detection.confidence,
      textLength: params.text.length
    });

    return {
      success: true,
      result: {
        language: detection.language,
        languageName: getLanguageName(detection.language),
        confidence: detection.confidence,
        alternativeLanguages: detection.alternatives
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to detect language', { error: error.message, userId });
    throw error;
  }
}

async function localizeContent(
  agent: BaseAgent,
  userId: string,
  params: {
    content: any;
    targetLocale: string;
    contentType: 'travel_booking' | 'email' | 'website' | 'notification';
  }
): Promise<any> {
  try {
    const localization = await performLocalization(params.content, params.targetLocale, params.contentType);
    
    await agent.logActivity(userId, 'content_localized', {
      targetLocale: params.targetLocale,
      contentType: params.contentType,
      itemsLocalized: localization.itemsProcessed
    });

    return {
      success: true,
      result: {
        localizedContent: localization.content,
        locale: params.targetLocale,
        changes: localization.changes,
        culturalAdaptations: localization.culturalAdaptations
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to localize content', { error: error.message, userId });
    throw error;
  }
}

async function culturalAdaptation(
  agent: BaseAgent,
  userId: string,
  params: {
    content: string;
    targetCulture: string;
    adaptationType: 'formal' | 'informal' | 'business' | 'casual';
  }
): Promise<any> {
  try {
    const adaptation = await performCulturalAdaptation(
      params.content,
      params.targetCulture,
      params.adaptationType
    );

    await agent.logActivity(userId, 'cultural_adaptation_performed', {
      targetCulture: params.targetCulture,
      adaptationType: params.adaptationType,
      changesCount: adaptation.changes.length
    });

    return {
      success: true,
      result: {
        adaptedContent: adaptation.content,
        targetCulture: params.targetCulture,
        adaptationType: params.adaptationType,
        changes: adaptation.changes,
        culturalNotes: adaptation.culturalNotes
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to perform cultural adaptation', { error: error.message, userId });
    throw error;
  }
}

async function getTranslationSuggestions(
  agent: BaseAgent,
  userId: String,
  params: {
    sourceText: string;
    targetLanguage: string;
    context?: string;
  }
): Promise<any> {
  try {
    // Get multiple translation suggestions
    const suggestions = await generateTranslationSuggestions(
      params.sourceText,
      params.targetLanguage,
      params.context
    );

    return {
      success: true,
      result: {
        suggestions,
        sourceText: params.sourceText,
        targetLanguage: params.targetLanguage,
        recommendedSuggestion: suggestions[0] // Highest confidence
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to get translation suggestions', { error: error.message, userId });
    throw error;
  }
}

async function simulateLanguageDetection(text: string): Promise<any> {
  // Simulate language detection - in production, use Google Translate, Azure Translator, etc.
  await new Promise(resolve => setTimeout(resolve, 50));
  
  const languages = [
    { code: 'en', patterns: ['the', 'and', 'is', 'a', 'to', 'of', 'in', 'that', 'have', 'it'] },
    { code: 'es', patterns: ['el', 'la', 'de', 'que', 'y', 'es', 'en', 'un', 'se', 'no'] },
    { code: 'fr', patterns: ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir'] },
    { code: 'de', patterns: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich'] },
    { code: 'it', patterns: ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'non'] }
  ];
  
  const textLower = text.toLowerCase();
  const scores = languages.map(lang => {
    const matches = lang.patterns.filter(pattern => textLower.includes(pattern)).length;
    return { language: lang.code, score: matches };
  });
  
  scores.sort((a, b) => b.score - a.score);
  
  const topLanguage = scores[0];
  const confidence = Math.min(0.95, 0.6 + (topLanguage.score * 0.05));
  
  return {
    language: topLanguage.language,
    confidence: Math.round(confidence * 100) / 100,
    alternatives: scores.slice(1, 3).map(s => ({
      language: s.language,
      confidence: Math.round((confidence * 0.7 * (s.score / topLanguage.score)) * 100) / 100
    }))
  };
}

async function simulateTranslation(
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
  context?: string
): Promise<any> {
  // Simulate translation - in production, integrate with Google Translate, DeepL, etc.
  await new Promise(resolve => setTimeout(resolve, 100 + text.length * 2));
  
  const translations = {
    'en->es': {
      'Hello': 'Hola',
      'Thank you': 'Gracias',
      'Book a flight': 'Reservar un vuelo',
      'Hotel reservation': 'Reserva de hotel',
      'Travel insurance': 'Seguro de viaje'
    },
    'en->fr': {
      'Hello': 'Bonjour',
      'Thank you': 'Merci',
      'Book a flight': 'Réserver un vol',
      'Hotel reservation': 'Réservation d\'hôtel',
      'Travel insurance': 'Assurance voyage'
    },
    'en->de': {
      'Hello': 'Hallo',
      'Thank you': 'Danke',
      'Book a flight': 'Flug buchen',
      'Hotel reservation': 'Hotelreservierung',
      'Travel insurance': 'Reiseversicherung'
    }
  };
  
  const translationKey = `${sourceLanguage}->${targetLanguage}`;
  const translationMap = translations[translationKey] || {};
  
  // Simple word-by-word translation for simulation
  let translatedText = text;
  Object.entries(translationMap).forEach(([source, target]) => {
    const regex = new RegExp(source, 'gi');
    translatedText = translatedText.replace(regex, target);
  });
  
  // If no translation found, append language indicator
  if (translatedText === text) {
    translatedText = `[${targetLanguage.toUpperCase()}] ${text}`;
  }
  
  const qualityScore = 0.85 + Math.random() * 0.1; // Random quality between 0.85-0.95
  
  return {
    translatedText,
    qualityScore: Math.round(qualityScore * 100) / 100,
    alternatives: [
      `Alt 1: ${translatedText}`,
      `Alt 2: ${translatedText.replace(/\b\w/g, l => l.toUpperCase())}`
    ]
  };
}

async function performLocalization(
  content: any,
  targetLocale: string,
  contentType: string
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const localizationRules = {
    'en-US': {
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
      numberFormat: '1,234.56',
      addressFormat: 'US'
    },
    'en-GB': {
      dateFormat: 'DD/MM/YYYY',
      currency: 'GBP',
      numberFormat: '1,234.56',
      addressFormat: 'UK'
    },
    'de-DE': {
      dateFormat: 'DD.MM.YYYY',
      currency: 'EUR',
      numberFormat: '1.234,56',
      addressFormat: 'DE'
    },
    'fr-FR': {
      dateFormat: 'DD/MM/YYYY',
      currency: 'EUR',
      numberFormat: '1 234,56',
      addressFormat: 'FR'
    }
  };
  
  const rules = localizationRules[targetLocale] || localizationRules['en-US'];
  const changes = [];
  const culturalAdaptations = [];
  
  // Apply localization rules
  let localizedContent = { ...content };
  
  if (typeof content === 'object') {
    // Localize dates
    if (content.date) {
      localizedContent.date = formatDate(content.date, rules.dateFormat);
      changes.push({ field: 'date', from: content.date, to: localizedContent.date });
    }
    
    // Localize currency
    if (content.price) {
      localizedContent.price = formatCurrency(content.price, rules.currency);
      changes.push({ field: 'price', from: content.price, to: localizedContent.price });
    }
    
    // Cultural adaptations based on content type
    if (contentType === 'travel_booking') {
      if (targetLocale.startsWith('de-')) {
        culturalAdaptations.push('Using formal address style (Sie)');
      }
      if (targetLocale.startsWith('ja-')) {
        culturalAdaptations.push('Added appropriate honorifics');
      }
    }
  }
  
  return {
    content: localizedContent,
    itemsProcessed: changes.length,
    changes,
    culturalAdaptations
  };
}

async function performCulturalAdaptation(
  content: string,
  targetCulture: string,
  adaptationType: string
): Promise<any> {
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const adaptations = {
    'formal': {
      'Hello': 'Good morning/afternoon',
      'Hi': 'Good day',
      'Thanks': 'Thank you very much'
    },
    'informal': {
      'Good morning': 'Hi',
      'Thank you very much': 'Thanks',
      'Please find attached': 'Here\'s'
    }
  };
  
  const culturalNotes = {
    'ja-JP': ['Use respectful language', 'Include appropriate bowing context', 'Consider seasonal greetings'],
    'de-DE': ['Use formal Sie unless informal context', 'Be direct and precise', 'Respect punctuality mentions'],
    'ar-SA': ['Consider right-to-left text flow', 'Respect cultural sensitivities', 'Use appropriate honorifics']
  };
  
  let adaptedContent = content;
  const changes = [];
  
  const adaptationRules = adaptations[adaptationType] || {};
  Object.entries(adaptationRules).forEach(([from, to]) => {
    if (content.includes(from)) {
      adaptedContent = adaptedContent.replace(new RegExp(from, 'g'), to);
      changes.push({ from, to, reason: `Cultural adaptation for ${adaptationType} style` });
    }
  });
  
  return {
    content: adaptedContent,
    changes,
    culturalNotes: culturalNotes[targetCulture] || []
  };
}

async function generateTranslationSuggestions(
  sourceText: string,
  targetLanguage: string,
  context?: string
): Promise<any[]> {
  await new Promise(resolve => setTimeout(resolve, 80));
  
  // Generate multiple suggestions with different approaches
  const baseTranslation = await simulateTranslation(sourceText, 'auto', targetLanguage, context);
  
  return [
    {
      text: baseTranslation.translatedText,
      confidence: baseTranslation.qualityScore,
      approach: 'neural_machine_translation',
      provider: 'primary'
    },
    {
      text: `${baseTranslation.translatedText} (formal)`,
      confidence: baseTranslation.qualityScore * 0.9,
      approach: 'formal_style',
      provider: 'primary'
    },
    {
      text: `${baseTranslation.translatedText} (casual)`,
      confidence: baseTranslation.qualityScore * 0.85,
      approach: 'casual_style',
      provider: 'primary'
    }
  ].sort((a, b) => b.confidence - a.confidence);
}

function generateCacheKey(text: string, sourceLanguage: string, targetLanguage: string): string {
  const textHash = btoa(text).substring(0, 16); // Simple hash
  return `${sourceLanguage}_${targetLanguage}_${textHash}`;
}

function getLanguageName(languageCode: string): string {
  const languageNames = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi'
  };
  
  return languageNames[languageCode] || languageCode.toUpperCase();
}

function formatDate(dateString: string, format: string): string {
  const date = new Date(dateString);
  
  switch (format) {
    case 'DD.MM.YYYY':
      return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    case 'DD/MM/YYYY':
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    case 'MM/DD/YYYY':
    default:
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  }
}

function formatCurrency(amount: number, currency: string): string {
  const formatters = {
    'USD': (amt: number) => `$${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    'EUR': (amt: number) => `€${amt.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`,
    'GBP': (amt: number) => `£${amt.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`,
    'JPY': (amt: number) => `¥${amt.toLocaleString('ja-JP', { minimumFractionDigits: 0 })}`
  };
  
  const formatter = formatters[currency] || formatters['USD'];
  return formatter(amount);
}