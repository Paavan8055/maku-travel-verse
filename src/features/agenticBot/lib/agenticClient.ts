// Agentic Bot Client - Handles AI-powered travel planning and booking automation
import logger from '@/utils/logger';

interface AgenticTaskParams {
  userId?: string;
  vertical?: 'Family' | 'Solo' | 'Pet' | 'Spiritual';
  destination?: string;
  dates?: string;
  budget?: number;
  preferences?: string;
  bookingId?: string;
  adjustmentType?: string;
}

interface AgenticResponse {
  success: boolean;
  message: string;
  actions?: Array<{
    type: 'search' | 'book' | 'monitor' | 'adjust';
    description: string;
    params: any;
    estimated_time: number;
  }>;
  results?: any;
  error?: string;
}

/**
 * Execute an agentic task using AI chain-of-thought reasoning
 */
export const runAgenticTask = async (
  intent: string,
  params: AgenticTaskParams
): Promise<AgenticResponse> => {
  try {
    const response = await fetch('/api/agentic-bot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent,
        params,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: AgenticResponse = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    logger.error('Agentic Bot API Error:', error);
    
    // Fallback responses based on intent
    const fallbackResponses: Record<string, string> = {
      plan_trip: "I'm ready to help plan your trip! Let me search for the best options in your vertical.",
      monitor_trips: "I'll keep watching for price drops and better deals on your bookings.",
      adjust_booking: "I can help optimize your existing bookings for better prices or upgrades.",
      monitor_prices: "Price monitoring activated! I'll notify you of any significant changes."
    };

    return {
      success: false,
      message: fallbackResponses[intent] || "I'm having trouble right now, but I'm here to help with your travel planning!",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get status of agentic tasks for a user
 */
export const getAgenticTaskStatus = async (userId: string): Promise<any[]> => {
  try {
    const response = await fetch(`/api/agentic-status?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch agentic task status:', error);
    return [];
  }
};

/**
 * Cancel a running agentic task
 */
export const cancelAgenticTask = async (taskId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/agentic-task/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    logger.error('Failed to cancel agentic task:', error);
    return false;
  }
};

/**
 * Build agentic prompt for OpenAI with chain-of-thought reasoning
 */
export const buildAgenticPrompt = (intent: string, params: AgenticTaskParams): string => {
  const basePrompt = `You are Maku, an advanced AI travel agent with autonomous booking capabilities. 
Use chain-of-thought reasoning to plan and execute travel tasks.

CONTEXT:
- User Vertical: ${params.vertical || 'General'}
- Intent: ${intent}
- Current Date: ${new Date().toISOString().split('T')[0]}

AVAILABLE ACTIONS:
1. search_flights(origin, destination, dates, passengers)
2. search_hotels(destination, checkin, checkout, guests)
3. search_activities(destination, type, dates)
4. book_flight(flight_id, passenger_details)
5. book_hotel(hotel_id, room_details)
6. monitor_prices(booking_type, criteria)
7. adjust_booking(booking_id, changes)

REASONING PROCESS:
1. Understand the user's intent and constraints
2. Break down the task into specific actions
3. Consider the user's vertical preferences
4. Plan the optimal sequence of API calls
5. Provide clear next steps

Task Parameters: ${JSON.stringify(params, null, 2)}

Please provide a structured response with:
- reasoning: Step-by-step thought process
- actions: Array of specific actions to take
- estimated_time: How long this will take
- user_message: What to tell the user`;

  return basePrompt;
};

/**
 * Retry wrapper for better reliability
 */
export const runAgenticTaskWithRetry = async (
  intent: string,
  params: AgenticTaskParams,
  maxRetries: number = 2
): Promise<AgenticResponse> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await runAgenticTask(intent, params);
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: wait 1s, then 2s
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
  }

  logger.error(`Agentic Bot failed after ${maxRetries} attempts:`, lastError);
  throw lastError;
};