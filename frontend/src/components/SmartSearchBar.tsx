/**
 * AI-Powered Smart Search Bar
 * Natural language search with AI personalization
 */

import { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getSmartPrefill, detectPersona } from '@/services/aiPersonalizationApi';
import { useAuth } from '@/features/auth/context/AuthContext';

interface SmartSearchBarProps {
  onSearch?: (query: string, suggestions: any) => void;
  placeholder?: string;
  className?: string;
}

const SmartSearchBar = ({ 
  onSearch, 
  placeholder = "Try 'Beach resort in Bali for 2 weeks under $2000'...",
  className = ""
}: SmartSearchBarProps) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any>(null);
  const [showPersonaTip, setShowPersonaTip] = useState(false);

  // Detect user persona on mount
  useEffect(() => {
    if (user?.id) {
      detectUserPersona();
    }
  }, [user]);

  const detectUserPersona = async () => {
    try {
      const persona = await detectPersona({
        user_id: user?.id || 'guest',
        search_history: [],
        booking_history: []
      });
      
      if (persona.confidence > 0.7) {
        setShowPersonaTip(true);
        setTimeout(() => setShowPersonaTip(false), 5000);
      }
    } catch (error) {
      console.error('Failed to detect persona:', error);
    }
  };

  const handleSmartSearch = async () => {
    if (!query.trim()) return;

    setIsAnalyzing(true);

    try {
      // Get AI-powered suggestions
      const suggestions = await getSmartPrefill({
        user_id: user?.id || 'guest',
        search_context: {
          type: 'hotel', // Detect from query in production
          partial_input: query
        }
      });

      setAiSuggestions(suggestions);

      // Parse natural language query
      const parsedSearch = parseNaturalLanguageQuery(query, suggestions);

      if (onSearch) {
        onSearch(query, parsedSearch);
      } else {
        // Default behavior: navigate to search results
        navigateToSearch(parsedSearch);
      }
    } catch (error) {
      console.error('Smart search failed:', error);
      
      // Fallback to basic search
      const basicSearch = parseBasicQuery(query);
      if (onSearch) {
        onSearch(query, basicSearch);
      } else {
        navigateToSearch(basicSearch);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const parseNaturalLanguageQuery = (text: string, suggestions: any) => {
    // Extract destination
    const destination = extractDestination(text) || suggestions.suggestions.destination;

    // Extract budget
    const budget = extractBudget(text) || suggestions.suggestions.budget_range;

    // Extract duration
    const duration = extractDuration(text);

    // Extract dates from duration if provided
    const dates = duration ? calculateDatesFromDuration(duration) : suggestions.suggestions.dates;

    // Extract guests
    const guests = extractGuests(text) || suggestions.suggestions.guests;

    return {
      destination,
      budget,
      duration,
      dates,
      guests,
      preferences: suggestions.suggestions.preferences,
      ai_enhanced: true
    };
  };

  const extractDestination = (text: string): string | null => {
    // Common destination patterns
    const patterns = [
      /(?:in|to|at)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:for|in)/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const extractBudget = (text: string): { min: number; max: number } | null => {
    const budgetMatch = text.match(/(?:under|below|less than)\s*\$?(\d+(?:,\d{3})*)/i);
    if (budgetMatch) {
      const maxBudget = parseInt(budgetMatch[1].replace(/,/g, ''));
      return { min: 0, max: maxBudget };
    }

    const rangeMatch = text.match(/\$?(\d+(?:,\d{3})*)\s*(?:to|-)\s*\$?(\d+(?:,\d{3})*)/i);
    if (rangeMatch) {
      return {
        min: parseInt(rangeMatch[1].replace(/,/g, '')),
        max: parseInt(rangeMatch[2].replace(/,/g, ''))
      };
    }

    return null;
  };

  const extractDuration = (text: string): number | null => {
    const durationMatch = text.match(/(\d+)\s*(?:day|night|week)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1]);
      const unit = durationMatch[0].toLowerCase();
      
      if (unit.includes('week')) {
        return value * 7;
      }
      return value;
    }

    return null;
  };

  const extractGuests = (text: string): { adults: number; children: number } | null => {
    const guestsMatch = text.match(/(\d+)\s*(?:person|people|guest|adult)/i);
    if (guestsMatch) {
      return { adults: parseInt(guestsMatch[1]), children: 0 };
    }

    return null;
  };

  const calculateDatesFromDuration = (days: number) => {
    const today = new Date();
    const checkin = new Date(today);
    checkin.setDate(today.getDate() + 14); // Default 2 weeks from now
    
    const checkout = new Date(checkin);
    checkout.setDate(checkin.getDate() + days);

    return {
      checkin: checkin.toISOString().split('T')[0],
      checkout: checkout.toISOString().split('T')[0]
    };
  };

  const parseBasicQuery = (text: string) => {
    return {
      destination: extractDestination(text) || text,
      budget: extractBudget(text),
      duration: extractDuration(text),
      guests: extractGuests(text) || { adults: 2, children: 0 },
      ai_enhanced: false
    };
  };

  const navigateToSearch = (parsedSearch: any) => {
    const params = new URLSearchParams();
    
    if (parsedSearch.destination) {
      params.set('destination', parsedSearch.destination);
    }
    
    if (parsedSearch.dates?.checkin) {
      params.set('checkIn', parsedSearch.dates.checkin);
    }
    
    if (parsedSearch.dates?.checkout) {
      params.set('checkOut', parsedSearch.dates.checkout);
    }
    
    if (parsedSearch.guests) {
      params.set('adults', parsedSearch.guests.adults.toString());
      params.set('children', parsedSearch.guests.children.toString());
    }
    
    if (parsedSearch.budget) {
      params.set('minPrice', parsedSearch.budget.min.toString());
      params.set('maxPrice', parsedSearch.budget.max.toString());
    }

    params.set('aiSearch', 'true');

    window.location.href = `/search/hotels?${params.toString()}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSmartSearch();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Persona Tip */}
      {showPersonaTip && (
        <div className="absolute -top-12 left-0 right-0 z-10">
          <Badge className="bg-purple-100 text-purple-800 border-purple-300">
            <Sparkles className="w-3 h-3 mr-1" />
            AI is learning your preferences for better results
          </Badge>
        </div>
      )}

      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {isAnalyzing ? (
            <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5 text-orange-500" />
          )}
        </div>

        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="pl-12 pr-32 h-14 text-base border-2 border-gray-200 focus:border-orange-500 rounded-full shadow-md"
          disabled={isAnalyzing}
        />

        <Button
          onClick={handleSmartSearch}
          disabled={!query.trim() || isAnalyzing}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
        >
          <Search className="h-4 w-4 mr-2" />
          {isAnalyzing ? 'Analyzing...' : 'Search'}
        </Button>
      </div>

      {/* AI Badge */}
      <div className="absolute -bottom-8 left-0 flex items-center gap-2 text-xs text-gray-500">
        <Sparkles className="w-3 h-3" />
        <span>Powered by AI • Try natural language like "Paris for a week under $1500"</span>
      </div>
    </div>
  );
};

export default SmartSearchBar;
