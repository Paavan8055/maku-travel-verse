// TODO: Replace with your Supabase edge function URL
import logger from '@/utils/logger';
const MAKU_BOT_API_URL = '/api/maku-bot'; // This will be a Supabase Edge Function

interface MakuBotContext {
  vertical: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
  recentMessages?: Array<{
    text: string;
    from: 'user' | 'bot';
  }>;
  userLocation?: string;
  searchContext?: {
    destination?: string;
    dates?: string;
    travelers?: number;
  };
}

interface MakuBotResponse {
  reply: string;
  suggestions?: string[];
  error?: string;
}

/**
 * Send a message to Maku Bot and get AI-powered travel assistance
 */
export const sendToMakuBot = async (
  message: string,
  context: MakuBotContext
): Promise<string> => {
  try {
    const response = await fetch(MAKU_BOT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        context,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MakuBotResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.reply || 'Sorry, I couldn\'t process that request.';
  } catch (error) {
    logger.error('MakuBot API Error:', error);
    
    // Fallback responses based on context
    const fallbackResponses = {
      Family: "I'd love to help you plan a family adventure! Try asking about kid-friendly destinations or family accommodations.",
      Solo: "Solo travel is amazing! I can help you find safe destinations and unique experiences perfect for solo travelers.",
      Pet: "Traveling with pets requires special planning! I can suggest pet-friendly hotels and activities for you and your furry friend.",
      Spiritual: "Spiritual journeys are transformative! I can recommend retreat centers, meditation spots, and sacred destinations."
    };

    return fallbackResponses[context.vertical] || 
           "I'm having trouble connecting right now, but I'm here to help with your travel planning! Please try again.";
  }
};

/**
 * Retry wrapper for better reliability
 */
export const sendToMakuBotWithRetry = async (
  message: string,
  context: MakuBotContext,
  maxRetries: number = 2
): Promise<string> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await sendToMakuBot(message, context);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, then 2s
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  logger.error(`MakuBot failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
};