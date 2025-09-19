import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Plane, 
  MapPin, 
  Clock, 
  DollarSign, 
  Leaf, 
  Calendar, 
  Plus, 
  X, 
  ArrowRight,
  TrendingUp,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';
import { IntelligentJourney } from '@/types/ai-intelligence-types';

interface JourneyOptimizerCardProps {
  currentJourney: IntelligentJourney | null;
  optimizing: boolean;
  onOptimize: (
    destinationIds: string[],
    preferences?: {
      optimize_for: 'cost' | 'time' | 'weather' | 'experience' | 'balanced';
      travel_style: 'budget' | 'comfort' | 'luxury';
      max_duration_days?: number;
      preferred_season?: 'spring' | 'summer' | 'fall' | 'winter';
    }
  ) => Promise<any>;
}

export const JourneyOptimizerCard: React.FC<JourneyOptimizerCardProps> = ({
  currentJourney,
  optimizing,
  onOptimize
}) => {
  const [destinations, setDestinations] = useState<string[]>(['', '']);
  const [optimizeFor, setOptimizeFor] = useState<'cost' | 'time' | 'weather' | 'experience' | 'balanced'>('balanced');
  const [travelStyle, setTravelStyle] = useState<'budget' | 'comfort' | 'luxury'>('comfort');
  const [maxDuration, setMaxDuration] = useState<number>(14);
  const [preferredSeason, setPreferredSeason] = useState<'spring' | 'summer' | 'fall' | 'winter'>('spring');

  const addDestination = () => {
    setDestinations([...destinations, '']);
  };

  const removeDestination = (index: number) => {
    if (destinations.length > 2) {
      const newDestinations = destinations.filter((_, i) => i !== index);
      setDestinations(newDestinations);
    }
  };

  const updateDestination = (index: number, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = value;
    setDestinations(newDestinations);
  };

  const handleOptimize = async () => {
    const validDestinations = destinations.filter(dest => dest.trim() !== '');
    if (validDestinations.length < 2) {
      alert('Please enter at least 2 destinations');
      return;
    }

    await onOptimize(validDestinations, {
      optimize_for: optimizeFor,
      travel_style: travelStyle,
      max_duration_days: maxDuration,
      preferred_season: preferredSeason
    });
  };

  const getOptimizationIcon = (factor: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'cost': <DollarSign className="h-4 w-4 text-green-500" />,
      'time': <Clock className="h-4 w-4 text-blue-500" />,
      'weather': <Calendar className="h-4 w-4 text-yellow-500" />,
      'experience': <Target className="h-4 w-4 text-purple-500" />,
      'balanced': <TrendingUp className="h-4 w-4 text-indigo-500" />
    };
    return iconMap[factor] || <Target className="h-4 w-4" />;
  };

  const getTravelMethodIcon = (method: string) => {
    const iconMap: Record<string, string> = {
      'flight': '✈️',
      'train': '🚄',
      'bus': '🚌',
      'car': '🚗',
      'ferry': '⛴️'
    };
    return iconMap[method] || '🚗';
  };

  return (
    <div className="space-y-6">
      {/* Journey Optimizer Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-blue-500" />
            <span>AI Journey Optimizer</span>
          </CardTitle>
          <CardDescription>
            Let our AI create the perfect multi-destination itinerary optimized for your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Destinations Input */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-gray-500" />
              <span>Destinations</span>
            </h3>
            
            {destinations.map((destination, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                  {index + 1}
                </div>
                <Input
                  placeholder={`Destination ${index + 1}`}
                  value={destination}
                  onChange={(e) => updateDestination(index, e.target.value)}
                  className="flex-1"
                />
                {destinations.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDestination(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addDestination}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Destination
            </Button>
          </div>

          {/* Optimization Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Optimization Goals</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Optimize For</label>
                  <Select value={optimizeFor} onValueChange={(value: any) => setOptimizeFor(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">💰 Lowest Cost</SelectItem>
                      <SelectItem value="time">⏱️ Shortest Time</SelectItem>
                      <SelectItem value="weather">🌤️ Best Weather</SelectItem>
                      <SelectItem value="experience">✨ Best Experience</SelectItem>
                      <SelectItem value="balanced">⚖️ Balanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Travel Style</label>
                  <Select value={travelStyle} onValueChange={(value: any) => setTravelStyle(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">🎒 Budget</SelectItem>
                      <SelectItem value="comfort">🏨 Comfort</SelectItem>
                      <SelectItem value="luxury">✨ Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Preferences</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Max Duration (days)</label>
                  <Input
                    type="number"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Preferred Season</label>
                  <Select value={preferredSeason} onValueChange={(value: any) => setPreferredSeason(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spring">🌸 Spring</SelectItem>
                      <SelectItem value="summer">☀️ Summer</SelectItem>
                      <SelectItem value="fall">🍂 Fall</SelectItem>
                      <SelectItem value="winter">❄️ Winter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Optimize Button */}
          <Button
            onClick={handleOptimize}
            disabled={optimizing || destinations.filter(d => d.trim()).length < 2}
            className="w-full"
            size="lg"
          >
            {optimizing ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Optimizing Your Journey...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Optimize My Journey
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Optimized Journey Results */}
      {currentJourney && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-green-500" />
              <span>Optimized Journey</span>
              <Badge variant="secondary" className="text-lg">
                Score: {currentJourney.optimization_score}/100
              </Badge>
            </CardTitle>
            <CardDescription>
              Your AI-optimized {currentJourney.total_duration_days}-day journey across {currentJourney.selected_destinations.length} destinations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Journey Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-800">Total Cost</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">${currentJourney.total_estimated_cost}</p>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Duration</span>
                </div>
                <p className="text-2xl font-bold text-green-900">{currentJourney.total_duration_days} days</p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-800">Distance</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">{currentJourney.optimized_route.total_distance_km} km</p>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Leaf className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Carbon</span>
                </div>
                <p className="text-2xl font-bold text-orange-900">{currentJourney.optimized_route.carbon_footprint_kg} kg</p>
              </div>
            </div>

            {/* Route Segments */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <Plane className="h-5 w-5 text-gray-500" />
                <span>Optimized Route</span>
              </h3>
              
              {currentJourney.optimized_route.route_segments.map((segment, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="text-2xl">
                    {getTravelMethodIcon(segment.travel_method)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium capitalize">{segment.from_destination_id}</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                      <span className="font-medium capitalize">{segment.to_destination_id}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Distance:</span> {segment.distance_km} km
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {segment.duration_hours}h
                      </div>
                      <div>
                        <span className="font-medium">Cost:</span> ${segment.estimated_cost}
                      </div>
                      <div>
                        <span className="font-medium">CO2:</span> {segment.carbon_footprint_kg} kg
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Optimization Factors */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Optimization Factors</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentJourney.optimization_factors.map((factor, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 border rounded-lg">
                    {getOptimizationIcon(factor.factor_type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium capitalize">{factor.factor_type}</span>
                        <Badge variant={factor.user_specified ? "default" : "outline"} className="text-xs">
                          {factor.user_specified ? 'User Specified' : 'AI Optimized'}
                        </Badge>
                      </div>
                      <Progress value={factor.weight * 100} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">Weight: {Math.round(factor.weight * 100)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};