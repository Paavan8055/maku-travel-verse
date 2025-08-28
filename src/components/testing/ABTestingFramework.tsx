import React, { useEffect, useState, createContext, useContext } from 'react';
import { BarChart3, Users, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'paused';
  variants: ABVariant[];
  metrics: TestMetrics;
  startDate: Date;
  endDate?: Date;
  trafficSplit: number[];
  significance: number;
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  isControl: boolean;
  traffic: number;
  conversions: number;
  conversionRate: number;
  component?: React.ComponentType<any>;
}

interface TestMetrics {
  participants: number;
  conversions: number;
  conversionRate: number;
  uplift?: number;
  pValue?: number;
}

interface ABTestContextType {
  currentTests: ABTest[];
  getVariant: (testId: string) => ABVariant | null;
  trackConversion: (testId: string, variantId: string) => void;
  isTestActive: (testId: string) => boolean;
}

const ABTestContext = createContext<ABTestContextType | null>(null);

export const useABTest = () => {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error('useABTest must be used within ABTestProvider');
  }
  return context;
};

interface ABTestProviderProps {
  children: React.ReactNode;
}

export const ABTestProvider: React.FC<ABTestProviderProps> = ({ children }) => {
  const [currentTests, setCurrentTests] = useState<ABTest[]>([]);
  const [userVariants, setUserVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    // Initialize with empty tests - data should come from actual A/B testing service
    setCurrentTests([]);
    setUserVariants({});
  }, []);

  const getVariant = (testId: string): ABVariant | null => {
    const test = currentTests.find(t => t.id === testId);
    const variantId = userVariants[testId];
    
    if (!test || !variantId) return null;
    
    return test.variants.find(v => v.id === variantId) || null;
  };

  const trackConversion = (testId: string, variantId: string) => {
    // In a real implementation, this would send data to analytics
    console.log(`Conversion tracked: ${testId} - ${variantId}`);
  };

  const isTestActive = (testId: string): boolean => {
    const test = currentTests.find(t => t.id === testId);
    return test?.status === 'running' || false;
  };

  const contextValue: ABTestContextType = {
    currentTests,
    getVariant,
    trackConversion,
    isTestActive
  };

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  );
};

interface ABTestDashboardProps {
  className?: string;
}

export const ABTestDashboard: React.FC<ABTestDashboardProps> = ({ className }) => {
  const { currentTests } = useABTest();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'paused': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'draft': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getSignificanceColor = (pValue?: number) => {
    if (!pValue) return 'text-muted-foreground';
    if (pValue < 0.05) return 'text-green-500';
    if (pValue < 0.1) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            A/B Test Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {currentTests.filter(t => t.status === 'running').length}
              </p>
              <p className="text-sm text-muted-foreground">Active Tests</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {currentTests.reduce((sum, test) => sum + test.metrics.participants, 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Total Participants</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {(currentTests.reduce((sum, test) => sum + (test.metrics.uplift || 0), 0) / currentTests.length).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Avg. Uplift</p>
            </div>
          </div>

          <div className="space-y-4">
            {currentTests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No A/B tests configured</p>
                <p className="text-sm text-muted-foreground mt-1">Tests will appear here when they are created</p>
              </div>
            ) : (
              currentTests.map(test => (
                <Card key={test.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold">{test.name}</h4>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Participants</p>
                      <p className="font-semibold">{test.metrics.participants.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion Rate</p>
                      <p className="font-semibold">{test.metrics.conversionRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Uplift</p>
                      <p className={`font-semibold ${test.metrics.uplift && test.metrics.uplift > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {test.metrics.uplift ? `${test.metrics.uplift > 0 ? '+' : ''}${test.metrics.uplift.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Significance</p>
                      <p className={`font-semibold ${getSignificanceColor(test.metrics.pValue)}`}>
                        {test.metrics.pValue ? (test.metrics.pValue < 0.05 ? 'Significant' : 'Not Significant') : 'Calculating...'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {test.variants.map(variant => (
                      <div key={variant.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{variant.name}</span>
                          {variant.isControl && (
                            <Badge variant="outline">Control</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>{variant.traffic.toLocaleString()} participants</span>
                          <span className="font-medium">{variant.conversionRate.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Progress 
                    value={(test.metrics.participants / 10000) * 100} 
                    className="mt-3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {test.metrics.participants.toLocaleString()} / 10,000 target participants
                  </p>
                </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Higher-order component for A/B testing
interface WithABTestProps {
  testId: string;
  variants: Record<string, React.ComponentType<any>>;
  fallback?: React.ComponentType<any>;
}

export function withABTest<P extends object>(
  { testId, variants, fallback }: WithABTestProps
) {
  return function ABTestWrapper(props: P) {
    const { getVariant, isTestActive } = useABTest();
    
    if (!isTestActive(testId)) {
      const FallbackComponent = fallback || variants.control;
      return FallbackComponent ? <FallbackComponent {...props} /> : null;
    }
    
    const variant = getVariant(testId);
    const VariantComponent = variant ? variants[variant.id] : fallback || variants.control;
    
    return VariantComponent ? <VariantComponent {...props} /> : null;
  };
}

export default ABTestDashboard;