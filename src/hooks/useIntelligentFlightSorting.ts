import { useState, useMemo, useCallback, useEffect } from 'react';

interface FlightData {
  id?: string;
  airline: string;
  price: number;
  duration: number | string;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  reliability?: number;
  demandScore?: number;
  bookingVelocity?: number;
  priceVolatility?: number;
  userPreferenceScore?: number;
}

interface SortingMetrics {
  valueScore: number;
  timeOptimized: number;
  priceToValueRatio: number;
  reliabilityScore: number;
  demandIndicator: number;
}

interface TravelerContext {
  tripPurpose?: 'business' | 'leisure' | 'family';
  priceFlexibility?: 'budget' | 'moderate' | 'premium';
  timePreference?: 'fastest' | 'convenient' | 'flexible';
  previousBookings?: string[];
  searchHistory?: string[];
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  connectionSpeed?: 'slow' | 'medium' | 'fast';
}

export const useIntelligentFlightSorting = (
  flights: FlightData[],
  context?: TravelerContext
) => {
  const [sortingMode, setSortingMode] = useState<'intelligent' | 'price' | 'duration' | 'departure'>('intelligent');
  const [behaviorPattern, setBehaviorPattern] = useState<'explorer' | 'optimizer' | 'expediter'>('optimizer');

  // Calculate intelligent metrics for each flight
  const calculateFlightMetrics = useCallback((flight: FlightData): SortingMetrics => {
    const durationMinutes = typeof flight.duration === 'string' 
      ? parseInt(flight.duration) 
      : flight.duration;

    // Value score considers price vs. service quality
    const valueScore = (1000 - flight.price) / 10 + 
                      (flight.reliability || 8) * 10 +
                      (flight.stops === 0 ? 20 : -5 * flight.stops);

    // Time optimization considers both duration and schedule convenience
    const timeOptimized = (300 - durationMinutes) / 3 +
                         (flight.stops === 0 ? 25 : 0);

    // Price-to-value ratio with smart weighting
    const priceToValueRatio = (valueScore / flight.price) * 1000;

    // Reliability includes on-time performance and airline reputation
    const reliabilityScore = (flight.reliability || 8) * 10 +
                           (flight.stops === 0 ? 15 : 0);

    // Demand indicator shows booking pressure
    const demandIndicator = (flight.demandScore || 5) * 10 +
                           (flight.bookingVelocity || 1) * 5;

    return {
      valueScore,
      timeOptimized,
      priceToValueRatio,
      reliabilityScore,
      demandIndicator
    };
  }, []);

  // Context-aware weighting based on traveler profile
  const getContextWeights = useCallback((context?: TravelerContext) => {
    const defaultWeights = { value: 0.3, time: 0.25, price: 0.2, reliability: 0.15, demand: 0.1 };

    if (!context) return defaultWeights;

    switch (context.tripPurpose) {
      case 'business':
        return { value: 0.2, time: 0.4, price: 0.1, reliability: 0.25, demand: 0.05 };
      case 'family':
        return { value: 0.25, time: 0.15, price: 0.35, reliability: 0.2, demand: 0.05 };
      case 'leisure':
      default:
        return { value: 0.35, time: 0.2, price: 0.25, reliability: 0.15, demand: 0.05 };
    }
  }, []);

  // Machine learning-inspired scoring algorithm
  const intelligentSort = useMemo(() => {
    if (sortingMode !== 'intelligent') {
      // Traditional sorting fallbacks
      switch (sortingMode) {
        case 'price':
          return [...flights].sort((a, b) => a.price - b.price);
        case 'duration':
          const getDuration = (f: FlightData) => typeof f.duration === 'string' ? parseInt(f.duration) : f.duration;
          return [...flights].sort((a, b) => getDuration(a) - getDuration(b));
        case 'departure':
          return [...flights].sort((a, b) => a.departureTime.localeCompare(b.departureTime));
        default:
          return flights;
      }
    }

    const weights = getContextWeights(context);
    
    return [...flights]
      .map(flight => {
        const metrics = calculateFlightMetrics(flight);
        
        // Composite intelligent score
        const intelligentScore = 
          metrics.valueScore * weights.value +
          metrics.timeOptimized * weights.time +
          metrics.priceToValueRatio * weights.price +
          metrics.reliabilityScore * weights.reliability +
          metrics.demandIndicator * weights.demand;

        return { flight, score: intelligentScore, metrics };
      })
      .sort((a, b) => b.score - a.score)
      .map(item => item.flight);
  }, [flights, sortingMode, context, calculateFlightMetrics, getContextWeights]);

  // Auto-detect user behavior pattern based on interaction
  const updateBehaviorPattern = useCallback((interactions: string[]) => {
    const priceClicks = interactions.filter(i => i.includes('price')).length;
    const timeClicks = interactions.filter(i => i.includes('time')).length;
    const detailClicks = interactions.filter(i => i.includes('detail')).length;

    if (priceClicks > timeClicks && priceClicks > detailClicks) {
      setBehaviorPattern('optimizer');
    } else if (timeClicks > priceClicks) {
      setBehaviorPattern('expediter');
    } else {
      setBehaviorPattern('explorer');
    }
  }, []);

  // Get personalized recommendations
  const getRecommendations = useCallback((topFlights: FlightData[]) => {
    if (topFlights.length < 3) return [];

    const recommendations = [];
    
    // Best value recommendation
    const valueLeader = topFlights.find(f => {
      const metrics = calculateFlightMetrics(f);
      return metrics.priceToValueRatio > 15;
    });
    
    if (valueLeader) {
      recommendations.push({
        flight: valueLeader,
        type: 'best_value',
        reason: 'Excellent price-to-value ratio with reliable service'
      });
    }

    // Time-optimized recommendation
    const timeOptimal = topFlights.find(f => f.stops === 0 && 
      (typeof f.duration === 'number' ? f.duration : parseInt(f.duration)) < 180);
    
    if (timeOptimal) {
      recommendations.push({
        flight: timeOptimal,
        type: 'time_saver',
        reason: 'Fastest option with direct routing'
      });
    }

    // High-demand alert
    const highDemand = topFlights.find(f => (f.demandScore || 5) > 8);
    
    if (highDemand) {
      recommendations.push({
        flight: highDemand,
        type: 'high_demand',
        reason: 'High booking activity - limited availability expected'
      });
    }

    return recommendations;
  }, [calculateFlightMetrics]);

  return {
    sortedFlights: intelligentSort,
    sortingMode,
    setSortingMode,
    behaviorPattern,
    updateBehaviorPattern,
    getRecommendations: () => getRecommendations(intelligentSort.slice(0, 10)),
    calculateFlightMetrics
  };
};