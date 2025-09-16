import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Brain, 
  Shield,
  Zap,
  Target,
  Clock,
  BarChart3
} from 'lucide-react';

interface PredictionData {
  provider: string;
  failureProbability: number;
  capacityForecast: number;
  performanceTrend: 'improving' | 'declining' | 'stable';
  recommendedAction: string;
  confidence: number;
  timeHorizon: string;
}

interface EarlyWarning {
  id: string;
  type: 'performance' | 'capacity' | 'failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  provider: string;
  prediction: string;
  confidence: number;
  timeToImpact: string;
}

export const PredictiveMonitoring: React.FC = () => {
  const { getPredictiveAnalytics, loading } = useAdvancedAnalytics();
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [warnings, setWarnings] = useState<EarlyWarning[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const generatePredictions = (): PredictionData[] => {
    const providers = ['Amadeus', 'Sabre', 'HotelBeds', 'Stripe'];
    return providers.map(provider => ({
      provider,
      failureProbability: Math.random() * 30,
      capacityForecast: 70 + Math.random() * 30,
      performanceTrend: Math.random() > 0.6 ? 'improving' : Math.random() > 0.3 ? 'stable' : 'declining',
      recommendedAction: getRandomAction(),
      confidence: 80 + Math.random() * 20,
      timeHorizon: Math.random() > 0.5 ? '2-4 hours' : '6-12 hours'
    }));
  };

  const generateWarnings = (): EarlyWarning[] => {
    const warnings: EarlyWarning[] = [];
    
    if (Math.random() > 0.7) {
      warnings.push({
        id: '1',
        type: 'performance',
        severity: 'medium',
        message: 'Amadeus response times increasing',
        provider: 'Amadeus',
        prediction: 'Response times may exceed 2s in next 4 hours',
        confidence: 85,
        timeToImpact: '3-4 hours'
      });
    }

    if (Math.random() > 0.8) {
      warnings.push({
        id: '2',
        type: 'capacity',
        severity: 'high',
        message: 'HotelBeds quota approaching limit',
        provider: 'HotelBeds',
        prediction: 'Quota exhaustion predicted in 6 hours',
        confidence: 92,
        timeToImpact: '5-6 hours'
      });
    }

    return warnings;
  };

  const getRandomAction = () => {
    const actions = [
      'Scale up capacity',
      'Enable circuit breaker',
      'Redistribute traffic',
      'Preemptive maintenance',
      'Monitor closely',
      'Optimize queries'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  };

  useEffect(() => {
    setPredictions(generatePredictions());
    setWarnings(generateWarnings());

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      setPredictions(generatePredictions());
      setWarnings(generateWarnings());
    }, 300000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleRefresh = async () => {
    await getPredictiveAnalytics('7d');
    setPredictions(generatePredictions());
    setWarnings(generateWarnings());
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-destructive';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-destructive" />;
      default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const averageFailureRisk = predictions.reduce((sum, p) => sum + p.failureProbability, 0) / predictions.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Brain className="h-6 w-6 mr-2 text-primary" />
            Predictive Monitoring
          </h2>
          <p className="text-muted-foreground">AI-powered failure prediction and capacity planning</p>
        </div>
        
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          <Zap className={`h-4 w-4 mr-2 ${loading ? 'animate-pulse' : ''}`} />
          Analyze
        </Button>
      </div>

      {/* Early Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
            Early Warnings
          </h3>
          {warnings.map((warning) => (
            <Alert key={warning.id} className="border-warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getSeverityBadge(warning.severity)}>
                        {warning.severity}
                      </Badge>
                      <Badge variant="outline">{warning.provider}</Badge>
                      <span className="text-sm font-medium">{warning.timeToImpact}</span>
                    </div>
                    <p className="font-medium">{warning.message}</p>
                    <p className="text-sm text-muted-foreground mt-1">{warning.prediction}</p>
                    <p className="text-xs text-muted-foreground">
                      Confidence: {warning.confidence}%
                    </p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Failure Risk</p>
                <p className="text-2xl font-bold">{averageFailureRisk.toFixed(1)}%</p>
              </div>
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <Progress value={averageFailureRisk} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Predictions</p>
                <p className="text-2xl font-bold">{predictions.length}</p>
              </div>
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Early Warnings</p>
                <p className="text-2xl font-bold">{warnings.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {(predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length).toFixed(0)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {predictions.map((prediction) => (
          <Card key={prediction.provider}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{prediction.provider}</CardTitle>
                <div className="flex items-center space-x-2">
                  {getTrendIcon(prediction.performanceTrend)}
                  <Badge variant="outline">{prediction.timeHorizon}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Failure Probability</p>
                  <p className="text-xl font-bold">{prediction.failureProbability.toFixed(1)}%</p>
                  <Progress value={prediction.failureProbability} className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Capacity Forecast</p>
                  <p className="text-xl font-bold">{prediction.capacityForecast.toFixed(0)}%</p>
                  <Progress value={prediction.capacityForecast} className="mt-1" />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Performance Trend</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getTrendIcon(prediction.performanceTrend)}
                  <span className="capitalize font-medium">{prediction.performanceTrend}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Recommended Action</p>
                <Badge variant="secondary" className="mt-1">
                  {prediction.recommendedAction}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground flex items-center">
                  <Target className="h-4 w-4 mr-1" />
                  Confidence
                </span>
                <span className="font-semibold">{prediction.confidence.toFixed(0)}%</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};