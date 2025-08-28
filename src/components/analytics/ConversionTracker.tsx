import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Users, ShoppingCart, CreditCard, CheckCircle, X, Minimize2, Maximize2 } from 'lucide-react';

interface ConversionMetrics {
  sessionId: string;
  timestamp: number;
  funnel: {
    search: number;
    results: number;
    hotel_view: number;
    room_selection: number;
    checkout: number;
    payment: number;
    confirmation: number;
  };
  conversionRates: {
    search_to_view: number;
    view_to_selection: number;
    selection_to_checkout: number;
    checkout_to_payment: number;
    payment_to_confirmation: number;
    overall: number;
  };
  dropOffPoints: string[];
  abTestVariant?: string;
}

interface ConversionTrackerProps {
  sessionId?: string;
  currentStep?: string;
  isVisible?: boolean;
  onOptimizationSuggestion?: (suggestion: string) => void;
  forceShow?: boolean; // New prop to explicitly enable in dev
}

export const ConversionTracker: React.FC<ConversionTrackerProps> = ({
  sessionId = 'default',
  currentStep = 'search',
  isVisible = false,
  onOptimizationSuggestion,
  forceShow = false
}) => {
  const [metrics, setMetrics] = useState<ConversionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show in development mode
  const showInDev = process.env.NODE_ENV === 'development';

  useEffect(() => {
    const trackSession = async () => {
      try {
        // Simulate conversion tracking (replace with real analytics)
        const mockMetrics: ConversionMetrics = {
          sessionId,
          timestamp: Date.now(),
          funnel: {
            search: 1000,
            results: 850,
            hotel_view: 620,
            room_selection: 380,
            checkout: 280,
            payment: 220,
            confirmation: 185
          },
          conversionRates: {
            search_to_view: 62.0,
            view_to_selection: 61.3,
            selection_to_checkout: 73.7,
            checkout_to_payment: 78.6,
            payment_to_confirmation: 84.1,
            overall: 18.5
          },
          dropOffPoints: ['hotel_view', 'room_selection'],
          abTestVariant: Math.random() > 0.5 ? 'variant_a' : 'variant_b'
        };

        setMetrics(mockMetrics);
        
        // Generate optimization suggestions
        if (mockMetrics.conversionRates.view_to_selection < 50) {
          onOptimizationSuggestion?.('Consider adding more room photos and reviews to improve selection rate');
        }
        if (mockMetrics.conversionRates.checkout_to_payment < 70) {
          onOptimizationSuggestion?.('Simplify checkout form to reduce payment abandonment');
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error tracking conversion:', error);
        setIsLoading(false);
      }
    };

    trackSession();

    // Track current step
    const trackStep = () => {
      // Track analytics event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'booking_funnel_step', {
          step_name: currentStep,
          session_id: sessionId,
          timestamp: Date.now()
        });
      }
    };

    trackStep();

    // Update metrics every 30 seconds
    const interval = setInterval(trackSession, 30000);
    return () => clearInterval(interval);
  }, [sessionId, currentStep, onOptimizationSuggestion]);

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'search': return <Users className="h-4 w-4" />;
      case 'results': return <TrendingUp className="h-4 w-4" />;
      case 'hotel_view': return <Users className="h-4 w-4" />;
      case 'room_selection': return <ShoppingCart className="h-4 w-4" />;
      case 'checkout': return <ShoppingCart className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'confirmation': return <CheckCircle className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (rate: number) => {
    return rate > 70 ? <TrendingUp className="h-3 w-3 text-green-600" /> : <TrendingDown className="h-3 w-3 text-red-600" />;
  };

  // Hide by default in development unless explicitly enabled
  if (!isVisible || !metrics || isLoading || (!forceShow && showInDev) || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 z-40 max-w-sm">
      <Card className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Conversion Analytics
            <Badge variant="outline" className="text-xs">
              {metrics.abTestVariant?.toUpperCase()}
            </Badge>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsDismissed(true)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        {!isMinimized && (
        <CardContent className="space-y-3">
          {/* Overall conversion rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Conversion</span>
              <span className="text-lg font-bold text-primary">
                {metrics.conversionRates.overall}%
              </span>
            </div>
            <Progress value={metrics.conversionRates.overall} className="h-2" />
          </div>

          {/* Funnel steps */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Conversion Funnel</h4>
            {Object.entries(metrics.funnel).map(([step, count], index) => {
              const rate = index === 0 ? 100 : (count / metrics.funnel.search) * 100;
              const stepRate = Object.values(metrics.conversionRates)[index] || rate;
              
              return (
                <div key={step} className="flex items-center gap-2 text-xs">
                  <div className="w-4 h-4 flex items-center justify-center">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="capitalize">{step.replace('_', ' ')}</span>
                      <div className="flex items-center gap-1">
                        <span>{stepRate.toFixed(1)}%</span>
                        {getTrendIcon(stepRate)}
                      </div>
                    </div>
                    <Progress value={rate} className="h-1" />
                  </div>
                  <span className="text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Drop-off alerts */}
          {metrics.dropOffPoints.length > 0 && (
            <div className="space-y-1">
              <h4 className="text-xs font-medium text-muted-foreground">Critical Drop-offs</h4>
              {metrics.dropOffPoints.map((point) => (
                <Badge key={point} variant="destructive" className="text-xs">
                  {point.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          )}

          {/* Current session info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Session:</span>
              <span>{sessionId.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span>Current Step:</span>
              <span className="capitalize">{currentStep.replace('_', ' ')}</span>
            </div>
          </div>
        </CardContent>
        )}
      </Card>
    </div>
  );
};

export default ConversionTracker;