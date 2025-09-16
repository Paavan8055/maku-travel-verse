import React, { useState, useEffect } from 'react';
import { TestTube, Users, TrendingUp, Settings, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'draft' | 'completed';
  variants: ABVariant[];
  startDate: string;
  endDate?: string;
  trafficSplit: number;
  primaryMetric: string;
  statisticalSignificance: number;
}

interface ABVariant {
  id: string;
  name: string;
  description: string;
  traffic: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  isControl: boolean;
  isWinner?: boolean;
}

interface ABTestingFrameworkProps {
  className?: string;
  onVariantChange?: (testId: string, variantId: string) => void;
}

export const ABTestingFramework: React.FC<ABTestingFrameworkProps> = ({
  className = "",
  onVariantChange
}) => {
  const [activeTests, setActiveTests] = useState<ABTest[]>([]);
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);

  const generateMockTests = (): ABTest[] => {
    return [
      {
        id: 'pricing-display-test',
        name: 'Pricing Display Format',
        description: 'Testing different ways to display hotel prices',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'Standard Price',
            description: 'Regular price display with per night rate',
            traffic: 1247,
            conversions: 89,
            conversionRate: 7.1,
            confidence: 95,
            isControl: true
          },
          {
            id: 'total-first',
            name: 'Total Price First',
            description: 'Show total stay cost prominently',
            traffic: 1293,
            conversions: 106,
            conversionRate: 8.2,
            confidence: 97,
            isControl: false,
            isWinner: true
          }
        ],
        startDate: '2024-01-15',
        trafficSplit: 50,
        primaryMetric: 'booking_conversion',
        statisticalSignificance: 97
      },
      {
        id: 'urgency-messaging-test',
        name: 'Urgency Messaging',
        description: 'Testing different urgency indicators',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'No Urgency',
            description: 'Standard hotel cards without urgency messaging',
            traffic: 986,
            conversions: 62,
            conversionRate: 6.3,
            confidence: 88,
            isControl: true
          },
          {
            id: 'limited-rooms',
            name: 'Limited Rooms',
            description: 'Show "Only X rooms left" messaging',
            traffic: 1021,
            conversions: 78,
            conversionRate: 7.6,
            confidence: 91,
            isControl: false
          },
          {
            id: 'social-proof',
            name: 'Social Proof',
            description: 'Show "X people viewing" indicators',
            traffic: 1067,
            conversions: 85,
            conversionRate: 8.0,
            confidence: 93,
            isControl: false,
            isWinner: true
          }
        ],
        startDate: '2024-01-20',
        trafficSplit: 33,
        primaryMetric: 'booking_conversion',
        statisticalSignificance: 93
      },
      {
        id: 'layout-test',
        name: 'Hotel Card Layout',
        description: 'Testing compact vs expanded hotel card layouts',
        status: 'active',
        variants: [
          {
            id: 'control',
            name: 'Standard Layout',
            description: 'Current hotel card design',
            traffic: 1455,
            conversions: 103,
            conversionRate: 7.1,
            confidence: 94,
            isControl: true
          },
          {
            id: 'compact',
            name: 'Compact Layout',
            description: 'Smaller cards showing more hotels per page',
            traffic: 1398,
            conversions: 87,
            conversionRate: 6.2,
            confidence: 89,
            isControl: false
          }
        ],
        startDate: '2024-01-25',
        trafficSplit: 50,
        primaryMetric: 'click_through_rate',
        statisticalSignificance: 89
      }
    ];
  };

  useEffect(() => {
    setActiveTests(generateMockTests());
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 95) return 'text-green-600';
    if (confidence >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleVariantSelect = (testId: string, variantId: string) => {
    onVariantChange?.(testId, variantId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="travel-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TestTube className="h-5 w-5 mr-2" />
            A/B Testing Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{activeTests.length}</div>
              <div className="text-sm text-muted-foreground">Active Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {activeTests.reduce((acc, test) => acc + test.variants.reduce((vAcc, v) => vAcc + v.traffic, 0), 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Traffic</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {activeTests.filter(test => test.statisticalSignificance >= 95).length}
              </div>
              <div className="text-sm text-muted-foreground">Significant Results</div>
            </div>
          </div>

          <div className="space-y-4">
            {activeTests.map((test) => (
              <Card key={test.id} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(test.status)}>
                        {test.status}
                      </Badge>
                      {test.statisticalSignificance >= 95 && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Significant
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {test.variants.map((variant) => (
                      <div
                        key={variant.id}
                        className={`p-3 rounded-lg border ${
                          variant.isWinner ? 'border-green-500 bg-green-50' : 
                          variant.isControl ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium flex items-center">
                              {variant.name}
                              {variant.isControl && (
                                <Badge variant="outline" className="ml-2 text-xs">Control</Badge>
                              )}
                              {variant.isWinner && (
                                <Badge variant="default" className="ml-2 text-xs bg-green-600">Winner</Badge>
                              )}
                            </h4>
                            <p className="text-xs text-muted-foreground">{variant.description}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVariantSelect(test.id, variant.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Traffic:</span>
                            <span className="font-medium">{variant.traffic.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Conversions:</span>
                            <span className="font-medium">{variant.conversions}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Conversion Rate:</span>
                            <span className="font-medium">{variant.conversionRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Confidence:</span>
                            <span className={`font-medium ${getConfidenceColor(variant.confidence)}`}>
                              {variant.confidence}%
                            </span>
                          </div>
                          <Progress value={variant.conversionRate} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Started: {new Date(test.startDate).toLocaleDateString()}</span>
                      <span>Primary Metric: {test.primaryMetric.replace('_', ' ')}</span>
                      <span className={getConfidenceColor(test.statisticalSignificance)}>
                        {test.statisticalSignificance}% statistical significance
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};