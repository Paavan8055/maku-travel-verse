import { useState, useMemo, useCallback, useEffect } from 'react';

interface ContextualFilter {
  id: string;
  label: string;
  type: 'price' | 'time' | 'stops' | 'airline' | 'schedule';
  relevanceScore: number;
  isActive: boolean;
  suggestedReason: string;
}

interface UserContext {
  location?: { timezone: string; country: string };
  deviceInfo?: { type: 'mobile' | 'desktop' | 'tablet'; connection: 'slow' | 'medium' | 'fast' };
  searchContext?: { origin: string; destination: string; tripType: string; passengers: number };
  timeConstraints?: { departureWindow?: [string, string]; flexibility: 'rigid' | 'moderate' | 'flexible' };
  preferences?: { budgetRange?: [number, number]; previousAirlines?: string[] };
}

interface SmartFilterSuggestion {
  filterType: string;
  value: any;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  potentialSavings?: number;
  timeImpact?: number;
}

export const useContextAwareFilters = (userContext?: UserContext) => {
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [suggestedFilters, setSuggestedFilters] = useState<SmartFilterSuggestion[]>([]);
  const [userInteractionPattern, setUserInteractionPattern] = useState<'explorer' | 'focused' | 'price_sensitive'>('focused');

  // Generate intelligent filter suggestions based on context
  const generateSmartSuggestions = useCallback(() => {
    if (!userContext?.searchContext) return [];

    const suggestions: SmartFilterSuggestion[] = [];
    const { origin, destination, tripType, passengers } = userContext.searchContext;

    // Price-based suggestions
    if (userContext.preferences?.budgetRange) {
      suggestions.push({
        filterType: 'price_range',
        value: userContext.preferences.budgetRange,
        priority: 'high',
        reasoning: 'Based on your budget preferences',
        potentialSavings: 150
      });
    }

    // Route-specific suggestions
    const isLongHaul = ['LAX', 'JFK', 'LHR', 'NRT', 'SIN'].some(code => 
      origin.includes(code) || destination.includes(code)
    );

    if (isLongHaul) {
      suggestions.push({
        filterType: 'stops',
        value: 'direct_preferred',
        priority: 'medium',
        reasoning: 'Direct flights recommended for long-haul routes',
        timeImpact: -120
      });
    }

    // Mobile-optimized suggestions
    if (userContext.deviceInfo?.type === 'mobile') {
      suggestions.push({
        filterType: 'top_airlines',
        value: 'major_carriers',
        priority: 'medium',
        reasoning: 'Reliable carriers for mobile booking confidence'
      });
    }

    // Group travel suggestions
    if (passengers > 3) {
      suggestions.push({
        filterType: 'group_discounts',
        value: 'family_friendly',
        priority: 'high',
        reasoning: 'Family-friendly airlines with group benefits',
        potentialSavings: 200
      });
    }

    // Time-sensitive suggestions
    if (userContext.timeConstraints?.flexibility === 'rigid') {
      suggestions.push({
        filterType: 'departure_time',
        value: userContext.timeConstraints.departureWindow,
        priority: 'high',
        reasoning: 'Matches your specific time requirements'
      });
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [userContext]);

  // Auto-apply contextual filters
  const autoApplyIntelligentFilters = useCallback(() => {
    const suggestions = generateSmartSuggestions();
    const autoFilters: Record<string, any> = {};

    // Auto-apply high-priority, non-intrusive filters
    suggestions
      .filter(s => s.priority === 'high' && s.filterType !== 'price_range')
      .forEach(suggestion => {
        autoFilters[suggestion.filterType] = suggestion.value;
      });

    setActiveFilters(prev => ({ ...prev, ...autoFilters }));
    setSuggestedFilters(suggestions);
  }, [generateSmartSuggestions]);

  // Contextual filter options based on route and user profile
  const getContextualFilterOptions = useMemo(() => {
    const baseFilters = [
      { id: 'price', label: 'Price Range', type: 'price' as const },
      { id: 'duration', label: 'Flight Duration', type: 'time' as const },
      { id: 'stops', label: 'Number of Stops', type: 'stops' as const },
      { id: 'airline', label: 'Airlines', type: 'airline' as const },
      { id: 'departure', label: 'Departure Time', type: 'schedule' as const }
    ];

    return baseFilters.map(filter => {
      const suggestions = suggestedFilters.find(s => s.filterType.includes(filter.id));
      return {
        ...filter,
        relevanceScore: suggestions ? (suggestions.priority === 'high' ? 1 : 0.7) : 0.5,
        isActive: activeFilters[filter.id] !== undefined,
        suggestedReason: suggestions?.reasoning || ''
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [activeFilters, suggestedFilters]);

  // Smart filter combinations that work well together
  const getRecommendedCombinations = useCallback(() => {
    const combinations = [];

    // Value seeker combination
    combinations.push({
      name: 'Best Value',
      filters: { price: 'budget', stops: 'up_to_1', timing: 'flexible' },
      description: 'Balance cost savings with reasonable convenience',
      estimatedSavings: 180
    });

    // Time optimizer combination
    combinations.push({
      name: 'Time Saver',
      filters: { stops: 'direct_only', departure: 'optimal_times', airline: 'reliable' },
      description: 'Minimize travel time and maximize schedule reliability',
      timeReduction: 90
    });

    // Family traveler combination
    if (userContext?.searchContext?.passengers && userContext.searchContext.passengers > 2) {
      combinations.push({
        name: 'Family Friendly',
        filters: { airline: 'family_services', seats: 'together', timing: 'convenient' },
        description: 'Airlines known for excellent family services and seating',
        additionalBenefits: ['Priority boarding', 'Child meals', 'Entertainment']
      });
    }

    return combinations;
  }, [userContext]);

  // Track filter effectiveness for ML improvement
  const trackFilterEffectiveness = useCallback((filterId: string, userAction: 'applied' | 'removed' | 'ignored') => {
    // This would integrate with analytics to improve future suggestions
    console.log(`Filter ${filterId} was ${userAction}`, {
      context: userContext,
      currentPattern: userInteractionPattern,
      timestamp: new Date().toISOString()
    });
  }, [userContext, userInteractionPattern]);

  // Auto-initialization
  useEffect(() => {
    autoApplyIntelligentFilters();
  }, [autoApplyIntelligentFilters]);

  return {
    activeFilters,
    setActiveFilters,
    suggestedFilters,
    getContextualFilterOptions,
    getRecommendedCombinations,
    autoApplyIntelligentFilters,
    trackFilterEffectiveness,
    userInteractionPattern,
    setUserInteractionPattern
  };
};