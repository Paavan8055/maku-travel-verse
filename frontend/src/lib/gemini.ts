import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || 'your-gemini-api-key');

// Get the model
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export interface GeminiResponse {
  success: boolean;
  message: string;
  data?: any;
  suggestions?: string[];
  confidence: number;
}

export class GeminiTravelBot {
  private model = model;

  async processQuery(query: string, context?: any): Promise<GeminiResponse> {
    try {
      const travelPrompt = `
        You are MAKU.Travel's AI assistant specialized in travel booking and recommendations.
        Current context: ${context ? JSON.stringify(context) : 'No specific context'}
        
        User query: ${query}
        
        Please provide helpful travel assistance, booking guidance, or answer travel-related questions.
        Focus on being helpful, accurate, and travel-focused.
      `;

      const result = await this.model.generateContent(travelPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        success: true,
        message: text,
        confidence: 0.9,
        suggestions: this.extractSuggestions(text)
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return {
        success: false,
        message: 'I apologize, but I encountered an issue processing your request. Please try again.',
        confidence: 0.1
      };
    }
  }

  async searchFlights(searchParams: any): Promise<GeminiResponse> {
    const prompt = `
      Help the user search for flights with these parameters:
      ${JSON.stringify(searchParams)}
      
      Provide search tips, recommendations for better deals, and general flight booking advice.
    `;

    return this.processQuery(prompt, { type: 'flight_search', params: searchParams });
  }

  async recommendHotels(destination: string, preferences?: any): Promise<GeminiResponse> {
    const prompt = `
      Recommend hotels in ${destination} based on preferences: ${JSON.stringify(preferences || {})}
      
      Provide hotel recommendations, area suggestions, and booking tips.
    `;

    return this.processQuery(prompt, { type: 'hotel_recommendation', destination, preferences });
  }

  async planItinerary(destination: string, duration: number, interests?: string[]): Promise<GeminiResponse> {
    const prompt = `
      Create a ${duration}-day itinerary for ${destination}.
      User interests: ${interests?.join(', ') || 'general tourism'}
      
      Provide a detailed day-by-day plan with activities, restaurants, and travel tips.
    `;

    return this.processQuery(prompt, { type: 'itinerary_planning', destination, duration, interests });
  }

  private extractSuggestions(text: string): string[] {
    // Simple suggestion extraction - can be enhanced
    const suggestions = [];
    if (text.includes('flight')) suggestions.push('Search for flights');
    if (text.includes('hotel')) suggestions.push('Find hotels');
    if (text.includes('activity')) suggestions.push('Browse activities');
    if (text.includes('restaurant')) suggestions.push('Find restaurants');
    
    return suggestions.slice(0, 3); // Limit to 3 suggestions
  }
}

export const geminiBot = new GeminiTravelBot();