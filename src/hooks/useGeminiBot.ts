import { useState, useCallback } from 'react';
import { geminiBot, GeminiResponse } from '@/lib/gemini';
import { toast } from 'sonner';

interface GeminiResult extends GeminiResponse {
  id: string;
  timestamp: Date;
  query: string;
  type?: 'travel_search' | 'recommendation' | 'itinerary' | 'general';
}

interface UseGeminiBotReturn {
  results: GeminiResult[];
  isProcessing: boolean;
  processQuery: (query: string, type?: string, context?: any) => Promise<GeminiResponse>;
  searchFlights: (searchParams: any) => Promise<GeminiResponse>;
  recommendHotels: (destination: string, preferences?: any) => Promise<GeminiResponse>;
  planItinerary: (destination: string, duration: number, interests?: string[]) => Promise<GeminiResponse>;
  clearResults: () => void;
  dismissResult: (resultId: string) => void;
}

export const useGeminiBot = (): UseGeminiBotReturn => {
  const [results, setResults] = useState<GeminiResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addResult = useCallback((query: string, response: GeminiResponse, type?: string) => {
    const result: GeminiResult = {
      ...response,
      id: Date.now().toString(),
      timestamp: new Date(),
      query,
      type: type as any
    };
    
    setResults(prev => [result, ...prev].slice(0, 50)); // Keep last 50 results
    return result;
  }, []);

  const processQuery = useCallback(async (
    query: string, 
    type?: string, 
    context?: any
  ): Promise<GeminiResponse> => {
    setIsProcessing(true);
    
    try {
      const response = await geminiBot.processQuery(query, context);
      addResult(query, response, type);
      
      if (!response.success) {
        toast.error('AI Processing Error', {
          description: 'The AI assistant encountered an issue processing your request.'
        });
      }
      
      return response;
    } catch (error) {
      console.error('Gemini bot error:', error);
      const errorResponse: GeminiResponse = {
        success: false,
        message: 'Unable to process your request at this time. Please try again.',
        confidence: 0
      };
      
      addResult(query, errorResponse, type);
      
      toast.error('Connection Error', {
        description: 'Unable to connect to the AI assistant.'
      });
      
      return errorResponse;
    } finally {
      setIsProcessing(false);
    }
  }, [addResult]);

  const searchFlights = useCallback(async (searchParams: any): Promise<GeminiResponse> => {
    const query = `Search flights from ${searchParams.origin} to ${searchParams.destination}`;
    setIsProcessing(true);
    
    try {
      const response = await geminiBot.searchFlights(searchParams);
      addResult(query, response, 'travel_search');
      return response;
    } catch (error) {
      console.error('Flight search error:', error);
      const errorResponse: GeminiResponse = {
        success: false,
        message: 'Unable to search flights at this time.',
        confidence: 0
      };
      addResult(query, errorResponse, 'travel_search');
      return errorResponse;
    } finally {
      setIsProcessing(false);
    }
  }, [addResult]);

  const recommendHotels = useCallback(async (
    destination: string, 
    preferences?: any
  ): Promise<GeminiResponse> => {
    const query = `Recommend hotels in ${destination}`;
    setIsProcessing(true);
    
    try {
      const response = await geminiBot.recommendHotels(destination, preferences);
      addResult(query, response, 'recommendation');
      return response;
    } catch (error) {
      console.error('Hotel recommendation error:', error);
      const errorResponse: GeminiResponse = {
        success: false,
        message: 'Unable to recommend hotels at this time.',
        confidence: 0
      };
      addResult(query, errorResponse, 'recommendation');
      return errorResponse;
    } finally {
      setIsProcessing(false);
    }
  }, [addResult]);

  const planItinerary = useCallback(async (
    destination: string, 
    duration: number, 
    interests?: string[]
  ): Promise<GeminiResponse> => {
    const query = `Plan ${duration}-day itinerary for ${destination}`;
    setIsProcessing(true);
    
    try {
      const response = await geminiBot.planItinerary(destination, duration, interests);
      addResult(query, response, 'itinerary');
      return response;
    } catch (error) {
      console.error('Itinerary planning error:', error);
      const errorResponse: GeminiResponse = {
        success: false,
        message: 'Unable to plan itinerary at this time.',
        confidence: 0
      };
      addResult(query, errorResponse, 'itinerary');
      return errorResponse;
    } finally {
      setIsProcessing(false);
    }
  }, [addResult]);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  const dismissResult = useCallback((resultId: string) => {
    setResults(prev => prev.filter(result => result.id !== resultId));
  }, []);

  return {
    results,
    isProcessing,
    processQuery,
    searchFlights,
    recommendHotels,
    planItinerary,
    clearResults,
    dismissResult
  };
};