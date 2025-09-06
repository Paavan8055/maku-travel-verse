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
  const agent = new BaseAgent(supabaseClient, 'voice-interface-agent');
  
  try {
    StructuredLogger.info('Voice interface agent processing request', {
      userId,
      intent,
      agentId: 'voice-interface-agent'
    });

    switch (intent) {
      case 'start_voice_session':
        return await startVoiceSession(agent, userId, params);
      
      case 'process_voice_input':
        return await processVoiceInput(agent, userId, params);
      
      case 'generate_voice_response':
        return await generateVoiceResponse(agent, userId, params);
      
      case 'update_voice_preferences':
        return await updateVoicePreferences(agent, userId, params);
      
      case 'analyze_conversation_quality':
        return await analyzeConversationQuality(agent, userId, params);
      
      default:
        StructuredLogger.warn('Unknown intent for voice interface agent', { intent });
        return {
          success: false,
          error: 'Unknown intent for voice interface agent'
        };
    }
  } catch (error) {
    StructuredLogger.error('Voice interface agent error', { error: error.message, userId });
    return {
      success: false,
      error: error.message
    };
  }
};

async function startVoiceSession(
  agent: BaseAgent,
  userId: string,
  params: {
    sessionId: string;
    languageCode?: string;
    voicePreferences?: any;
  }
): Promise<any> {
  try {
    const { data: session, error } = await agent['supabase']
      .from('voice_interface_sessions')
      .insert({
        user_id: userId,
        session_id: params.sessionId,
        language_code: params.languageCode || 'en-US',
        voice_preferences: params.voicePreferences || {
          voice: 'neutral',
          speed: 1.0,
          pitch: 1.0
        },
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    await agent.logActivity(userId, 'voice_session_started', {
      sessionId: params.sessionId,
      languageCode: params.languageCode || 'en-US'
    });

    return {
      success: true,
      result: {
        session,
        welcomeMessage: generateWelcomeMessage(params.languageCode || 'en-US'),
        supportedCommands: getSupportedCommands(params.languageCode || 'en-US')
      },
      memoryUpdates: [{
        key: 'active_voice_session',
        data: {
          sessionId: params.sessionId,
          startedAt: new Date().toISOString(),
          languageCode: params.languageCode || 'en-US'
        }
      }]
    };
  } catch (error) {
    StructuredLogger.error('Failed to start voice session', { error: error.message, userId });
    throw error;
  }
}

async function processVoiceInput(
  agent: BaseAgent,
  userId: string,
  params: {
    sessionId: string;
    audioData?: string;
    transcript?: string;
    confidence?: number;
  }
): Promise<any> {
  try {
    // Get current session
    const { data: session, error: sessionError } = await agent['supabase']
      .from('voice_interface_sessions')
      .select('*')
      .eq('session_id', params.sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) throw sessionError;

    // Process the voice input
    let transcript = params.transcript;
    let confidence = params.confidence || 0.9;

    // If audio data is provided, simulate speech-to-text processing
    if (params.audioData && !transcript) {
      const speechToTextResult = await simulateSpeechToText(params.audioData, session.language_code);
      transcript = speechToTextResult.transcript;
      confidence = speechToTextResult.confidence;
    }

    if (!transcript) {
      return {
        success: false,
        error: 'No transcript available for processing'
      };
    }

    // Analyze intent from transcript
    const intentAnalysis = analyzeVoiceIntent(transcript, session.language_code);

    // Update session conversation history
    const updatedTranscript = [
      ...(session.conversation_transcript || []),
      {
        timestamp: new Date().toISOString(),
        type: 'user_input',
        transcript,
        confidence,
        intent: intentAnalysis.intent,
        entities: intentAnalysis.entities
      }
    ];

    const { error: updateError } = await agent['supabase']
      .from('voice_interface_sessions')
      .update({
        conversation_transcript: updatedTranscript,
        recognition_accuracy: confidence,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) throw updateError;

    await agent.logActivity(userId, 'voice_input_processed', {
      sessionId: params.sessionId,
      intent: intentAnalysis.intent,
      confidence
    });

    return {
      success: true,
      result: {
        transcript,
        confidence,
        intent: intentAnalysis.intent,
        entities: intentAnalysis.entities,
        suggestedResponse: generateSuggestedResponse(intentAnalysis, session.language_code),
        nextActions: determineNextActions(intentAnalysis)
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to process voice input', { error: error.message, userId });
    throw error;
  }
}

async function generateVoiceResponse(
  agent: BaseAgent,
  userId: string,
  params: {
    sessionId: string;
    responseText: string;
    voiceSettings?: any;
  }
): Promise<any> {
  try {
    // Get current session
    const { data: session, error: sessionError } = await agent['supabase']
      .from('voice_interface_sessions')
      .select('*')
      .eq('session_id', params.sessionId)
      .eq('user_id', userId)
      .single();

    if (sessionError) throw sessionError;

    // Generate voice response
    const voiceResponse = await simulateTextToSpeech(
      params.responseText,
      session.language_code,
      { ...session.voice_preferences, ...params.voiceSettings }
    );

    // Update conversation history
    const updatedTranscript = [
      ...(session.conversation_transcript || []),
      {
        timestamp: new Date().toISOString(),
        type: 'system_response',
        text: params.responseText,
        audioUrl: voiceResponse.audioUrl,
        duration: voiceResponse.duration
      }
    ];

    const { error: updateError } = await agent['supabase']
      .from('voice_interface_sessions')
      .update({
        conversation_transcript: updatedTranscript,
        audio_duration_seconds: (session.audio_duration_seconds || 0) + voiceResponse.duration,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) throw updateError;

    await agent.logActivity(userId, 'voice_response_generated', {
      sessionId: params.sessionId,
      responseLength: params.responseText.length,
      audioDuration: voiceResponse.duration
    });

    return {
      success: true,
      result: {
        audioUrl: voiceResponse.audioUrl,
        duration: voiceResponse.duration,
        text: params.responseText,
        voiceSettings: voiceResponse.settings
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to generate voice response', { error: error.message, userId });
    throw error;
  }
}

async function updateVoicePreferences(
  agent: BaseAgent,
  userId: string,
  params: {
    sessionId: string;
    preferences: {
      voice?: string;
      speed?: number;
      pitch?: number;
      volume?: number;
    };
  }
): Promise<any> {
  try {
    const { data: updatedSession, error } = await agent['supabase']
      .from('voice_interface_sessions')
      .update({
        voice_preferences: params.preferences,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', params.sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    await agent.logActivity(userId, 'voice_preferences_updated', {
      sessionId: params.sessionId,
      preferences: params.preferences
    });

    return {
      success: true,
      result: { 
        updatedPreferences: updatedSession.voice_preferences,
        confirmationMessage: 'Voice preferences updated successfully'
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to update voice preferences', { error: error.message, userId });
    throw error;
  }
}

async function analyzeConversationQuality(
  agent: BaseAgent,
  userId: string,
  params: { sessionId: string }
): Promise<any> {
  try {
    const { data: session, error } = await agent['supabase']
      .from('voice_interface_sessions')
      .select('*')
      .eq('session_id', params.sessionId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    const qualityAnalysis = analyzeSessionQuality(session);

    return {
      success: true,
      result: {
        qualityScore: qualityAnalysis.overallScore,
        metrics: qualityAnalysis.metrics,
        recommendations: qualityAnalysis.recommendations,
        conversationSummary: qualityAnalysis.summary
      }
    };
  } catch (error) {
    StructuredLogger.error('Failed to analyze conversation quality', { error: error.message, userId });
    throw error;
  }
}

async function simulateSpeechToText(audioData: string, languageCode: string): Promise<any> {
  // Simulate speech-to-text processing
  // In production, this would integrate with services like Google Speech-to-Text, AWS Transcribe, etc.
  
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing time
  
  const sampleTranscripts = [
    "I want to book a flight to Paris",
    "Can you help me find hotels in Tokyo?",
    "What's the weather like in London?",
    "I need to cancel my booking",
    "Show me my itinerary"
  ];
  
  const transcript = sampleTranscripts[Math.floor(Math.random() * sampleTranscripts.length)];
  const confidence = 0.85 + Math.random() * 0.15; // Random confidence between 0.85-1.0
  
  return {
    transcript,
    confidence: Math.round(confidence * 100) / 100
  };
}

async function simulateTextToSpeech(text: string, languageCode: string, voiceSettings: any): Promise<any> {
  // Simulate text-to-speech processing
  // In production, this would integrate with services like Google Text-to-Speech, Amazon Polly, etc.
  
  await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
  
  const estimatedDuration = Math.ceil(text.length * 0.1); // Rough estimate: 0.1 seconds per character
  const audioUrl = `https://example.com/audio/${Date.now()}.mp3`; // Mock URL
  
  return {
    audioUrl,
    duration: estimatedDuration,
    settings: voiceSettings
  };
}

function analyzeVoiceIntent(transcript: string, languageCode: string): any {
  // Simple intent analysis - in production, use NLP services like Dialogflow, LUIS, etc.
  const lowerTranscript = transcript.toLowerCase();
  
  let intent = 'unknown';
  const entities: any[] = [];
  
  if (lowerTranscript.includes('book') || lowerTranscript.includes('reserve')) {
    intent = 'booking_request';
    
    if (lowerTranscript.includes('flight')) entities.push({ type: 'service', value: 'flight' });
    if (lowerTranscript.includes('hotel')) entities.push({ type: 'service', value: 'hotel' });
    if (lowerTranscript.includes('car')) entities.push({ type: 'service', value: 'car_rental' });
    
    // Extract potential destinations
    const cities = ['paris', 'london', 'tokyo', 'new york', 'sydney', 'berlin'];
    cities.forEach(city => {
      if (lowerTranscript.includes(city)) {
        entities.push({ type: 'destination', value: city });
      }
    });
  } else if (lowerTranscript.includes('cancel')) {
    intent = 'cancellation_request';
  } else if (lowerTranscript.includes('help') || lowerTranscript.includes('support')) {
    intent = 'help_request';
  } else if (lowerTranscript.includes('weather')) {
    intent = 'weather_inquiry';
  } else if (lowerTranscript.includes('itinerary') || lowerTranscript.includes('booking')) {
    intent = 'booking_inquiry';
  }
  
  return { intent, entities };
}

function generateWelcomeMessage(languageCode: string): string {
  const messages = {
    'en-US': "Hello! I'm your travel assistant. You can ask me to book flights, find hotels, or help with your travel plans. How can I help you today?",
    'es-ES': "¡Hola! Soy tu asistente de viaje. Puedes pedirme que reserve vuelos, encuentre hoteles o te ayude con tus planes de viaje. ¿Cómo puedo ayudarte hoy?",
    'fr-FR': "Bonjour! Je suis votre assistant de voyage. Vous pouvez me demander de réserver des vols, trouver des hôtels ou vous aider avec vos projets de voyage. Comment puis-je vous aider aujourd'hui?",
    'de-DE': "Hallo! Ich bin Ihr Reiseassistent. Sie können mich bitten, Flüge zu buchen, Hotels zu finden oder bei Ihren Reiseplänen zu helfen. Wie kann ich Ihnen heute helfen?"
  };
  
  return messages[languageCode] || messages['en-US'];
}

function getSupportedCommands(languageCode: string): string[] {
  const commands = {
    'en-US': [
      "Book a flight to [destination]",
      "Find hotels in [city]",
      "Show my bookings",
      "Cancel my reservation",
      "Get weather for [location]",
      "Help me plan a trip"
    ],
    'es-ES': [
      "Reservar un vuelo a [destino]",
      "Encontrar hoteles en [ciudad]",
      "Mostrar mis reservas",
      "Cancelar mi reserva",
      "Obtener el clima para [ubicación]",
      "Ayúdame a planificar un viaje"
    ]
  };
  
  return commands[languageCode] || commands['en-US'];
}

function generateSuggestedResponse(intentAnalysis: any, languageCode: string): string {
  const responses = {
    'en-US': {
      'booking_request': "I'd be happy to help you with your booking. Let me find the best options for you.",
      'cancellation_request': "I can help you cancel your reservation. Let me check your bookings.",
      'help_request': "I'm here to help! You can ask me about bookings, travel information, or planning assistance.",
      'weather_inquiry': "I can check the weather for you. Which location are you interested in?",
      'booking_inquiry': "Let me pull up your booking information for you.",
      'unknown': "I'm not sure I understood that. Could you please rephrase your request?"
    }
  };
  
  const languageResponses = responses[languageCode] || responses['en-US'];
  return languageResponses[intentAnalysis.intent] || languageResponses['unknown'];
}

function determineNextActions(intentAnalysis: any): string[] {
  const actions = {
    'booking_request': ['search_options', 'collect_preferences', 'show_results'],
    'cancellation_request': ['fetch_bookings', 'confirm_cancellation'],
    'help_request': ['show_capabilities', 'offer_assistance'],
    'weather_inquiry': ['get_location', 'fetch_weather'],
    'booking_inquiry': ['fetch_user_bookings', 'display_itinerary'],
    'unknown': ['clarify_request', 'suggest_alternatives']
  };
  
  return actions[intentAnalysis.intent] || actions['unknown'];
}

function analyzeSessionQuality(session: any): any {
  const transcript = session.conversation_transcript || [];
  const userInputs = transcript.filter(t => t.type === 'user_input');
  const systemResponses = transcript.filter(t => t.type === 'system_response');
  
  // Calculate metrics
  const averageConfidence = userInputs.length > 0 
    ? userInputs.reduce((sum, input) => sum + (input.confidence || 0), 0) / userInputs.length
    : 0;
  
  const conversationLength = transcript.length;
  const recognitionQuality = averageConfidence;
  const responseTime = systemResponses.length; // Simplified metric
  
  const overallScore = Math.round((recognitionQuality * 0.4 + (conversationLength > 0 ? 0.3 : 0) + (responseTime > 0 ? 0.3 : 0)) * 100);
  
  const metrics = {
    conversationLength,
    averageRecognitionConfidence: Math.round(averageConfidence * 100) / 100,
    totalAudioDuration: session.audio_duration_seconds || 0,
    userInteractions: userInputs.length,
    systemResponses: systemResponses.length
  };
  
  const recommendations = [];
  if (averageConfidence < 0.8) {
    recommendations.push("Consider speaking more clearly or checking microphone quality");
  }
  if (conversationLength < 3) {
    recommendations.push("Session was quite short - consider extending conversation for better experience");
  }
  
  const summary = {
    totalExchanges: Math.floor(conversationLength / 2),
    primaryIntents: extractPrimaryIntents(userInputs),
    sessionDuration: estimateSessionDuration(transcript)
  };
  
  return {
    overallScore,
    metrics,
    recommendations,
    summary
  };
}

function extractPrimaryIntents(userInputs: any[]): string[] {
  const intents = userInputs.map(input => input.intent).filter(Boolean);
  const intentCounts: Record<string, number> = {};
  
  intents.forEach(intent => {
    intentCounts[intent] = (intentCounts[intent] || 0) + 1;
  });
  
  return Object.entries(intentCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([intent]) => intent);
}

function estimateSessionDuration(transcript: any[]): number {
  if (transcript.length < 2) return 0;
  
  const firstTimestamp = new Date(transcript[0].timestamp);
  const lastTimestamp = new Date(transcript[transcript.length - 1].timestamp);
  
  return Math.round((lastTimestamp.getTime() - firstTimestamp.getTime()) / 1000); // Duration in seconds
}